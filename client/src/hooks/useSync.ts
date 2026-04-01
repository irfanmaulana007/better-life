import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSyncStore } from '@store';
import {
  fullSync,
  getPendingChangesCount,
  ensureDeviceRegistered,
} from '@services/sync';
import { checkHealth } from '@services/api';

// Debounce time for sync after data changes (ms)
const SYNC_DEBOUNCE_TIME = 5000;

export function useSync() {
  const {
    syncState,
    isOnline,
    lastSyncTime,
    error,
    pendingChangesCount,
    initializeNetworkListener,
    startSync,
    endSync,
    setPendingChangesCount,
  } = useSyncStore();

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);

  // Initialize network listener on mount
  useEffect(() => {
    const unsubscribe = initializeNetworkListener();
    return () => {
      unsubscribe();
    };
  }, [initializeNetworkListener]);

  // Register device on first launch
  useEffect(() => {
    const registerOnLaunch = async () => {
      try {
        const serverAvailable = await checkHealth();
        if (serverAvailable) {
          await ensureDeviceRegistered();
        }
      } catch (error) {
        console.log('Server not available, will register later');
      }
    };
    registerOnLaunch();
  }, []);

  // Update pending changes count
  const updatePendingCount = useCallback(async () => {
    const count = await getPendingChangesCount();
    setPendingChangesCount(count);
  }, [setPendingChangesCount]);

  // Perform sync
  const performSync = useCallback(async () => {
    if (isSyncingRef.current || !isOnline) {
      return;
    }

    isSyncingRef.current = true;
    startSync();

    try {
      const result = await fullSync();

      if (result.success) {
        endSync(true);
        await updatePendingCount();
      } else {
        endSync(false, result.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      endSync(false, message);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isOnline, startSync, endSync, updatePendingCount]);

  // Debounced sync (for triggering after data changes)
  const triggerSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Update pending count immediately
    updatePendingCount();

    // Schedule sync after debounce period
    syncTimeoutRef.current = setTimeout(() => {
      performSync();
    }, SYNC_DEBOUNCE_TIME);
  }, [performSync, updatePendingCount]);

  // Manual sync (immediate)
  const manualSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    performSync();
  }, [performSync]);

  // Handle app state changes (sync on foreground)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isOnline) {
        // Sync when app comes to foreground
        performSync();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isOnline, performSync]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Initial sync and pending count on mount
  useEffect(() => {
    updatePendingCount();
    // Perform initial sync after a short delay
    const timeout = setTimeout(() => {
      if (isOnline) {
        performSync();
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return {
    syncState,
    isOnline,
    lastSyncTime,
    error,
    pendingChangesCount,
    triggerSync,
    manualSync,
    isSyncing: syncState === 'syncing',
  };
}
