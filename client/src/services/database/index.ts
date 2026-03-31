import * as SQLite from 'expo-sqlite';
import { runMigrations, CURRENT_VERSION } from './migrations';

const DATABASE_NAME = 'betterlife.db';

let db: SQLite.SQLiteDatabase | null = null;

// Initialize the database
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Run migrations
  await runMigrations(db);

  console.log(`Database initialized with version ${CURRENT_VERSION}`);

  return db;
}

// Get the database instance
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Close the database
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

// Export database utilities
export { db };
