package dto

// CreateResumeRequest represents create resume request
type CreateResumeRequest struct {
	Title      string `json:"title" binding:"required,max=255"`
	TemplateID *int   `json:"templateId"`
}

// UpdateResumeRequest represents update resume request
type UpdateResumeRequest struct {
	Title      *string `json:"title" binding:"omitempty,max=255"`
	TemplateID *int    `json:"templateId"`
	IsDefault  *bool   `json:"isDefault"`
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
	FullName string `json:"fullName"`
	Email    string `json:"email" binding:"omitempty,email"`
	Phone    string `json:"phone"`
	Location string `json:"location"`
	Website  string `json:"website" binding:"omitempty,url"`
	LinkedIn string `json:"linkedin"`
	Github   string `json:"github"`
	Summary  string `json:"summary"`
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
