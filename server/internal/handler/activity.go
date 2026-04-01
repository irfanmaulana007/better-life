package handler

import (
	"strconv"

	"github.com/betterlife/server/internal/middleware"
	"github.com/betterlife/server/internal/model"
	"github.com/betterlife/server/internal/repository"
	"github.com/betterlife/server/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type ActivityHandler struct {
	repo *repository.ActivityRepository
}

func NewActivityHandler(repo *repository.ActivityRepository) *ActivityHandler {
	return &ActivityHandler{repo: repo}
}

func (h *ActivityHandler) Create(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	var req model.CreateActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	activity, err := h.repo.Create(c.Request.Context(), deviceToken, &req)
	if err != nil {
		response.InternalError(c, "Failed to create activity")
		return
	}

	response.Created(c, activity)
}

func (h *ActivityHandler) GetAll(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	activities, err := h.repo.GetAll(c.Request.Context(), deviceToken)
	if err != nil {
		response.InternalError(c, "Failed to fetch activities")
		return
	}

	if activities == nil {
		activities = []model.Activity{}
	}

	response.Success(c, activities)
}

func (h *ActivityHandler) GetByID(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid activity ID")
		return
	}

	activity, err := h.repo.GetByID(c.Request.Context(), deviceToken, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(c, "Activity not found")
			return
		}
		response.InternalError(c, "Failed to fetch activity")
		return
	}

	response.Success(c, activity)
}

func (h *ActivityHandler) Update(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid activity ID")
		return
	}

	var req model.UpdateActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	activity, err := h.repo.Update(c.Request.Context(), deviceToken, id, &req)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(c, "Activity not found")
			return
		}
		response.InternalError(c, "Failed to update activity")
		return
	}

	response.Success(c, activity)
}

func (h *ActivityHandler) Delete(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid activity ID")
		return
	}

	if err := h.repo.Delete(c.Request.Context(), deviceToken, id); err != nil {
		response.InternalError(c, "Failed to delete activity")
		return
	}

	response.NoContent(c)
}
