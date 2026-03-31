import { useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useMilestoneStore } from '@store';
import { MilestoneCard, EmptyState, FAB } from '@components';
import type { MilestoneStackScreenProps } from '@types/navigation';

type Props = MilestoneStackScreenProps<'MilestoneList'>;

export default function MilestoneListScreen({ navigation }: Props) {
  const { milestones, isLoading, fetchMilestones } = useMilestoneStore();

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleRefresh = useCallback(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleMilestonePress = useCallback(
    (localId: string) => {
      navigation.navigate('MilestoneDetail', { localId });
    },
    [navigation]
  );

  const handleCreatePress = useCallback(() => {
    navigation.navigate('MilestoneForm', {});
  }, [navigation]);

  if (isLoading && milestones.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={milestones}
        keyExtractor={item => item.localId}
        renderItem={({ item }) => (
          <MilestoneCard
            name={item.name}
            startDate={item.startDate}
            endDate={item.endDate}
            activitiesCount={item.activitiesCount}
            onPress={() => handleMilestonePress(item.localId)}
          />
        )}
        contentContainerStyle={
          milestones.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🎯"
            title="No Milestones Yet"
            message="Create your first milestone to start tracking your goals and activities."
          />
        }
      />
      <FAB onPress={handleCreatePress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
  },
});
