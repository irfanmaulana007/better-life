-- Revert betterlife:001-create-devices from pg

BEGIN;

DROP TABLE IF EXISTS devices;

COMMIT;
