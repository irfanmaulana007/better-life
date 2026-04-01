package middleware

import (
	"strings"

	"github.com/betterlife/server/internal/repository"
	"github.com/betterlife/server/pkg/response"
	"github.com/gin-gonic/gin"
)

const DeviceTokenKey = "device_token"

func DeviceAuth(deviceRepo *repository.DeviceRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "Authorization header is required")
			c.Abort()
			return
		}

		// Expect "Bearer <token>" format
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.Unauthorized(c, "Invalid authorization header format")
			c.Abort()
			return
		}

		token := parts[1]
		if token == "" {
			response.Unauthorized(c, "Device token is required")
			c.Abort()
			return
		}

		// Verify token exists in database
		exists, err := deviceRepo.Exists(c.Request.Context(), token)
		if err != nil {
			response.InternalError(c, "Failed to verify device token")
			c.Abort()
			return
		}

		if !exists {
			response.Unauthorized(c, "Invalid device token")
			c.Abort()
			return
		}

		// Set token in context for handlers to use
		c.Set(DeviceTokenKey, token)
		c.Next()
	}
}

func GetDeviceToken(c *gin.Context) string {
	token, exists := c.Get(DeviceTokenKey)
	if !exists {
		return ""
	}
	return token.(string)
}
