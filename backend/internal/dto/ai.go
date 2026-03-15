package dto

// GenerateSummaryRequest is the request for AI summary generation
type GenerateSummaryRequest struct {
	ResumeID uint   `json:"resumeId" binding:"required"`
	Language string `json:"language" binding:"required,oneof=zh en"`
}

// EnhanceDescriptionRequest is the request for AI description enhancement
type EnhanceDescriptionRequest struct {
	Content  string `json:"content" binding:"required"`
	Position string `json:"position"`
	Company  string `json:"company"`
	Language string `json:"language" binding:"required,oneof=zh en"`
}
