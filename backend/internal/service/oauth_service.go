package service

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/henryhua/resume-backend/config"
	"github.com/henryhua/resume-backend/internal/domain/models"
	"github.com/henryhua/resume-backend/pkg/auth"
	"github.com/henryhua/resume-backend/pkg/database"
)

// OAuthUserInfo represents normalized user info from any OAuth provider
type OAuthUserInfo struct {
	ProviderUserID string
	Email          string
	Name           string
	AvatarURL      string
}

// OAuthService handles OAuth authentication logic
type OAuthService struct {
	config *config.OAuthConfig
}

// NewOAuthService creates a new OAuthService
func NewOAuthService() *OAuthService {
	return &OAuthService{
		config: config.LoadOAuthConfig(),
	}
}

// GenerateState generates a random state string for CSRF protection
func (s *OAuthService) GenerateState() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// GetAuthURL returns the OAuth authorization URL for the given provider
func (s *OAuthService) GetAuthURL(provider, state string) (string, error) {
	providerConfig := s.config.GetProviderConfig(provider)
	if providerConfig == nil {
		return "", fmt.Errorf("unsupported provider: %s", provider)
	}

	switch provider {
	case "github":
		return s.getGitHubAuthURL(providerConfig, state), nil
	case "google":
		return s.getGoogleAuthURL(providerConfig, state), nil
	case "wechat":
		return s.getWeChatAuthURL(providerConfig, state), nil
	default:
		return "", fmt.Errorf("unsupported provider: %s", provider)
	}
}

// ExchangeCodeAndGetUser exchanges the authorization code for user info
func (s *OAuthService) ExchangeCodeAndGetUser(provider, code string) (*OAuthUserInfo, error) {
	providerConfig := s.config.GetProviderConfig(provider)
	if providerConfig == nil {
		return nil, fmt.Errorf("unsupported provider: %s", provider)
	}

	switch provider {
	case "github":
		return s.handleGitHub(providerConfig, code)
	case "google":
		return s.handleGoogle(providerConfig, code)
	case "wechat":
		return s.handleWeChat(providerConfig, code)
	default:
		return nil, fmt.Errorf("unsupported provider: %s", provider)
	}
}

// FindOrCreateUser finds an existing user or creates a new one based on OAuth info
func (s *OAuthService) FindOrCreateUser(provider string, userInfo *OAuthUserInfo) (*models.User, error) {
	db := database.DB

	// 1. Check if OAuth provider link already exists
	var oauthProvider models.OAuthProvider
	err := db.Where("provider = ? AND provider_user_id = ?", provider, userInfo.ProviderUserID).First(&oauthProvider).Error
	if err == nil {
		// Found existing link, return the user
		var user models.User
		if err := db.First(&user, oauthProvider.UserID).Error; err != nil {
			return nil, fmt.Errorf("failed to find linked user: %w", err)
		}
		return &user, nil
	}

	// 2. Check if email matches an existing user (skip placeholder emails)
	var existingUser models.User
	if userInfo.Email != "" && !strings.Contains(userInfo.Email, "@oauth.placeholder") {
		if err := db.Where("email = ?", userInfo.Email).First(&existingUser).Error; err == nil {
			// Link the OAuth provider to the existing user
			oauthLink := models.OAuthProvider{
				UserID:         existingUser.ID,
				Provider:       provider,
				ProviderUserID: userInfo.ProviderUserID,
				Email:          userInfo.Email,
				Name:           userInfo.Name,
				AvatarURL:      userInfo.AvatarURL,
			}
			if err := db.Create(&oauthLink).Error; err != nil {
				return nil, fmt.Errorf("failed to link OAuth provider: %w", err)
			}
			return &existingUser, nil
		}
	}

	// 3. Create a new user
	email := userInfo.Email
	if email == "" {
		email = fmt.Sprintf("wechat_%s@oauth.placeholder", userInfo.ProviderUserID)
	}

	name := userInfo.Name
	if name == "" {
		name = provider + " user"
	}

	newUser := models.User{
		Email: email,
		Name:  name,
	}

	if err := db.Create(&newUser).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Link OAuth provider
	oauthLink := models.OAuthProvider{
		UserID:         newUser.ID,
		Provider:       provider,
		ProviderUserID: userInfo.ProviderUserID,
		Email:          userInfo.Email,
		Name:           userInfo.Name,
		AvatarURL:      userInfo.AvatarURL,
	}
	if err := db.Create(&oauthLink).Error; err != nil {
		return nil, fmt.Errorf("failed to link OAuth provider: %w", err)
	}

	// Create default resume
	s.createDefaultResume(newUser.ID, newUser.Name)

	return &newUser, nil
}

// GenerateTokens generates access and refresh tokens for a user
func (s *OAuthService) GenerateTokens(user *models.User) (accessToken, refreshToken string, err error) {
	accessToken, err = auth.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, expiresAt, err := auth.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Save refresh token
	tokenRecord := models.RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: expiresAt,
	}
	database.DB.Create(&tokenRecord)

	return accessToken, refreshToken, nil
}

