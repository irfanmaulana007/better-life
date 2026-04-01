-- Verify betterlife:001-create-devices on pg

BEGIN;

SELECT id, token, created_at
FROM devices
WHERE FALSE;

ROLLBACK;
