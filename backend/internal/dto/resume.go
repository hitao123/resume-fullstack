package dto

// CreateResumeRequest represents create resume request
type CreateResumeRequest struct {
	Title        string `json:"title" binding:"required,max=255"`
	TemplateID   *int   `json:"templateId"`
	VersionLabel string `json:"versionLabel"`
	TargetRole   string `json:"targetRole"`
}

// UpdateResumeRequest represents update resume request
type UpdateResumeRequest struct {
	ID            uint                        `json:"id" binding:"required"`
	Title         *string                     `json:"title" binding:"omitempty,max=255"`
	TemplateID    *int                        `json:"templateId"`
	VersionLabel  *string                     `json:"versionLabel"`
	TargetRole    *string                     `json:"targetRole"`
	SectionConfig *[]ResumeSectionConfigInput `json:"sectionConfig"`
	IsDefault     *bool                       `json:"isDefault"`
}

type ResumeSectionConfigInput struct {
	Key     string `json:"key" binding:"required"`
	Visible bool   `json:"visible"`
	Order   int    `json:"order"`
}

// GetResumeRequest represents get resume request
type GetResumeRequest struct {
	ID uint `json:"id" binding:"required"`
}

// DeleteResumeRequest represents delete resume request
type DeleteResumeRequest struct {
	ID uint `json:"id" binding:"required"`
}

// ReorderRequest represents reorder items request
type ReorderRequest struct {
	Items []ReorderItem `json:"items" binding:"required"`
}

// ReorderItem represents a single item to reorder
type ReorderItem struct {
	ID           uint `json:"id" binding:"required"`
	DisplayOrder int  `json:"displayOrder" binding:"min=0"`
}

// PersonalInfoInput represents personal info input
type PersonalInfoInput struct {
	FullName   string `json:"fullName"`
	Email      string `json:"email" binding:"omitempty,email"`
	Phone      string `json:"phone"`
	Location   string `json:"location"`
	Website    string `json:"website" binding:"omitempty,url"`
	LinkedIn   string `json:"linkedin"`
	Github     string `json:"github"`
	AvatarURL  string `json:"avatarUrl" binding:"omitempty,url"`
	ShowAvatar bool   `json:"showAvatar"`
	Summary    string `json:"summary"`
}

// WorkExperienceInput represents work experience input
type WorkExperienceInput struct {
	CompanyName  string `json:"companyName" binding:"required"`
	Position     string `json:"position" binding:"required"`
	Location     string `json:"location"`
	StartDate    string `json:"startDate" binding:"required"`
	EndDate      string `json:"endDate"`
	IsCurrent    bool   `json:"isCurrent"`
	Description  string `json:"description"`
	DisplayOrder int    `json:"displayOrder"`
}

// EducationInput represents education input
type EducationInput struct {
	Institution  string `json:"institution" binding:"required"`
	Degree       string `json:"degree" binding:"required"`
	FieldOfStudy string `json:"fieldOfStudy"`
	Location     string `json:"location"`
	StartDate    string `json:"startDate" binding:"required"`
	EndDate      string `json:"endDate"`
	GPA          string `json:"gpa"`
	Description  string `json:"description"`
	DisplayOrder int    `json:"displayOrder"`
}

// SkillInput represents skill input
type SkillInput struct {
	Category         string `json:"category"`
	Name             string `json:"name" binding:"required"`
	ProficiencyLevel string `json:"proficiencyLevel"`
	DisplayOrder     int    `json:"displayOrder"`
}

// ProjectInput represents project input
type ProjectInput struct {
	Name         string `json:"name" binding:"required"`
	Description  string `json:"description"`
	Technologies string `json:"technologies"`
	URL          string `json:"url" binding:"omitempty,url"`
	GithubURL    string `json:"githubUrl" binding:"omitempty,url"`
	StartDate    string `json:"startDate"`
	EndDate      string `json:"endDate"`
	DisplayOrder int    `json:"displayOrder"`
}

// CertificationInput represents certification input
type CertificationInput struct {
	Name                string `json:"name" binding:"required"`
	IssuingOrganization string `json:"issuingOrganization"`
	IssueDate           string `json:"issueDate"`
	ExpiryDate          string `json:"expiryDate"`
	CredentialID        string `json:"credentialId"`
	CredentialURL       string `json:"credentialUrl" binding:"omitempty,url"`
	DisplayOrder        int    `json:"displayOrder"`
}

