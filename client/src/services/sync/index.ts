import { getDatabase } from '../database';
import {
  getPendingMilestones,
  markMilestoneSynced,
} from '../database/milestones';
import {
  getPendingActivities,
  markActivitySynced,
} from '../database/activities';
import {
  getPendingSessions,
  markSessionSynced,
} from '../database/sessions';
import {
  registerDevice,
  isDeviceRegistered,
  pushChanges,
  pullChanges,
  type SyncMilestone,
  type SyncActivity,
  type SyncSession,
  type SyncPushRequest,
} from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Milestone, Activity, Session } from '@types/entities';

const LAST_SYNC_TIME_KEY = 'last_sync_time';

// Convert local entities to sync format
function milestoneToSync(m: Milestone): SyncMilestone {
  return {
    local_id: m.localId,
    name: m.name,
    start_date: m.startDate,
    end_date: m.endDate ?? null,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
    deleted_at: m.deletedAt ?? null,
  };
}

function activityToSync(a: Activity): SyncActivity {
  return {
    local_id: a.localId,
    milestone_local_id: a.milestoneLocalId,
    name: a.name,
    unit_type: a.unitType,
    unit_name: a.unitName,
    target_goal: a.targetGoal ?? null,
    schedule_days: a.scheduleDays,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
    deleted_at: a.deletedAt ?? null,
  };
}

function sessionToSync(s: Session): SyncSession {
  return {
    local_id: s.localId,
    activity_local_id: s.activityLocalId,
    date: s.date,
    is_completed: s.isCompleted,
    actual_result: s.actualResult ?? null,
    target_goal: s.targetGoal ?? null,
    notes: s.notes ?? null,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    deleted_at: s.deletedAt ?? null,
  };
}

// Get count of pending changes
export async function getPendingChangesCount(): Promise<number> {
  const [milestones, activities, sessions] = await Promise.all([
    getPendingMilestones(),
    getPendingActivities(),
    getPendingSessions(),
  ]);
  return milestones.length + activities.length + sessions.length;
}

// Ensure device is registered
export async function ensureDeviceRegistered(): Promise<string> {
  const registered = await isDeviceRegistered();
  if (!registered) {
    return await registerDevice();
  }
  const token = await AsyncStorage.getItem('device_token');
  return token || await registerDevice();
}

// Push local changes to server
export async function pushLocalChanges(): Promise<{
  success: boolean;
  pushed: { milestones: number; activities: number; sessions: number };
}> {
  // Get all pending changes
  const [pendingMilestones, pendingActivities, pendingSessions] = await Promise.all([
    getPendingMilestones(),
    getPendingActivities(),
    getPendingSessions(),
  ]);

  // If nothing to push, return success
  if (
    pendingMilestones.length === 0 &&
    pendingActivities.length === 0 &&
    pendingSessions.length === 0
  ) {
    return {
      success: true,
      pushed: { milestones: 0, activities: 0, sessions: 0 },
    };
  }

  // Prepare push request
  const pushRequest: SyncPushRequest = {};

  if (pendingMilestones.length > 0) {
    pushRequest.milestones = pendingMilestones.map(milestoneToSync);
  }
  if (pendingActivities.length > 0) {
    pushRequest.activities = pendingActivities.map(activityToSync);
  }
  if (pendingSessions.length > 0) {
    pushRequest.sessions = pendingSessions.map(sessionToSync);
  }

  // Push to server
  const result = await pushChanges(pushRequest);

  // Mark items as synced
  for (const item of result.milestones) {
    await markMilestoneSynced(item.local_id, item.server_id);
  }
  for (const item of result.activities) {
    await markActivitySynced(item.local_id, item.server_id);
  }
  for (const item of result.sessions) {
    await markSessionSynced(item.local_id, item.server_id);
  }

  return {
    success: true,
    pushed: {
      milestones: result.milestones.length,
      activities: result.activities.length,
      sessions: result.sessions.length,
    },
  };
}

