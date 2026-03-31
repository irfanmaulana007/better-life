import type { SQLiteDatabase } from 'expo-sqlite';

export const CURRENT_VERSION = 1;

interface Migration {
  version: number;
  up: string[];
  description: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    description: 'Initial schema - milestones, activities, sessions',
    up: [
      // Milestones table
      `CREATE TABLE IF NOT EXISTS milestones (
        local_id TEXT PRIMARY KEY,
        server_id INTEGER,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        deleted_at TEXT
      );`,

      // Activities table
      `CREATE TABLE IF NOT EXISTS activities (
        local_id TEXT PRIMARY KEY,
        server_id INTEGER,
        milestone_local_id TEXT NOT NULL,
        name TEXT NOT NULL,
        unit_type TEXT NOT NULL,
        unit_name TEXT NOT NULL,
        target_goal REAL,
        schedule_days TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        deleted_at TEXT,
        FOREIGN KEY (milestone_local_id) REFERENCES milestones(local_id)
      );`,

      // Sessions table
      `CREATE TABLE IF NOT EXISTS sessions (
        local_id TEXT PRIMARY KEY,
        server_id INTEGER,
        activity_local_id TEXT NOT NULL,
        date TEXT NOT NULL,
        is_completed INTEGER NOT NULL DEFAULT 0,
        actual_result REAL,
        target_goal REAL,
        notes TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        deleted_at TEXT,
        FOREIGN KEY (activity_local_id) REFERENCES activities(local_id)
      );`,

      // Indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_milestones_deleted_at ON milestones(deleted_at);`,
      `CREATE INDEX IF NOT EXISTS idx_milestones_sync_status ON milestones(sync_status);`,
      `CREATE INDEX IF NOT EXISTS idx_activities_milestone ON activities(milestone_local_id);`,
      `CREATE INDEX IF NOT EXISTS idx_activities_deleted_at ON activities(deleted_at);`,
      `CREATE INDEX IF NOT EXISTS idx_activities_sync_status ON activities(sync_status);`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_activity ON sessions(activity_local_id);`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at ON sessions(deleted_at);`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_sync_status ON sessions(sync_status);`,
    ],
  },
];

// Get current database version
async function getDatabaseVersion(db: SQLiteDatabase): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version;'
    );
    return result?.user_version ?? 0;
  } catch {
    return 0;
  }
}

// Set database version
async function setDatabaseVersion(
  db: SQLiteDatabase,
  version: number
): Promise<void> {
  await db.execAsync(`PRAGMA user_version = ${version};`);
}

// Run migrations
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const currentVersion = await getDatabaseVersion(db);

  if (currentVersion >= CURRENT_VERSION) {
    console.log(`Database is up to date (version ${currentVersion})`);
    return;
  }

  console.log(
    `Migrating database from version ${currentVersion} to ${CURRENT_VERSION}`
  );

  // Run each migration that hasn't been applied yet
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(
        `Running migration ${migration.version}: ${migration.description}`
      );

      // Run all statements in the migration
      for (const sql of migration.up) {
        await db.execAsync(sql);
      }

      // Update version after each successful migration
      await setDatabaseVersion(db, migration.version);
    }
  }

  console.log(`Database migrated to version ${CURRENT_VERSION}`);
}
