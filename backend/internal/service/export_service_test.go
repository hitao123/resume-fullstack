package service

import (
	"errors"
	"testing"

	"github.com/henryhua/resume-backend/internal/domain/models"
)

func TestAttachAvatarOmitsUnreachableAvatarInsteadOfFailing(t *testing.T) {
	resume := &models.Resume{PersonalInfo: &models.PersonalInfo{ShowAvatar: true, AvatarURL: "https://example.com/a.png"}}
	warning := attachAvatar(resume, func(string) (string, error) { return "", errors.New("unreachable") })
	if warning != avatarOmittedWarning {
		t.Fatalf("expected %s warning, got %q", avatarOmittedWarning, warning)
	}
	if resume.PersonalInfo.AvatarDataURL != "" {
		t.Fatalf("avatar should be omitted, got %q", resume.PersonalInfo.AvatarDataURL)
	}
}

func TestAttachAvatarInlinesFetchedAvatar(t *testing.T) {
	resume := &models.Resume{PersonalInfo: &models.PersonalInfo{ShowAvatar: true, AvatarURL: "https://example.com/a.png"}}
	if warning := attachAvatar(resume, func(string) (string, error) { return "data:image/png;base64,AA==", nil }); warning != "" {
		t.Fatalf("unexpected warning %q", warning)
	}
	if resume.PersonalInfo.AvatarDataURL != "data:image/png;base64,AA==" {
		t.Fatalf("avatar was not inlined: %q", resume.PersonalInfo.AvatarDataURL)
	}
}

func TestAttachAvatarSkipsHiddenAvatar(t *testing.T) {
	called := false
	resume := &models.Resume{PersonalInfo: &models.PersonalInfo{ShowAvatar: false, AvatarURL: "https://example.com/a.png"}}
	if warning := attachAvatar(resume, func(string) (string, error) { called = true; return "", nil }); warning != "" || called {
		t.Fatalf("hidden avatar should not be fetched (warning %q, called %v)", warning, called)
	}
}
