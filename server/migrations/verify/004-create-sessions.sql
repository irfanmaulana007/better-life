-- Verify betterlife:004-create-sessions on pg

BEGIN;

SELECT id, device_token, local_id, activity_id, activity_local_id,
       date, is_completed, actual_result, target_goal, notes,
       created_at, updated_at, deleted_at
FROM sessions
WHERE FALSE;

ROLLBACK;
