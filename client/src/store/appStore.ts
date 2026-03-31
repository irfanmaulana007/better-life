import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SELECTED_MILESTONE: 'selected_milestone_id',
  LAST_SYNC_TIME: 'last_sync_time',
  DEVICE_TOKEN: 'device_token',
};

interface AppStore {
  selectedMilestoneId: string | null;
  lastSyncTime: string | null;
  deviceToken: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setSelectedMilestoneId: (id: string | null) => Promise<void>;
  setLastSyncTime: (time: string) => Promise<void>;
  setDeviceToken: (token: string) => Promise<void>;
}

export const useAppStore = create<AppStore>((set) => ({
  selectedMilestoneId: null,
  lastSyncTime: null,
  deviceToken: null,
  isInitialized: false,

  initialize: async () => {
    try {
      const [selectedMilestoneId, lastSyncTime, deviceToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_MILESTONE),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME),
        AsyncStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN),
      ]);

      set({
        selectedMilestoneId,
        lastSyncTime,
        deviceToken,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize app store:', error);
      set({ isInitialized: true });
    }
  },

  setSelectedMilestoneId: async (id: string | null) => {
    try {
      if (id) {
        await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_MILESTONE, id);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_MILESTONE);
      }
      set({ selectedMilestoneId: id });
    } catch (error) {
      console.error('Failed to save selected milestone:', error);
    }
  },

  setLastSyncTime: async (time: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, time);
      set({ lastSyncTime: time });
    } catch (error) {
      console.error('Failed to save last sync time:', error);
    }
  },

  setDeviceToken: async (token: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, token);
      set({ deviceToken: token });
    } catch (error) {
      console.error('Failed to save device token:', error);
    }
  },
}));
