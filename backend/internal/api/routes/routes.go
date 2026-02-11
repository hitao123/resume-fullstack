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

		// Personal Info
		resumes.GET("/:resumeId/personal-info", resumeHandler.GetPersonalInfo)
		resumes.PUT("/:resumeId/personal-info", resumeHandler.UpdatePersonalInfo)

		// TODO: Add more resume section endpoints
		// - Work Experience
		// - Education
		// - Skills
		// - Projects
		// - Certifications
		// - Languages
	}
}
