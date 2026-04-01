package repository

import (
	"context"
	"time"

	"github.com/betterlife/server/internal/model"
	"github.com/google/uuid"
)

type SessionRepository struct {
	db *DB
}

func NewSessionRepository(db *DB) *SessionRepository {
	return &SessionRepository{db: db}
}

func (r *SessionRepository) Create(ctx context.Context, deviceToken string, req *model.CreateSessionRequest) (*model.Session, error) {
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, err
	}

	createdAt := time.Now()
	if req.CreatedAt != nil {
		createdAt = *req.CreatedAt
	}
	updatedAt := createdAt
	if req.UpdatedAt != nil {
		updatedAt = *req.UpdatedAt
	}

	var session model.Session
	err = r.db.Pool.QueryRow(ctx,
		`INSERT INTO sessions (device_token, local_id, activity_local_id, date, is_completed, actual_result, target_goal, notes, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		 RETURNING id, device_token, local_id, activity_id, activity_local_id, date, is_completed, actual_result, target_goal, notes, created_at, updated_at, deleted_at`,
		deviceToken, req.LocalID, req.ActivityLocalID, date, req.IsCompleted, req.ActualResult, req.TargetGoal, req.Notes, createdAt, updatedAt,
	).Scan(&session.ID, &session.DeviceToken, &session.LocalID, &session.ActivityID, &session.ActivityLocalID,
		&session.Date, &session.IsCompleted, &session.ActualResult, &session.TargetGoal, &session.Notes,
		&session.CreatedAt, &session.UpdatedAt, &session.DeletedAt)

	if err != nil {
		return nil, err
	}

	return &session, nil
}

func (r *SessionRepository) GetAll(ctx context.Context, deviceToken string) ([]model.Session, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT id, device_token, local_id, activity_id, activity_local_id, date, is_completed, actual_result, target_goal, notes, created_at, updated_at, deleted_at
		 FROM sessions
		 WHERE device_token = $1 AND deleted_at IS NULL
		 ORDER BY date DESC`,
		deviceToken,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []model.Session
	for rows.Next() {
		var s model.Session
		err := rows.Scan(&s.ID, &s.DeviceToken, &s.LocalID, &s.ActivityID, &s.ActivityLocalID,
			&s.Date, &s.IsCompleted, &s.ActualResult, &s.TargetGoal, &s.Notes,
			&s.CreatedAt, &s.UpdatedAt, &s.DeletedAt)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}

	return sessions, nil
}

func (r *SessionRepository) GetByID(ctx context.Context, deviceToken string, id int64) (*model.Session, error) {
	var s model.Session
	err := r.db.Pool.QueryRow(ctx,
		`SELECT id, device_token, local_id, activity_id, activity_local_id, date, is_completed, actual_result, target_goal, notes, created_at, updated_at, deleted_at
		 FROM sessions
		 WHERE id = $1 AND device_token = $2 AND deleted_at IS NULL`,
		id, deviceToken,
	).Scan(&s.ID, &s.DeviceToken, &s.LocalID, &s.ActivityID, &s.ActivityLocalID,
		&s.Date, &s.IsCompleted, &s.ActualResult, &s.TargetGoal, &s.Notes,
		&s.CreatedAt, &s.UpdatedAt, &s.DeletedAt)

	if err != nil {
		return nil, err
	}

	return &s, nil
}

func (r *SessionRepository) GetByLocalID(ctx context.Context, deviceToken string, localID uuid.UUID) (*model.Session, error) {
	var s model.Session
	err := r.db.Pool.QueryRow(ctx,
		`SELECT id, device_token, local_id, activity_id, activity_local_id, date, is_completed, actual_result, target_goal, notes, created_at, updated_at, deleted_at
		 FROM sessions
		 WHERE local_id = $1 AND device_token = $2`,
		localID, deviceToken,
	).Scan(&s.ID, &s.DeviceToken, &s.LocalID, &s.ActivityID, &s.ActivityLocalID,
		&s.Date, &s.IsCompleted, &s.ActualResult, &s.TargetGoal, &s.Notes,
		&s.CreatedAt, &s.UpdatedAt, &s.DeletedAt)

	if err != nil {
		return nil, err
	}

	return &s, nil
}

func (r *SessionRepository) Update(ctx context.Context, deviceToken string, id int64, req *model.UpdateSessionRequest) (*model.Session, error) {
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, err
	}

	updatedAt := time.Now()
	if req.UpdatedAt != nil {
		updatedAt = *req.UpdatedAt
	}

	var s model.Session
	err = r.db.Pool.QueryRow(ctx,
		`UPDATE sessions
		 SET activity_local_id = $1, date = $2, is_completed = $3, actual_result = $4, target_goal = $5, notes = $6, updated_at = $7
		 WHERE id = $8 AND device_token = $9 AND deleted_at IS NULL
		 RETURNING id, device_token, local_id, activity_id, activity_local_id, date, is_completed, actual_result, target_goal, notes, created_at, updated_at, deleted_at`,
		req.ActivityLocalID, date, req.IsCompleted, req.ActualResult, req.TargetGoal, req.Notes, updatedAt, id, deviceToken,
	).Scan(&s.ID, &s.DeviceToken, &s.LocalID, &s.ActivityID, &s.ActivityLocalID,
		&s.Date, &s.IsCompleted, &s.ActualResult, &s.TargetGoal, &s.Notes,
		&s.CreatedAt, &s.UpdatedAt, &s.DeletedAt)

	if err != nil {
		return nil, err
	}

	return &s, nil
}

func (r *SessionRepository) Delete(ctx context.Context, deviceToken string, id int64) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE sessions SET deleted_at = $1, updated_at = $1
		 WHERE id = $2 AND device_token = $3 AND deleted_at IS NULL`,
		time.Now(), id, deviceToken,
	)
	return err
}

