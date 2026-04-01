-- Deploy betterlife:002-create-milestones to pg

BEGIN;

CREATE TABLE milestones (
    id SERIAL PRIMARY KEY,
    device_token TEXT NOT NULL REFERENCES devices(token),
    local_id UUID NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(device_token, local_id)
);

CREATE INDEX idx_milestones_device_token ON milestones(device_token);
CREATE INDEX idx_milestones_local_id ON milestones(local_id);
CREATE INDEX idx_milestones_updated_at ON milestones(updated_at);

COMMIT;
