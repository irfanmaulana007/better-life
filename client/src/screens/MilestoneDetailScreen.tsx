import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { format, differenceInDays, isPast } from 'date-fns';
import { useMilestoneStore, useActivityStore } from '@store';
import { EmptyState, Loading } from '@components';
import { useTheme } from '@hooks';
import type { Milestone } from '@types/entities';
import type { MilestoneStackScreenProps } from '@types/navigation';

type Props = MilestoneStackScreenProps<'MilestoneDetail'>;

export default function MilestoneDetailScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { localId } = route.params;
  const { fetchMilestoneById, removeMilestone } = useMilestoneStore();
  const { activities, fetchActivitiesByMilestone } = useActivityStore();

  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [localId]);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchMilestoneById(localId);
    setMilestone(data);
    await fetchActivitiesByMilestone(localId);
    setIsLoading(false);
  };

  const handleEdit = useCallback(() => {
    navigation.navigate('MilestoneForm', { localId });
  }, [navigation, localId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Milestone',
      'Are you sure you want to delete this milestone? All associated activities will remain but will no longer be linked to this milestone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await removeMilestone(localId);
            if (success) {
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to delete milestone');
            }
          },
        },
      ]
    );
  }, [localId, removeMilestone, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, handleEdit]);

  if (isLoading) {
    return <Loading message="Loading milestone..." />;
  }

  if (!milestone) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="x"
          title="Milestone Not Found"
          message="This milestone may have been deleted."
        />
      </View>
    );
  }

  const start = new Date(milestone.startDate);
  const end = milestone.endDate ? new Date(milestone.endDate) : null;
  const today = new Date();

  const getStatus = () => {
    if (!end) return { text: 'Ongoing', color: '#007AFF' };
    if (isPast(end)) return { text: 'Completed', color: '#34C759' };
    const daysLeft = differenceInDays(end, today);
    if (daysLeft <= 7) return { text: `${daysLeft} days left`, color: '#FF9500' };
    return { text: `${daysLeft} days left`, color: '#007AFF' };
  };

  const getProgress = () => {
    if (!end) return null;
    if (isPast(end)) return 100;
    const totalDays = differenceInDays(end, start);
    const elapsed = differenceInDays(today, start);
    return Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
  };

  const status = getStatus();
  const progress = getProgress();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Card */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.milestoneName, { color: theme.colors.text }]}>{milestone.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
        </View>
      </View>

      {/* Dates Card */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Timeline</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>Start Date</Text>
            <Text style={[styles.dateValue, { color: theme.colors.text }]}>{format(start, 'MMM d, yyyy')}</Text>
          </View>
          {end && (
            <View style={styles.dateItem}>
              <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>End Date</Text>
              <Text style={[styles.dateValue, { color: theme.colors.text }]}>{format(end, 'MMM d, yyyy')}</Text>
            </View>
          )}
        </View>

        {progress !== null && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>Progress</Text>
              <Text style={[styles.progressValue, { color: theme.colors.primary }]}>{progress}%</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.colors.primary }]} />
            </View>
          </View>
        )}
      </View>

      {/* Activities Card */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={styles.activitiesHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Activities</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.getParent()?.navigate('ActivitiesTab', {
                screen: 'ActivityForm',
                params: { milestoneLocalId: localId },
              })
            }
          >
            <Text style={[styles.addActivityText, { color: theme.colors.primary }]}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {activities.length === 0 ? (
          <Text style={[styles.noActivitiesText, { color: theme.colors.textSecondary }]}>
            No activities yet. Add activities to track your progress.
          </Text>
        ) : (
          activities.map(activity => (
            <View key={activity.localId} style={[styles.activityItem, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.activityInfo}>
                <Text style={[styles.activityName, { color: theme.colors.text }]}>{activity.name}</Text>
                <Text style={[styles.activityMeta, { color: theme.colors.textSecondary }]}>
                  {activity.targetGoal
                    ? `${activity.targetGoal} ${activity.unitName}`
                    : activity.unitName}
                </Text>
              </View>
              <View style={styles.scheduleDays}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dayBadge,
                      { backgroundColor: theme.colors.border },
                      activity.scheduleDays.includes(index as 0 | 1 | 2 | 3 | 4 | 5 | 6) &&
                        { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: theme.colors.textSecondary },
                        activity.scheduleDays.includes(index as 0 | 1 | 2 | 3 | 4 | 5 | 6) &&
                          styles.dayTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Delete Button */}
      <TouchableOpacity style={[styles.deleteButton, { backgroundColor: theme.colors.card }]} onPress={handleDelete}>
        <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>Delete Milestone</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  milestoneName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addActivityText: {
    fontSize: 16,
    fontWeight: '500',
  },
  noActivitiesText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  activityItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityInfo: {
    marginBottom: 8,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
  },
  activityMeta: {
    fontSize: 14,
    marginTop: 2,
  },
  scheduleDays: {
    flexDirection: 'row',
    gap: 4,
  },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dayTextActive: {
    color: '#fff',
  },
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 32,
  },
});
