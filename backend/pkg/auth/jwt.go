package auth

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	jwtSecret        []byte
	jwtRefreshSecret []byte
	accessExpiry     time.Duration
	refreshExpiry    time.Duration
)

// Claims represents JWT claims
type Claims struct {
	UserID uint   `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// Initialize sets up JWT configuration
func Initialize() error {
	jwtSecret = []byte(os.Getenv("JWT_SECRET"))
	jwtRefreshSecret = []byte(os.Getenv("JWT_REFRESH_SECRET"))

	if len(jwtSecret) == 0 || len(jwtRefreshSecret) == 0 {
		return errors.New("JWT secrets not configured")
	}

	var err error
	accessExpiryStr := os.Getenv("JWT_ACCESS_EXPIRY")
	if accessExpiryStr == "" {
		accessExpiryStr = "15m"
	}
	accessExpiry, err = time.ParseDuration(accessExpiryStr)
	if err != nil {
		return fmt.Errorf("invalid JWT_ACCESS_EXPIRY: %w", err)
	}

	refreshExpiryStr := os.Getenv("JWT_REFRESH_EXPIRY")
	if refreshExpiryStr == "" {
		refreshExpiryStr = "168h" // 7 days
	}
	refreshExpiry, err = time.ParseDuration(refreshExpiryStr)
	if err != nil {
		return fmt.Errorf("invalid JWT_REFRESH_EXPIRY: %w", err)
	}

	return nil
}

// GenerateAccessToken generates an access token
func GenerateAccessToken(userID uint, email string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(accessExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// GenerateRefreshToken generates a refresh token
func GenerateRefreshToken(userID uint, email string) (string, time.Time, error) {
	expiresAt := time.Now().Add(refreshExpiry)
	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtRefreshSecret)
	return tokenString, expiresAt, err
}

// ValidateAccessToken validates and parses an access token
func ValidateAccessToken(tokenString string) (*Claims, error) {
	return validateToken(tokenString, jwtSecret)
}

// ValidateRefreshToken validates and parses a refresh token
func ValidateRefreshToken(tokenString string) (*Claims, error) {
	return validateToken(tokenString, jwtRefreshSecret)
}

// validateToken is a helper function to validate tokens
func validateToken(tokenString string, secret []byte) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
