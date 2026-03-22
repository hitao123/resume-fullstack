package dto

// RegisterRequest represents registration request
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name" binding:"required,min=2"`
}

// LoginRequest represents login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RefreshTokenRequest represents refresh token request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	AccessToken  string    `json:"accessToken"`
	RefreshToken string    `json:"refreshToken"`
	User         *UserInfo `json:"user"`
}

type PlanSummary struct {
	Code                string `json:"code"`
	Name                string `json:"name"`
	ResumeLimit         int    `json:"resumeLimit"`
	AIQuotaMonthly      int    `json:"aiQuotaMonthly"`
	TemplateLimit       int    `json:"templateLimit"`
	AllowDuplicate      bool   `json:"allowDuplicate"`
	AllowCustomSections bool   `json:"allowCustomSections"`
	AllowCertifications bool   `json:"allowCertifications"`
	AllowLanguages      bool   `json:"allowLanguages"`
	AllowAwards         bool   `json:"allowAwards"`
	AllowHdPdf          bool   `json:"allowHdPdf"`
	AllowJdOptimization bool   `json:"allowJdOptimization"`
	AllowMultiLanguage  bool   `json:"allowMultiLanguage"`
}

type UsageSummary struct {
	YearMonth     string `json:"yearMonth"`
	AIUsed        int    `json:"aiUsed"`
	PdfExportUsed int    `json:"pdfExportUsed"`
}

// UserInfo represents user information
type UserInfo struct {
	ID          uint          `json:"id"`
	Email       string        `json:"email"`
	Name        string        `json:"name"`
	CreatedAt   string        `json:"createdAt"`
	UpdatedAt   string        `json:"updatedAt"`
	Plan        *PlanSummary  `json:"plan,omitempty"`
	Usage       *UsageSummary `json:"usage,omitempty"`
	UpgradeHint string        `json:"upgradeHint,omitempty"`
}
