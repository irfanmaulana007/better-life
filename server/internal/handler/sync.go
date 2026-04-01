package handler

import (
	"time"

	"github.com/betterlife/server/internal/middleware"
	"github.com/betterlife/server/internal/model"
	"github.com/betterlife/server/internal/repository"
	"github.com/betterlife/server/pkg/response"
	"github.com/gin-gonic/gin"
)

type SyncHandler struct {
	milestoneRepo *repository.MilestoneRepository
	activityRepo  *repository.ActivityRepository
	sessionRepo   *repository.SessionRepository
}

func NewSyncHandler(
	milestoneRepo *repository.MilestoneRepository,
	activityRepo *repository.ActivityRepository,
	sessionRepo *repository.SessionRepository,
) *SyncHandler {
	return &SyncHandler{
		milestoneRepo: milestoneRepo,
		activityRepo:  activityRepo,
		sessionRepo:   sessionRepo,
	}
}

func (h *SyncHandler) Push(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	var req model.SyncPushRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result := model.SyncPushResponse{
		Milestones: []model.SyncResultItem{},
		Activities: []model.SyncResultItem{},
		Sessions:   []model.SyncResultItem{},
	}

	// Process milestones
	for _, m := range req.Milestones {
		milestone, status, err := h.milestoneRepo.Upsert(c.Request.Context(), deviceToken, &m)
		if err != nil {
			response.InternalError(c, "Failed to sync milestone: "+err.Error())
			return
		}
		result.Milestones = append(result.Milestones, model.SyncResultItem{
			LocalID:  m.LocalID,
			ServerID: milestone.ID,
			Status:   status,
		})
	}

	// Process activities
	for _, a := range req.Activities {
		activity, status, err := h.activityRepo.Upsert(c.Request.Context(), deviceToken, &a)
		if err != nil {
			response.InternalError(c, "Failed to sync activity: "+err.Error())
			return
		}
		result.Activities = append(result.Activities, model.SyncResultItem{
			LocalID:  a.LocalID,
			ServerID: activity.ID,
			Status:   status,
		})
	}

	// Process sessions
	for _, s := range req.Sessions {
		session, status, err := h.sessionRepo.Upsert(c.Request.Context(), deviceToken, &s)
		if err != nil {
			response.InternalError(c, "Failed to sync session: "+err.Error())
			return
		}
		result.Sessions = append(result.Sessions, model.SyncResultItem{
			LocalID:  s.LocalID,
			ServerID: session.ID,
			Status:   status,
		})
	}

	response.Success(c, result)
}

func (h *SyncHandler) Pull(c *gin.Context) {
	deviceToken := middleware.GetDeviceToken(c)

	// Parse since timestamp from query parameter
	sinceStr := c.Query("since")
	var since time.Time
	if sinceStr != "" {
		var err error
		since, err = time.Parse(time.RFC3339, sinceStr)
		if err != nil {
			response.BadRequest(c, "Invalid since timestamp format. Use RFC3339.")
			return
		}
	} else {
		// Default to beginning of time (get all)
		since = time.Time{}
	}

	// Fetch all updated records
	milestones, err := h.milestoneRepo.GetUpdatedSince(c.Request.Context(), deviceToken, since)
	if err != nil {
		response.InternalError(c, "Failed to fetch milestones")
		return
	}

	activities, err := h.activityRepo.GetUpdatedSince(c.Request.Context(), deviceToken, since)
	if err != nil {
		response.InternalError(c, "Failed to fetch activities")
		return
	}

	sessions, err := h.sessionRepo.GetUpdatedSince(c.Request.Context(), deviceToken, since)
	if err != nil {
		response.InternalError(c, "Failed to fetch sessions")
		return
	}

	if milestones == nil {
		milestones = []model.Milestone{}
	}
	if activities == nil {
		activities = []model.Activity{}
	}
	if sessions == nil {
		sessions = []model.Session{}
	}

	response.Success(c, model.SyncPullResponse{
		Milestones: milestones,
		Activities: activities,
		Sessions:   sessions,
		SyncedAt:   time.Now(),
	})
}
