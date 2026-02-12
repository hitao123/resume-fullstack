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

// DuplicateResume creates a copy of an existing resume with all its sections
func (h *ResumeHandler) DuplicateResume(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	resumeID := c.Param("id")

	// Get the original resume with all sections
	var originalResume models.Resume
	if err := database.DB.Where("id = ? AND user_id = ?", resumeID, userID).
		Preload("PersonalInfo").
		Preload("WorkExperiences").
		Preload("Education").
		Preload("Skills").
		Preload("Projects").
		Preload("Certifications").
		Preload("Languages").
		First(&originalResume).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Resume not found",
		})
		return
	}

	// Create new resume
	newResume := models.Resume{
		UserID:     userID,
		Title:      originalResume.Title + " - Copy",
		TemplateID: originalResume.TemplateID,
		IsDefault:  false,
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

	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    newResume,
	})
}

// GetPersonalInfo returns personal info for a resume
func (h *ResumeHandler) GetPersonalInfo(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	resumeID := c.Param("id")

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
	resumeID := c.Param("id")

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

// ============ Work Experience Handlers ============

// GetWorkExperiences returns all work experiences for a resume
func (h *ResumeHandler) GetWorkExperiences(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	resumeID := c.Param("id")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var experiences []models.WorkExperience
	if err := database.DB.Where("resume_id = ?", resumeID).
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
	resumeID := c.Param("id")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var req dto.WorkExperienceInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
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

	resumeIDUint, _ := strconv.ParseUint(resumeID, 10, 32)
	experience := models.WorkExperience{
		ResumeID:     uint(resumeIDUint),
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
	resumeID := c.Param("id")
	experienceID := c.Param("itemId")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var experience models.WorkExperience
	if err := database.DB.Where("id = ? AND resume_id = ?", experienceID, resumeID).
		First(&experience).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Work experience not found",
		})
		return
	}

	var req dto.WorkExperienceInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
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
	resumeID := c.Param("id")
	experienceID := c.Param("itemId")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	result := database.DB.Where("id = ? AND resume_id = ?", experienceID, resumeID).
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
	resumeID := c.Param("id")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var req dto.ReorderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	tx := database.DB.Begin()
	for _, item := range req.Items {
		if err := tx.Model(&models.WorkExperience{}).
			Where("id = ? AND resume_id = ?", item.ID, resumeID).
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
	resumeID := c.Param("id")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var education []models.Education
	if err := database.DB.Where("resume_id = ?", resumeID).
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
	resumeID := c.Param("id")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var req dto.EducationInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
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
	if req.EndDate != "" {
		endDate, err = parseDate(req.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid end date format",
			})
			return
		}
	}

	resumeIDUint, _ := strconv.ParseUint(resumeID, 10, 32)
	education := models.Education{
		ResumeID:     uint(resumeIDUint),
		Institution:  req.Institution,
		Degree:       req.Degree,
		FieldOfStudy: req.FieldOfStudy,
		Location:     req.Location,
		StartDate:    *startDate,
		EndDate:      endDate,
		GPA:          req.GPA,
		Description:  req.Description,
		DisplayOrder: req.DisplayOrder,
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
	resumeID := c.Param("id")
	educationID := c.Param("itemId")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var education models.Education
	if err := database.DB.Where("id = ? AND resume_id = ?", educationID, resumeID).
		First(&education).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Education not found",
		})
		return
	}

	var req dto.EducationInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
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
	if req.EndDate != "" {
		endDate, err = parseDate(req.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid end date format",
			})
			return
		}
	}

	education.Institution = req.Institution
	education.Degree = req.Degree
	education.FieldOfStudy = req.FieldOfStudy
	education.Location = req.Location
	education.StartDate = *startDate
	education.EndDate = endDate
	education.GPA = req.GPA
	education.Description = req.Description
	education.DisplayOrder = req.DisplayOrder

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
	resumeID := c.Param("id")
	educationID := c.Param("itemId")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	result := database.DB.Where("id = ? AND resume_id = ?", educationID, resumeID).
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
	resumeID := c.Param("id")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var req dto.ReorderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	tx := database.DB.Begin()
	for _, item := range req.Items {
		if err := tx.Model(&models.Education{}).
			Where("id = ? AND resume_id = ?", item.ID, resumeID).
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
	resumeID := c.Param("id")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var skills []models.Skill
	if err := database.DB.Where("resume_id = ?", resumeID).
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
	resumeID := c.Param("id")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var req dto.SkillInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	resumeIDUint, _ := strconv.ParseUint(resumeID, 10, 32)
	skill := models.Skill{
		ResumeID:         uint(resumeIDUint),
		Category:         req.Category,
		Name:             req.Name,
		ProficiencyLevel: req.ProficiencyLevel,
		DisplayOrder:     req.DisplayOrder,
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
	resumeID := c.Param("id")
	skillID := c.Param("itemId")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var skill models.Skill
	if err := database.DB.Where("id = ? AND resume_id = ?", skillID, resumeID).
		First(&skill).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Skill not found",
		})
		return
	}

	var req dto.SkillInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	skill.Category = req.Category
	skill.Name = req.Name
	skill.ProficiencyLevel = req.ProficiencyLevel
	skill.DisplayOrder = req.DisplayOrder

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
	resumeID := c.Param("id")
	skillID := c.Param("itemId")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	result := database.DB.Where("id = ? AND resume_id = ?", skillID, resumeID).
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
	resumeID := c.Param("id")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var req struct {
		Skills []dto.SkillInput `json:"skills" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	resumeIDUint, _ := strconv.ParseUint(resumeID, 10, 32)

	tx := database.DB.Begin()

	// Delete all existing skills for this resume
	if err := tx.Where("resume_id = ?", resumeID).Delete(&models.Skill{}).Error; err != nil {
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
			ResumeID:         uint(resumeIDUint),
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
	resumeID := c.Param("id")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var projects []models.Project
	if err := database.DB.Where("resume_id = ?", resumeID).
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
	resumeID := c.Param("id")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var req dto.ProjectInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var startDate, endDate *time.Time
	var err error

	if req.StartDate != "" {
		startDate, err = parseDate(req.StartDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid start date format",
			})
			return
		}
	}

	if req.EndDate != "" {
		endDate, err = parseDate(req.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid end date format",
			})
			return
		}
	}

	resumeIDUint, _ := strconv.ParseUint(resumeID, 10, 32)
	project := models.Project{
		ResumeID:     uint(resumeIDUint),
		Name:         req.Name,
		Description:  req.Description,
		Technologies: req.Technologies,
		URL:          req.URL,
		GithubURL:    req.GithubURL,
		StartDate:    startDate,
		EndDate:      endDate,
		DisplayOrder: req.DisplayOrder,
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
	resumeID := c.Param("id")
	projectID := c.Param("itemId")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	var project models.Project
	if err := database.DB.Where("id = ? AND resume_id = ?", projectID, resumeID).
		First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Project not found",
		})
		return
	}

	var req dto.ProjectInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var startDate, endDate *time.Time
	var err error

	if req.StartDate != "" {
		startDate, err = parseDate(req.StartDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid start date format",
			})
			return
		}
	}

	if req.EndDate != "" {
		endDate, err = parseDate(req.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Invalid end date format",
			})
			return
		}
	}

	project.Name = req.Name
	project.Description = req.Description
	project.Technologies = req.Technologies
	project.URL = req.URL
	project.GithubURL = req.GithubURL
	project.StartDate = startDate
	project.EndDate = endDate
	project.DisplayOrder = req.DisplayOrder

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
	resumeID := c.Param("id")
	projectID := c.Param("itemId")

	if !h.verifyResumeOwnership(c, resumeID, userID) {
		return
	}

	result := database.DB.Where("id = ? AND resume_id = ?", projectID, resumeID).
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
