package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/henryhua/resume-backend/config"
	"github.com/henryhua/resume-backend/internal/api/middleware"
	"github.com/henryhua/resume-backend/internal/api/routes"
	"github.com/henryhua/resume-backend/pkg/auth"
	"github.com/henryhua/resume-backend/pkg/database"
)

func main() {
	// Load configuration
	if err := config.Load(); err != nil {
		log.Fatal("Failed to load configuration:", err)
	}

	// Initialize JWT
	if err := auth.Initialize(); err != nil {
		log.Fatal("Failed to initialize JWT:", err)
	}

	// Connect to database
	if err := database.Connect(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.Close()

	// Run migrations
	if err := database.Migrate(); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Set Gin mode
	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		ginMode = gin.DebugMode
	}
	gin.SetMode(ginMode)

	// Create router
	router := gin.Default()

	// Apply middleware
	router.Use(middleware.CORSMiddleware())

	// Setup routes
	routes.SetupRoutes(router)

	// Get port
	port := config.GetPort()

	log.Printf("Server starting on port %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
