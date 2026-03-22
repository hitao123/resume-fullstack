package models

import (
	"gorm.io/gorm"
	"time"
)

// User represents a user account
type User struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	Email        string         `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash string         `gorm:"type:varchar(255)" json:"-"`
	Name         string         `gorm:"type:varchar(255)" json:"name"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Resumes        []Resume           `gorm:"foreignKey:UserID" json:"resumes,omitempty"`
	RefreshTokens  []RefreshToken     `gorm:"foreignKey:UserID" json:"-"`
	OAuthProviders []OAuthProvider    `gorm:"foreignKey:UserID" json:"-"`
	Subscriptions  []UserSubscription `gorm:"foreignKey:UserID" json:"-"`
	Payments       []PaymentOrder     `gorm:"foreignKey:UserID" json:"-"`
}

// OAuthProvider represents a third-party OAuth provider linked to a user
type OAuthProvider struct {
	ID             uint      `gorm:"primarykey" json:"id"`
	UserID         uint      `gorm:"not null;index" json:"userId"`
	Provider       string    `gorm:"type:varchar(50);not null;uniqueIndex:idx_provider_uid" json:"provider"`
	ProviderUserID string    `gorm:"type:varchar(255);not null;uniqueIndex:idx_provider_uid" json:"providerUserId"`
	Email          string    `gorm:"type:varchar(255)" json:"email"`
	Name           string    `gorm:"type:varchar(255)" json:"name"`
	AvatarURL      string    `gorm:"type:varchar(500)" json:"avatarUrl"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// Resume represents a resume document
type Resume struct {
	ID            uint                  `gorm:"primarykey" json:"id"`
	UserID        uint                  `gorm:"not null;index" json:"userId"`
	Title         string                `gorm:"not null;default:'Untitled Resume'" json:"title"`
	TemplateID    int                   `gorm:"default:1" json:"templateId"`
	VersionLabel  string                `gorm:"type:varchar(255)" json:"versionLabel"`
	TargetRole    string                `gorm:"type:varchar(255)" json:"targetRole"`
	SectionConfig []ResumeSectionConfig `gorm:"serializer:json;type:longtext" json:"sectionConfig,omitempty"`
	IsDefault     bool                  `gorm:"default:false" json:"isDefault"`
	CreatedAt     time.Time             `json:"createdAt"`
	UpdatedAt     time.Time             `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt        `gorm:"index" json:"-"`

	// Relationships
	User            User             `gorm:"foreignKey:UserID" json:"-"`
	PersonalInfo    *PersonalInfo    `gorm:"foreignKey:ResumeID" json:"personalInfo,omitempty"`
	WorkExperiences []WorkExperience `gorm:"foreignKey:ResumeID" json:"workExperiences,omitempty"`
	Education       []Education      `gorm:"foreignKey:ResumeID" json:"education,omitempty"`
	Skills          []Skill          `gorm:"foreignKey:ResumeID" json:"skills,omitempty"`
	Projects        []Project        `gorm:"foreignKey:ResumeID" json:"projects,omitempty"`
	Certifications  []Certification  `gorm:"foreignKey:ResumeID" json:"certifications,omitempty"`
	Languages       []Language       `gorm:"foreignKey:ResumeID" json:"languages,omitempty"`
	Awards          []Award          `gorm:"foreignKey:ResumeID" json:"awards,omitempty"`
	CustomSections  []CustomSection  `gorm:"foreignKey:ResumeID" json:"customSections,omitempty"`
}

type ResumeSectionConfig struct {
	Key     string `json:"key"`
	Visible bool   `json:"visible"`
	Order   int    `json:"order"`
}

