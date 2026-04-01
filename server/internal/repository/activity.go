package repository

import (
	"context"
	"time"

	"github.com/betterlife/server/internal/model"
	"github.com/google/uuid"
)

type ActivityRepository struct {
	db *DB
}

func NewActivityRepository(db *DB) *ActivityRepository {
	return &ActivityRepository{db: db}
}

func (r *ActivityRepository) Create(ctx context.Context, deviceToken string, req *model.CreateActivityRequest) (*model.Activity, error) {
	createdAt := time.Now()
	if req.CreatedAt != nil {
		createdAt = *req.CreatedAt
	}
	updatedAt := createdAt
	if req.UpdatedAt != nil {
		updatedAt = *req.UpdatedAt
	}

	var activity model.Activity
	err := r.db.Pool.QueryRow(ctx,
		`INSERT INTO activities (device_token, local_id, milestone_local_id, name, unit_type, unit_name, target_goal, schedule_days, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		 RETURNING id, device_token, local_id, milestone_id, milestone_local_id, name, unit_type, unit_name, target_goal, schedule_days, created_at, updated_at, deleted_at`,
		deviceToken, req.LocalID, req.MilestoneLocalID, req.Name, req.UnitType, req.UnitName, req.TargetGoal, req.ScheduleDays, createdAt, updatedAt,
	).Scan(&activity.ID, &activity.DeviceToken, &activity.LocalID, &activity.MilestoneID, &activity.MilestoneLocalID,
		&activity.Name, &activity.UnitType, &activity.UnitName, &activity.TargetGoal, &activity.ScheduleDays,
		&activity.CreatedAt, &activity.UpdatedAt, &activity.DeletedAt)

	if err != nil {
		return nil, err
	}

	return &activity, nil
}

func (r *ActivityRepository) GetAll(ctx context.Context, deviceToken string) ([]model.Activity, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT id, device_token, local_id, milestone_id, milestone_local_id, name, unit_type, unit_name, target_goal, schedule_days, created_at, updated_at, deleted_at
		 FROM activities
		 WHERE device_token = $1 AND deleted_at IS NULL
		 ORDER BY name ASC`,
		deviceToken,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var activities []model.Activity
	for rows.Next() {
		var a model.Activity
		err := rows.Scan(&a.ID, &a.DeviceToken, &a.LocalID, &a.MilestoneID, &a.MilestoneLocalID,
			&a.Name, &a.UnitType, &a.UnitName, &a.TargetGoal, &a.ScheduleDays,
			&a.CreatedAt, &a.UpdatedAt, &a.DeletedAt)
		if err != nil {
			return nil, err
		}
		activities = append(activities, a)
	}

	return activities, nil
}

func (r *ActivityRepository) GetByID(ctx context.Context, deviceToken string, id int64) (*model.Activity, error) {
	var a model.Activity
	err := r.db.Pool.QueryRow(ctx,
		`SELECT id, device_token, local_id, milestone_id, milestone_local_id, name, unit_type, unit_name, target_goal, schedule_days, created_at, updated_at, deleted_at
		 FROM activities
		 WHERE id = $1 AND device_token = $2 AND deleted_at IS NULL`,
		id, deviceToken,
	).Scan(&a.ID, &a.DeviceToken, &a.LocalID, &a.MilestoneID, &a.MilestoneLocalID,
		&a.Name, &a.UnitType, &a.UnitName, &a.TargetGoal, &a.ScheduleDays,
		&a.CreatedAt, &a.UpdatedAt, &a.DeletedAt)

	if err != nil {
		return nil, err
	}

	return &a, nil
}

func (r *ActivityRepository) GetByLocalID(ctx context.Context, deviceToken string, localID uuid.UUID) (*model.Activity, error) {
	var a model.Activity
	err := r.db.Pool.QueryRow(ctx,
		`SELECT id, device_token, local_id, milestone_id, milestone_local_id, name, unit_type, unit_name, target_goal, schedule_days, created_at, updated_at, deleted_at
		 FROM activities
		 WHERE local_id = $1 AND device_token = $2`,
		localID, deviceToken,
	).Scan(&a.ID, &a.DeviceToken, &a.LocalID, &a.MilestoneID, &a.MilestoneLocalID,
		&a.Name, &a.UnitType, &a.UnitName, &a.TargetGoal, &a.ScheduleDays,
		&a.CreatedAt, &a.UpdatedAt, &a.DeletedAt)

	if err != nil {
		return nil, err
	}

	return &a, nil
}

func (r *ActivityRepository) Update(ctx context.Context, deviceToken string, id int64, req *model.UpdateActivityRequest) (*model.Activity, error) {
	updatedAt := time.Now()
	if req.UpdatedAt != nil {
		updatedAt = *req.UpdatedAt
	}

	var a model.Activity
	err := r.db.Pool.QueryRow(ctx,
		`UPDATE activities
		 SET milestone_local_id = $1, name = $2, unit_type = $3, unit_name = $4, target_goal = $5, schedule_days = $6, updated_at = $7
		 WHERE id = $8 AND device_token = $9 AND deleted_at IS NULL
		 RETURNING id, device_token, local_id, milestone_id, milestone_local_id, name, unit_type, unit_name, target_goal, schedule_days, created_at, updated_at, deleted_at`,
		req.MilestoneLocalID, req.Name, req.UnitType, req.UnitName, req.TargetGoal, req.ScheduleDays, updatedAt, id, deviceToken,
	).Scan(&a.ID, &a.DeviceToken, &a.LocalID, &a.MilestoneID, &a.MilestoneLocalID,
		&a.Name, &a.UnitType, &a.UnitName, &a.TargetGoal, &a.ScheduleDays,
		&a.CreatedAt, &a.UpdatedAt, &a.DeletedAt)

	if err != nil {
		return nil, err
	}

	return &a, nil
}

func (r *ActivityRepository) Delete(ctx context.Context, deviceToken string, id int64) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE activities SET deleted_at = $1, updated_at = $1
		 WHERE id = $2 AND device_token = $3 AND deleted_at IS NULL`,
		time.Now(), id, deviceToken,
	)
	return err
}

