package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/henryhua/resume-backend/internal/api/middleware"
	"github.com/henryhua/resume-backend/internal/api/response"
	"github.com/henryhua/resume-backend/internal/domain/models"
	"github.com/henryhua/resume-backend/internal/dto"
	"github.com/henryhua/resume-backend/internal/service"
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

	// 如果当前用户还没有任何简历，兜底创建一份默认模板简历并返回
	if len(resumes) == 0 {
		if defaultResume, err := h.createDefaultResumeForUser(userID); err == nil && defaultResume != nil {
			resumes = append(resumes, *defaultResume)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    resumes,
	})
}

// GetResume returns a specific resume with all sections
func (h *ResumeHandler) GetResume(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.GetResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ID, userID).
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
		Preload("Languages", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order ASC")
		}).
		Preload("Awards", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order ASC")
		}).
		Preload("CustomSections", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order ASC")
		}).
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
		response.BadRequest(c, "INVALID_REQUEST", err.Error())
		return
	}

	templateID := 1
	if req.TemplateID != nil {
		templateID = *req.TemplateID
	}
	billing := service.NewBillingService()
	if _, err := billing.CheckResumeCreation(userID); err != nil {
		h.handleLimitError(c, err)
		return
	}
	if err := billing.CheckTemplateAccess(userID, templateID); err != nil {
		h.handleLimitError(c, err)
		return
	}

	resume := models.Resume{
		UserID:       userID,
		Title:        req.Title,
		TemplateID:   templateID,
		VersionLabel: req.VersionLabel,
		TargetRole:   req.TargetRole,
	}

	if err := database.DB.Create(&resume).Error; err != nil {
		response.Internal(c, "RESUME_CREATE_FAILED", "Failed to create resume")
		return
	}

	response.Success(c, http.StatusCreated, resume)
}

// UpdateResume updates resume metadata
func (h *ResumeHandler) UpdateResume(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.UpdateResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", err.Error())
		return
	}

	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ID, userID).First(&resume).Error; err != nil {
		response.NotFound(c, "RESUME_NOT_FOUND", "Resume not found")
		return
	}

	if req.Title != nil {
		resume.Title = *req.Title
	}
	if req.TemplateID != nil {
		if err := service.NewBillingService().CheckTemplateAccess(userID, *req.TemplateID); err != nil {
			h.handleLimitError(c, err)
			return
		}
		resume.TemplateID = *req.TemplateID
	}
	if req.VersionLabel != nil {
		resume.VersionLabel = *req.VersionLabel
	}
	if req.TargetRole != nil {
		resume.TargetRole = *req.TargetRole
	}
	if req.SectionConfig != nil {
		resume.SectionConfig = make([]models.ResumeSectionConfig, 0, len(*req.SectionConfig))
		for _, item := range *req.SectionConfig {
			resume.SectionConfig = append(resume.SectionConfig, models.ResumeSectionConfig{
				Key:     item.Key,
				Visible: item.Visible,
				Order:   item.Order,
			})
		}
	}
	if req.IsDefault != nil {
		resume.IsDefault = *req.IsDefault
	}

	if err := database.DB.Save(&resume).Error; err != nil {
		response.Internal(c, "RESUME_UPDATE_FAILED", "Failed to update resume")
		return
	}

	response.Success(c, http.StatusOK, resume)
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

