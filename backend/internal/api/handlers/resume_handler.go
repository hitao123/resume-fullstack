package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/henryhua/resume-backend/internal/api/middleware"
	"github.com/henryhua/resume-backend/internal/domain/models"
	"github.com/henryhua/resume-backend/internal/dto"
	"github.com/henryhua/resume-backend/pkg/database"
	"gorm.io/gorm"
)

type ResumeHandler struct{}

func NewResumeHandler() *ResumeHandler {
	return &ResumeHandler{}
}

// GetResumes returns all user's resumes
func (h *ResumeHandler) GetResumes(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var resumes []models.Resume
	if err := database.DB.Where("user_id = ?", userID).Order("updated_at DESC").Find(&resumes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch resumes",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    resumes,
	})
}

// GetResume returns a specific resume with all sections
func (h *ResumeHandler) GetResume(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	resumeID := c.Param("id")

	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", resumeID, userID).
		Preload("PersonalInfo").
		Preload("WorkExperiences", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order ASC")
		}).
		Preload("Education", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order ASC")
		}).
		Preload("Skills", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order ASC")
		}).
		Preload("Projects", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order ASC")
		}).
		Preload("Certifications", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order ASC")
		}).
		Preload("Languages").
		First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    resume,
	})
}

// CreateResume creates a new resume
func (h *ResumeHandler) CreateResume(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.CreateResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	templateID := 1
	if req.TemplateID != nil {
		templateID = *req.TemplateID
	}

	resume := models.Resume{
		UserID:     userID,
		Title:      req.Title,
		TemplateID: templateID,
	}

	if err := database.DB.Create(&resume).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create resume",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    resume,
	})
}

// UpdateResume updates resume metadata
func (h *ResumeHandler) UpdateResume(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	resumeID := c.Param("id")

	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", resumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	var req dto.UpdateResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	if req.Title != nil {
		resume.Title = *req.Title
	}
	if req.TemplateID != nil {
		resume.TemplateID = *req.TemplateID
	}
	if req.IsDefault != nil {
		resume.IsDefault = *req.IsDefault
	}

	if err := database.DB.Save(&resume).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update resume",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    resume,
	})
}

// DeleteResume deletes a resume
func (h *ResumeHandler) DeleteResume(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	resumeID := c.Param("id")

	result := database.DB.Where("id = ? AND user_id = ?", resumeID, userID).Delete(&models.Resume{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete resume",
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Resume deleted successfully",
	})
}

// GetPersonalInfo returns personal info for a resume
func (h *ResumeHandler) GetPersonalInfo(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	resumeID := c.Param("resumeId")

	// Verify resume ownership
	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var personalInfo models.PersonalInfo
	if err := database.DB.Where("resume_id = ?", resumeID).First(&personalInfo).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Personal info not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    personalInfo,
	})
}

// UpdatePersonalInfo updates personal info
func (h *ResumeHandler) UpdatePersonalInfo(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	resumeID := c.Param("resumeId")

	// Verify resume ownership
	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var req dto.PersonalInfoInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	resumeIDUint, _ := strconv.ParseUint(resumeID, 10, 32)

	var personalInfo models.PersonalInfo
	err := database.DB.Where("resume_id = ?", resumeID).First(&personalInfo).Error

	if err != nil {
		// Create new personal info
		personalInfo = models.PersonalInfo{
			ResumeID: uint(resumeIDUint),
			FullName: req.FullName,
			Email:    req.Email,
			Phone:    req.Phone,
			Location: req.Location,
			Website:  req.Website,
			LinkedIn: req.LinkedIn,
			Github:   req.Github,
			Summary:  req.Summary,
		}
		if err := database.DB.Create(&personalInfo).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to create personal info",
			})
			return
		}
	} else {
		// Update existing
		personalInfo.FullName = req.FullName
		personalInfo.Email = req.Email
		personalInfo.Phone = req.Phone
		personalInfo.Location = req.Location
		personalInfo.Website = req.Website
		personalInfo.LinkedIn = req.LinkedIn
		personalInfo.Github = req.Github
		personalInfo.Summary = req.Summary

		if err := database.DB.Save(&personalInfo).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to update personal info",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    personalInfo,
	})
}

// Helper function to verify resume ownership
func (h *ResumeHandler) verifyResumeOwnership(c *gin.Context, resumeID string, userID uint) bool {
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", resumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return false
	}
	return true
}

// Helper function to parse date
func parseDate(dateStr string) (*time.Time, error) {
	if dateStr == "" {
		return nil, nil
	}
	t, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return nil, err
	}
	return &t, nil
}
