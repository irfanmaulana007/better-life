import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './index';
import type {
  Milestone,
  CreateMilestoneDTO,
  UpdateMilestoneDTO,
} from '@types/entities';

// Row type from database
interface MilestoneRow {
  local_id: string;
  server_id: number | null;
  name: string;
  start_date: string;
  end_date: string | null;
  sync_status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Convert database row to entity
function rowToMilestone(row: MilestoneRow): Milestone {
  return {
    localId: row.local_id,
    serverId: row.server_id ?? undefined,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    syncStatus: row.sync_status as Milestone['syncStatus'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

// Create a new milestone
export async function createMilestone(
  data: CreateMilestoneDTO
): Promise<Milestone> {
  const db = getDatabase();
  const localId = uuidv4();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO milestones (local_id, name, start_date, end_date, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    [localId, data.name, data.startDate, data.endDate ?? null, now, now]
  );

  const milestone = await getMilestoneById(localId);
  if (!milestone) {
    throw new Error('Failed to create milestone');
  }

  return milestone;
}

// Get all milestones (excluding soft-deleted)
export async function getMilestones(): Promise<Milestone[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<MilestoneRow>(
    `SELECT * FROM milestones WHERE deleted_at IS NULL ORDER BY start_date DESC`
  );
  return rows.map(rowToMilestone);
}

// Get milestone by ID
export async function getMilestoneById(
  localId: string
): Promise<Milestone | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<MilestoneRow>(
    `SELECT * FROM milestones WHERE local_id = ? AND deleted_at IS NULL`,
    [localId]
  );
  return row ? rowToMilestone(row) : null;
}

// Update a milestone
export async function updateMilestone(
  localId: string,
  data: UpdateMilestoneDTO
): Promise<Milestone | null> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.startDate !== undefined) {
    updates.push('start_date = ?');
    values.push(data.startDate);
  }
  if (data.endDate !== undefined) {
    updates.push('end_date = ?');
    values.push(data.endDate);
  }

  if (updates.length === 0) {
    return getMilestoneById(localId);
  }

  updates.push("sync_status = 'pending'");
  updates.push('updated_at = ?');
  values.push(now, localId);

  await db.runAsync(
    `UPDATE milestones SET ${updates.join(', ')} WHERE local_id = ? AND deleted_at IS NULL`,
    values
  );

  return getMilestoneById(localId);
}

// Soft delete a milestone
export async function deleteMilestone(localId: string): Promise<boolean> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const result = await db.runAsync(
    `UPDATE milestones SET deleted_at = ?, sync_status = 'pending', updated_at = ? WHERE local_id = ? AND deleted_at IS NULL`,
    [now, now, localId]
  );

  return result.changes > 0;
}

// Get count of activities for a milestone
export async function getActivitiesCountByMilestone(
  milestoneLocalId: string
): Promise<number> {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM activities WHERE milestone_local_id = ? AND deleted_at IS NULL`,
    [milestoneLocalId]
  );
  return result?.count ?? 0;
}

// Get milestones with pending sync status
export async function getPendingMilestones(): Promise<Milestone[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<MilestoneRow>(
    `SELECT * FROM milestones WHERE sync_status = 'pending'`
  );
  return rows.map(rowToMilestone);
}

// Mark milestone as synced
export async function markMilestoneSynced(
  localId: string,
  serverId: number
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `UPDATE milestones SET server_id = ?, sync_status = 'synced' WHERE local_id = ?`,
    [serverId, localId]
  );
}
