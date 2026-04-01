-- Revert betterlife:003-create-activities from pg

BEGIN;

DROP TABLE IF EXISTS activities;

COMMIT;
