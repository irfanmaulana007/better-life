-- Deploy betterlife:003-create-activities to pg

BEGIN;

CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    device_token TEXT NOT NULL REFERENCES devices(token),
    local_id UUID NOT NULL,
    milestone_id INTEGER REFERENCES milestones(id),
    milestone_local_id UUID NOT NULL,
    name TEXT NOT NULL,
    unit_type TEXT NOT NULL,
    unit_name TEXT NOT NULL,
    target_goal NUMERIC,
    schedule_days INTEGER[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(device_token, local_id)
);

CREATE INDEX idx_activities_device_token ON activities(device_token);
CREATE INDEX idx_activities_local_id ON activities(local_id);
CREATE INDEX idx_activities_milestone_local_id ON activities(milestone_local_id);
CREATE INDEX idx_activities_updated_at ON activities(updated_at);

COMMIT;