// DuplicateResume creates a copy of an existing resume with all its sections
func (h *ResumeHandler) DuplicateResume(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.GetResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.ID == 0 {
		if paramID, parseErr := strconv.ParseUint(c.Param("id"), 10, 64); parseErr == nil {
			req.ID = uint(paramID)
		} else {
			response.BadRequest(c, "INVALID_REQUEST", "resume id is required")
			return
		}
	}
	billing := service.NewBillingService()
	if err := billing.CheckFeature(userID, "duplicate"); err != nil {
		h.handleLimitError(c, err)
		return
	}
	if _, err := billing.CheckResumeCreation(userID); err != nil {
		h.handleLimitError(c, err)
		return
	}

	var originalResume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ID, userID).First(&originalResume).Error; err != nil {
		response.NotFound(c, "RESUME_NOT_FOUND", "Resume not found")
		return
	}

	// Get the original resume with all sections (already loaded above)
	if err := database.DB.Where("id = ? AND user_id = ?", req.ID, userID).
		Preload("PersonalInfo").
		Preload("WorkExperiences").
		Preload("Education").
		Preload("Skills").
		Preload("Projects").
		Preload("Certifications").
		Preload("Languages").
		Preload("Awards").
		Preload("CustomSections").
		First(&originalResume).Error; err != nil {
		response.NotFound(c, "RESUME_NOT_FOUND", "Resume not found")
		return
	}

	// Create new resume
	newResume := models.Resume{
		UserID:        userID,
		Title:         originalResume.Title + " - Copy",
		TemplateID:    originalResume.TemplateID,
		VersionLabel:  originalResume.VersionLabel,
		TargetRole:    originalResume.TargetRole,
		SectionConfig: originalResume.SectionConfig,
		IsDefault:     false,
	}

	tx := database.DB.Begin()

	// Create the resume
	if err := tx.Create(&newResume).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to duplicate resume",
		})
		return
	}

	// Copy personal info
	if originalResume.PersonalInfo != nil {
		personalInfo := *originalResume.PersonalInfo
		personalInfo.ID = 0
		personalInfo.ResumeID = newResume.ID
		if err := tx.Create(&personalInfo).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to copy personal info",
			})
			return
		}
	}

	// Copy work experiences
	for _, exp := range originalResume.WorkExperiences {
		newExp := exp
		newExp.ID = 0
		newExp.ResumeID = newResume.ID
		if err := tx.Create(&newExp).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to copy work experiences",
			})
			return
		}
	}

	// Copy education
	for _, edu := range originalResume.Education {
		newEdu := edu
		newEdu.ID = 0
		newEdu.ResumeID = newResume.ID
		if err := tx.Create(&newEdu).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to copy education",
			})
			return
		}
	}

	// Copy skills
	for _, skill := range originalResume.Skills {
		newSkill := skill
		newSkill.ID = 0
		newSkill.ResumeID = newResume.ID
		if err := tx.Create(&newSkill).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to copy skills",
			})
			return
		}
	}

	// Copy projects
	for _, project := range originalResume.Projects {
		newProject := project
		newProject.ID = 0
		newProject.ResumeID = newResume.ID
		if err := tx.Create(&newProject).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to copy projects",
			})
			return
		}
	}

	// Copy certifications
	for _, cert := range originalResume.Certifications {
		newCert := cert
		newCert.ID = 0
		newCert.ResumeID = newResume.ID
		if err := tx.Create(&newCert).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to copy certifications",
			})
			return
		}
	}

	// Copy languages
	for _, lang := range originalResume.Languages {
		newLang := lang
		newLang.ID = 0
		newLang.ResumeID = newResume.ID
		if err := tx.Create(&newLang).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to copy languages",
			})
			return
		}
	}

	// Copy awards
	for _, award := range originalResume.Awards {
		newAward := award
		newAward.ID = 0
		newAward.ResumeID = newResume.ID
		if err := tx.Create(&newAward).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to copy awards",
			})
			return
		}
	}

	// Copy custom sections
	for _, section := range originalResume.CustomSections {
		newSection := section
		newSection.ID = 0
		newSection.ResumeID = newResume.ID
		if err := tx.Create(&newSection).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to copy custom sections",
			})
			return
		}
	}

	tx.Commit()

	response.Success(c, http.StatusCreated, newResume)
}

