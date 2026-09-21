package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/henryhua/resume-backend/internal/api/middleware"
	"github.com/henryhua/resume-backend/internal/api/response"
	"github.com/henryhua/resume-backend/internal/domain/models"
	"github.com/henryhua/resume-backend/internal/dto"
	"github.com/henryhua/resume-backend/internal/service"
	"github.com/henryhua/resume-backend/pkg/database"
	"gorm.io/gorm"
)

type ExportHandler struct{ exports *service.ExportService }

func NewExportHandler() *ExportHandler { return &ExportHandler{exports: service.NewExportService()} }

func exportError(c *gin.Context, err error) {
	var queueFull service.ExportQueueFullError
	var rendererError *service.RendererError
	if errors.Is(err, gorm.ErrRecordNotFound) {
		response.NotFound(c, "EXPORT_NOT_FOUND", "Export not found")
		return
	}
	if errors.As(err, &queueFull) {
		response.Error(c, http.StatusTooManyRequests, "QUEUE_FULL", err.Error(), nil)
		return
	}
	if errors.As(err, &rendererError) {
		response.Error(c, http.StatusUnprocessableEntity, rendererError.Code, rendererError.Message, nil)
		return
	}
	response.Internal(c, "EXPORT_FAILED", "Could not create PDF export")
}

func (h *ExportHandler) Create(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	resumeID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || resumeID64 == 0 {
		response.BadRequest(c, "INVALID_RESUME_ID", "Invalid resume id")
		return
	}
	var req dto.CreateResumeExportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", err.Error())
		return
	}
	if err := service.NewBillingService().CheckTemplateAccess(userID, 3); err != nil {
		h := NewResumeHandler()
		h.handleLimitError(c, err)
		return
	}
	task, err := h.exports.Create(uint(resumeID64), userID, req.Locale)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.NotFound(c, "RESUME_NOT_FOUND", "Resume not found")
			return
		}
		exportError(c, err)
		return
	}
	response.Success(c, http.StatusAccepted, task)
}

func (h *ExportHandler) Get(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	resumeID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "INVALID_RESUME_ID", "Invalid resume id")
		return
	}
	var task models.ResumeExport
	if err := database.DB.Where("id = ? AND resume_id = ? AND user_id = ?", c.Param("exportId"), uint(resumeID), userID).First(&task).Error; err != nil {
		response.NotFound(c, "EXPORT_NOT_FOUND", "Export not found")
		return
	}
	if task.Status == "rendering" && task.UpdatedAt.Before(time.Now().UTC().Add(-80*time.Second)) {
		// A worker that exits or stalls must not leave the browser polling forever.
		database.DB.Model(&models.ResumeExport{}).Where("id = ? AND status = ? AND updated_at < ?", task.ID, "rendering", time.Now().UTC().Add(-80*time.Second)).Updates(map[string]interface{}{
			"status": "failed", "error_code": "EXPORT_WORKER_TIMEOUT", "error_message": "PDF generation stopped unexpectedly. Please retry.",
		})
		_ = database.DB.First(&task, "id = ?", task.ID).Error
	}
	response.Success(c, http.StatusOK, task)
}

func (h *ExportHandler) File(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	resumeID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "INVALID_RESUME_ID", "Invalid resume id")
		return
	}
	task, file, err := h.exports.OpenReady(c.Param("exportId"), uint(resumeID), userID)
	if err != nil {
		exportError(c, err)
		return
	}
	defer file.Close()
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", "attachment; filename=\""+task.FileName+"\"")
	c.Header("X-Content-Type-Options", "nosniff")
	http.ServeContent(c.Writer, c.Request, task.FileName, task.UpdatedAt, file)
}
