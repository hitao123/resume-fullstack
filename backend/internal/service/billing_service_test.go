package service

import (
	"testing"

	"github.com/henryhua/resume-backend/internal/domain/models"
)

func TestEditorFeaturesAreOpenRegardlessOfStoredPlan(t *testing.T) {
	features := BuildPlanFeatures(&models.Plan{Code: PlanFree, Name: "免费版", ResumeLimit: 1, TemplateLimit: 1})
	if features.ResumeLimit != 0 || features.TemplateLimit != CurrentFreeTemplateMaxID {
		t.Fatalf("unexpected open limits: %+v", features)
	}
	if !features.AllowDuplicate || !features.AllowCustomSections || !features.AllowCertifications || !features.AllowLanguages || !features.AllowAwards || !features.AllowHdPdf {
		t.Fatalf("editing feature unexpectedly gated: %+v", features)
	}
}

func TestPublishedTemplatesAreAvailableWithoutMembership(t *testing.T) {
	billing := NewBillingService()
	for id := 1; id <= CurrentFreeTemplateMaxID; id++ {
		if err := billing.CheckTemplateAccess(1, id); err != nil {
			t.Errorf("template %d was blocked: %v", id, err)
		}
	}
	if err := billing.CheckTemplateAccess(1, CurrentFreeTemplateMaxID+1); err == nil {
		t.Error("unpublished template was accepted")
	}
}