// PersonalInfo represents personal information section
type PersonalInfo struct {
	ID         uint      `gorm:"primarykey" json:"id"`
	ResumeID   uint      `gorm:"uniqueIndex;not null" json:"resumeId"`
	FullName   string    `json:"fullName"`
	Email      string    `json:"email"`
	Phone      string    `json:"phone"`
	Location   string    `json:"location"`
	Website    string    `json:"website"`
	LinkedIn   string    `json:"linkedin"`
	Github     string    `json:"github"`
	AvatarURL  string    `gorm:"type:varchar(500)" json:"avatarUrl"`
	ShowAvatar bool      `gorm:"default:false" json:"showAvatar"`
	Summary    string    `gorm:"type:text" json:"summary"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// WorkExperience represents work experience entry
type WorkExperience struct {
	ID           uint       `gorm:"primarykey" json:"id"`
	ResumeID     uint       `gorm:"not null;index" json:"resumeId"`
	CompanyName  string     `gorm:"not null" json:"companyName"`
	Position     string     `gorm:"not null" json:"position"`
	Location     string     `json:"location"`
	StartDate    time.Time  `gorm:"type:date;not null" json:"startDate"`
	EndDate      *time.Time `gorm:"type:date" json:"endDate"`
	IsCurrent    bool       `gorm:"default:false" json:"isCurrent"`
	Description  string     `gorm:"type:text" json:"description"`
	DisplayOrder int        `gorm:"default:0;index" json:"displayOrder"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

// Education represents education entry
type Education struct {
	ID           uint       `gorm:"primarykey" json:"id"`
	ResumeID     uint       `gorm:"not null;index" json:"resumeId"`
	Institution  string     `gorm:"not null" json:"institution"`
	Degree       string     `gorm:"not null" json:"degree"`
	FieldOfStudy string     `json:"fieldOfStudy"`
	Location     string     `json:"location"`
	StartDate    time.Time  `gorm:"type:date;not null" json:"startDate"`
	EndDate      *time.Time `gorm:"type:date" json:"endDate"`
	GPA          string     `json:"gpa"`
	Description  string     `gorm:"type:text" json:"description"`
	DisplayOrder int        `gorm:"default:0;index" json:"displayOrder"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

// Skill represents a skill entry
type Skill struct {
	ID               uint      `gorm:"primarykey" json:"id"`
	ResumeID         uint      `gorm:"not null;index" json:"resumeId"`
	Category         string    `gorm:"index" json:"category"`
	Name             string    `gorm:"not null" json:"name"`
	ProficiencyLevel string    `json:"proficiencyLevel"`
	DisplayOrder     int       `gorm:"default:0;index" json:"displayOrder"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

// Project represents a project entry
type Project struct {
	ID           uint       `gorm:"primarykey" json:"id"`
	ResumeID     uint       `gorm:"not null;index" json:"resumeId"`
	Name         string     `gorm:"not null" json:"name"`
	Description  string     `gorm:"type:text" json:"description"`
	Technologies string     `json:"technologies"`
	URL          string     `json:"url"`
	GithubURL    string     `json:"githubUrl"`
	StartDate    *time.Time `gorm:"type:date" json:"startDate"`
	EndDate      *time.Time `gorm:"type:date" json:"endDate"`
	DisplayOrder int        `gorm:"default:0;index" json:"displayOrder"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

// Certification represents a certification entry
type Certification struct {
	ID                  uint       `gorm:"primarykey" json:"id"`
	ResumeID            uint       `gorm:"not null;index" json:"resumeId"`
	Name                string     `gorm:"not null" json:"name"`
	IssuingOrganization string     `json:"issuingOrganization"`
	IssueDate           *time.Time `gorm:"type:date" json:"issueDate"`
	ExpiryDate          *time.Time `gorm:"type:date" json:"expiryDate"`
	CredentialID        string     `json:"credentialId"`
	CredentialURL       string     `json:"credentialUrl"`
	DisplayOrder        int        `gorm:"default:0;index" json:"displayOrder"`
	CreatedAt           time.Time  `json:"createdAt"`
	UpdatedAt           time.Time  `json:"updatedAt"`
}

// Language represents a language proficiency entry
type Language struct {
	ID           uint      `gorm:"primarykey" json:"id"`
	ResumeID     uint      `gorm:"not null;index" json:"resumeId"`
	Language     string    `gorm:"not null" json:"language"`
	Proficiency  string    `json:"proficiency"`
	DisplayOrder int       `gorm:"default:0" json:"displayOrder"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// Award represents an award entry
type Award struct {
	ID           uint       `gorm:"primarykey" json:"id"`
	ResumeID     uint       `gorm:"not null;index" json:"resumeId"`
	Title        string     `gorm:"not null" json:"title"`
	Issuer       string     `json:"issuer"`
	IssueDate    *time.Time `gorm:"type:date" json:"issueDate"`
	Description  string     `gorm:"type:text" json:"description"`
	DisplayOrder int        `gorm:"default:0;index" json:"displayOrder"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

// CustomSection represents a user-defined resume section
type CustomSection struct {
	ID           uint      `gorm:"primarykey" json:"id"`
	ResumeID     uint      `gorm:"not null;index" json:"resumeId"`
	Title        string    `gorm:"not null" json:"title"`
	Content      string    `gorm:"type:text" json:"content"`
	DisplayOrder int       `gorm:"default:0;index" json:"displayOrder"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// RefreshToken represents a JWT refresh token
type RefreshToken struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"userId"`
	Token     string    `gorm:"type:varchar(500);uniqueIndex;not null" json:"token"`
	ExpiresAt time.Time `gorm:"not null;index" json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
}

type Plan struct {
	ID                    uint      `gorm:"primarykey" json:"id"`
	Code                  string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	Name                  string    `gorm:"type:varchar(255);not null" json:"name"`
	PriceMonthly          int64     `gorm:"default:0" json:"priceMonthly"`
	PriceYearly           int64     `gorm:"default:0" json:"priceYearly"`
	ResumeLimit           int       `gorm:"default:0" json:"resumeLimit"`
	AIQuotaMonthly        int       `gorm:"default:0" json:"aiQuotaMonthly"`
	TemplateLimit         int       `gorm:"default:0" json:"templateLimit"`
	AllowDuplicate        bool      `gorm:"default:false" json:"allowDuplicate"`
	AllowCustomSections   bool      `gorm:"default:false" json:"allowCustomSections"`
	AllowCertifications   bool      `gorm:"default:false" json:"allowCertifications"`
	AllowLanguages        bool      `gorm:"default:false" json:"allowLanguages"`
	AllowAwards           bool      `gorm:"default:false" json:"allowAwards"`
	AllowHdPdf            bool      `gorm:"default:false" json:"allowHdPdf"`
	AllowJdOptimization   bool      `gorm:"default:false" json:"allowJdOptimization"`
	AllowMultiLanguage    bool      `gorm:"default:false" json:"allowMultiLanguage"`
	AllowPriorityFeatures bool      `gorm:"default:false" json:"allowPriorityFeatures"`
	Active                bool      `gorm:"default:true" json:"active"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

type UserSubscription struct {
	ID           uint       `gorm:"primarykey" json:"id"`
	UserID       uint       `gorm:"not null;index" json:"userId"`
	PlanID       uint       `gorm:"not null;index" json:"planId"`
	Status       string     `gorm:"type:varchar(50);not null;default:'active'" json:"status"`
	BillingCycle string     `gorm:"type:varchar(50);not null;default:'monthly'" json:"billingCycle"`
	StartAt      time.Time  `json:"startAt"`
	EndAt        *time.Time `json:"endAt"`
	RenewAt      *time.Time `json:"renewAt"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

type UserUsageMonthly struct {
	ID                uint      `gorm:"primarykey" json:"id"`
	UserID            uint      `gorm:"not null;uniqueIndex:idx_user_month" json:"userId"`
	YearMonth         string    `gorm:"type:char(7);not null;uniqueIndex:idx_user_month" json:"yearMonth"`
	AIUsed            int       `gorm:"default:0" json:"aiUsed"`
	PdfExportUsed     int       `gorm:"default:0" json:"pdfExportUsed"`
	ResumeCreatedUsed int       `gorm:"default:0" json:"resumeCreatedUsed"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

type PaymentOrder struct {
	ID              uint       `gorm:"primarykey" json:"id"`
	UserID          uint       `gorm:"not null;index" json:"userId"`
	PlanID          uint       `gorm:"not null;index" json:"planId"`
	Amount          int64      `gorm:"not null" json:"amount"`
	Status          string     `gorm:"type:varchar(50);not null;default:'pending'" json:"status"`
	BillingCycle    string     `gorm:"type:varchar(50);not null;default:'monthly'" json:"billingCycle"`
	Provider        string     `gorm:"type:varchar(50)" json:"provider"`
	ProviderOrderID string     `gorm:"type:varchar(255);index" json:"providerOrderId"`
	PaidAt          *time.Time `json:"paidAt"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}
