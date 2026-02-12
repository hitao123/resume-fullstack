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
		auth.GET("/me", middleware.AuthMiddleware(), authHandler.Me)
	}

	// Resume handlers (protected)
	resumeHandler := handlers.NewResumeHandler()
	resumes := v1.Group("/resumes")
	resumes.Use(middleware.AuthMiddleware())
	{
		// Resume CRUD
		resumes.GET("", resumeHandler.GetResumes)
		resumes.POST("", resumeHandler.CreateResume)
		resumes.GET("/:id", resumeHandler.GetResume)
		resumes.PUT("/:id", resumeHandler.UpdateResume)
		resumes.DELETE("/:id", resumeHandler.DeleteResume)
		resumes.POST("/:id/duplicate", resumeHandler.DuplicateResume)

		// Resume sections - use :id as resumeId
		resumes.GET("/:id/personal-info", resumeHandler.GetPersonalInfo)
		resumes.PUT("/:id/personal-info", resumeHandler.UpdatePersonalInfo)

		// Work Experience
		resumes.GET("/:id/work-experiences", resumeHandler.GetWorkExperiences)
		resumes.POST("/:id/work-experiences", resumeHandler.CreateWorkExperience)
		resumes.PUT("/:id/work-experiences/reorder", resumeHandler.ReorderWorkExperiences)
		resumes.PUT("/:id/work-experiences/:itemId", resumeHandler.UpdateWorkExperience)
		resumes.DELETE("/:id/work-experiences/:itemId", resumeHandler.DeleteWorkExperience)

		// Education
		resumes.GET("/:id/education", resumeHandler.GetEducation)
		resumes.POST("/:id/education", resumeHandler.CreateEducation)
		resumes.PUT("/:id/education/reorder", resumeHandler.ReorderEducation)
		resumes.PUT("/:id/education/:itemId", resumeHandler.UpdateEducation)
		resumes.DELETE("/:id/education/:itemId", resumeHandler.DeleteEducation)

		// Skills
		resumes.GET("/:id/skills", resumeHandler.GetSkills)
		resumes.POST("/:id/skills", resumeHandler.CreateSkill)
		resumes.PUT("/:id/skills/bulk", resumeHandler.BulkUpdateSkills)
		resumes.PUT("/:id/skills/:itemId", resumeHandler.UpdateSkill)
		resumes.DELETE("/:id/skills/:itemId", resumeHandler.DeleteSkill)

		// Projects
		resumes.GET("/:id/projects", resumeHandler.GetProjects)
		resumes.POST("/:id/projects", resumeHandler.CreateProject)
		resumes.PUT("/:id/projects/:itemId", resumeHandler.UpdateProject)
		resumes.DELETE("/:id/projects/:itemId", resumeHandler.DeleteProject)

		// TODO: Add more resume section endpoints
		// - Certifications
		// - Languages
	}
}
