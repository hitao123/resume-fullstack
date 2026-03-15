package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// AIService handles communication with OpenAI API
type AIService struct {
	apiKey  string
	model   string
	baseURL string
}

// NewAIService creates a new AI service instance
func NewAIService() *AIService {
	baseURL := os.Getenv("AI_BASE_URL")
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}
	model := os.Getenv("AI_MODEL")
	if model == "" {
		model = "gpt-4o-mini"
	}
	return &AIService{
		apiKey:  os.Getenv("AI_API_KEY"),
		model:   model,
		baseURL: baseURL,
	}
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
	Stream   bool          `json:"stream"`
}

type chatChunkChoice struct {
	Delta struct {
		Content string `json:"content"`
	} `json:"delta"`
}

type chatChunk struct {
	Choices []chatChunkChoice `json:"choices"`
}

// StreamChat sends a streaming chat completion request and returns the response body for SSE forwarding.
// Caller is responsible for closing the returned body.
func (s *AIService) StreamChat(systemPrompt, userPrompt string) (io.ReadCloser, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("AI_API_KEY is not configured")
	}

	reqBody := chatRequest{
		Model: s.model,
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Stream: true,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", s.baseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		defer resp.Body.Close()
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OpenAI API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	return resp.Body, nil
}

// GenerateSummaryPrompt returns the system prompt for summary generation
func GenerateSummaryPrompt(language string) string {
	if language == "zh" {
		return `你是一位专业的简历顾问。根据用户的工作经历、项目经历和技能，生成一段简洁有力的个人简介（Summary）。
要求：
- 使用中文
- 100-200字
- 突出核心竞争力和关键技能
- 使用第一人称
- 语言专业、简洁
- 返回 HTML 格式，可以使用 <p>、<strong> 标签`
	}
	return `You are a professional resume consultant. Based on the user's work experience, projects, and skills, generate a concise and impactful professional summary.
Requirements:
- Use English
- 50-100 words
- Highlight core competencies and key skills
- Use first person
- Professional and concise language
- Return in HTML format, you may use <p> and <strong> tags`
}

// EnhanceDescriptionPrompt returns the system prompt for description enhancement
func EnhanceDescriptionPrompt(language string) string {
	if language == "zh" {
		return `你是一位专业的简历顾问。优化用户提供的工作/项目描述，使其更加专业、有说服力。
要求：
- 使用中文
- 加入量化指标（如百分比、数字）
- 使用 STAR 法则（情境-任务-行动-结果）
- 使用动词开头（如"主导"、"优化"、"设计"）
- 保持简洁，每条不超过两行
- 返回 HTML 格式，使用 <ul><li> 列表格式`
	}
	return `You are a professional resume consultant. Enhance the provided work/project description to be more professional and compelling.
Requirements:
- Use English
- Add quantifiable metrics (percentages, numbers)
- Apply STAR method (Situation-Task-Action-Result)
- Start with action verbs (e.g., "Led", "Optimized", "Designed")
- Keep each point concise, no more than two lines
- Return in HTML format using <ul><li> list format`
}
