package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/henryhua/resume-backend/internal/domain/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Connect establishes database connection
func Connect() error {
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPassword, dbHost, dbPort, dbName,
	)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	// Connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Database connected successfully")
	return nil
}

// Migrate runs database migrations
func Migrate() error {
	log.Println("Running database migrations...")

	err := DB.AutoMigrate(
		&models.User{},
		&models.Resume{},
		&models.PersonalInfo{},
		&models.WorkExperience{},
		&models.Education{},
		&models.Skill{},
		&models.Project{},
		&models.Certification{},
		&models.Language{},
		&models.Award{},
		&models.CustomSection{},
		&models.Plan{},
		&models.UserSubscription{},
		&models.UserUsageMonthly{},
		&models.PaymentOrder{},
		&models.RefreshToken{},
		&models.OAuthProvider{},
	)

	if err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}

	log.Println("Database migrations completed successfully")
	if err := SeedPlans(); err != nil {
		return err
	}
	return nil
}

func SeedPlans() error {
	plans := []models.Plan{
		{
			Code:           "FREE",
			Name:           "免费版",
			ResumeLimit:    1,
			AIQuotaMonthly: 3,
			TemplateLimit:  1,
			PriceMonthly:   0,
			PriceYearly:    0,
		},
		{
			Code:                "STARTER",
			Name:                "初级会员",
			ResumeLimit:         5,
			AIQuotaMonthly:      50,
			TemplateLimit:       3,
			PriceMonthly:        3900,
			PriceYearly:         39900,
			AllowDuplicate:      true,
			AllowCustomSections: true,
			AllowCertifications: true,
			AllowLanguages:      true,
			AllowAwards:         true,
			AllowHdPdf:          true,
		},
		{
			Code:                  "PRO",
			Name:                  "高级会员",
			ResumeLimit:           0,
			AIQuotaMonthly:        300,
			TemplateLimit:         99,
			PriceMonthly:          9900,
			PriceYearly:           99900,
			AllowDuplicate:        true,
			AllowCustomSections:   true,
			AllowCertifications:   true,
			AllowLanguages:        true,
			AllowAwards:           true,
			AllowHdPdf:            true,
			AllowJdOptimization:   true,
			AllowMultiLanguage:    true,
			AllowPriorityFeatures: true,
		},
	}

	for _, plan := range plans {
		var existing models.Plan
		if err := DB.Where("code = ?", plan.Code).First(&existing).Error; err == nil {
			plan.ID = existing.ID
			if err := DB.Model(&existing).Updates(plan).Error; err != nil {
				return fmt.Errorf("failed to update seeded plan %s: %w", plan.Code, err)
			}
			continue
		}
		if err := DB.Create(&plan).Error; err != nil {
			return fmt.Errorf("failed to seed plan %s: %w", plan.Code, err)
		}
	}
	return nil
}

// Close closes database connection
func Close() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
