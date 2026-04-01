-- Verify betterlife:003-create-activities on pg

BEGIN;

SELECT id, device_token, local_id, milestone_id, milestone_local_id,
       name, unit_type, unit_name, target_goal, schedule_days,
       created_at, updated_at, deleted_at
FROM activities
WHERE FALSE;

ROLLBACK;