func (r *SessionRepository) GetUpdatedSince(ctx context.Context, deviceToken string, since time.Time) ([]model.Session, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT id, device_token, local_id, activity_id, activity_local_id, date, is_completed, actual_result, target_goal, notes, created_at, updated_at, deleted_at
		 FROM sessions
		 WHERE device_token = $1 AND updated_at > $2
		 ORDER BY updated_at ASC`,
		deviceToken, since,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []model.Session
	for rows.Next() {
		var s model.Session
		err := rows.Scan(&s.ID, &s.DeviceToken, &s.LocalID, &s.ActivityID, &s.ActivityLocalID,
			&s.Date, &s.IsCompleted, &s.ActualResult, &s.TargetGoal, &s.Notes,
			&s.CreatedAt, &s.UpdatedAt, &s.DeletedAt)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}

	return sessions, nil
}

func (r *SessionRepository) Upsert(ctx context.Context, deviceToken string, req *model.SyncSession) (*model.Session, string, error) {
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, "", err
	}

	var session model.Session
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
		err = r.db.Pool.QueryRow(ctx,
			`UPDATE sessions
			 SET activity_local_id = $1, date = $2, is_completed = $3, actual_result = $4, target_goal = $5, notes = $6, updated_at = $7, deleted_at = $8
			 WHERE local_id = $9 AND device_token = $10
			 RETURNING id, device_token, local_id, activity_id, activity_local_id, date, is_completed, actual_result, target_goal, notes, created_at, updated_at, deleted_at`,
			req.ActivityLocalID, date, req.IsCompleted, req.ActualResult, req.TargetGoal, req.Notes, req.UpdatedAt, req.DeletedAt, req.LocalID, deviceToken,
		).Scan(&session.ID, &session.DeviceToken, &session.LocalID, &session.ActivityID, &session.ActivityLocalID,
			&session.Date, &session.IsCompleted, &session.ActualResult, &session.TargetGoal, &session.Notes,
			&session.CreatedAt, &session.UpdatedAt, &session.DeletedAt)
	} else {
		// Create new
		status = "created"
		err = r.db.Pool.QueryRow(ctx,
			`INSERT INTO sessions (device_token, local_id, activity_local_id, date, is_completed, actual_result, target_goal, notes, created_at, updated_at, deleted_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			 RETURNING id, device_token, local_id, activity_id, activity_local_id, date, is_completed, actual_result, target_goal, notes, created_at, updated_at, deleted_at`,
			deviceToken, req.LocalID, req.ActivityLocalID, date, req.IsCompleted, req.ActualResult, req.TargetGoal, req.Notes, req.CreatedAt, req.UpdatedAt, req.DeletedAt,
		).Scan(&session.ID, &session.DeviceToken, &session.LocalID, &session.ActivityID, &session.ActivityLocalID,
			&session.Date, &session.IsCompleted, &session.ActualResult, &session.TargetGoal, &session.Notes,
			&session.CreatedAt, &session.UpdatedAt, &session.DeletedAt)
	}

	if err != nil {
		return nil, "", err
	}

	return &session, status, nil
}
