package model

import (
	"time"

	"github.com/google/uuid"
)

// Milestone represents a goal or milestone with a time period
type Milestone struct {
	ID          int64      `json:"id"`
	DeviceToken string     `json:"-"`
	LocalID     uuid.UUID  `json:"local_id"`
	Name        string     `json:"name"`
	StartDate   time.Time  `json:"start_date"`
	EndDate     *time.Time `json:"end_date,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`
}

// Activity represents a trackable activity under a milestone
type Activity struct {
	ID               int64      `json:"id"`
	DeviceToken      string     `json:"-"`
	LocalID          uuid.UUID  `json:"local_id"`
	MilestoneID      *int64     `json:"milestone_id,omitempty"`
	MilestoneLocalID uuid.UUID  `json:"milestone_local_id"`
	Name             string     `json:"name"`
	UnitType         string     `json:"unit_type"`
	UnitName         string     `json:"unit_name"`
	TargetGoal       *float64   `json:"target_goal,omitempty"`
	ScheduleDays     []int      `json:"schedule_days"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	DeletedAt        *time.Time `json:"deleted_at,omitempty"`
}

// Session represents a logged activity session
type Session struct {
	ID              int64      `json:"id"`
	DeviceToken     string     `json:"-"`
	LocalID         uuid.UUID  `json:"local_id"`
	ActivityID      *int64     `json:"activity_id,omitempty"`
	ActivityLocalID uuid.UUID  `json:"activity_local_id"`
	Date            time.Time  `json:"date"`
	IsCompleted     bool       `json:"is_completed"`
	ActualResult    *float64   `json:"actual_result,omitempty"`
	TargetGoal      *float64   `json:"target_goal,omitempty"`
	Notes           *string    `json:"notes,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	DeletedAt       *time.Time `json:"deleted_at,omitempty"`
}

// Device represents a registered device
type Device struct {
	ID        int64     `json:"id"`
	Token     string    `json:"token"`
	CreatedAt time.Time `json:"created_at"`
}

// Request/Response DTOs

type CreateMilestoneRequest struct {
	LocalID   uuid.UUID  `json:"local_id" binding:"required"`
	Name      string     `json:"name" binding:"required"`
	StartDate string     `json:"start_date" binding:"required"`
	EndDate   *string    `json:"end_date,omitempty"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type UpdateMilestoneRequest struct {
	Name      string     `json:"name" binding:"required"`
	StartDate string     `json:"start_date" binding:"required"`
	EndDate   *string    `json:"end_date,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type CreateActivityRequest struct {
	LocalID          uuid.UUID `json:"local_id" binding:"required"`
	MilestoneLocalID uuid.UUID `json:"milestone_local_id" binding:"required"`
	Name             string    `json:"name" binding:"required"`
	UnitType         string    `json:"unit_type" binding:"required"`
	UnitName         string    `json:"unit_name" binding:"required"`
	TargetGoal       *float64  `json:"target_goal,omitempty"`
	ScheduleDays     []int     `json:"schedule_days" binding:"required"`
	CreatedAt        *time.Time `json:"created_at,omitempty"`
	UpdatedAt        *time.Time `json:"updated_at,omitempty"`
}

type UpdateActivityRequest struct {
	MilestoneLocalID uuid.UUID `json:"milestone_local_id" binding:"required"`
	Name             string    `json:"name" binding:"required"`
	UnitType         string    `json:"unit_type" binding:"required"`
	UnitName         string    `json:"unit_name" binding:"required"`
	TargetGoal       *float64  `json:"target_goal,omitempty"`
	ScheduleDays     []int     `json:"schedule_days" binding:"required"`
	UpdatedAt        *time.Time `json:"updated_at,omitempty"`
}

type CreateSessionRequest struct {
	LocalID         uuid.UUID  `json:"local_id" binding:"required"`
	ActivityLocalID uuid.UUID  `json:"activity_local_id" binding:"required"`
	Date            string     `json:"date" binding:"required"`
	IsCompleted     bool       `json:"is_completed"`
	ActualResult    *float64   `json:"actual_result,omitempty"`
	TargetGoal      *float64   `json:"target_goal,omitempty"`
	Notes           *string    `json:"notes,omitempty"`
	CreatedAt       *time.Time `json:"created_at,omitempty"`
	UpdatedAt       *time.Time `json:"updated_at,omitempty"`
}

type UpdateSessionRequest struct {
	ActivityLocalID uuid.UUID  `json:"activity_local_id" binding:"required"`
	Date            string     `json:"date" binding:"required"`
	IsCompleted     bool       `json:"is_completed"`
	ActualResult    *float64   `json:"actual_result,omitempty"`
	TargetGoal      *float64   `json:"target_goal,omitempty"`
	Notes           *string    `json:"notes,omitempty"`
	UpdatedAt       *time.Time `json:"updated_at,omitempty"`
}

// Sync DTOs

type SyncPushRequest struct {
	Milestones []SyncMilestone `json:"milestones,omitempty"`
	Activities []SyncActivity  `json:"activities,omitempty"`
	Sessions   []SyncSession   `json:"sessions,omitempty"`
}

type SyncMilestone struct {
	LocalID   uuid.UUID  `json:"local_id"`
	Name      string     `json:"name"`
	StartDate string     `json:"start_date"`
	EndDate   *string    `json:"end_date,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

type SyncActivity struct {
	LocalID          uuid.UUID  `json:"local_id"`
	MilestoneLocalID uuid.UUID  `json:"milestone_local_id"`
	Name             string     `json:"name"`
	UnitType         string     `json:"unit_type"`
	UnitName         string     `json:"unit_name"`
	TargetGoal       *float64   `json:"target_goal,omitempty"`
	ScheduleDays     []int      `json:"schedule_days"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	DeletedAt        *time.Time `json:"deleted_at,omitempty"`
}

type SyncSession struct {
	LocalID         uuid.UUID  `json:"local_id"`
	ActivityLocalID uuid.UUID  `json:"activity_local_id"`
	Date            string     `json:"date"`
	IsCompleted     bool       `json:"is_completed"`
	ActualResult    *float64   `json:"actual_result,omitempty"`
	TargetGoal      *float64   `json:"target_goal,omitempty"`
	Notes           *string    `json:"notes,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	DeletedAt       *time.Time `json:"deleted_at,omitempty"`
}

type SyncPushResponse struct {
	Milestones []SyncResultItem `json:"milestones"`
	Activities []SyncResultItem `json:"activities"`
	Sessions   []SyncResultItem `json:"sessions"`
}

type SyncResultItem struct {
	LocalID  uuid.UUID `json:"local_id"`
	ServerID int64     `json:"server_id"`
	Status   string    `json:"status"` // "created", "updated", "deleted"
}

type SyncPullResponse struct {
	Milestones []Milestone `json:"milestones"`
	Activities []Activity  `json:"activities"`
	Sessions   []Session   `json:"sessions"`
	SyncedAt   time.Time   `json:"synced_at"`
}
