package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Load loads environment variables from .env file
func Load() error {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Validate required environment variables
	required := []string{
		"DB_HOST",
		"DB_PORT",
		"DB_USER",
		"DB_PASSWORD",
		"DB_NAME",
		"JWT_SECRET",
		"JWT_REFRESH_SECRET",
	}

	for _, key := range required {
		if os.Getenv(key) == "" {
			log.Printf("Warning: %s environment variable not set", key)
		}
	}

	return nil
}

// GetPort returns the server port
func GetPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return port
}
