-- Deploy betterlife:001-create-devices to pg

BEGIN;

CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_devices_token ON devices(token);

COMMIT;
