package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/henryhua/resume-backend/internal/domain/models"
	"github.com/henryhua/resume-backend/internal/dto"
	"github.com/henryhua/resume-backend/pkg/auth"
	"github.com/henryhua/resume-backend/pkg/database"
)

type AuthHandler struct{}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"message": "User with this email already exists",
		})
		return
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to process password",
		})
		return
	}

	// Create user
	user := models.User{
		Email:        req.Email,
		PasswordHash: hashedPassword,
		Name:         req.Name,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create user",
		})
		return
	}

	// Create default resume with sample data
	h.createDefaultResume(user.ID, user.Name)

	// Generate tokens
	accessToken, err := auth.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate access token",
		})
		return
	}

	refreshToken, expiresAt, err := auth.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate refresh token",
		})
		return
	}

	// Save refresh token
	tokenRecord := models.RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: expiresAt,
	}
	database.DB.Create(&tokenRecord)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data": dto.AuthResponse{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			User: &dto.UserInfo{
				ID:        user.ID,
				Email:     user.Email,
				Name:      user.Name,
				CreatedAt: user.CreatedAt.Format(time.RFC3339),
				UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
			},
		},
	})
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Find user
	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid email or password",
		})
		return
	}

	// Check password
	if err := auth.CheckPassword(user.PasswordHash, req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid email or password",
		})
		return
	}

	// Generate tokens
	accessToken, err := auth.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate access token",
		})
		return
	}

	refreshToken, expiresAt, err := auth.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate refresh token",
		})
		return
	}

	// Save refresh token
	tokenRecord := models.RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: expiresAt,
	}
	database.DB.Create(&tokenRecord)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": dto.AuthResponse{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			User: &dto.UserInfo{
				ID:        user.ID,
				Email:     user.Email,
				Name:      user.Name,
				CreatedAt: user.CreatedAt.Format(time.RFC3339),
				UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
			},
		},
	})
}

// Refresh handles token refresh
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req dto.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Validate refresh token
	claims, err := auth.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid or expired refresh token",
		})
		return
	}

	// Check if token exists in database
	var tokenRecord models.RefreshToken
	if err := database.DB.Where("token = ? AND user_id = ?", req.RefreshToken, claims.UserID).First(&tokenRecord).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid refresh token",
		})
		return
	}

	// Check if token is expired
	if time.Now().After(tokenRecord.ExpiresAt) {
		database.DB.Delete(&tokenRecord)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Refresh token expired",
		})
		return
	}

	// Generate new tokens
	accessToken, err := auth.GenerateAccessToken(claims.UserID, claims.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate access token",
		})
		return
	}

	newRefreshToken, expiresAt, err := auth.GenerateRefreshToken(claims.UserID, claims.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate refresh token",
		})
		return
	}

	// Delete old refresh token and create new one
	database.DB.Delete(&tokenRecord)
	newTokenRecord := models.RefreshToken{
		UserID:    claims.UserID,
		Token:     newRefreshToken,
		ExpiresAt: expiresAt,
	}
	database.DB.Create(&newTokenRecord)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"accessToken":  accessToken,
			"refreshToken": newRefreshToken,
		},
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	var req dto.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Delete refresh token
	database.DB.Where("token = ?", req.RefreshToken).Delete(&models.RefreshToken{})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logged out successfully",
	})
}

// Me returns current user info
func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("userID")

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": dto.UserInfo{
			ID:        user.ID,
			Email:     user.Email,
			Name:      user.Name,
			CreatedAt: user.CreatedAt.Format(time.RFC3339),
			UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
		},
	})
}

// createDefaultResume creates a default resume with sample data for new users
func (h *AuthHandler) createDefaultResume(userID uint, userName string) {
	// Create default resume
	resume := models.Resume{
		UserID:     userID,
		Title:      "我的简历",
		TemplateID: 1,
		IsDefault:  true,
	}

	if err := database.DB.Create(&resume).Error; err != nil {
		return // Silently fail, don't block registration
	}

	// Create sample personal info
	startDate, _ := time.Parse("2006-01-02", "2020-01-01")

	personalInfo := models.PersonalInfo{
		ResumeID: resume.ID,
		FullName: userName,
		Email:    "",
		Phone:    "",
		Location: "",
		Summary:  "简要介绍你的职业背景和技能特长",
	}
	database.DB.Create(&personalInfo)

	// Create sample work experience
	workExp := models.WorkExperience{
		ResumeID:     resume.ID,
		CompanyName:  "示例公司",
		Position:     "职位名称",
		Location:     "城市",
		StartDate:    startDate,
		EndDate:      nil,
		IsCurrent:    true,
		Description:  "• 描述你的工作职责和成就\n• 使用量化数据展示工作成果\n• 突出你的关键技能和贡献",
		DisplayOrder: 0,
	}
	database.DB.Create(&workExp)

	// Create sample education
	education := models.Education{
		ResumeID:     resume.ID,
		Institution:  "大学名称",
		Degree:       "学位 (如学士/硕士)",
		FieldOfStudy: "专业名称",
		Location:     "城市",
		StartDate:    startDate,
		EndDate:      nil,
		Description:  "相关课程、荣誉或活动",
		DisplayOrder: 0,
	}
	database.DB.Create(&education)

	// Create sample skills
	skills := []models.Skill{
		{
			ResumeID:         resume.ID,
			Category:         "编程语言",
			Name:             "JavaScript, Python, Go",
			ProficiencyLevel: "熟练",
			DisplayOrder:     0,
		},
		{
			ResumeID:         resume.ID,
			Category:         "框架/工具",
			Name:             "React, Node.js, Docker",
			ProficiencyLevel: "熟练",
			DisplayOrder:     1,
		},
	}
	for _, skill := range skills {
		database.DB.Create(&skill)
	}

	// Create sample project
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