// GetPersonalInfo returns personal info for a resume
func (h *ResumeHandler) GetPersonalInfo(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.GetPersonalInfoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	var personalInfo models.PersonalInfo
	if err := database.DB.Where("resume_id = ?", req.ResumeID).First(&personalInfo).Error; err != nil {
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

	var req dto.UpdatePersonalInfoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	var personalInfo models.PersonalInfo
	err := database.DB.Where("resume_id = ?", req.ResumeID).First(&personalInfo).Error

	if err != nil {
		// Create new personal info
		personalInfo = models.PersonalInfo{
			ResumeID:   req.ResumeID,
			FullName:   req.FullName,
			Email:      req.Email,
			Phone:      req.Phone,
			Location:   req.Location,
			Website:    req.Website,
			LinkedIn:   req.LinkedIn,
			Github:     req.Github,
			AvatarURL:  req.AvatarURL,
			ShowAvatar: req.ShowAvatar,
			Summary:    req.Summary,
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
		personalInfo.AvatarURL = req.AvatarURL
		personalInfo.ShowAvatar = req.ShowAvatar
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

// Helper: ensure a default resume exists for the given user and return it.
// This is mainly a safety net in case the registration hook failed or
// historical用户没有模板数据。
func (h *ResumeHandler) createDefaultResumeForUser(userID uint) (*models.Resume, error) {
	// Double-check to avoid creating duplicates if called并发/多次
	var existing models.Resume
	if err := database.DB.
		Where("user_id = ? AND is_default = ?", userID, true).
		Order("created_at ASC").
		First(&existing).Error; err == nil {
		return &existing, nil
	}

	// Try to infer a friendly title; fallback to generic.
	resume := models.Resume{
		UserID:     userID,
		Title:      "我的简历",
		TemplateID: 1,
		IsDefault:  true,
	}

	if err := database.DB.Create(&resume).Error; err != nil {
		// 不要影响主流程，只返回错误给调用方做记录/忽略
		return nil, err
	}

	return &resume, nil
}

// ============ Work Experience Handlers ============

// GetWorkExperiences returns all work experiences for a resume
func (h *ResumeHandler) GetWorkExperiences(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.GetWorkExperiencesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	var experiences []models.WorkExperience
	if err := database.DB.Where("resume_id = ?", req.ResumeID).
		Order("display_order ASC").
		Find(&experiences).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch work experiences",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    experiences,
	})
}

// CreateWorkExperience creates a new work experience
func (h *ResumeHandler) CreateWorkExperience(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.CreateWorkExperienceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	startDate, err := parseDate(req.StartDate)
	if err != nil || startDate == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid start date format",
		})
		return
	}

	var endDate *time.Time
	if !req.IsCurrent && req.EndDate != "" {
		endDate, err = parseDate(req.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid end date format",
			})
			return
		}
	}

	experience := models.WorkExperience{
		ResumeID:     req.ResumeID,
		CompanyName:  req.CompanyName,
		Position:     req.Position,
		Location:     req.Location,
		StartDate:    *startDate,
		EndDate:      endDate,
		IsCurrent:    req.IsCurrent,
		Description:  req.Description,
		DisplayOrder: req.DisplayOrder,
	}

	if err := database.DB.Create(&experience).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create work experience",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    experience,
	})
}

// UpdateWorkExperience updates a work experience
func (h *ResumeHandler) UpdateWorkExperience(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.UpdateWorkExperienceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	var experience models.WorkExperience
	if err := database.DB.Where("id = ? AND resume_id = ?", req.ID, req.ResumeID).
		First(&experience).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Work experience not found",
		})
		return
	}

	startDate, err := parseDate(req.StartDate)
	if err != nil || startDate == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid start date format",
		})
		return
	}

	var endDate *time.Time
	if !req.IsCurrent && req.EndDate != "" {
		endDate, err = parseDate(req.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid end date format",
			})
			return
		}
	}

	experience.CompanyName = req.CompanyName
	experience.Position = req.Position
	experience.Location = req.Location
	experience.StartDate = *startDate
	experience.EndDate = endDate
	experience.IsCurrent = req.IsCurrent
	experience.Description = req.Description
	experience.DisplayOrder = req.DisplayOrder

	if err := database.DB.Save(&experience).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update work experience",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    experience,
	})
}

// DeleteWorkExperience deletes a work experience
func (h *ResumeHandler) DeleteWorkExperience(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	experienceID := c.Param("id")

	var req dto.DeleteWorkExperienceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	result := database.DB.Where("id = ? AND resume_id = ?", experienceID, req.ResumeID).
		Delete(&models.WorkExperience{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete work experience",
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Work experience not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Work experience deleted successfully",
	})
}