// Pull changes from server and merge locally
export async function pullServerChanges(): Promise<{
  success: boolean;
  pulled: { milestones: number; activities: number; sessions: number };
}> {
  const db = getDatabase();
  const lastSyncTime = await AsyncStorage.getItem(LAST_SYNC_TIME_KEY);

  // Pull changes from server
  const result = await pullChanges(lastSyncTime ?? undefined);

  // Merge milestones
  for (const m of result.milestones) {
    const existing = await db.getFirstAsync<{ local_id: string }>(
      'SELECT local_id FROM milestones WHERE local_id = ?',
      [m.local_id]
    );

    if (existing) {
      // Update existing - server wins for conflicts
      await db.runAsync(
        `UPDATE milestones
         SET name = ?, start_date = ?, end_date = ?,
             updated_at = ?, deleted_at = ?, sync_status = 'synced'
         WHERE local_id = ?`,
        [m.name, m.start_date, m.end_date, m.updated_at, m.deleted_at, m.local_id]
      );
    } else {
      // Insert new
      await db.runAsync(
        `INSERT INTO milestones (local_id, name, start_date, end_date, sync_status, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, 'synced', ?, ?, ?)`,
        [m.local_id, m.name, m.start_date, m.end_date, m.created_at, m.updated_at, m.deleted_at]
      );
    }
  }

  // Merge activities
  for (const a of result.activities) {
    const existing = await db.getFirstAsync<{ local_id: string }>(
      'SELECT local_id FROM activities WHERE local_id = ?',
      [a.local_id]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE activities
         SET milestone_local_id = ?, name = ?, unit_type = ?, unit_name = ?,
             target_goal = ?, schedule_days = ?, updated_at = ?, deleted_at = ?, sync_status = 'synced'
         WHERE local_id = ?`,
        [
          a.milestone_local_id,
          a.name,
          a.unit_type,
          a.unit_name,
          a.target_goal,
          JSON.stringify(a.schedule_days),
          a.updated_at,
          a.deleted_at,
          a.local_id,
        ]
      );
    } else {
      await db.runAsync(
        `INSERT INTO activities (local_id, milestone_local_id, name, unit_type, unit_name, target_goal, schedule_days, sync_status, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)`,
        [
          a.local_id,
          a.milestone_local_id,
          a.name,
          a.unit_type,
          a.unit_name,
          a.target_goal,
          JSON.stringify(a.schedule_days),
          a.created_at,
          a.updated_at,
          a.deleted_at,
        ]
      );
    }
  }

  // Merge sessions
  for (const s of result.sessions) {
    const existing = await db.getFirstAsync<{ local_id: string }>(
      'SELECT local_id FROM sessions WHERE local_id = ?',
      [s.local_id]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE sessions
         SET activity_local_id = ?, date = ?, is_completed = ?, actual_result = ?,
             target_goal = ?, notes = ?, updated_at = ?, deleted_at = ?, sync_status = 'synced'
         WHERE local_id = ?`,
        [
          s.activity_local_id,
          s.date,
          s.is_completed ? 1 : 0,
          s.actual_result,
          s.target_goal,
          s.notes,
          s.updated_at,
          s.deleted_at,
          s.local_id,
        ]
      );
    } else {
      await db.runAsync(
        `INSERT INTO sessions (local_id, activity_local_id, date, is_completed, actual_result, target_goal, notes, sync_status, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)`,
        [
          s.local_id,
          s.activity_local_id,
          s.date,
          s.is_completed ? 1 : 0,
          s.actual_result,
          s.target_goal,
          s.notes,
          s.created_at,
          s.updated_at,
          s.deleted_at,
        ]
      );
    }
  }

  // Update last sync time
  await AsyncStorage.setItem(LAST_SYNC_TIME_KEY, result.synced_at);

  return {
    success: true,
    pulled: {
      milestones: result.milestones.length,
      activities: result.activities.length,
      sessions: result.sessions.length,
    },
  };
}

// Full sync: push then pull
export async function fullSync(): Promise<{
  success: boolean;
  pushed: { milestones: number; activities: number; sessions: number };
  pulled: { milestones: number; activities: number; sessions: number };
  error?: string;
}> {
  try {
    // Ensure device is registered
    await ensureDeviceRegistered();

    // Push local changes first
    const pushResult = await pushLocalChanges();

    // Then pull server changes
    const pullResult = await pullServerChanges();

    return {
      success: true,
      pushed: pushResult.pushed,
      pulled: pullResult.pulled,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    console.error('Sync failed:', error);
    return {
      success: false,
      pushed: { milestones: 0, activities: 0, sessions: 0 },
      pulled: { milestones: 0, activities: 0, sessions: 0 },
      error: message,
    };
  }
}

// Get last sync time
export async function getLastSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNC_TIME_KEY);
}
