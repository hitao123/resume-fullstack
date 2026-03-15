package handlers

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/henryhua/resume-backend/internal/api/middleware"
	"github.com/henryhua/resume-backend/internal/domain/models"
	"github.com/henryhua/resume-backend/internal/dto"
	"github.com/henryhua/resume-backend/internal/service"
	"github.com/henryhua/resume-backend/pkg/database"
)

// AIHandler handles AI-related requests
type AIHandler struct {
	aiService *service.AIService
}

// NewAIHandler creates a new AI handler
func NewAIHandler() *AIHandler {
	return &AIHandler{
		aiService: service.NewAIService(),
	}
}

// GenerateSummary generates a professional summary using AI based on resume data
func (h *AIHandler) GenerateSummary(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.GenerateSummaryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify resume belongs to user
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resume not found"})
		return
	}

	// Gather resume data for context
	var workExperiences []models.WorkExperience
	database.DB.Where("resume_id = ?", req.ResumeID).Order("display_order").Find(&workExperiences)

	var projects []models.Project
	database.DB.Where("resume_id = ?", req.ResumeID).Order("display_order").Find(&projects)

	var skills []models.Skill
	database.DB.Where("resume_id = ?", req.ResumeID).Find(&skills)

	// Build user prompt from resume data
	var sb strings.Builder
	sb.WriteString("Here is my resume data:\n\n")

	if len(workExperiences) > 0 {
		sb.WriteString("Work Experience:\n")
		for _, w := range workExperiences {
			sb.WriteString(fmt.Sprintf("- %s at %s (%s - %s): %s\n", w.Position, w.CompanyName, w.StartDate, w.EndDate, w.Description))
		}
		sb.WriteString("\n")
	}

	if len(projects) > 0 {
		sb.WriteString("Projects:\n")
		for _, p := range projects {
			sb.WriteString(fmt.Sprintf("- %s (Tech: %s): %s\n", p.Name, p.Technologies, p.Description))
		}
		sb.WriteString("\n")
	}

	if len(skills) > 0 {
		sb.WriteString("Skills:\n")
		for _, s := range skills {
			sb.WriteString(fmt.Sprintf("- %s (%s)\n", s.Name, s.Category))
		}
	}

	systemPrompt := service.GenerateSummaryPrompt(req.Language)
	h.streamResponse(c, systemPrompt, sb.String())
}

// EnhanceDescription enhances a work/project description using AI
func (h *AIHandler) EnhanceDescription(c *gin.Context) {
	// Verify user is authenticated
	_, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req dto.EnhanceDescriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Please enhance the following description:\n\n%s", req.Content))
	if req.Position != "" {
		sb.WriteString(fmt.Sprintf("\n\nPosition: %s", req.Position))
	}
	if req.Company != "" {
		sb.WriteString(fmt.Sprintf("\nCompany: %s", req.Company))
	}

	systemPrompt := service.EnhanceDescriptionPrompt(req.Language)
	h.streamResponse(c, systemPrompt, sb.String())
}

// streamResponse handles the SSE streaming from OpenAI to the client
func (h *AIHandler) streamResponse(c *gin.Context, systemPrompt, userPrompt string) {
	respBody, err := h.aiService.StreamChat(systemPrompt, userPrompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer respBody.Close()

	// Set SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "streaming not supported"})
		return
	}

	scanner := bufio.NewScanner(respBody)
	for scanner.Scan() {
		line := scanner.Text()

		if !strings.HasPrefix(line, "data: ") {
			continue
		}

		data := strings.TrimPrefix(line, "data: ")

		if data == "[DONE]" {
			fmt.Fprintf(c.Writer, "data: [DONE]\n\n")
			flusher.Flush()
			break
		}

		var chunk struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}

		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			continue
		}

		if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
			content := chunk.Choices[0].Delta.Content
			sseData, _ := json.Marshal(gin.H{"content": content})
			fmt.Fprintf(c.Writer, "data: %s\n\n", sseData)
			flusher.Flush()
		}
	}

	// Handle scanner error
	if err := scanner.Err(); err != nil && err != io.EOF {
		sseData, _ := json.Marshal(gin.H{"error": err.Error()})
		fmt.Fprintf(c.Writer, "data: %s\n\n", sseData)
		flusher.Flush()
	}
}
