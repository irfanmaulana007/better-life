package repository

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/betterlife/server/internal/model"
)

type DeviceRepository struct {
	db *DB
}

func NewDeviceRepository(db *DB) *DeviceRepository {
	return &DeviceRepository{db: db}
}

func generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (r *DeviceRepository) Create(ctx context.Context) (*model.Device, error) {
	token, err := generateToken()
	if err != nil {
		return nil, err
	}

	var device model.Device
	err = r.db.Pool.QueryRow(ctx,
		`INSERT INTO devices (token, created_at)
		 VALUES ($1, $2)
		 RETURNING id, token, created_at`,
		token, time.Now(),
	).Scan(&device.ID, &device.Token, &device.CreatedAt)

	if err != nil {
		return nil, err
	}

	return &device, nil
}

func (r *DeviceRepository) GetByToken(ctx context.Context, token string) (*model.Device, error) {
	var device model.Device
	err := r.db.Pool.QueryRow(ctx,
		`SELECT id, token, created_at FROM devices WHERE token = $1`,
		token,
	).Scan(&device.ID, &device.Token, &device.CreatedAt)

	if err != nil {
		return nil, err
	}

	return &device, nil
}

func (r *DeviceRepository) Exists(ctx context.Context, token string) (bool, error) {
	var exists bool
	err := r.db.Pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM devices WHERE token = $1)`,
		token,
	).Scan(&exists)

	return exists, err
}
