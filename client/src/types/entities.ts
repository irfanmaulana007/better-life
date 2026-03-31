// Sync status for offline-first functionality
export type SyncStatus = 'pending' | 'synced' | 'conflict';

// Unit types for activities
export type UnitType = 'distance' | 'time' | 'reps' | 'counter';

// Days of the week (0 = Sunday, 6 = Saturday)
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Base entity with common fields
export interface BaseEntity {
  localId: string;
  serverId?: number;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Milestone entity
export interface Milestone extends BaseEntity {
  name: string;
  startDate: string;
  endDate?: string;
}

// Activity entity
export interface Activity extends BaseEntity {
  milestoneLocalId: string;
  name: string;
  unitType: UnitType;
  unitName: string;
  targetGoal?: number;
  scheduleDays: DayOfWeek[];
}

// Session entity (daily activity log)
export interface Session extends BaseEntity {
  activityLocalId: string;
  date: string;
  isCompleted: boolean;
  actualResult?: number;
  targetGoal?: number;
  notes?: string;
}

// DTOs for creating entities (without auto-generated fields)
export interface CreateMilestoneDTO {
  name: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateMilestoneDTO {
  name?: string;
  startDate?: string;
  endDate?: string | null;
}

export interface CreateActivityDTO {
  milestoneLocalId: string;
  name: string;
  unitType: UnitType;
  unitName: string;
  targetGoal?: number;
  scheduleDays: DayOfWeek[];
}

export interface UpdateActivityDTO {
  name?: string;
  unitType?: UnitType;
  unitName?: string;
  targetGoal?: number | null;
  scheduleDays?: DayOfWeek[];
}

export interface CreateSessionDTO {
  activityLocalId: string;
  date: string;
  isCompleted?: boolean;
  actualResult?: number;
  targetGoal?: number;
  notes?: string;
}

export interface UpdateSessionDTO {
  isCompleted?: boolean;
  actualResult?: number | null;
  targetGoal?: number | null;
  notes?: string | null;
}