func (r *ActivityRepository) GetUpdatedSince(ctx context.Context, deviceToken string, since time.Time) ([]model.Activity, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT id, device_token, local_id, milestone_id, milestone_local_id, name, unit_type, unit_name, target_goal, schedule_days, created_at, updated_at, deleted_at
		 FROM activities
		 WHERE device_token = $1 AND updated_at > $2
		 ORDER BY updated_at ASC`,
		deviceToken, since,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var activities []model.Activity
	for rows.Next() {
		var a model.Activity
		err := rows.Scan(&a.ID, &a.DeviceToken, &a.LocalID, &a.MilestoneID, &a.MilestoneLocalID,
			&a.Name, &a.UnitType, &a.UnitName, &a.TargetGoal, &a.ScheduleDays,
			&a.CreatedAt, &a.UpdatedAt, &a.DeletedAt)
		if err != nil {
			return nil, err
		}
		activities = append(activities, a)
	}

	return activities, nil
}

func (r *ActivityRepository) Upsert(ctx context.Context, deviceToken string, req *model.SyncActivity) (*model.Activity, string, error) {
	var activity model.Activity
	var status string

	// Check if exists
	existing, _ := r.GetByLocalID(ctx, deviceToken, req.LocalID)

	if existing != nil {
		// Update existing
		if req.DeletedAt != nil {
			status = "deleted"
		} else {
			status = "updated"
		}
		err := r.db.Pool.QueryRow(ctx,
			`UPDATE activities
			 SET milestone_local_id = $1, name = $2, unit_type = $3, unit_name = $4, target_goal = $5, schedule_days = $6, updated_at = $7, deleted_at = $8
			 WHERE local_id = $9 AND device_token = $10
			 RETURNING id, device_token, local_id, milestone_id, milestone_local_id, name, unit_type, unit_name, target_goal, schedule_days, created_at, updated_at, deleted_at`,
			req.MilestoneLocalID, req.Name, req.UnitType, req.UnitName, req.TargetGoal, req.ScheduleDays, req.UpdatedAt, req.DeletedAt, req.LocalID, deviceToken,
		).Scan(&activity.ID, &activity.DeviceToken, &activity.LocalID, &activity.MilestoneID, &activity.MilestoneLocalID,
			&activity.Name, &activity.UnitType, &activity.UnitName, &activity.TargetGoal, &activity.ScheduleDays,
			&activity.CreatedAt, &activity.UpdatedAt, &activity.DeletedAt)
		if err != nil {
			return nil, "", err
		}
	} else {
		// Create new
		status = "created"
		err := r.db.Pool.QueryRow(ctx,
			`INSERT INTO activities (device_token, local_id, milestone_local_id, name, unit_type, unit_name, target_goal, schedule_days, created_at, updated_at, deleted_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			 RETURNING id, device_token, local_id, milestone_id, milestone_local_id, name, unit_type, unit_name, target_goal, schedule_days, created_at, updated_at, deleted_at`,
			deviceToken, req.LocalID, req.MilestoneLocalID, req.Name, req.UnitType, req.UnitName, req.TargetGoal, req.ScheduleDays, req.CreatedAt, req.UpdatedAt, req.DeletedAt,
		).Scan(&activity.ID, &activity.DeviceToken, &activity.LocalID, &activity.MilestoneID, &activity.MilestoneLocalID,
			&activity.Name, &activity.UnitType, &activity.UnitName, &activity.TargetGoal, &activity.ScheduleDays,
			&activity.CreatedAt, &activity.UpdatedAt, &activity.DeletedAt)
		if err != nil {
			return nil, "", err
		}
	}

	return &activity, status, nil
}
