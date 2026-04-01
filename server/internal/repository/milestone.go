package repository

import (
	"context"
	"time"

	"github.com/betterlife/server/internal/model"
	"github.com/google/uuid"
)

type MilestoneRepository struct {
	db *DB
}

func NewMilestoneRepository(db *DB) *MilestoneRepository {
	return &MilestoneRepository{db: db}
}

func (r *MilestoneRepository) Create(ctx context.Context, deviceToken string, req *model.CreateMilestoneRequest) (*model.Milestone, error) {
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return nil, err
	}

	var endDate *time.Time
	if req.EndDate != nil && *req.EndDate != "" {
		t, err := time.Parse("2006-01-02", *req.EndDate)
		if err != nil {
			return nil, err
		}
		endDate = &t
	}

	createdAt := time.Now()
	if req.CreatedAt != nil {
		createdAt = *req.CreatedAt
	}
	updatedAt := createdAt
	if req.UpdatedAt != nil {
		updatedAt = *req.UpdatedAt
	}

	var milestone model.Milestone
	err = r.db.Pool.QueryRow(ctx,
		`INSERT INTO milestones (device_token, local_id, name, start_date, end_date, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, device_token, local_id, name, start_date, end_date, created_at, updated_at, deleted_at`,
		deviceToken, req.LocalID, req.Name, startDate, endDate, createdAt, updatedAt,
	).Scan(&milestone.ID, &milestone.DeviceToken, &milestone.LocalID, &milestone.Name,
		&milestone.StartDate, &milestone.EndDate, &milestone.CreatedAt, &milestone.UpdatedAt, &milestone.DeletedAt)

	if err != nil {
		return nil, err
	}

	return &milestone, nil
}

