import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './index';
import type {
  Activity,
  CreateActivityDTO,
  UpdateActivityDTO,
  DayOfWeek,
} from '@types/entities';

// Row type from database
interface ActivityRow {
  local_id: string;
  server_id: number | null;
  milestone_local_id: string;
  name: string;
  unit_type: string;
  unit_name: string;
  target_goal: number | null;
  schedule_days: string;
  sync_status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Convert database row to entity
function rowToActivity(row: ActivityRow): Activity {
  return {
    localId: row.local_id,
    serverId: row.server_id ?? undefined,
    milestoneLocalId: row.milestone_local_id,
    name: row.name,
    unitType: row.unit_type as Activity['unitType'],
    unitName: row.unit_name,
    targetGoal: row.target_goal ?? undefined,
    scheduleDays: JSON.parse(row.schedule_days) as DayOfWeek[],
    syncStatus: row.sync_status as Activity['syncStatus'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

// Create a new activity
export async function createActivity(
  data: CreateActivityDTO
): Promise<Activity> {
  const db = getDatabase();
  const localId = uuidv4();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO activities (local_id, milestone_local_id, name, unit_type, unit_name, target_goal, schedule_days, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      localId,
      data.milestoneLocalId,
      data.name,
      data.unitType,
      data.unitName,
      data.targetGoal ?? null,
      JSON.stringify(data.scheduleDays),
      now,
      now,
    ]
  );

  const activity = await getActivityById(localId);
  if (!activity) {
    throw new Error('Failed to create activity');
  }

  return activity;
}

// Get activity by ID
export async function getActivityById(
  localId: string
): Promise<Activity | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<ActivityRow>(
    `SELECT * FROM activities WHERE local_id = ? AND deleted_at IS NULL`,
    [localId]
  );
  return row ? rowToActivity(row) : null;
}

// Get activities by milestone
export async function getActivitiesByMilestone(
  milestoneLocalId: string
): Promise<Activity[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<ActivityRow>(
    `SELECT * FROM activities WHERE milestone_local_id = ? AND deleted_at IS NULL ORDER BY name`,
    [milestoneLocalId]
  );
  return rows.map(rowToActivity);
}

// Get activities scheduled for a specific day
export async function getActivitiesByScheduleDay(
  dayOfWeek: DayOfWeek
): Promise<Activity[]> {
  const db = getDatabase();
  // Query all non-deleted activities and filter by schedule_days in code
  const rows = await db.getAllAsync<ActivityRow>(
    `SELECT * FROM activities WHERE deleted_at IS NULL`
  );

  return rows
    .map(rowToActivity)
    .filter(activity => activity.scheduleDays.includes(dayOfWeek));
}

// Get all activities for today (based on current day of week)
export async function getTodayActivities(): Promise<Activity[]> {
  const today = new Date().getDay() as DayOfWeek;
  return getActivitiesByScheduleDay(today);
}

// Update an activity
export async function updateActivity(
  localId: string,
  data: UpdateActivityDTO
): Promise<Activity | null> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.unitType !== undefined) {
    updates.push('unit_type = ?');
    values.push(data.unitType);
  }
  if (data.unitName !== undefined) {
    updates.push('unit_name = ?');
    values.push(data.unitName);
  }
  if (data.targetGoal !== undefined) {
    updates.push('target_goal = ?');
    values.push(data.targetGoal);
  }
  if (data.scheduleDays !== undefined) {
    updates.push('schedule_days = ?');
    values.push(JSON.stringify(data.scheduleDays));
  }

  if (updates.length === 0) {
    return getActivityById(localId);
  }

  updates.push("sync_status = 'pending'");
  updates.push('updated_at = ?');
  values.push(now, localId);

  await db.runAsync(
    `UPDATE activities SET ${updates.join(', ')} WHERE local_id = ? AND deleted_at IS NULL`,
    values
  );

  return getActivityById(localId);
}

// Soft delete an activity
export async function deleteActivity(localId: string): Promise<boolean> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `UPDATE activities SET deleted_at = ?, sync_status = 'pending', updated_at = ? WHERE local_id = ? AND deleted_at IS NULL`,
    [now, now, localId]
  );

  return result.changes > 0;
}

// Get activities with pending sync status
export async function getPendingActivities(): Promise<Activity[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<ActivityRow>(
    `SELECT * FROM activities WHERE sync_status = 'pending'`
  );
  return rows.map(rowToActivity);
}

// Mark activity as synced
export async function markActivitySynced(
  localId: string,
  serverId: number
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `UPDATE activities SET server_id = ?, sync_status = 'synced' WHERE local_id = ?`,
    [serverId, localId]
  );
}
