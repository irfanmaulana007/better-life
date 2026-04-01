-- Verify betterlife:002-create-milestones on pg

BEGIN;

SELECT id, device_token, local_id, name, start_date, end_date,
       created_at, updated_at, deleted_at
FROM milestones
WHERE FALSE;

ROLLBACK;