// ReorderWorkExperiences updates display order for work experiences
func (h *ResumeHandler) ReorderWorkExperiences(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.ReorderWorkExperiencesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	tx := database.DB.Begin()
	for _, item := range req.Items {
		if err := tx.Model(&models.WorkExperience{}).
			Where("id = ? AND resume_id = ?", item.ID, req.ResumeID).
			Update("display_order", item.DisplayOrder).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to reorder work experiences",
			})
			return
		}
	}
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Work experiences reordered successfully",
	})
}

// ============ Education Handlers ============

// GetEducation returns all education for a resume
func (h *ResumeHandler) GetEducation(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.GetEducationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	var education []models.Education
	if err := database.DB.Where("resume_id = ?", req.ResumeID).
		Order("display_order ASC").
		Find(&education).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch education",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    education,
	})
}

// CreateEducation creates a new education entry
func (h *ResumeHandler) CreateEducation(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.CreateEducationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	startDate, err := parseDate(req.EducationInput.StartDate)
	if err != nil || startDate == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid start date format",
		})
		return
	}

	var endDate *time.Time
	if req.EducationInput.EndDate != "" {
		endDate, err = parseDate(req.EducationInput.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid end date format",
			})
			return
		}
	}

	education := models.Education{
		ResumeID:     req.ResumeID,
		Institution:  req.EducationInput.Institution,
		Degree:       req.EducationInput.Degree,
		FieldOfStudy: req.EducationInput.FieldOfStudy,
		Location:     req.EducationInput.Location,
		StartDate:    *startDate,
		EndDate:      endDate,
		GPA:          req.EducationInput.GPA,
		Description:  req.EducationInput.Description,
		DisplayOrder: req.EducationInput.DisplayOrder,
	}

	if err := database.DB.Create(&education).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create education",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    education,
	})
}

// UpdateEducation updates an education entry
func (h *ResumeHandler) UpdateEducation(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.UpdateEducationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	var education models.Education
	if err := database.DB.Where("id = ? AND resume_id = ?", req.ID, req.ResumeID).
		First(&education).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Education not found",
		})
		return
	}

	startDate, err := parseDate(req.EducationInput.StartDate)
	if err != nil || startDate == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid start date format",
		})
		return
	}

	var endDate *time.Time
	if req.EducationInput.EndDate != "" {
		endDate, err = parseDate(req.EducationInput.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid end date format",
			})
			return
		}
	}

	education.Institution = req.EducationInput.Institution
	education.Degree = req.EducationInput.Degree
	education.FieldOfStudy = req.EducationInput.FieldOfStudy
	education.Location = req.EducationInput.Location
	education.StartDate = *startDate
	education.EndDate = endDate
	education.GPA = req.EducationInput.GPA
	education.Description = req.EducationInput.Description
	education.DisplayOrder = req.EducationInput.DisplayOrder

	if err := database.DB.Save(&education).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update education",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    education,
	})
}

// DeleteEducation deletes an education entry
func (h *ResumeHandler) DeleteEducation(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	educationID := c.Param("id")

	var req dto.DeleteEducationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	result := database.DB.Where("id = ? AND resume_id = ?", educationID, req.ResumeID).
		Delete(&models.Education{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete education",
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Education not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Education deleted successfully",
	})
}

// ReorderEducation updates display order for education
func (h *ResumeHandler) ReorderEducation(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.ReorderEducationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	tx := database.DB.Begin()
	for _, item := range req.Items {
		if err := tx.Model(&models.Education{}).
			Where("id = ? AND resume_id = ?", item.ID, req.ResumeID).
			Update("display_order", item.DisplayOrder).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to reorder education",
			})
			return
		}
	}
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Education reordered successfully",
	})
}

// ============ Skills Handlers ============

// GetSkills returns all skills for a resume
func (h *ResumeHandler) GetSkills(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.GetSkillsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	var skills []models.Skill
	if err := database.DB.Where("resume_id = ?", req.ResumeID).
		Order("display_order ASC").
		Find(&skills).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch skills",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    skills,
	})
}

