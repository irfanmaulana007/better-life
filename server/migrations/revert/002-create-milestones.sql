-- Revert betterlife:002-create-milestones from pg

BEGIN;

DROP TABLE IF EXISTS milestones;

COMMIT;
