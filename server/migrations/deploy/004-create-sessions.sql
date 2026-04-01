-- Deploy betterlife:004-create-sessions to pg

BEGIN;

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    device_token TEXT NOT NULL REFERENCES devices(token),
    local_id UUID NOT NULL,
    activity_id INTEGER REFERENCES activities(id),
    activity_local_id UUID NOT NULL,
    date DATE NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    actual_result NUMERIC,
    target_goal NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(device_token, local_id)
);

CREATE INDEX idx_sessions_device_token ON sessions(device_token);
CREATE INDEX idx_sessions_local_id ON sessions(local_id);
CREATE INDEX idx_sessions_activity_local_id ON sessions(activity_local_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_updated_at ON sessions(updated_at);

COMMIT;
