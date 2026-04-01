-- Revert betterlife:004-create-sessions from pg

BEGIN;

DROP TABLE IF EXISTS sessions;

COMMIT;
