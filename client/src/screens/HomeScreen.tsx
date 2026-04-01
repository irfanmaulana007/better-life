import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format, addDays, subDays, isToday, isFuture } from 'date-fns';
import { useActivityStore, useSessionStore, useMilestoneStore } from '@store';
import { EmptyState, SyncStatusIndicator, Loading, Icon } from '@components';
import { useSync, useTheme } from '@hooks';
import type { Activity, Session } from '@types/entities';
import type { HomeStackScreenProps } from '@types/navigation';

type Props = HomeStackScreenProps<'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const { triggerSync, manualSync } = useSync();

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
    await manualSync();
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

    // Trigger sync
    triggerSync();
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
    return <Loading message="Loading activities..." />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Date Selector */}
      <View style={[styles.dateSelector, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={styles.dateArrow}
          onPress={() => handleDateChange('prev')}
        >
          <Icon name="chevron-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateCenter} onPress={handleGoToToday}>
          <Text style={[styles.dateLabelText, { color: theme.colors.text }]}>{getDateLabel()}</Text>
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>{format(selectedDate, 'MMMM d, yyyy')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateArrow}
          onPress={() => handleDateChange('next')}
        >
          <Icon name="chevron-right" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <SyncStatusIndicator />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Streak Card */}
        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{currentStreak}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Day Streak</Text>
        </View>

        {/* Progress Card */}
        <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.progressCircle, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={[styles.progressText, { color: theme.colors.primary }]}>{progressPercentage}%</Text>
          </View>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {completionStats.completed}/{completionStats.total} Done
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {completionStats.total > 0 && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
            <View
              style={[styles.progressFill, { width: `${progressPercentage}%`, backgroundColor: theme.colors.success }]}
            />
          </View>
        </View>
      )}

      {/* Activities Section */}
      <View style={styles.activitiesSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {isToday(selectedDate) ? "Today's Activities" : 'Activities'}
        </Text>

        {dayActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="calendar"
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
                style={[
                  styles.activityCard,
                  { backgroundColor: theme.colors.card },
                  isCompleted && { backgroundColor: theme.colors.successLight },
                ]}
                onPress={() => handleLogSession(activity)}
                activeOpacity={0.7}
              >
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    { borderColor: theme.colors.disabled },
                    isCompleted && { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
                  ]}
                  onPress={() => handleToggleComplete(activity)}
                >
                  {isCompleted && <Icon name="check" size={16} color="#fff" />}
                </TouchableOpacity>

                <View style={styles.activityInfo}>
                  <Text
                    style={[
                      styles.activityName,
                      { color: theme.colors.text },
                      isCompleted && { textDecorationLine: 'line-through', color: theme.colors.textSecondary },
                    ]}
                  >
                    {activity.name}
                  </Text>
                  <Text style={[styles.activityMeta, { color: theme.colors.textSecondary }]}>
                    {milestoneNameMap[activity.milestoneLocalId]}
                    {activity.targetGoal && ` • ${activity.targetGoal} ${activity.unitName}`}
                  </Text>
                  {session?.actualResult !== undefined && (
                    <Text style={[styles.sessionResult, { color: theme.colors.success }]}>
                      Logged: {session.actualResult} {activity.unitName}
                    </Text>
                  )}
                </View>

                <View style={[styles.logButton, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text style={[styles.logButtonText, { color: theme.colors.primary }]}>
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
        <View style={[styles.futureNotice, { backgroundColor: theme.colors.warningLight }]}>
          <Text style={[styles.futureNoticeText, { color: theme.colors.warning }]}>
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
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dateArrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrowText: {
    fontSize: 28,
    fontWeight: '300',
  },
  dateCenter: {
    alignItems: 'center',
    flex: 1,
  },
  dateLabelText: {
    fontSize: 18,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
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
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
  activitiesSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyContainer: {
    paddingVertical: 32,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  },
  activityMeta: {
    fontSize: 14,
    marginTop: 2,
  },
  sessionResult: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  logButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  futureNotice: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  futureNoticeText: {
    fontSize: 14,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 32,
  },
});
