package service

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/henryhua/resume-backend/internal/domain/models"
	"github.com/henryhua/resume-backend/pkg/database"
	"gorm.io/gorm"
)

const (
	exportStatusQueued    = "queued"
	exportStatusRendering = "rendering"
	exportStatusReady     = "ready"
	exportStatusFailed    = "failed"
	exportTTL             = 24 * time.Hour
	maxExportPages        = 20
)

type ExportQueueFullError struct{}

func (ExportQueueFullError) Error() string { return "PDF export queue is full. Please retry shortly." }

type RendererError struct {
	Code    string
	Message string
}

func (e *RendererError) Error() string { return e.Message }

type ExportService struct {
	queue      chan string
	client     *http.Client
	endpoint   string
	token      string
	storageDir string
}

var exportServiceOnce sync.Once
var sharedExportService *ExportService

func NewExportService() *ExportService {
	exportServiceOnce.Do(func() {
		endpoint := strings.TrimRight(os.Getenv("RENDERER_URL"), "/")
		if endpoint == "" {
			endpoint = "http://127.0.0.1:3001"
		}
		storageDir := os.Getenv("EXPORT_STORAGE_DIR")
		if storageDir == "" {
			storageDir = "./storage/exports"
		}
		sharedExportService = &ExportService{
			queue: make(chan string, 16), client: &http.Client{Timeout: 70 * time.Second}, endpoint: endpoint,
			token: os.Getenv("RENDERER_INTERNAL_TOKEN"), storageDir: storageDir,
		}
		if database.DB != nil {
			// Interrupted processes must never leave a task that polls forever.
			database.DB.Model(&models.ResumeExport{}).Where("status IN ?", []string{exportStatusQueued, exportStatusRendering}).Updates(map[string]interface{}{"status": exportStatusFailed, "error_code": "RENDERER_RESTARTED", "error_message": "Renderer restarted before this export completed."})
		}
		for i := 0; i < 2; i++ {
			go sharedExportService.worker()
		}
	})
	return sharedExportService
}

func randomID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func exportSnapshot(tx *gorm.DB, resumeID, userID uint) (*models.Resume, error) {
	var resume models.Resume
	err := tx.Where("id = ? AND user_id = ?", resumeID, userID).
		Preload("PersonalInfo").
		Preload("WorkExperiences", func(db *gorm.DB) *gorm.DB { return db.Order("display_order ASC, id ASC") }).
		Preload("Education", func(db *gorm.DB) *gorm.DB { return db.Order("display_order ASC, id ASC") }).
		Preload("Skills", func(db *gorm.DB) *gorm.DB { return db.Order("display_order ASC, id ASC") }).
		Preload("Projects", func(db *gorm.DB) *gorm.DB { return db.Order("display_order ASC, id ASC") }).
		Preload("Certifications", func(db *gorm.DB) *gorm.DB { return db.Order("display_order ASC, id ASC") }).
		Preload("Languages", func(db *gorm.DB) *gorm.DB { return db.Order("display_order ASC, id ASC") }).
		Preload("Awards", func(db *gorm.DB) *gorm.DB { return db.Order("display_order ASC, id ASC") }).
		Preload("CustomSections", func(db *gorm.DB) *gorm.DB { return db.Order("display_order ASC, id ASC") }).
		First(&resume).Error
	if err != nil {
		return nil, err
	}
	return &resume, nil
}

func isPublicIP(ip net.IP) bool {
	return !ip.IsLoopback() && !ip.IsPrivate() && !ip.IsLinkLocalUnicast() && !ip.IsLinkLocalMulticast() && !ip.IsMulticast() && !ip.IsUnspecified()
}

