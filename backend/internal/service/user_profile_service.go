package service

import (
	"time"

	"github.com/henryhua/resume-backend/internal/domain/models"
	"github.com/henryhua/resume-backend/internal/dto"
)

func BuildUserInfo(user models.User) (*dto.UserInfo, error) {
	billing := NewBillingService()
	_, plan, err := billing.GetActiveSubscription(user.ID)
	if err != nil {
		return nil, err
	}
	usage, err := billing.GetUsage(user.ID, time.Now())
	if err != nil {
		return nil, err
	}

	features := BuildPlanFeatures(plan)
	return &dto.UserInfo{
		ID:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		CreatedAt: user.CreatedAt.Format(time.RFC3339),
		UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
		Plan: &dto.PlanSummary{
			Code:                features.Code,
			Name:                features.Name,
			ResumeLimit:         features.ResumeLimit,
			AIQuotaMonthly:      features.AIQuotaMonthly,
			TemplateLimit:       features.TemplateLimit,
			AllowDuplicate:      features.AllowDuplicate,
			AllowCustomSections: features.AllowCustomSections,
			AllowCertifications: features.AllowCertifications,
			AllowLanguages:      features.AllowLanguages,
			AllowAwards:         features.AllowAwards,
			AllowHdPdf:          features.AllowHdPdf,
			AllowJdOptimization: features.AllowJdOptimization,
			AllowMultiLanguage:  features.AllowMultiLanguage,
		},
		Usage: &dto.UsageSummary{
			YearMonth:     usage.YearMonth,
			AIUsed:        usage.AIUsed,
			PdfExportUsed: usage.PdfExportUsed,
		},
		UpgradeHint: "",
	}, nil
}