// GetFrontendCallbackURL returns the frontend callback URL with tokens in hash
func (s *OAuthService) GetFrontendCallbackURL(accessToken, refreshToken string) string {
	return fmt.Sprintf("%s#access_token=%s&refresh_token=%s",
		s.config.FrontendCallbackURL, accessToken, refreshToken)
}

// --- GitHub ---

func (s *OAuthService) getGitHubAuthURL(cfg *config.OAuthProviderConfig, state string) string {
	params := url.Values{
		"client_id":    {cfg.ClientID},
		"redirect_uri": {cfg.RedirectURI},
		"scope":        {"read:user user:email"},
		"state":        {state},
	}
	return "https://github.com/login/oauth/authorize?" + params.Encode()
}

func (s *OAuthService) handleGitHub(cfg *config.OAuthProviderConfig, code string) (*OAuthUserInfo, error) {
	// Exchange code for token
	tokenURL := "https://github.com/login/oauth/access_token"
	data := url.Values{
		"client_id":     {cfg.ClientID},
		"client_secret": {cfg.ClientSecret},
		"code":          {code},
		"redirect_uri":  {cfg.RedirectURI},
	}

	req, err := http.NewRequest("POST", tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	defer resp.Body.Close()

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
		Error       string `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, fmt.Errorf("failed to decode token response: %w", err)
	}
	if tokenResp.Error != "" {
		return nil, fmt.Errorf("GitHub token error: %s", tokenResp.Error)
	}

	// Get user info
	userReq, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	userReq.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)
	userReq.Header.Set("Accept", "application/json")

	userResp, err := http.DefaultClient.Do(userReq)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer userResp.Body.Close()

	var ghUser struct {
		ID        int    `json:"id"`
		Login     string `json:"login"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := json.NewDecoder(userResp.Body).Decode(&ghUser); err != nil {
		return nil, fmt.Errorf("failed to decode user info: %w", err)
	}

	name := ghUser.Name
	if name == "" {
		name = ghUser.Login
	}

	email := ghUser.Email
	// If email is empty, try to get it from the emails endpoint
	if email == "" {
		email = s.getGitHubEmail(tokenResp.AccessToken)
	}

	return &OAuthUserInfo{
		ProviderUserID: fmt.Sprintf("%d", ghUser.ID),
		Email:          email,
		Name:           name,
		AvatarURL:      ghUser.AvatarURL,
	}, nil
}

func (s *OAuthService) getGitHubEmail(accessToken string) string {
	req, _ := http.NewRequest("GET", "https://api.github.com/user/emails", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return ""
	}
	defer resp.Body.Close()

	var emails []struct {
		Email    string `json:"email"`
		Primary  bool   `json:"primary"`
		Verified bool   `json:"verified"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&emails); err != nil {
		return ""
	}

	for _, e := range emails {
		if e.Primary && e.Verified {
			return e.Email
		}
	}
	for _, e := range emails {
		if e.Verified {
			return e.Email
		}
	}
	return ""
}

// --- Google ---

func (s *OAuthService) getGoogleAuthURL(cfg *config.OAuthProviderConfig, state string) string {
	params := url.Values{
		"client_id":     {cfg.ClientID},
		"redirect_uri":  {cfg.RedirectURI},
		"response_type": {"code"},
		"scope":         {"openid email profile"},
		"state":         {state},
		"access_type":   {"offline"},
	}
	return "https://accounts.google.com/o/oauth2/v2/auth?" + params.Encode()
}

func (s *OAuthService) handleGoogle(cfg *config.OAuthProviderConfig, code string) (*OAuthUserInfo, error) {
	// Exchange code for token
	tokenURL := "https://oauth2.googleapis.com/token"
	data := url.Values{
		"client_id":     {cfg.ClientID},
		"client_secret": {cfg.ClientSecret},
		"code":          {code},
		"grant_type":    {"authorization_code"},
		"redirect_uri":  {cfg.RedirectURI},
	}

	resp, err := http.PostForm(tokenURL, data)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	defer resp.Body.Close()

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, fmt.Errorf("failed to decode token response: %w", err)
	}
	if tokenResp.Error != "" {
		return nil, fmt.Errorf("Google token error: %s", tokenResp.Error)
	}

	// Get user info
	userReq, _ := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	userReq.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)

	userResp, err := http.DefaultClient.Do(userReq)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer userResp.Body.Close()

	var googleUser struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.NewDecoder(userResp.Body).Decode(&googleUser); err != nil {
		return nil, fmt.Errorf("failed to decode user info: %w", err)
	}

	return &OAuthUserInfo{
		ProviderUserID: googleUser.ID,
		Email:          googleUser.Email,
		Name:           googleUser.Name,
		AvatarURL:      googleUser.Picture,
	}, nil
}

// --- WeChat ---

func (s *OAuthService) getWeChatAuthURL(cfg *config.OAuthProviderConfig, state string) string {
	params := url.Values{
		"appid":         {cfg.ClientID},
		"redirect_uri":  {cfg.RedirectURI},
		"response_type": {"code"},
		"scope":         {"snsapi_login"},
		"state":         {state},
	}
	return "https://open.weixin.qq.com/connect/qrconnect?" + params.Encode() + "#wechat_redirect"
}

func (s *OAuthService) handleWeChat(cfg *config.OAuthProviderConfig, code string) (*OAuthUserInfo, error) {
	// Exchange code for token (WeChat uses GET)
	tokenURL := fmt.Sprintf(
		"https://api.weixin.qq.com/sns/oauth2/access_token?appid=%s&secret=%s&code=%s&grant_type=authorization_code",
		cfg.ClientID, cfg.ClientSecret, code,
	)

	resp, err := http.Get(tokenURL)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var tokenResp struct {
		AccessToken string `json:"access_token"`
		OpenID      string `json:"openid"`
		ErrCode     int    `json:"errcode"`
		ErrMsg      string `json:"errmsg"`
	}
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, fmt.Errorf("failed to decode token response: %w", err)
	}
	if tokenResp.ErrCode != 0 {
		return nil, fmt.Errorf("WeChat token error: %s", tokenResp.ErrMsg)
	}

	// Get user info
	userURL := fmt.Sprintf(
		"https://api.weixin.qq.com/sns/userinfo?access_token=%s&openid=%s&lang=zh_CN",
		tokenResp.AccessToken, tokenResp.OpenID,
	)

	userResp, err := http.Get(userURL)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer userResp.Body.Close()

	userBody, _ := io.ReadAll(userResp.Body)
	var wxUser struct {
		OpenID   string `json:"openid"`
		Nickname string `json:"nickname"`
		HeadURL  string `json:"headimgurl"`
		ErrCode  int    `json:"errcode"`
		ErrMsg   string `json:"errmsg"`
	}
	if err := json.Unmarshal(userBody, &wxUser); err != nil {
		return nil, fmt.Errorf("failed to decode user info: %w", err)
	}
	if wxUser.ErrCode != 0 {
		return nil, fmt.Errorf("WeChat user info error: %s", wxUser.ErrMsg)
	}

	return &OAuthUserInfo{
		ProviderUserID: wxUser.OpenID,
		Email:          "", // WeChat does not provide email
		Name:           wxUser.Nickname,
		AvatarURL:      wxUser.HeadURL,
	}, nil
}

// createDefaultResume creates a default resume for a new OAuth user
func (s *OAuthService) createDefaultResume(userID uint, userName string) {
	startDate, _ := time.Parse("2006-01-02", "2020-01-01")

	resume := models.Resume{
		UserID:     userID,
		Title:      "我的简历",
		TemplateID: 1,
		IsDefault:  true,
	}
	if err := database.DB.Create(&resume).Error; err != nil {
		return
	}

	personalInfo := models.PersonalInfo{
		ResumeID: resume.ID,
		FullName: userName,
		Summary:  "简要介绍你的职业背景和技能特长",
	}
	database.DB.Create(&personalInfo)

	workExp := models.WorkExperience{
		ResumeID:     resume.ID,
		CompanyName:  "示例公司",
		Position:     "职位名称",
		Location:     "城市",
		StartDate:    startDate,
		IsCurrent:    true,
		Description:  "• 描述你的工作职责和成就\n• 使用量化数据展示工作成果\n• 突出你的关键技能和贡献",
		DisplayOrder: 0,
	}
	database.DB.Create(&workExp)

	education := models.Education{
		ResumeID:     resume.ID,
		Institution:  "大学名称",
		Degree:       "学位 (如学士/硕士)",
		FieldOfStudy: "专业名称",
		Location:     "城市",
		StartDate:    startDate,
		Description:  "相关课程、荣誉或活动",
		DisplayOrder: 0,
	}
	database.DB.Create(&education)

	skills := []models.Skill{
		{ResumeID: resume.ID, Category: "编程语言", Name: "JavaScript, Python, Go", ProficiencyLevel: "熟练", DisplayOrder: 0},
		{ResumeID: resume.ID, Category: "框架/工具", Name: "React, Node.js, Docker", ProficiencyLevel: "熟练", DisplayOrder: 1},
	}
	for _, skill := range skills {
		database.DB.Create(&skill)
	}

	project := models.Project{
		ResumeID:     resume.ID,
		Name:         "项目名称",
		Description:  "项目简介和你在其中的角色\n\n技术栈：列出使用的技术\n\n主要成果：\n• 成就1\n• 成就2",
		Technologies: "React, Node.js, MongoDB",
		StartDate:    &startDate,
		DisplayOrder: 0,
	}
	database.DB.Create(&project)
}