// controlledAvatarDataURL fetches an existing HTTPS avatar before snapshotting
// it. Chromium only receives the resulting bounded data URL, never the remote
// URL, and the dialer rejects local/private destinations to avoid SSRF.
func controlledAvatarDataURL(raw string) (string, error) {
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Scheme != "https" || parsed.Hostname() == "" || parsed.User != nil || len(raw) > 2048 {
		return "", errors.New("avatar must be a valid HTTPS URL")
	}
	port := parsed.Port()
	if port != "" && port != "443" {
		return "", errors.New("avatar URL must use HTTPS port 443")
	}
	lookup := func(ctx context.Context, host string) ([]net.IP, error) {
		ips, lookupErr := net.DefaultResolver.LookupIP(ctx, "ip", host)
		if lookupErr != nil {
			return nil, lookupErr
		}
		for _, ip := range ips {
			if !isPublicIP(ip) {
				return nil, errors.New("avatar URL resolves to a restricted address")
			}
		}
		if len(ips) == 0 {
			return nil, errors.New("avatar URL did not resolve")
		}
		return ips, nil
	}
	dialer := &net.Dialer{Timeout: 5 * time.Second}
	transport := &http.Transport{
		Proxy: nil,
		DialContext: func(ctx context.Context, network, address string) (net.Conn, error) {
			host, requestedPort, splitErr := net.SplitHostPort(address)
			if splitErr != nil {
				return nil, splitErr
			}
			ips, lookupErr := lookup(ctx, host)
			if lookupErr != nil {
				return nil, lookupErr
			}
			return dialer.DialContext(ctx, network, net.JoinHostPort(ips[0].String(), requestedPort))
		},
	}
	client := &http.Client{Timeout: 10 * time.Second, Transport: transport, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, parsed.String(), nil)
	if err != nil {
		return "", err
	}
	response, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return "", fmt.Errorf("avatar server returned status %d", response.StatusCode)
	}
	mediaType, _, err := mime.ParseMediaType(response.Header.Get("Content-Type"))
	if err != nil || (mediaType != "image/png" && mediaType != "image/jpeg" && mediaType != "image/webp") {
		return "", errors.New("avatar must be a PNG, JPEG, or WebP image")
	}
	const maxAvatarBytes = 2 * 1024 * 1024
	if response.ContentLength > maxAvatarBytes {
		return "", errors.New("avatar exceeds the 2 MiB limit")
	}
	data, err := io.ReadAll(io.LimitReader(response.Body, maxAvatarBytes+1))
	if err != nil {
		return "", err
	}
	if len(data) == 0 || len(data) > maxAvatarBytes {
		return "", errors.New("avatar exceeds the 2 MiB limit")
	}
	return "data:" + mediaType + ";base64," + base64.StdEncoding.EncodeToString(data), nil
}