// LanguageInput represents language input
type LanguageInput struct {
	Language     string `json:"language" binding:"required"`
	Proficiency  string `json:"proficiency"`
	DisplayOrder int    `json:"displayOrder"`
}

// AwardInput represents award input
type AwardInput struct {
	Title        string `json:"title" binding:"required"`
	Issuer       string `json:"issuer"`
	IssueDate    string `json:"issueDate"`
	Description  string `json:"description"`
	DisplayOrder int    `json:"displayOrder"`
}

// CustomSectionInput represents custom section input
type CustomSectionInput struct {
	Title        string `json:"title" binding:"required"`
	Content      string `json:"content"`
	DisplayOrder int    `json:"displayOrder"`
}

// ========== Request wrappers for personal info, sections, etc ==========

// GetPersonalInfoRequest represents get personal info request
type GetPersonalInfoRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
}

// UpdatePersonalInfoRequest represents update personal info request
type UpdatePersonalInfoRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	PersonalInfoInput
}

// GetWorkExperiencesRequest represents get work experiences request
type GetWorkExperiencesRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
}

// CreateWorkExperienceRequest represents create work experience request
type CreateWorkExperienceRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	WorkExperienceInput
}

// UpdateWorkExperienceRequest represents update work experience request
type UpdateWorkExperienceRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
	WorkExperienceInput
}

// DeleteWorkExperienceRequest represents delete work experience request
type DeleteWorkExperienceRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
}

// ReorderWorkExperiencesRequest represents reorder work experiences request
type ReorderWorkExperiencesRequest struct {
	ResumeID uint          `json:"resumeId" binding:"required"`
	Items    []ReorderItem `json:"items" binding:"required"`
}

// GetEducationRequest represents get education request
type GetEducationRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
}

// CreateEducationRequest represents create education request
type CreateEducationRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	EducationInput
}

// UpdateEducationRequest represents update education request
type UpdateEducationRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
	EducationInput
}

// DeleteEducationRequest represents delete education request
type DeleteEducationRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
}

// ReorderEducationRequest represents reorder education request
type ReorderEducationRequest struct {
	ResumeID uint          `json:"resumeId" binding:"required"`
	Items    []ReorderItem `json:"items" binding:"required"`
}

// GetSkillsRequest represents get skills request
type GetSkillsRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
}

// CreateSkillRequest represents create skill request
type CreateSkillRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	SkillInput
}

// UpdateSkillRequest represents update skill request
type UpdateSkillRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
	SkillInput
}

// DeleteSkillRequest represents delete skill request
type DeleteSkillRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
}

// BulkUpdateSkillsRequest represents bulk update skills request
type BulkUpdateSkillsRequest struct {
	ResumeID uint         `json:"resumeId" binding:"required"`
	Skills   []SkillInput `json:"skills" binding:"required"`
}

// GetProjectsRequest represents get projects request
type GetProjectsRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
}

// CreateProjectRequest represents create project request
type CreateProjectRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ProjectInput
}

// UpdateProjectRequest represents update project request
type UpdateProjectRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
	ProjectInput
}

// DeleteProjectRequest represents delete project request
type DeleteProjectRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
}

type GetCertificationsRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
}

type CreateCertificationRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	CertificationInput
}

type UpdateCertificationRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
	CertificationInput
}

type DeleteCertificationRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
}

type GetLanguagesRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
}

type CreateLanguageRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	LanguageInput
}

type UpdateLanguageRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
	LanguageInput
}

type DeleteLanguageRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
}

type GetAwardsRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
}

type CreateAwardRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	AwardInput
}

type UpdateAwardRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
	AwardInput
}

type DeleteAwardRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
}

type GetCustomSectionsRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
}

type CreateCustomSectionRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	CustomSectionInput
}

type UpdateCustomSectionRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
	CustomSectionInput
}

type DeleteCustomSectionRequest struct {
	ResumeID uint `json:"resumeId" binding:"required"`
	ID       uint `json:"id" binding:"required"`
}