// CreateSkill creates a new skill
func (h *ResumeHandler) CreateSkill(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.CreateSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	skill := models.Skill{
		ResumeID:         req.ResumeID,
		Category:         req.SkillInput.Category,
		Name:             req.SkillInput.Name,
		ProficiencyLevel: req.SkillInput.ProficiencyLevel,
		DisplayOrder:     req.SkillInput.DisplayOrder,
	}

	if err := database.DB.Create(&skill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create skill",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    skill,
	})
}

// UpdateSkill updates a skill
func (h *ResumeHandler) UpdateSkill(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.UpdateSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	var skill models.Skill
	if err := database.DB.Where("id = ? AND resume_id = ?", req.ID, req.ResumeID).
		First(&skill).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Skill not found",
		})
		return
	}

	skill.Category = req.SkillInput.Category
	skill.Name = req.SkillInput.Name
	skill.ProficiencyLevel = req.SkillInput.ProficiencyLevel
	skill.DisplayOrder = req.SkillInput.DisplayOrder

	if err := database.DB.Save(&skill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update skill",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    skill,
	})
}

// DeleteSkill deletes a skill
func (h *ResumeHandler) DeleteSkill(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	skillID := c.Param("id")

	var req dto.DeleteSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	result := database.DB.Where("id = ? AND resume_id = ?", skillID, req.ResumeID).
		Delete(&models.Skill{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete skill",
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Skill not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Skill deleted successfully",
	})
}

// BulkUpdateSkills updates multiple skills at once
func (h *ResumeHandler) BulkUpdateSkills(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.BulkUpdateSkillsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	tx := database.DB.Begin()

	// Delete all existing skills for this resume
	if err := tx.Where("resume_id = ?", req.ResumeID).Delete(&models.Skill{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update skills",
		})
		return
	}

	// Create new skills
	var newSkills []models.Skill
	for _, skillInput := range req.Skills {
		skill := models.Skill{
			ResumeID:         req.ResumeID,
			Category:         skillInput.Category,
			Name:             skillInput.Name,
			ProficiencyLevel: skillInput.ProficiencyLevel,
			DisplayOrder:     skillInput.DisplayOrder,
		}
		newSkills = append(newSkills, skill)
	}

	if len(newSkills) > 0 {
		if err := tx.Create(&newSkills).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to create skills",
			})
			return
		}
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    newSkills,
	})
}

// ============ Projects Handlers ============

// GetProjects returns all projects for a resume
func (h *ResumeHandler) GetProjects(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.GetProjectsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	var projects []models.Project
	if err := database.DB.Where("resume_id = ?", req.ResumeID).
		Order("display_order ASC").
		Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch projects",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    projects,
	})
}

// CreateProject creates a new project
func (h *ResumeHandler) CreateProject(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	var startDate, endDate *time.Time
	var err error

	if req.ProjectInput.StartDate != "" {
		startDate, err = parseDate(req.ProjectInput.StartDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid start date format",
			})
			return
		}
	}

	if req.ProjectInput.EndDate != "" {
		endDate, err = parseDate(req.ProjectInput.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid end date format",
			})
			return
		}
	}

	project := models.Project{
		ResumeID:     req.ResumeID,
		Name:         req.ProjectInput.Name,
		Description:  req.ProjectInput.Description,
		Technologies: req.ProjectInput.Technologies,
		URL:          req.ProjectInput.URL,
		GithubURL:    req.ProjectInput.GithubURL,
		StartDate:    startDate,
		EndDate:      endDate,
		DisplayOrder: req.ProjectInput.DisplayOrder,
	}

	if err := database.DB.Create(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create project",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    project,
	})
}

