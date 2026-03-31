import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './index';
import type { Session, CreateSessionDTO, UpdateSessionDTO } from '@types/entities';

// Row type from database
interface SessionRow {
  local_id: string;
  server_id: number | null;
  activity_local_id: string;
  date: string;
  is_completed: number;
  actual_result: number | null;
  target_goal: number | null;
  notes: string | null;
  sync_status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Convert database row to entity
function rowToSession(row: SessionRow): Session {
  return {
    localId: row.local_id,
    serverId: row.server_id ?? undefined,
    activityLocalId: row.activity_local_id,
    date: row.date,
    isCompleted: row.is_completed === 1,
    actualResult: row.actual_result ?? undefined,
    targetGoal: row.target_goal ?? undefined,
    notes: row.notes ?? undefined,
    syncStatus: row.sync_status as Session['syncStatus'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

// Create a new session
export async function createSession(data: CreateSessionDTO): Promise<Session> {
  const db = getDatabase();
  const localId = uuidv4();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO sessions (local_id, activity_local_id, date, is_completed, actual_result, target_goal, notes, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      localId,
      data.activityLocalId,
      data.date,
      data.isCompleted ? 1 : 0,
      data.actualResult ?? null,
      data.targetGoal ?? null,
      data.notes ?? null,
      now,
      now,
    ]
  );

  const session = await getSessionById(localId);
  if (!session) {
    throw new Error('Failed to create session');
  }

  return session;
}

// Get session by ID
export async function getSessionById(localId: string): Promise<Session | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<SessionRow>(
    `SELECT * FROM sessions WHERE local_id = ? AND deleted_at IS NULL`,
    [localId]
  );
  return row ? rowToSession(row) : null;
}

// Get sessions by date
export async function getSessionsByDate(date: string): Promise<Session[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM sessions WHERE date = ? AND deleted_at IS NULL ORDER BY created_at`,
    [date]
  );
  return rows.map(rowToSession);
}

// Get sessions by activity
export async function getSessionsByActivity(
  activityLocalId: string
): Promise<Session[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM sessions WHERE activity_local_id = ? AND deleted_at IS NULL ORDER BY date DESC`,
    [activityLocalId]
  );
  return rows.map(rowToSession);
}

// Get sessions by date range
export async function getSessionsByDateRange(
  startDate: string,
  endDate: string
): Promise<Session[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM sessions WHERE date >= ? AND date <= ? AND deleted_at IS NULL ORDER BY date DESC`,
    [startDate, endDate]
  );
  return rows.map(rowToSession);
}

// Get session for a specific activity and date
export async function getSessionByActivityAndDate(
  activityLocalId: string,
  date: string
): Promise<Session | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<SessionRow>(
    `SELECT * FROM sessions WHERE activity_local_id = ? AND date = ? AND deleted_at IS NULL`,
    [activityLocalId, date]
  );
  return row ? rowToSession(row) : null;
}

// Update a session
export async function updateSession(
  localId: string,
  data: UpdateSessionDTO
): Promise<Session | null> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.isCompleted !== undefined) {
    updates.push('is_completed = ?');
    values.push(data.isCompleted ? 1 : 0);
  }
  if (data.actualResult !== undefined) {
    updates.push('actual_result = ?');
    values.push(data.actualResult);
  }
  if (data.targetGoal !== undefined) {
    updates.push('target_goal = ?');
    values.push(data.targetGoal);
  }
  if (data.notes !== undefined) {
    updates.push('notes = ?');
    values.push(data.notes);
  }

  if (updates.length === 0) {
    return getSessionById(localId);
  }

  updates.push("sync_status = 'pending'");
  updates.push('updated_at = ?');
  values.push(now, localId);

  await db.runAsync(
    `UPDATE sessions SET ${updates.join(', ')} WHERE local_id = ? AND deleted_at IS NULL`,
    values
  );

  return getSessionById(localId);
}

// Soft delete a session
export async function deleteSession(localId: string): Promise<boolean> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `UPDATE sessions SET deleted_at = ?, sync_status = 'pending', updated_at = ? WHERE local_id = ? AND deleted_at IS NULL`,
    [now, now, localId]
  );

  return result.changes > 0;
}

// Get sessions with pending sync status
export async function getPendingSessions(): Promise<Session[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM sessions WHERE sync_status = 'pending'`
  );
  return rows.map(rowToSession);
}

// Mark session as synced
export async function markSessionSynced(
  localId: string,
  serverId: number
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `UPDATE sessions SET server_id = ?, sync_status = 'synced' WHERE local_id = ?`,
    [serverId, localId]
  );
}

// Get today's sessions
export async function getTodaySessions(): Promise<Session[]> {
  const today = new Date().toISOString().split('T')[0];
  return getSessionsByDate(today);
}

// Check if a session exists for an activity on a specific date
export async function sessionExists(
  activityLocalId: string,
  date: string
): Promise<boolean> {
  const session = await getSessionByActivityAndDate(activityLocalId, date);
  return session !== null;
}
