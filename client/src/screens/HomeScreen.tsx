import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format, addDays, subDays, isToday, isFuture } from 'date-fns';
import { useActivityStore, useSessionStore, useMilestoneStore } from '@store';
import { EmptyState } from '@components';
import type { Activity, Session } from '@types/entities';
import type { HomeStackScreenProps } from '@types/navigation';

type Props = HomeStackScreenProps<'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const { todayActivities, fetchTodayActivities, fetchActivitiesByScheduleDay } =
    useActivityStore();
  const {
    sessions,
    currentStreak,
    completionStats,
    fetchSessionsByDate,
    fetchStreak,
    fetchCompletionStats,
    addSession,
    editSession,
  } = useSessionStore();
  const { milestones, fetchMilestones } = useMilestoneStore();

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const dayOfWeek = selectedDate.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  // Get activities for the selected day
  const [dayActivities, setDayActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await fetchMilestones();

    if (isToday(selectedDate)) {
      await fetchTodayActivities();
      setDayActivities(todayActivities);
    } else {
      await fetchActivitiesByScheduleDay(dayOfWeek);
    }

    await fetchSessionsByDate(dateString);
    await fetchStreak();
    await fetchCompletionStats(dateString);
    setIsLoading(false);
  }, [
    selectedDate,
    dateString,
    dayOfWeek,
    fetchMilestones,
    fetchTodayActivities,
    fetchActivitiesByScheduleDay,
    fetchSessionsByDate,
    fetchStreak,
    fetchCompletionStats,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Update dayActivities when todayActivities changes
  useFocusEffect(
    useCallback(() => {
      if (isToday(selectedDate)) {
        setDayActivities(todayActivities);
      }
    }, [selectedDate, todayActivities])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Create a map of activity localId to session
  const sessionMap = useMemo(() => {
    const map: Record<string, Session> = {};
    sessions.forEach(s => {
      map[s.activityLocalId] = s;
    });
    return map;
  }, [sessions]);

  // Create a map of milestone localId to name
  const milestoneNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    milestones.forEach(m => {
      map[m.localId] = m.name;
    });
    return map;
  }, [milestones]);

  const handleDateChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDate(prev => subDays(prev, 1));
    } else {
      setSelectedDate(prev => addDays(prev, 1));
    }
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date());
  };

  const handleToggleComplete = async (activity: Activity) => {
    const existingSession = sessionMap[activity.localId];

    if (existingSession) {
      // Toggle the existing session
      await editSession(existingSession.localId, {
        isCompleted: !existingSession.isCompleted,
      });
    } else {
      // Create a new completed session
      await addSession({
        activityLocalId: activity.localId,
        date: dateString,
        isCompleted: true,
        targetGoal: activity.targetGoal,
      });
    }

    // Reload data
    await fetchSessionsByDate(dateString);
    await fetchStreak();
    await fetchCompletionStats(dateString);
  };

  const handleLogSession = (activity: Activity) => {
    navigation.navigate('LogSession', {
      activityLocalId: activity.localId,
      date: dateString,
    });
  };

  const progressPercentage =
    completionStats.total > 0
      ? Math.round((completionStats.completed / completionStats.total) * 100)
      : 0;

  const getDateLabel = () => {
    if (isToday(selectedDate)) return 'Today';
    const daysDiff = Math.round(
      (selectedDate.getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff === -1) return 'Yesterday';
    if (daysDiff === 1) return 'Tomorrow';
    return format(selectedDate, 'EEEE');
  };

  if (isLoading && dayActivities.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity
          style={styles.dateArrow}
          onPress={() => handleDateChange('prev')}
        >
          <Text style={styles.dateArrowText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateCenter} onPress={handleGoToToday}>
          <Text style={styles.dateLabelText}>{getDateLabel()}</Text>
          <Text style={styles.dateText}>{format(selectedDate, 'MMMM d, yyyy')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateArrow}
          onPress={() => handleDateChange('next')}
        >
          <Text style={styles.dateArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Streak Card */}
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        {/* Progress Card */}
        <View style={styles.statCard}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>{progressPercentage}%</Text>
          </View>
          <Text style={styles.statLabel}>
            {completionStats.completed}/{completionStats.total} Done
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {completionStats.total > 0 && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progressPercentage}%` }]}
            />
          </View>
        </View>
      )}

      {/* Activities Section */}
      <View style={styles.activitiesSection}>
        <Text style={styles.sectionTitle}>
          {isToday(selectedDate) ? "Today's Activities" : 'Activities'}
        </Text>

        {dayActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="📅"
              title="No Activities Scheduled"
              message={
                isToday(selectedDate)
                  ? 'You have no activities scheduled for today. Enjoy your rest day!'
                  : 'No activities scheduled for this day.'
              }
            />
          </View>
        ) : (
          dayActivities.map(activity => {
            const session = sessionMap[activity.localId];
            const isCompleted = session?.isCompleted || false;

            return (
              <TouchableOpacity
                key={activity.localId}
                style={[styles.activityCard, isCompleted && styles.activityCardCompleted]}
                onPress={() => handleLogSession(activity)}
                activeOpacity={0.7}
              >
                <TouchableOpacity
                  style={[styles.checkbox, isCompleted && styles.checkboxChecked]}
                  onPress={() => handleToggleComplete(activity)}
                >
                  {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>

                <View style={styles.activityInfo}>
                  <Text
                    style={[
                      styles.activityName,
                      isCompleted && styles.activityNameCompleted,
                    ]}
                  >
                    {activity.name}
                  </Text>
                  <Text style={styles.activityMeta}>
                    {milestoneNameMap[activity.milestoneLocalId]}
                    {activity.targetGoal && ` • ${activity.targetGoal} ${activity.unitName}`}
                  </Text>
                  {session?.actualResult !== undefined && (
                    <Text style={styles.sessionResult}>
                      Logged: {session.actualResult} {activity.unitName}
                    </Text>
                  )}
                </View>

                <View style={styles.logButton}>
                  <Text style={styles.logButtonText}>
                    {session ? 'Edit' : 'Log'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Future Date Notice */}
      {isFuture(selectedDate) && (
        <View style={styles.futureNotice}>
          <Text style={styles.futureNoticeText}>
            This is a future date. You can plan activities but cannot log sessions yet.
          </Text>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
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
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  dateArrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrowText: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: '300',
  },
  dateCenter: {
    alignItems: 'center',
    flex: 1,
  },
  dateLabelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  activitiesSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  emptyContainer: {
    paddingVertical: 32,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityCardCompleted: {
    backgroundColor: '#34C75910',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  activityNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  activityMeta: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  sessionResult: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
    marginTop: 4,
  },
  logButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF20',
    borderRadius: 8,
  },
  logButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  futureNotice: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FF950020',
    borderRadius: 8,
  },
  futureNoticeText: {
    fontSize: 14,
    color: '#FF9500',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 32,
  },
});
