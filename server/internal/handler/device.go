package handler

import (
	"github.com/betterlife/server/internal/repository"
	"github.com/betterlife/server/pkg/response"
	"github.com/gin-gonic/gin"
)

type DeviceHandler struct {
	repo *repository.DeviceRepository
}

func NewDeviceHandler(repo *repository.DeviceRepository) *DeviceHandler {
	return &DeviceHandler{repo: repo}
}

func (h *DeviceHandler) Register(c *gin.Context) {
	device, err := h.repo.Create(c.Request.Context())
	if err != nil {
		response.InternalError(c, "Failed to register device")
		return
	}

	response.Created(c, gin.H{
		"token": device.Token,
	})
}