// Create records the only source of truth for an export before it enters the queue.
func (s *ExportService) Create(resumeID, userID uint, locale string) (*models.ResumeExport, error) {
	if database.DB == nil {
		return nil, errors.New("database is not initialized")
	}
	if locale != "zh-CN" {
		locale = "en-US"
	}
	tx := database.DB.Begin(&sql.TxOptions{Isolation: sql.LevelRepeatableRead, ReadOnly: true})
	if tx.Error != nil {
		return nil, tx.Error
	}
	resume, err := exportSnapshot(tx, resumeID, userID)
	if err != nil {
		tx.Rollback()
		return nil, err
	}
	if resume.TemplateID != 3 {
		tx.Rollback()
		return nil, &RendererError{Code: "MINIMAL_V2_REQUIRED", Message: "minimal-v2 exports require the minimal template."}
	}
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}
	if resume.PersonalInfo != nil && resume.PersonalInfo.ShowAvatar && resume.PersonalInfo.AvatarURL != "" {
		dataURL, avatarErr := controlledAvatarDataURL(resume.PersonalInfo.AvatarURL)
		if avatarErr != nil {
			return nil, &RendererError{Code: "AVATAR_ASSET_UNAVAILABLE", Message: "Avatar could not be loaded safely: " + avatarErr.Error()}
		}
		resume.PersonalInfo.AvatarDataURL = dataURL
	}
	snapshot, err := json.Marshal(resume)
	if err != nil {
		return nil, err
	}
	contentHash := fmt.Sprintf("%x", sha256.Sum256(snapshot))
	cacheKey := fmt.Sprintf("%x", sha256.Sum256([]byte(fmt.Sprintf("%d:%s:minimal-v2:%s:renderer-1", userID, contentHash, locale))))
	now := time.Now().UTC()
	var cached models.ResumeExport
	if err := database.DB.Where("user_id = ? AND cache_key = ? AND status = ? AND expires_at > ?", userID, cacheKey, exportStatusReady, now).First(&cached).Error; err == nil {
		if info, statErr := os.Stat(cached.FilePath); statErr == nil && !info.IsDir() {
			return &cached, nil
		}
		database.DB.Model(&cached).Updates(map[string]interface{}{"status": exportStatusFailed, "error_code": "EXPORT_FILE_MISSING", "error_message": "Cached export file is unavailable."})
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	id, err := randomID()
	if err != nil {
		return nil, err
	}
	task := &models.ResumeExport{ID: id, ResumeID: resumeID, UserID: userID, Status: exportStatusQueued, TemplateVersion: "minimal-v2", Locale: locale, ContentHash: contentHash, CacheKey: cacheKey, Snapshot: string(snapshot), ExpiresAt: now.Add(exportTTL)}
	if err := database.DB.Create(task).Error; err != nil {
		return nil, err
	}
	if err := s.enqueue(task.ID); err != nil {
		database.DB.Model(task).Updates(map[string]interface{}{"status": exportStatusFailed, "error_code": "QUEUE_FULL", "error_message": err.Error()})
		return nil, err
	}
	go s.cleanupExpired()
	return task, nil
}

func (s *ExportService) enqueue(id string) error {
	select {
	case s.queue <- id:
		return nil
	default:
		return ExportQueueFullError{}
	}
}
func (s *ExportService) worker() {
	for id := range s.queue {
		s.render(id)
	}
}

func (s *ExportService) render(id string) {
	var task models.ResumeExport
	if err := database.DB.Where("id = ? AND status = ?", id, exportStatusQueued).First(&task).Error; err != nil {
		return
	}
	if database.DB.Model(&task).Update("status", exportStatusRendering).Error != nil {
		return
	}
	pdfBytes, pages, err := s.callRenderer(task)
	if err != nil {
		s.fail(task.ID, err)
		return
	}
	if !bytes.HasPrefix(pdfBytes, []byte("%PDF-")) {
		s.fail(task.ID, &RendererError{Code: "INVALID_PDF", Message: "Renderer returned an invalid PDF."})
		return
	}
	if pages < 1 {
		pages = bytes.Count(pdfBytes, []byte("/Type /Page")) - bytes.Count(pdfBytes, []byte("/Type /Pages"))
	}
	if pages < 1 || pages > maxExportPages {
		s.fail(task.ID, &RendererError{Code: "PAGE_LIMIT_EXCEEDED", Message: "PDF exceeds the supported 20 page limit."})
		return
	}
	if err := os.MkdirAll(s.storageDir, 0o750); err != nil {
		s.fail(task.ID, &RendererError{Code: "STORAGE_FAILED", Message: "Could not create export storage."})
		return
	}
	path := filepath.Join(s.storageDir, task.ID+".pdf")
	temp := path + ".tmp"
	if err := os.WriteFile(temp, pdfBytes, 0o640); err != nil {
		s.fail(task.ID, &RendererError{Code: "STORAGE_FAILED", Message: "Could not store PDF."})
		return
	}
	if err := os.Rename(temp, path); err != nil {
		_ = os.Remove(temp)
		s.fail(task.ID, &RendererError{Code: "STORAGE_FAILED", Message: "Could not finalize PDF."})
		return
	}
	fileHash := fmt.Sprintf("%x", sha256.Sum256(pdfBytes))
	fileName := fmt.Sprintf("resume-%d-minimal-v2.pdf", task.ResumeID)
	database.DB.Model(&models.ResumeExport{}).Where("id = ? AND status = ?", task.ID, exportStatusRendering).Updates(map[string]interface{}{"status": exportStatusReady, "file_path": path, "file_name": fileName, "file_hash": fileHash, "page_count": pages, "error_code": "", "error_message": ""})
}

