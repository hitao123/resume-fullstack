package service

import (
	"errors"
	"time"

	mysqlDriver "github.com/go-sql-driver/mysql"
	"github.com/henryhua/resume-backend/internal/domain/models"
	"github.com/henryhua/resume-backend/pkg/database"
	"gorm.io/gorm"
)

const (
	PlanFree     = "FREE"
	PlanStarter  = "STARTER"
	PlanPro      = "PRO"
	CycleMonthly = "monthly"
	StatusActive = "active"
	// CurrentFreeTemplateMaxID is the last template ID available on every plan
	// (Modern, Classic, Minimal / minimal-v2). Membership only gates later IDs.
	CurrentFreeTemplateMaxID = 3
)

type LimitError struct {
	Code    string
	Message string
	Details map[string]interface{}
}

func (e *LimitError) Error() string {
	return e.Message
}

type PlanFeatures struct {
	Code                  string
	Name                  string
	ResumeLimit           int
	AIQuotaMonthly        int
	TemplateLimit         int
	AllowDuplicate        bool
	AllowCustomSections   bool
	AllowCertifications   bool
	AllowLanguages        bool
	AllowAwards           bool
	AllowHdPdf            bool
	AllowJdOptimization   bool
	AllowMultiLanguage    bool
	AllowPriorityFeatures bool
}

type BillingService struct{}

func NewBillingService() *BillingService {
	return &BillingService{}
}

func (s *BillingService) EnsureDefaultSubscription(userID uint) error {
	_, _, err := s.GetActiveSubscription(userID)
	return err
}

func (s *BillingService) GetActiveSubscription(userID uint) (*models.UserSubscription, *models.Plan, error) {
	var subscription models.UserSubscription
	err := database.DB.
		Where("user_id = ? AND status = ?", userID, StatusActive).
		Order("created_at DESC").
		First(&subscription).Error
	if isMissingTableError(err) {
		if migrateErr := ensureBillingSchema(); migrateErr != nil {
			return nil, nil, migrateErr
		}
		err = database.DB.
			Where("user_id = ? AND status = ?", userID, StatusActive).
			Order("created_at DESC").
			First(&subscription).Error
	}
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			var freePlan models.Plan
			if err := database.DB.Where("code = ?", PlanFree).First(&freePlan).Error; err != nil {
				return nil, nil, err
			}
			subscription = models.UserSubscription{
				UserID:       userID,
				PlanID:       freePlan.ID,
				Status:       StatusActive,
				BillingCycle: CycleMonthly,
				StartAt:      time.Now().UTC(),
			}
			if err := database.DB.Create(&subscription).Error; err != nil {
				return nil, nil, err
			}
			return &subscription, &freePlan, nil
		}
		return nil, nil, err
	}

	var plan models.Plan
	if err := database.DB.First(&plan, subscription.PlanID).Error; err != nil {
		return nil, nil, err
	}
	return &subscription, &plan, nil
}

func (s *BillingService) GetUsage(userID uint, now time.Time) (*models.UserUsageMonthly, error) {
	yearMonth := now.UTC().Format("2006-01")
	var usage models.UserUsageMonthly
	conditions := map[string]interface{}{
		"user_id":    userID,
		"year_month": yearMonth,
	}
	err := database.DB.Where(conditions).First(&usage).Error
	if isMissingTableError(err) {
		if migrateErr := ensureBillingSchema(); migrateErr != nil {
			return nil, migrateErr
		}
		err = database.DB.Where(conditions).First(&usage).Error
	}
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			usage = models.UserUsageMonthly{
				UserID:    userID,
				YearMonth: yearMonth,
			}
			if err := database.DB.Create(&usage).Error; err != nil {
				return nil, err
			}
			return &usage, nil
		}
		return nil, err
	}
	return &usage, nil
}

func (s *BillingService) CheckResumeCreation(userID uint) (*models.Plan, error) {
	_, plan, err := s.GetActiveSubscription(userID)
	if err != nil {
		return nil, err
	}
	// Membership is paused: every account can create job-specific versions.
	return plan, nil
}

func (s *BillingService) CheckTemplateAccess(userID uint, templateID int) error {
	// All published templates are available while membership is hidden.
	_ = userID
	if templateID < 1 || templateID > CurrentFreeTemplateMaxID {
		return &LimitError{Code: "INVALID_TEMPLATE_ID", Message: "Unknown resume template."}
	}
	return nil
}

func EffectiveTemplateLimit(limit int) int {
	if limit > 0 && limit < CurrentFreeTemplateMaxID {
		return CurrentFreeTemplateMaxID
	}
	return limit
}

func (s *BillingService) CheckFeature(userID uint, feature string) error {
	// Resume sections, duplication, and export are open to every account.
	_ = userID
	_ = feature
	return nil
}

func (s *BillingService) ConsumeAIQuota(userID uint) (*models.Plan, *models.UserUsageMonthly, error) {
	_, plan, err := s.GetActiveSubscription(userID)
	if err != nil {
		return nil, nil, err
	}
	usage, err := s.GetUsage(userID, time.Now())
	if err != nil {
		return nil, nil, err
	}
	if plan.AIQuotaMonthly > 0 && usage.AIUsed >= plan.AIQuotaMonthly {
		return nil, nil, &LimitError{
			Code:    "AI_QUOTA_EXCEEDED",
			Message: "Monthly AI quota exceeded. Upgrade your plan to get more AI usage.",
			Details: map[string]interface{}{"used": usage.AIUsed, "limit": plan.AIQuotaMonthly, "planCode": plan.Code},
		}
	}
	usage.AIUsed += 1
	if err := database.DB.Save(usage).Error; err != nil {
		return nil, nil, err
	}
	return plan, usage, nil
}

func BuildPlanFeatures(plan *models.Plan) PlanFeatures {
	return PlanFeatures{
		Code:                  plan.Code,
		Name:                  plan.Name,
		ResumeLimit:           0,
		AIQuotaMonthly:        0,
		TemplateLimit:         CurrentFreeTemplateMaxID,
		AllowDuplicate:        true,
		AllowCustomSections:   true,
		AllowCertifications:   true,
		AllowLanguages:        true,
		AllowAwards:           true,
		AllowHdPdf:            true,
		AllowJdOptimization:   false,
		AllowMultiLanguage:    true,
		AllowPriorityFeatures: false,
	}
}

func isMissingTableError(err error) bool {
	if err == nil {
		return false
	}
	var mysqlErr *mysqlDriver.MySQLError
	return errors.As(err, &mysqlErr) && mysqlErr.Number == 1146
}

func ensureBillingSchema() error {
	if err := database.DB.AutoMigrate(
		&models.Plan{},
		&models.UserSubscription{},
		&models.UserUsageMonthly{},
		&models.PaymentOrder{},
	); err != nil {
		return err
	}
	return database.SeedPlans()
}
