package config

import "os"

// OAuthProviderConfig holds configuration for a single OAuth provider
type OAuthProviderConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURI  string
}

// OAuthConfig holds all OAuth-related configuration
type OAuthConfig struct {
	GitHub               OAuthProviderConfig
	Google               OAuthProviderConfig
	WeChat               OAuthProviderConfig
	FrontendCallbackURL  string
}

// LoadOAuthConfig loads OAuth configuration from environment variables
func LoadOAuthConfig() *OAuthConfig {
	return &OAuthConfig{
		GitHub: OAuthProviderConfig{
			ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
			ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
			RedirectURI:  os.Getenv("GITHUB_REDIRECT_URI"),
		},
		Google: OAuthProviderConfig{
			ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
			ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
			RedirectURI:  os.Getenv("GOOGLE_REDIRECT_URI"),
		},
		WeChat: OAuthProviderConfig{
			ClientID:     os.Getenv("WECHAT_APP_ID"),
			ClientSecret: os.Getenv("WECHAT_APP_SECRET"),
			RedirectURI:  os.Getenv("WECHAT_REDIRECT_URI"),
		},
		FrontendCallbackURL: getEnvOrDefault("OAUTH_FRONTEND_CALLBACK_URL", "http://localhost:5176/oauth/callback"),
	}
}

// GetProviderConfig returns the config for the given provider name
func (c *OAuthConfig) GetProviderConfig(provider string) *OAuthProviderConfig {
	switch provider {
	case "github":
		return &c.GitHub
	case "google":
		return &c.Google
	case "wechat":
		return &c.WeChat
	default:
		return nil
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}
