import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useActivityStore, useMilestoneStore } from '@store';
import { ActivityCard, EmptyState, FAB } from '@components';
import { useTheme } from '@hooks';
import type { Activity } from '@types/entities';
import type { ActivityStackScreenProps } from '@types/navigation';

type Props = ActivityStackScreenProps<'ActivityList'>;

export default function ActivityListScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { milestoneLocalId: initialMilestoneId } = route.params || {};

  const { activities, isLoading, fetchAllActivities, fetchActivitiesByMilestone } =
    useActivityStore();
  const { milestones, fetchMilestones } = useMilestoneStore();

  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    initialMilestoneId || null
  );
  const [refreshing, setRefreshing] = useState(false);

  // Create a map of milestone localIds to names for display
  const milestoneNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    milestones.forEach(m => {
      map[m.localId] = m.name;
    });
    return map;
  }, [milestones]);

  const loadData = useCallback(async () => {
    await fetchMilestones();
    if (selectedMilestoneId) {
      await fetchActivitiesByMilestone(selectedMilestoneId);
    } else {
      await fetchAllActivities();
    }
  }, [selectedMilestoneId, fetchMilestones, fetchAllActivities, fetchActivitiesByMilestone]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    // Reload activities when filter changes
    if (selectedMilestoneId) {
      fetchActivitiesByMilestone(selectedMilestoneId);
    } else {
      fetchAllActivities();
    }
  }, [selectedMilestoneId, fetchActivitiesByMilestone, fetchAllActivities]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleActivityPress = (activity: Activity) => {
    navigation.navigate('ActivityDetail', { localId: activity.localId });
  };

  const handleAddActivity = () => {
    navigation.navigate('ActivityForm', {
      milestoneLocalId: selectedMilestoneId || undefined,
    });
  };

  const handleFilterPress = (milestoneId: string | null) => {
    setSelectedMilestoneId(milestoneId);
  };

  const renderFilterChips = () => (
    <View style={[styles.filterContainer, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            { backgroundColor: theme.colors.border },
            selectedMilestoneId === null && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => handleFilterPress(null)}
        >
          <Text
            style={[
              styles.filterChipText,
              { color: theme.colors.textSecondary },
              selectedMilestoneId === null && styles.filterChipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {milestones.map(milestone => (
          <TouchableOpacity
            key={milestone.localId}
            style={[
              styles.filterChip,
              { backgroundColor: theme.colors.border },
              selectedMilestoneId === milestone.localId && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => handleFilterPress(milestone.localId)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: theme.colors.textSecondary },
                selectedMilestoneId === milestone.localId && styles.filterChipTextActive,
              ]}
              numberOfLines={1}
            >
              {milestone.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderActivity = ({ item }: { item: Activity }) => (
    <ActivityCard
      name={item.name}
      unitType={item.unitType}
      unitName={item.unitName}
      targetGoal={item.targetGoal}
      scheduleDays={item.scheduleDays}
      milestoneName={milestoneNameMap[item.milestoneLocalId]}
      onPress={() => handleActivityPress(item)}
    />
  );

  const renderEmpty = () => (
    <EmptyState
      icon="target"
      title="No Activities Yet"
      message={
        selectedMilestoneId
          ? 'Create your first activity for this milestone to start tracking your progress.'
          : 'Create your first activity to start building better habits.'
      }
      actionLabel="Add Activity"
      onAction={handleAddActivity}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {milestones.length > 0 && renderFilterChips()}
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={item => item.localId}
        contentContainerStyle={[
          styles.listContent,
          activities.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={!isLoading ? renderEmpty : null}
      />
      <FAB onPress={handleAddActivity} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: 150,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
  },
});