// UpdateProject updates a project
func (h *ResumeHandler) UpdateProject(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var reqBody dto.UpdateProjectRequest
	if err := c.ShouldBindJSON(&reqBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", reqBody.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	var project models.Project
	if err := database.DB.Where("id = ? AND resume_id = ?", reqBody.ID, reqBody.ResumeID).
		First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Project not found",
		})
		return
	}

	var startDate, endDate *time.Time
	var err error

	if reqBody.ProjectInput.StartDate != "" {
		startDate, err = parseDate(reqBody.ProjectInput.StartDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid start date format",
			})
			return
		}
	}

	if reqBody.ProjectInput.EndDate != "" {
		endDate, err = parseDate(reqBody.ProjectInput.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid end date format",
			})
			return
		}
	}

	project.Name = reqBody.ProjectInput.Name
	project.Description = reqBody.ProjectInput.Description
	project.Technologies = reqBody.ProjectInput.Technologies
	project.URL = reqBody.ProjectInput.URL
	project.GithubURL = reqBody.ProjectInput.GithubURL
	project.StartDate = startDate
	project.EndDate = endDate
	project.DisplayOrder = reqBody.ProjectInput.DisplayOrder

	if err := database.DB.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update project",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    project,
	})
}

// DeleteProject deletes a project
func (h *ResumeHandler) DeleteProject(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	projectID := c.Param("id")

	var req dto.DeleteProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Verify resume ownership
	var resume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	result := database.DB.Where("id = ? AND resume_id = ?", projectID, req.ResumeID).
		Delete(&models.Project{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete project",
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Project not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Project deleted successfully",
	})
}

func (h *ResumeHandler) ensureResumeOwner(resumeID uint, userID uint) error {
	var resume models.Resume
	return database.DB.Where("id = ? AND user_id = ?", resumeID, userID).First(&resume).Error
}

// ============ Certification Handlers ============

func (h *ResumeHandler) GetCertifications(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.GetCertificationsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	var items []models.Certification
	if err := database.DB.Where("resume_id = ?", req.ResumeID).Order("display_order ASC").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch certifications"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": items})
}

func (h *ResumeHandler) CreateCertification(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.CreateCertificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	if err := service.NewBillingService().CheckFeature(userID, "certifications"); err != nil {
		h.handleLimitError(c, err)
		return
	}
	issueDate, err := parseDate(req.IssueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid issue date format"})
		return
	}
	expiryDate, err := parseDate(req.ExpiryDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid expiry date format"})
		return
	}
	item := models.Certification{
		ResumeID: req.ResumeID, Name: req.Name, IssuingOrganization: req.IssuingOrganization,
		IssueDate: issueDate, ExpiryDate: expiryDate, CredentialID: req.CredentialID,
		CredentialURL: req.CredentialURL, DisplayOrder: req.DisplayOrder,
	}
	if err := database.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to create certification"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": item})
}

func (h *ResumeHandler) UpdateCertification(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.UpdateCertificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	var item models.Certification
	if err := database.DB.Where("id = ? AND resume_id = ?", req.ID, req.ResumeID).First(&item).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Certification not found"})
		return
	}
	issueDate, err := parseDate(req.IssueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid issue date format"})
		return
	}
	expiryDate, err := parseDate(req.ExpiryDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid expiry date format"})
		return
	}
	item.Name = req.Name
	item.IssuingOrganization = req.IssuingOrganization
	item.IssueDate = issueDate
	item.ExpiryDate = expiryDate
	item.CredentialID = req.CredentialID
	item.CredentialURL = req.CredentialURL
	item.DisplayOrder = req.DisplayOrder
	if err := database.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update certification"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": item})
}

func (h *ResumeHandler) DeleteCertification(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.DeleteCertificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	result := database.DB.Where("id = ? AND resume_id = ?", c.Param("id"), req.ResumeID).Delete(&models.Certification{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to delete certification"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Certification not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Certification deleted successfully"})
}

// ============ Language Handlers ============

func (h *ResumeHandler) GetLanguages(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.GetLanguagesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	var items []models.Language
	if err := database.DB.Where("resume_id = ?", req.ResumeID).Order("display_order ASC").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch languages"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": items})
}

func (h *ResumeHandler) CreateLanguage(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.CreateLanguageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	if err := service.NewBillingService().CheckFeature(userID, "languages"); err != nil {
		h.handleLimitError(c, err)
		return
	}
	item := models.Language{ResumeID: req.ResumeID, Language: req.Language, Proficiency: req.Proficiency, DisplayOrder: req.DisplayOrder}
	if err := database.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to create language"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": item})
}

