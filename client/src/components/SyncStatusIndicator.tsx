import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSyncStore } from '@store';
import { useSync } from '@hooks';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  showDetails?: boolean;
}

export function SyncStatusIndicator({ showDetails = false }: Props) {
  const { syncState, isOnline, lastSyncTime, pendingChangesCount, error } = useSyncStore();
  const { manualSync } = useSync();

  const getStatusColor = () => {
    if (!isOnline) return '#8E8E93';
    switch (syncState) {
      case 'syncing':
        return '#007AFF';
      case 'error':
        return '#FF3B30';
      default:
        return pendingChangesCount > 0 ? '#FF9500' : '#34C759';
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    switch (syncState) {
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Sync Error';
      default:
        if (pendingChangesCount > 0) {
          return `${pendingChangesCount} pending`;
        }
        return 'Synced';
    }
  };

  const getLastSyncText = () => {
    if (!lastSyncTime) return 'Never synced';
    try {
      return `Last sync: ${formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}`;
    } catch {
      return 'Last sync: Unknown';
    }
  };

  if (!showDetails) {
    // Compact view - just a dot indicator
    return (
      <TouchableOpacity
        onPress={manualSync}
        disabled={syncState === 'syncing' || !isOnline}
        style={styles.compactContainer}
      >
        {syncState === 'syncing' ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
        )}
      </TouchableOpacity>
    );
  }

  // Detailed view
  return (
    <TouchableOpacity
      onPress={manualSync}
      disabled={syncState === 'syncing' || !isOnline}
      style={styles.container}
    >
      <View style={styles.statusRow}>
        {syncState === 'syncing' ? (
          <ActivityIndicator size="small" color="#007AFF" style={styles.indicator} />
        ) : (
          <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
        )}
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>
      <Text style={styles.lastSyncText}>{getLastSyncText()}</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {syncState !== 'syncing' && isOnline && (
        <Text style={styles.tapHint}>Tap to sync</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  indicator: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  tapHint: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
