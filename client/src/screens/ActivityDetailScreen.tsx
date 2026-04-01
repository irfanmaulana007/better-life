import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { format } from 'date-fns';
import { useActivityStore, useMilestoneStore, useSessionStore } from '@store';
import { EmptyState, Loading } from '@components';
import { useTheme } from '@hooks';
import type { Activity, Session } from '@types/entities';
import type { ActivityStackScreenProps } from '@types/navigation';

type Props = ActivityStackScreenProps<'ActivityDetail'>;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const UNIT_TYPE_LABELS = {
  distance: 'Distance',
  time: 'Time',
  reps: 'Reps',
  counter: 'Counter',
};

export default function ActivityDetailScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { localId } = route.params;
  const { fetchActivityById, removeActivity } = useActivityStore();
  const { fetchMilestoneById } = useMilestoneStore();
  const { sessions, fetchSessionsByActivity } = useSessionStore();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [milestoneName, setMilestoneName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [localId]);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchActivityById(localId);
    setActivity(data);

    if (data) {
      const milestone = await fetchMilestoneById(data.milestoneLocalId);
      setMilestoneName(milestone?.name || 'Unknown');
      await fetchSessionsByActivity(localId);
    }
    setIsLoading(false);
  };

  const handleEdit = useCallback(() => {
    navigation.navigate('ActivityForm', { localId });
  }, [navigation, localId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity? All associated sessions will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await removeActivity(localId);
            if (success) {
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to delete activity');
            }
          },
        },
      ]
    );
  }, [localId, removeActivity, navigation]);

  const handleLogSession = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    navigation.getParent()?.navigate('HomeTab', {
      screen: 'LogSession',
      params: { activityLocalId: localId, date: today },
    });
  }, [navigation, localId]);

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
    return <Loading message="Loading activity..." />;
  }

  if (!activity) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="❌"
          title="Activity Not Found"
          message="This activity may have been deleted."
        />
      </View>
    );
  }

  const getScheduleText = () => {
    if (activity.scheduleDays.length === 7) return 'Every day';
    if (
      activity.scheduleDays.length === 5 &&
      !activity.scheduleDays.includes(0) &&
      !activity.scheduleDays.includes(6)
    ) {
      return 'Weekdays';
    }
    if (
      activity.scheduleDays.length === 2 &&
      activity.scheduleDays.includes(0) &&
      activity.scheduleDays.includes(6)
    ) {
      return 'Weekends';
    }
    return activity.scheduleDays.map(d => DAY_LABELS[d]).join(', ');
  };

  const recentSessions = sessions.slice(0, 10);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Card */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.activityName, { color: theme.colors.text }]}>{activity.name}</Text>
        <View style={[styles.unitBadge, { backgroundColor: theme.colors.primaryLight }]}>
          <Text style={[styles.unitBadgeText, { color: theme.colors.primary }]}>
            {UNIT_TYPE_LABELS[activity.unitType]}
          </Text>
        </View>
      </View>

      {/* Details Card */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Details</Text>

        <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Milestone</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{milestoneName}</Text>
        </View>

        <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Unit</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{activity.unitName}</Text>
        </View>

        {activity.targetGoal && (
          <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Target Goal</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {activity.targetGoal} {activity.unitName}
            </Text>
          </View>
        )}

        <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Schedule</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{getScheduleText()}</Text>
        </View>

        <View style={styles.scheduleVisual}>
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

      {/* Log Session Button */}
      <TouchableOpacity style={[styles.logButton, { backgroundColor: theme.colors.primary }]} onPress={handleLogSession}>
        <Text style={styles.logButtonText}>Log Today's Session</Text>
      </TouchableOpacity>

      {/* Recent Sessions Card */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Sessions</Text>

        {recentSessions.length === 0 ? (
          <Text style={[styles.noSessionsText, { color: theme.colors.textSecondary }]}>
            No sessions logged yet. Start tracking your progress!
          </Text>
        ) : (
          recentSessions.map((session: Session) => (
            <View key={session.localId} style={[styles.sessionItem, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionDate, { color: theme.colors.text }]}>
                  {format(new Date(session.date), 'MMM d, yyyy')}
                </Text>
                {session.actualResult !== undefined && (
                  <Text style={[styles.sessionResult, { color: theme.colors.textSecondary }]}>
                    {session.actualResult} {activity.unitName}
                  </Text>
                )}
              </View>
              <View
                style={[
                  styles.sessionStatus,
                  session.isCompleted
                    ? { backgroundColor: theme.colors.successLight }
                    : { backgroundColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.sessionStatusText,
                    session.isCompleted
                      ? { color: theme.colors.success }
                      : { color: theme.colors.textSecondary },
                  ]}
                >
                  {session.isCompleted ? '✓' : '○'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Delete Button */}
      <TouchableOpacity style={[styles.deleteButton, { backgroundColor: theme.colors.card }]} onPress={handleDelete}>
        <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>Delete Activity</Text>
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
  activityName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  unitBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  unitBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  scheduleVisual: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  dayBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#fff',
  },
  logButton: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  noSessionsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '500',
  },
  sessionResult: {
    fontSize: 14,
    marginTop: 2,
  },
  sessionStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionStatusText: {
    fontSize: 16,
    fontWeight: '600',
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
