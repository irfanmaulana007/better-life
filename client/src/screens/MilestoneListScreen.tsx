import { useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useMilestoneStore } from '@store';
import { MilestoneCard, EmptyState, FAB, Loading } from '@components';
import { useTheme } from '@hooks';
import type { MilestoneStackScreenProps } from '@types/navigation';

type Props = MilestoneStackScreenProps<'MilestoneList'>;

export default function MilestoneListScreen({ navigation }: Props) {
  const theme = useTheme();
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
    return <Loading message="Loading milestones..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
            tintColor={theme.colors.primary}
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
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
  },
});
