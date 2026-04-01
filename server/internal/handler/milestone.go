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

type MilestoneHandler struct {
	repo *repository.MilestoneRepository
}

func NewMilestoneHandler(repo *repository.MilestoneRepository) *MilestoneHandler {
	return &MilestoneHandler{repo: repo}
}

func (h *MilestoneHandler) Create(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	var req model.CreateMilestoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	milestone, err := h.repo.Create(c.Request.Context(), deviceToken, &req)
	if err != nil {
		response.InternalError(c, "Failed to create milestone")
		return
	}

	response.Created(c, milestone)
}

func (h *MilestoneHandler) GetAll(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	milestones, err := h.repo.GetAll(c.Request.Context(), deviceToken)
	if err != nil {
		response.InternalError(c, "Failed to fetch milestones")
		return
	}

	if milestones == nil {
		milestones = []model.Milestone{}
	}

	response.Success(c, milestones)
}

func (h *MilestoneHandler) GetByID(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid milestone ID")
		return
	}

	milestone, err := h.repo.GetByID(c.Request.Context(), deviceToken, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(c, "Milestone not found")
			return
		}
		response.InternalError(c, "Failed to fetch milestone")
		return
	}

	response.Success(c, milestone)
}

func (h *MilestoneHandler) Update(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid milestone ID")
		return
	}

	var req model.UpdateMilestoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	milestone, err := h.repo.Update(c.Request.Context(), deviceToken, id, &req)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(c, "Milestone not found")
			return
		}
		response.InternalError(c, "Failed to update milestone")
		return
	}

	response.Success(c, milestone)
}

func (h *MilestoneHandler) Delete(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid milestone ID")
		return
	}

	if err := h.repo.Delete(c.Request.Context(), deviceToken, id); err != nil {
		response.InternalError(c, "Failed to delete milestone")
		return
	}

	response.NoContent(c)
}