func (s *ExportService) callRenderer(task models.ResumeExport) ([]byte, int, error) {
	body, err := json.Marshal(map[string]string{"snapshot": task.Snapshot, "locale": task.Locale, "templateVersion": task.TemplateVersion})
	if err != nil {
		return nil, 0, err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 65*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.endpoint+"/render", bytes.NewReader(body))
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	if s.token != "" {
		req.Header.Set("X-Renderer-Token", s.token)
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, 0, &RendererError{Code: "RENDERER_UNAVAILABLE", Message: "PDF renderer is unavailable. Please retry."}
	}
	defer resp.Body.Close()
	responseBody, readErr := io.ReadAll(io.LimitReader(resp.Body, 25*1024*1024))
	if readErr != nil {
		return nil, 0, readErr
	}
	if resp.StatusCode != http.StatusOK {
		var rendererResponse struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		}
		_ = json.Unmarshal(responseBody, &rendererResponse)
		if rendererResponse.Code == "" {
			rendererResponse.Code = "RENDER_FAILED"
		}
		if rendererResponse.Message == "" {
			rendererResponse.Message = "Renderer failed to create the PDF."
		}
		return nil, 0, &RendererError{Code: rendererResponse.Code, Message: rendererResponse.Message}
	}
	pages, _ := strconv.Atoi(resp.Header.Get("X-Resume-Pages"))
	return responseBody, pages, nil
}

func (s *ExportService) fail(id string, cause error) {
	code, message := "RENDER_FAILED", cause.Error()
	var rendererError *RendererError
	if errors.As(cause, &rendererError) {
		code, message = rendererError.Code, rendererError.Message
	}
	// The persisted error column is varchar(500). Playwright startup errors can
	// include multi-line installation help and paths far beyond that limit.
	if detail := []rune(message); len(detail) > 500 {
		message = string(detail[:497]) + "..."
	}
	database.DB.Model(&models.ResumeExport{}).Where("id = ?", id).Updates(map[string]interface{}{"status": exportStatusFailed, "error_code": code, "error_message": message})
}

func (s *ExportService) cleanupExpired() {
	if database.DB == nil {
		return
	}
	var expired []models.ResumeExport
	if err := database.DB.Where("expires_at <= ?", time.Now().UTC()).Find(&expired).Error; err != nil {
		return
	}
	for _, item := range expired {
		if item.FilePath != "" {
			_ = os.Remove(item.FilePath)
		}
		database.DB.Delete(&item)
	}
}

func (s *ExportService) OpenReady(id string, resumeID, userID uint) (*models.ResumeExport, *os.File, error) {
	var task models.ResumeExport
	if err := database.DB.Where("id = ? AND resume_id = ? AND user_id = ?", id, resumeID, userID).First(&task).Error; err != nil {
		return nil, nil, err
	}
	if task.ExpiresAt.Before(time.Now().UTC()) {
		return &task, nil, &RendererError{Code: "EXPORT_EXPIRED", Message: "This export has expired. Generate a new PDF."}
	}
	if task.Status != exportStatusReady {
		return &task, nil, &RendererError{Code: "EXPORT_NOT_READY", Message: "This export is not ready."}
	}
	file, err := os.Open(task.FilePath)
	if err != nil {
		return &task, nil, &RendererError{Code: "EXPORT_FILE_MISSING", Message: "The export file is unavailable. Generate a new PDF."}
	}
	return &task, file, nil
}
