package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/henryhua/resume-backend/internal/dto"
	"github.com/henryhua/resume-backend/internal/service"
)

type OAuthHandler struct {
	oauthService *service.OAuthService
}

func NewOAuthHandler() *OAuthHandler {
	return &OAuthHandler{
		oauthService: service.NewOAuthService(),
	}
}

// Initiate returns the OAuth authorization URL for the given provider
func (h *OAuthHandler) Initiate(c *gin.Context) {
	provider := c.Param("provider")

	state, err := h.oauthService.GenerateState()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate state",
		})
		return
	}

	authURL, err := h.oauthService.GetAuthURL(provider, state)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Set state cookie for CSRF validation
	c.SetCookie("oauth_state", state, 600, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": dto.OAuthInitiateResponse{
			AuthURL: authURL,
		},
	})
}

// Callback handles the OAuth callback from the provider
func (h *OAuthHandler) Callback(c *gin.Context) {
	provider := c.Param("provider")
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		h.redirectWithError(c, "Missing authorization code")
		return
	}

	// Validate state
	storedState, err := c.Cookie("oauth_state")
	if err != nil || storedState != state {
		h.redirectWithError(c, "Invalid state parameter")
		return
	}

	// Clear the state cookie
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)

	// Exchange code for user info
	userInfo, err := h.oauthService.ExchangeCodeAndGetUser(provider, code)
	if err != nil {
		log.Printf("OAuth exchange error for %s: %v", provider, err)
		h.redirectWithError(c, "Failed to authenticate with provider")
		return
	}

	// Find or create user
	user, err := h.oauthService.FindOrCreateUser(provider, userInfo)
	if err != nil {
		log.Printf("OAuth user creation error: %v", err)
		h.redirectWithError(c, "Failed to create user account")
		return
	}

	// Generate JWT tokens
	accessToken, refreshToken, err := h.oauthService.GenerateTokens(user)
	if err != nil {
		log.Printf("OAuth token generation error: %v", err)
		h.redirectWithError(c, "Failed to generate tokens")
		return
	}

	// Redirect to frontend with tokens in hash
	redirectURL := h.oauthService.GetFrontendCallbackURL(accessToken, refreshToken)
	c.Redirect(http.StatusFound, redirectURL)
}

func (h *OAuthHandler) redirectWithError(c *gin.Context, msg string) {
	redirectURL := h.oauthService.GetFrontendCallbackURL("", "")
	redirectURL += "&error=" + msg
	c.Redirect(http.StatusFound, redirectURL)
}
