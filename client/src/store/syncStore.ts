import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

type SyncState = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncStore {
  syncState: SyncState;
  isOnline: boolean;
  lastSyncTime: string | null;
  error: string | null;
  pendingChangesCount: number;

  // Actions
  initializeNetworkListener: () => () => void;
  setSyncState: (state: SyncState) => void;
  setLastSyncTime: (time: string) => void;
  setSyncError: (error: string | null) => void;
  setPendingChangesCount: (count: number) => void;
  startSync: () => void;
  endSync: (success: boolean, error?: string) => void;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  syncState: 'idle',
  isOnline: true,
  lastSyncTime: null,
  error: null,
  pendingChangesCount: 0,

  initializeNetworkListener: () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOnline = state.isConnected ?? false;
      set({ isOnline });

      if (!isOnline) {
        set({ syncState: 'offline' });
      } else if (get().syncState === 'offline') {
        set({ syncState: 'idle' });
      }
    });

    return unsubscribe;
  },

  setSyncState: (syncState: SyncState) => {
    set({ syncState });
  },

  setLastSyncTime: (lastSyncTime: string) => {
    set({ lastSyncTime });
  },

  setSyncError: (error: string | null) => {
    set({ error, syncState: error ? 'error' : 'idle' });
  },

  setPendingChangesCount: (pendingChangesCount: number) => {
    set({ pendingChangesCount });
  },

  startSync: () => {
    const { isOnline } = get();
    if (!isOnline) {
      set({ syncState: 'offline' });
      return;
    }
    set({ syncState: 'syncing', error: null });
  },

  endSync: (success: boolean, error?: string) => {
    if (success) {
      set({
        syncState: 'idle',
        lastSyncTime: new Date().toISOString(),
        error: null,
      });
    } else {
      set({
        syncState: 'error',
        error: error || 'Sync failed',
      });
    }
  },
}));
