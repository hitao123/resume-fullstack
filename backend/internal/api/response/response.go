package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Success(c *gin.Context, status int, data interface{}) {
	c.JSON(status, gin.H{
		"success": true,
		"data":    data,
	})
}

func Message(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{
		"success": true,
		"message": message,
	})
}

func Error(c *gin.Context, status int, code, message string, details interface{}) {
	body := gin.H{
		"success": false,
		"code":    code,
		"message": message,
	}
	if details != nil {
		body["details"] = details
	}
	c.JSON(status, body)
}

func BadRequest(c *gin.Context, code, message string) {
	Error(c, http.StatusBadRequest, code, message, nil)
}

func Unauthorized(c *gin.Context, code, message string) {
	Error(c, http.StatusUnauthorized, code, message, nil)
}

func Forbidden(c *gin.Context, code, message string, details interface{}) {
	Error(c, http.StatusForbidden, code, message, details)
}

func NotFound(c *gin.Context, code, message string) {
	Error(c, http.StatusNotFound, code, message, nil)
}

func Internal(c *gin.Context, code, message string) {
	Error(c, http.StatusInternalServerError, code, message, nil)
}
