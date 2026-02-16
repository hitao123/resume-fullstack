package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/henryhua/resume-backend/internal/api/handlers"
	"github.com/henryhua/resume-backend/internal/api/middleware"
)

// SetupRoutes configures all API routes
func SetupRoutes(router *gin.Engine) {
	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Resume API is running",
		})
	})

	// API v1 group
	v1 := router.Group("/api/v1")

	// Auth handlers
	authHandler := handlers.NewAuthHandler()
	auth := v1.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
		auth.POST("/logout", authHandler.Logout)
		auth.POST("/me", middleware.AuthMiddleware(), authHandler.Me)
	}

	// Resume handlers (protected)
	resumeHandler := handlers.NewResumeHandler()
	resumes := v1.Group("/resumes")
	resumes.Use(middleware.AuthMiddleware())
	{
		// Resume CRUD
		resumes.POST("/list", resumeHandler.GetResumes)
		resumes.POST("", resumeHandler.CreateResume)
		resumes.POST("/get", resumeHandler.GetResume)
		resumes.POST("/update", resumeHandler.UpdateResume)
		resumes.DELETE("/:id", resumeHandler.DeleteResume)
		resumes.POST("/:id/duplicate", resumeHandler.DuplicateResume)

		// Resume sections - use :id as resumeId
		resumes.POST("/personal-info/get", resumeHandler.GetPersonalInfo)
		resumes.POST("/personal-info/update", resumeHandler.UpdatePersonalInfo)

		// Work Experience
		resumes.POST("/work-experiences/list", resumeHandler.GetWorkExperiences)
		resumes.POST("/work-experiences", resumeHandler.CreateWorkExperience)
		resumes.POST("/work-experiences/reorder", resumeHandler.ReorderWorkExperiences)
		resumes.POST("/work-experiences/update", resumeHandler.UpdateWorkExperience)
		resumes.DELETE("/work-experiences/:id", resumeHandler.DeleteWorkExperience)

		// Education
		resumes.POST("/education/list", resumeHandler.GetEducation)
		resumes.POST("/education", resumeHandler.CreateEducation)
		resumes.POST("/education/reorder", resumeHandler.ReorderEducation)
		resumes.POST("/education/update", resumeHandler.UpdateEducation)
		resumes.DELETE("/education/:id", resumeHandler.DeleteEducation)

		// Skills
		resumes.POST("/skills/list", resumeHandler.GetSkills)
		resumes.POST("/skills", resumeHandler.CreateSkill)
		resumes.POST("/skills/bulk", resumeHandler.BulkUpdateSkills)
		resumes.POST("/skills/update", resumeHandler.UpdateSkill)
		resumes.DELETE("/skills/:id", resumeHandler.DeleteSkill)

		// Projects
		resumes.POST("/projects/list", resumeHandler.GetProjects)
		resumes.POST("/projects", resumeHandler.CreateProject)
		resumes.POST("/projects/update", resumeHandler.UpdateProject)
		resumes.DELETE("/projects/:id", resumeHandler.DeleteProject)

		// TODO: Add more resume section endpoints
		// - Certifications
		// - Languages
	}
}
