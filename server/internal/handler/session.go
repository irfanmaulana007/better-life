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

type SessionHandler struct {
	repo *repository.SessionRepository
}

func NewSessionHandler(repo *repository.SessionRepository) *SessionHandler {
	return &SessionHandler{repo: repo}
}

func (h *SessionHandler) Create(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	var req model.CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	session, err := h.repo.Create(c.Request.Context(), deviceToken, &req)
	if err != nil {
		response.InternalError(c, "Failed to create session")
		return
	}

	response.Created(c, session)
}

func (h *SessionHandler) GetAll(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	sessions, err := h.repo.GetAll(c.Request.Context(), deviceToken)
	if err != nil {
		response.InternalError(c, "Failed to fetch sessions")
		return
	}

	if sessions == nil {
		sessions = []model.Session{}
	}

	response.Success(c, sessions)
}

func (h *SessionHandler) GetByID(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid session ID")
		return
	}

	session, err := h.repo.GetByID(c.Request.Context(), deviceToken, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(c, "Session not found")
			return
		}
		response.InternalError(c, "Failed to fetch session")
		return
	}

	response.Success(c, session)
}

func (h *SessionHandler) Update(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid session ID")
		return
	}

	var req model.UpdateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	session, err := h.repo.Update(c.Request.Context(), deviceToken, id, &req)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(c, "Session not found")
			return
		}
		response.InternalError(c, "Failed to update session")
		return
	}

	response.Success(c, session)
}

func (h *SessionHandler) Delete(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "Invalid session ID")
		return
	}

	if err := h.repo.Delete(c.Request.Context(), deviceToken, id); err != nil {
		response.InternalError(c, "Failed to delete session")
		return
	}

	response.NoContent(c)
}