func (h *ResumeHandler) UpdateLanguage(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.UpdateLanguageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	var item models.Language
	if err := database.DB.Where("id = ? AND resume_id = ?", req.ID, req.ResumeID).First(&item).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Language not found"})
		return
	}
	item.Language = req.Language
	item.Proficiency = req.Proficiency
	item.DisplayOrder = req.DisplayOrder
	if err := database.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update language"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": item})
}

func (h *ResumeHandler) DeleteLanguage(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.DeleteLanguageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	result := database.DB.Where("id = ? AND resume_id = ?", c.Param("id"), req.ResumeID).Delete(&models.Language{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to delete language"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Language not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Language deleted successfully"})
}

// ============ Award Handlers ============

func (h *ResumeHandler) GetAwards(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.GetAwardsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	var items []models.Award
	if err := database.DB.Where("resume_id = ?", req.ResumeID).Order("display_order ASC").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch awards"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": items})
}

func (h *ResumeHandler) CreateAward(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.CreateAwardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	if err := service.NewBillingService().CheckFeature(userID, "awards"); err != nil {
		h.handleLimitError(c, err)
		return
	}
	issueDate, err := parseDate(req.IssueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid issue date format"})
		return
	}
	item := models.Award{ResumeID: req.ResumeID, Title: req.Title, Issuer: req.Issuer, IssueDate: issueDate, Description: req.Description, DisplayOrder: req.DisplayOrder}
	if err := database.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to create award"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": item})
}

func (h *ResumeHandler) UpdateAward(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.UpdateAwardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	var item models.Award
	if err := database.DB.Where("id = ? AND resume_id = ?", req.ID, req.ResumeID).First(&item).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Award not found"})
		return
	}
	issueDate, err := parseDate(req.IssueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid issue date format"})
		return
	}
	item.Title = req.Title
	item.Issuer = req.Issuer
	item.IssueDate = issueDate
	item.Description = req.Description
	item.DisplayOrder = req.DisplayOrder
	if err := database.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update award"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": item})
}

func (h *ResumeHandler) DeleteAward(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.DeleteAwardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	result := database.DB.Where("id = ? AND resume_id = ?", c.Param("id"), req.ResumeID).Delete(&models.Award{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to delete award"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Award not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Award deleted successfully"})
}

// ============ Custom Section Handlers ============

func (h *ResumeHandler) GetCustomSections(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.GetCustomSectionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	var items []models.CustomSection
	if err := database.DB.Where("resume_id = ?", req.ResumeID).Order("display_order ASC").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch custom sections"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": items})
}

func (h *ResumeHandler) CreateCustomSection(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.CreateCustomSectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	if err := service.NewBillingService().CheckFeature(userID, "custom_sections"); err != nil {
		h.handleLimitError(c, err)
		return
	}
	item := models.CustomSection{ResumeID: req.ResumeID, Title: req.Title, Content: req.Content, DisplayOrder: req.DisplayOrder}
	if err := database.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to create custom section"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": item})
}

func (h *ResumeHandler) UpdateCustomSection(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.UpdateCustomSectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	var item models.CustomSection
	if err := database.DB.Where("id = ? AND resume_id = ?", req.ID, req.ResumeID).First(&item).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Custom section not found"})
		return
	}
	item.Title = req.Title
	item.Content = req.Content
	item.DisplayOrder = req.DisplayOrder
	if err := database.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update custom section"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": item})
}

func (h *ResumeHandler) DeleteCustomSection(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	var req dto.DeleteCustomSectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := h.ensureResumeOwner(req.ResumeID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Resume not found"})
		return
	}
	result := database.DB.Where("id = ? AND resume_id = ?", c.Param("id"), req.ResumeID).Delete(&models.CustomSection{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to delete custom section"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Custom section not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Custom section deleted successfully"})
}

func (h *ResumeHandler) handleLimitError(c *gin.Context, err error) {
	if limitErr, ok := err.(*service.LimitError); ok {
		response.Forbidden(c, limitErr.Code, limitErr.Message, limitErr.Details)
		return
	}
	response.Internal(c, "PLAN_VALIDATION_FAILED", err.Error())
}
