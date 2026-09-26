package handlers

import (
	"errors"
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/henryhua/resume-backend/internal/domain/models"
	"github.com/henryhua/resume-backend/internal/service"
	"github.com/henryhua/resume-backend/pkg/auth"
	"github.com/henryhua/resume-backend/pkg/database"
	"gorm.io/gorm"
)

// SeedDevUser ensures a fixed debug account exists for local development.
// It is a no-op in release mode or when DEV_USER_EMAIL / DEV_USER_PASSWORD are unset.
// The password is reset on every startup so the configured value always works.
func SeedDevUser() error {
	email := os.Getenv("DEV_USER_EMAIL")
	password := os.Getenv("DEV_USER_PASSWORD")
	if email == "" || password == "" || gin.Mode() == gin.ReleaseMode {
		return nil
	}

	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash dev user password: %w", err)
	}

	var user models.User
	err = database.DB.Where("email = ?", email).First(&user).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("failed to query dev user: %w", err)
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		user = models.User{
			Email:        email,
			PasswordHash: hashedPassword,
			Name:         "Dev",
		}
		if err := database.DB.Create(&user).Error; err != nil {
			return fmt.Errorf("failed to create dev user: %w", err)
		}
		NewAuthHandler().createDefaultResume(user.ID, user.Name)
		log.Printf("Dev user created: %s", email)
	} else {
		if err := database.DB.Model(&user).Update("password_hash", hashedPassword).Error; err != nil {
			return fmt.Errorf("failed to reset dev user password: %w", err)
		}
		log.Printf("Dev user ready: %s", email)
	}

	return ensureDevUserPlan(user.ID, service.PlanPro)
}

func ensureDevUserPlan(userID uint, planCode string) error {
	subscription, plan, err := service.NewBillingService().GetActiveSubscription(userID)
	if err != nil {
		return fmt.Errorf("failed to load dev user subscription: %w", err)
	}
	if plan.Code == planCode {
		return nil
	}

	var target models.Plan
	if err := database.DB.Where("code = ?", planCode).First(&target).Error; err != nil {
		return fmt.Errorf("failed to find plan %s: %w", planCode, err)
	}
	if err := database.DB.Model(subscription).Update("plan_id", target.ID).Error; err != nil {
		return fmt.Errorf("failed to set dev user plan: %w", err)
	}
	log.Printf("Dev user plan set to %s", planCode)
	return nil
}
