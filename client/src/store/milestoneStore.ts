import { create } from 'zustand';
import type { Milestone, CreateMilestoneDTO, UpdateMilestoneDTO } from '@types/entities';
import {
  createMilestone,
  getMilestones,
  getMilestoneById,
  updateMilestone,
  deleteMilestone,
  getActivitiesCountByMilestone,
} from '@services/database/milestones';

interface MilestoneWithCount extends Milestone {
  activitiesCount: number;
}

interface MilestoneStore {
  milestones: MilestoneWithCount[];
  selectedMilestone: Milestone | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMilestones: () => Promise<void>;
  fetchMilestoneById: (localId: string) => Promise<Milestone | null>;
  addMilestone: (data: CreateMilestoneDTO) => Promise<Milestone>;
  editMilestone: (localId: string, data: UpdateMilestoneDTO) => Promise<Milestone | null>;
  removeMilestone: (localId: string) => Promise<boolean>;
  selectMilestone: (milestone: Milestone | null) => void;
  clearError: () => void;
}

export const useMilestoneStore = create<MilestoneStore>((set, get) => ({
  milestones: [],
  selectedMilestone: null,
  isLoading: false,
  error: null,

  fetchMilestones: async () => {
    set({ isLoading: true, error: null });
    try {
      const milestones = await getMilestones();
      const milestonesWithCount: MilestoneWithCount[] = await Promise.all(
        milestones.map(async milestone => ({
          ...milestone,
          activitiesCount: await getActivitiesCountByMilestone(milestone.localId),
        }))
      );
      set({ milestones: milestonesWithCount, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch milestones',
        isLoading: false,
      });
    }
  },

  fetchMilestoneById: async (localId: string) => {
    try {
      return await getMilestoneById(localId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch milestone',
      });
      return null;
    }
  },

  addMilestone: async (data: CreateMilestoneDTO) => {
    set({ isLoading: true, error: null });
    try {
      const milestone = await createMilestone(data);
      await get().fetchMilestones(); // Refresh the list
      return milestone;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create milestone',
        isLoading: false,
      });
      throw error;
    }
  },

  editMilestone: async (localId: string, data: UpdateMilestoneDTO) => {
    set({ isLoading: true, error: null });
    try {
      const milestone = await updateMilestone(localId, data);
      await get().fetchMilestones(); // Refresh the list
      return milestone;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update milestone',
        isLoading: false,
      });
      throw error;
    }
  },

  removeMilestone: async (localId: string) => {
    set({ isLoading: true, error: null });
    try {
      const success = await deleteMilestone(localId);
      if (success) {
        await get().fetchMilestones(); // Refresh the list
        // Clear selection if deleted milestone was selected
        const { selectedMilestone } = get();
        if (selectedMilestone?.localId === localId) {
          set({ selectedMilestone: null });
        }
      }
      return success;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete milestone',
        isLoading: false,
      });
      throw error;
    }
  },

  selectMilestone: (milestone: Milestone | null) => {
    set({ selectedMilestone: milestone });
  },

  clearError: () => {
    set({ error: null });
  },
}));
