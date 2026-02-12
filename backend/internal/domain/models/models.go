package models

import (
	"time"
	"gorm.io/gorm"
)

// User represents a user account
type User struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	Email        string         `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash string         `gorm:"type:varchar(255);not null" json:"-"`
	Name         string         `gorm:"type:varchar(255)" json:"name"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Resumes       []Resume       `gorm:"foreignKey:UserID" json:"resumes,omitempty"`
	RefreshTokens []RefreshToken `gorm:"foreignKey:UserID" json:"-"`
}

// Resume represents a resume document
type Resume struct {
	ID         uint           `gorm:"primarykey" json:"id"`
	UserID     uint           `gorm:"not null;index" json:"userId"`
	Title      string         `gorm:"not null;default:'Untitled Resume'" json:"title"`
	TemplateID int            `gorm:"default:1" json:"templateId"`
	IsDefault  bool           `gorm:"default:false" json:"isDefault"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	User            User              `gorm:"foreignKey:UserID" json:"-"`
	PersonalInfo    *PersonalInfo     `gorm:"foreignKey:ResumeID" json:"personalInfo,omitempty"`
	WorkExperiences []WorkExperience  `gorm:"foreignKey:ResumeID" json:"workExperiences,omitempty"`
	Education       []Education       `gorm:"foreignKey:ResumeID" json:"education,omitempty"`
	Skills          []Skill           `gorm:"foreignKey:ResumeID" json:"skills,omitempty"`
	Projects        []Project         `gorm:"foreignKey:ResumeID" json:"projects,omitempty"`
	Certifications  []Certification   `gorm:"foreignKey:ResumeID" json:"certifications,omitempty"`
	Languages       []Language        `gorm:"foreignKey:ResumeID" json:"languages,omitempty"`
}

// PersonalInfo represents personal information section
type PersonalInfo struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	ResumeID  uint      `gorm:"uniqueIndex;not null" json:"resumeId"`
	FullName  string    `json:"fullName"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Location  string    `json:"location"`
	Website   string    `json:"website"`
	LinkedIn  string    `json:"linkedin"`
	Github    string    `json:"github"`
	Summary   string    `gorm:"type:text" json:"summary"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// WorkExperience represents work experience entry
type WorkExperience struct {
	ID           uint      `gorm:"primarykey" json:"id"`
	ResumeID     uint      `gorm:"not null;index" json:"resumeId"`
	CompanyName  string    `gorm:"not null" json:"companyName"`
	Position     string    `gorm:"not null" json:"position"`
	Location     string    `json:"location"`
	StartDate    time.Time `gorm:"type:date;not null" json:"startDate"`
	EndDate      *time.Time `gorm:"type:date" json:"endDate"`
	IsCurrent    bool      `gorm:"default:false" json:"isCurrent"`
	Description  string    `gorm:"type:text" json:"description"`
	DisplayOrder int       `gorm:"default:0;index" json:"displayOrder"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// Education represents education entry
type Education struct {
	ID            uint       `gorm:"primarykey" json:"id"`
	ResumeID      uint       `gorm:"not null;index" json:"resumeId"`
	Institution   string     `gorm:"not null" json:"institution"`
	Degree        string     `gorm:"not null" json:"degree"`
	FieldOfStudy  string     `json:"fieldOfStudy"`
	Location      string     `json:"location"`
	StartDate     time.Time  `gorm:"type:date;not null" json:"startDate"`
	EndDate       *time.Time `gorm:"type:date" json:"endDate"`
	GPA           string     `json:"gpa"`
	Description   string     `gorm:"type:text" json:"description"`
	DisplayOrder  int        `gorm:"default:0;index" json:"displayOrder"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

// Skill represents a skill entry
type Skill struct {
	ID              uint      `gorm:"primarykey" json:"id"`
	ResumeID        uint      `gorm:"not null;index" json:"resumeId"`
	Category        string    `gorm:"index" json:"category"`
	Name            string    `gorm:"not null" json:"name"`
	ProficiencyLevel string   `json:"proficiencyLevel"`
	DisplayOrder    int       `gorm:"default:0;index" json:"displayOrder"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
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

// RefreshToken represents a JWT refresh token
type RefreshToken struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"userId"`
	Token     string    `gorm:"type:varchar(500);uniqueIndex;not null" json:"token"`
	ExpiresAt time.Time `gorm:"not null;index" json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
}