func (r *MilestoneRepository) GetAll(ctx context.Context, deviceToken string) ([]model.Milestone, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT id, device_token, local_id, name, start_date, end_date, created_at, updated_at, deleted_at
		 FROM milestones
		 WHERE device_token = $1 AND deleted_at IS NULL
		 ORDER BY start_date DESC`,
		deviceToken,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var milestones []model.Milestone
	for rows.Next() {
		var m model.Milestone
		err := rows.Scan(&m.ID, &m.DeviceToken, &m.LocalID, &m.Name,
			&m.StartDate, &m.EndDate, &m.CreatedAt, &m.UpdatedAt, &m.DeletedAt)
		if err != nil {
			return nil, err
		}
		milestones = append(milestones, m)
	}

	return milestones, nil
}

func (r *MilestoneRepository) GetByID(ctx context.Context, deviceToken string, id int64) (*model.Milestone, error) {
	var m model.Milestone
	err := r.db.Pool.QueryRow(ctx,
		`SELECT id, device_token, local_id, name, start_date, end_date, created_at, updated_at, deleted_at
		 FROM milestones
		 WHERE id = $1 AND device_token = $2 AND deleted_at IS NULL`,
		id, deviceToken,
	).Scan(&m.ID, &m.DeviceToken, &m.LocalID, &m.Name,
		&m.StartDate, &m.EndDate, &m.CreatedAt, &m.UpdatedAt, &m.DeletedAt)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (r *MilestoneRepository) GetByLocalID(ctx context.Context, deviceToken string, localID uuid.UUID) (*model.Milestone, error) {
	var m model.Milestone
	err := r.db.Pool.QueryRow(ctx,
		`SELECT id, device_token, local_id, name, start_date, end_date, created_at, updated_at, deleted_at
		 FROM milestones
		 WHERE local_id = $1 AND device_token = $2`,
		localID, deviceToken,
	).Scan(&m.ID, &m.DeviceToken, &m.LocalID, &m.Name,
		&m.StartDate, &m.EndDate, &m.CreatedAt, &m.UpdatedAt, &m.DeletedAt)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (r *MilestoneRepository) Update(ctx context.Context, deviceToken string, id int64, req *model.UpdateMilestoneRequest) (*model.Milestone, error) {
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return nil, err
	}

	var endDate *time.Time
	if req.EndDate != nil && *req.EndDate != "" {
		t, err := time.Parse("2006-01-02", *req.EndDate)
		if err != nil {
			return nil, err
		}
		endDate = &t
	}

	updatedAt := time.Now()
	if req.UpdatedAt != nil {
		updatedAt = *req.UpdatedAt
	}

	var m model.Milestone
	err = r.db.Pool.QueryRow(ctx,
		`UPDATE milestones
		 SET name = $1, start_date = $2, end_date = $3, updated_at = $4
		 WHERE id = $5 AND device_token = $6 AND deleted_at IS NULL
		 RETURNING id, device_token, local_id, name, start_date, end_date, created_at, updated_at, deleted_at`,
		req.Name, startDate, endDate, updatedAt, id, deviceToken,
	).Scan(&m.ID, &m.DeviceToken, &m.LocalID, &m.Name,
		&m.StartDate, &m.EndDate, &m.CreatedAt, &m.UpdatedAt, &m.DeletedAt)

	if err != nil {
		return nil, err
	}

	return &m, nil
}

func (r *MilestoneRepository) Delete(ctx context.Context, deviceToken string, id int64) error {
	_, err := r.db.Pool.Exec(ctx,
		`UPDATE milestones SET deleted_at = $1, updated_at = $1
		 WHERE id = $2 AND device_token = $3 AND deleted_at IS NULL`,
		time.Now(), id, deviceToken,
	)
	return err
}

func (r *MilestoneRepository) GetUpdatedSince(ctx context.Context, deviceToken string, since time.Time) ([]model.Milestone, error) {
	rows, err := r.db.Pool.Query(ctx,
		`SELECT id, device_token, local_id, name, start_date, end_date, created_at, updated_at, deleted_at
		 FROM milestones
		 WHERE device_token = $1 AND updated_at > $2
		 ORDER BY updated_at ASC`,
		deviceToken, since,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var milestones []model.Milestone
	for rows.Next() {
		var m model.Milestone
		err := rows.Scan(&m.ID, &m.DeviceToken, &m.LocalID, &m.Name,
			&m.StartDate, &m.EndDate, &m.CreatedAt, &m.UpdatedAt, &m.DeletedAt)
		if err != nil {
			return nil, err
		}
		milestones = append(milestones, m)
	}

	return milestones, nil
}

func (r *MilestoneRepository) Upsert(ctx context.Context, deviceToken string, req *model.SyncMilestone) (*model.Milestone, string, error) {
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return nil, "", err
	}

	var endDate *time.Time
	if req.EndDate != nil && *req.EndDate != "" {
		t, err := time.Parse("2006-01-02", *req.EndDate)
		if err != nil {
			return nil, "", err
		}
		endDate = &t
	}

	var milestone model.Milestone
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
			`UPDATE milestones
			 SET name = $1, start_date = $2, end_date = $3, updated_at = $4, deleted_at = $5
			 WHERE local_id = $6 AND device_token = $7
			 RETURNING id, device_token, local_id, name, start_date, end_date, created_at, updated_at, deleted_at`,
			req.Name, startDate, endDate, req.UpdatedAt, req.DeletedAt, req.LocalID, deviceToken,
		).Scan(&milestone.ID, &milestone.DeviceToken, &milestone.LocalID, &milestone.Name,
			&milestone.StartDate, &milestone.EndDate, &milestone.CreatedAt, &milestone.UpdatedAt, &milestone.DeletedAt)
	} else {
		// Create new
		status = "created"
		err = r.db.Pool.QueryRow(ctx,
			`INSERT INTO milestones (device_token, local_id, name, start_date, end_date, created_at, updated_at, deleted_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			 RETURNING id, device_token, local_id, name, start_date, end_date, created_at, updated_at, deleted_at`,
			deviceToken, req.LocalID, req.Name, startDate, endDate, req.CreatedAt, req.UpdatedAt, req.DeletedAt,
		).Scan(&milestone.ID, &milestone.DeviceToken, &milestone.LocalID, &milestone.Name,
			&milestone.StartDate, &milestone.EndDate, &milestone.CreatedAt, &milestone.UpdatedAt, &milestone.DeletedAt)
	}

	if err != nil {
		return nil, "", err
	}

	return &milestone, status, nil
}
