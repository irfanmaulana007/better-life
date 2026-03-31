import { create } from 'zustand';
import type { Session, CreateSessionDTO, UpdateSessionDTO } from '@types/entities';
import {
  createSession,
  getSessionsByDate,
  getSessionsByActivity,
  getSessionsByDateRange,
  getSessionById,
  getSessionByActivityAndDate,
  updateSession,
  deleteSession,
  getTodaySessions,
  calculateStreak,
  getDateCompletionStats,
} from '@services/database/sessions';

interface SessionStore {
  sessions: Session[];
  todaySessions: Session[];
  currentStreak: number;
  completionStats: { completed: number; total: number };
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSessionsByDate: (date: string) => Promise<void>;
  fetchTodaySessions: () => Promise<void>;
  fetchSessionsByActivity: (activityLocalId: string) => Promise<void>;
  fetchSessionsByDateRange: (startDate: string, endDate: string) => Promise<void>;
  fetchSessionById: (localId: string) => Promise<Session | null>;
  getSessionForActivityOnDate: (activityLocalId: string, date: string) => Promise<Session | null>;
  fetchStreak: () => Promise<void>;
  fetchCompletionStats: (date: string) => Promise<void>;
  addSession: (data: CreateSessionDTO) => Promise<Session>;
  editSession: (localId: string, data: UpdateSessionDTO) => Promise<Session | null>;
  removeSession: (localId: string) => Promise<boolean>;
  clearSessions: () => void;
  clearError: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  todaySessions: [],
  currentStreak: 0,
  completionStats: { completed: 0, total: 0 },
  isLoading: false,
  error: null,

  fetchSessionsByDate: async (date: string) => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await getSessionsByDate(date);
      set({ sessions, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch sessions',
        isLoading: false,
      });
    }
  },

  fetchTodaySessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const todaySessions = await getTodaySessions();
      set({ todaySessions, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch today's sessions",
        isLoading: false,
      });
    }
  },

  fetchSessionsByActivity: async (activityLocalId: string) => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await getSessionsByActivity(activityLocalId);
      set({ sessions, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch sessions',
        isLoading: false,
      });
    }
  },

  fetchSessionsByDateRange: async (startDate: string, endDate: string) => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await getSessionsByDateRange(startDate, endDate);
      set({ sessions, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch sessions',
        isLoading: false,
      });
    }
  },

  fetchSessionById: async (localId: string) => {
    try {
      return await getSessionById(localId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch session',
      });
      return null;
    }
  },

  getSessionForActivityOnDate: async (activityLocalId: string, date: string) => {
    try {
      return await getSessionByActivityAndDate(activityLocalId, date);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch session',
      });
      return null;
    }
  },

  fetchStreak: async () => {
    try {
      const currentStreak = await calculateStreak();
      set({ currentStreak });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch streak',
      });
    }
  },

  fetchCompletionStats: async (date: string) => {
    try {
      const completionStats = await getDateCompletionStats(date);
      set({ completionStats });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch completion stats',
      });
    }
  },

  addSession: async (data: CreateSessionDTO) => {
    set({ isLoading: true, error: null });
    try {
      const session = await createSession(data);
      // Refresh today's sessions, streak, and completion stats
      await get().fetchTodaySessions();
      await get().fetchStreak();
      await get().fetchCompletionStats(data.date);
      set({ isLoading: false });
      return session;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create session',
        isLoading: false,
      });
      throw error;
    }
  },

  editSession: async (localId: string, data: UpdateSessionDTO) => {
    set({ isLoading: true, error: null });
    try {
      const session = await updateSession(localId, data);
      // Refresh today's sessions
      await get().fetchTodaySessions();
      return session;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update session',
        isLoading: false,
      });
      throw error;
    }
  },

  removeSession: async (localId: string) => {
    set({ isLoading: true, error: null });
    try {
      const success = await deleteSession(localId);
      if (success) {
        // Remove from local state
        set(state => ({
          sessions: state.sessions.filter(s => s.localId !== localId),
          todaySessions: state.todaySessions.filter(s => s.localId !== localId),
          isLoading: false,
        }));
      }
      return success;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete session',
        isLoading: false,
      });
      throw error;
    }
  },

  clearSessions: () => {
    set({ sessions: [], todaySessions: [] });
  },

  clearError: () => {
    set({ error: null });
  },
}));
