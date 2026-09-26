package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestPausedRoutesAreNotRegistered(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	SetupRoutes(router)

	for _, route := range []struct {
		method string
		path   string
	}{
		{http.MethodPost, "/api/v1/ai/generate-summary"},
		{http.MethodPost, "/api/v1/ai/enhance-description"},
		{http.MethodGet, "/api/v1/billing/plans"},
		{http.MethodPost, "/api/v1/billing/checkout"},
	} {
		request := httptest.NewRequest(route.method, route.path, nil)
		response := httptest.NewRecorder()
		router.ServeHTTP(response, request)
		if response.Code != http.StatusNotFound {
			t.Errorf("%s %s: got %d, want 404", route.method, route.path, response.Code)
		}
	}
}
