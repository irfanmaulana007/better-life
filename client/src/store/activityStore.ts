import { create } from 'zustand';
import type { Activity, CreateActivityDTO, UpdateActivityDTO, DayOfWeek } from '@types/entities';
import {
  createActivity,
  getAllActivities,
  getActivitiesByMilestone,
  getActivityById,
  getActivitiesByScheduleDay,
  getTodayActivities,
  updateActivity,
  deleteActivity,
} from '@services/database/activities';

interface ActivityStore {
  activities: Activity[];
  todayActivities: Activity[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAllActivities: () => Promise<void>;
  fetchActivitiesByMilestone: (milestoneLocalId: string) => Promise<void>;
  fetchTodayActivities: () => Promise<void>;
  fetchActivitiesByScheduleDay: (dayOfWeek: DayOfWeek) => Promise<void>;
  fetchActivityById: (localId: string) => Promise<Activity | null>;
  addActivity: (data: CreateActivityDTO) => Promise<Activity>;
  editActivity: (localId: string, data: UpdateActivityDTO) => Promise<Activity | null>;
  removeActivity: (localId: string) => Promise<boolean>;
  clearActivities: () => void;
  clearError: () => void;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  todayActivities: [],
  isLoading: false,
  error: null,

  fetchAllActivities: async () => {
    set({ isLoading: true, error: null });
    try {
      const activities = await getAllActivities();
      set({ activities, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch activities',
        isLoading: false,
      });
    }
  },

  fetchActivitiesByMilestone: async (milestoneLocalId: string) => {
    set({ isLoading: true, error: null });
    try {
      const activities = await getActivitiesByMilestone(milestoneLocalId);
      set({ activities, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch activities',
        isLoading: false,
      });
    }
  },

  fetchTodayActivities: async () => {
    set({ isLoading: true, error: null });
    try {
      const todayActivities = await getTodayActivities();
      set({ todayActivities, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch today's activities",
        isLoading: false,
      });
    }
  },

  fetchActivitiesByScheduleDay: async (dayOfWeek: DayOfWeek) => {
    set({ isLoading: true, error: null });
    try {
      const activities = await getActivitiesByScheduleDay(dayOfWeek);
      set({ activities, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch activities',
        isLoading: false,
      });
    }
  },

  fetchActivityById: async (localId: string) => {
    try {
      return await getActivityById(localId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch activity',
      });
      return null;
    }
  },

  addActivity: async (data: CreateActivityDTO) => {
    set({ isLoading: true, error: null });
    try {
      const activity = await createActivity(data);
      // Refresh activities list
      await get().fetchActivitiesByMilestone(data.milestoneLocalId);
      await get().fetchTodayActivities();
      return activity;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create activity',
        isLoading: false,
      });
      throw error;
    }
  },

  editActivity: async (localId: string, data: UpdateActivityDTO) => {
    set({ isLoading: true, error: null });
    try {
      const activity = await updateActivity(localId, data);
      // Refresh today's activities
      await get().fetchTodayActivities();
      return activity;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update activity',
        isLoading: false,
      });
      throw error;
    }
  },

  removeActivity: async (localId: string) => {
    set({ isLoading: true, error: null });
    try {
      const success = await deleteActivity(localId);
      if (success) {
        // Remove from local state
        set(state => ({
          activities: state.activities.filter(a => a.localId !== localId),
          todayActivities: state.todayActivities.filter(a => a.localId !== localId),
          isLoading: false,
        }));
      }
      return success;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete activity',
        isLoading: false,
      });
      throw error;
    }
  },

  clearActivities: () => {
    set({ activities: [], todayActivities: [] });
  },

  clearError: () => {
    set({ error: null });
  },
}));
