import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useSessionStore, useActivityStore, useMilestoneStore } from '@store';
import { EmptyState } from '@components';
import type { Session, Activity } from '@types/entities';
import type { HistoryStackScreenProps } from '@types/navigation';

type Props = HistoryStackScreenProps<'History'>;

const DATE_RANGES = [
  { label: 'Last 7 days', value: '7days' },
  { label: 'Last 30 days', value: '30days' },
  { label: 'This month', value: 'thisMonth' },
  { label: 'Last month', value: 'lastMonth' },
  { label: 'All time', value: 'all' },
];

export default function HistoryScreen({ navigation }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [showActivityFilter, setShowActivityFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const {
    sessions,
    fetchAllSessions,
    fetchSessionsByDateRange,
    isLoading,
  } = useSessionStore();
  const { activities, fetchAllActivities } = useActivityStore();
  const { milestones, fetchMilestones } = useMilestoneStore();

  // Create maps for quick lookups
  const activityMap = useMemo(() => {
    const map: Record<string, Activity> = {};
    activities.forEach(a => {
      map[a.localId] = a;
    });
    return map;
  }, [activities]);

  const milestoneNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    milestones.forEach(m => {
      map[m.localId] = m.name;
    });
    return map;
  }, [milestones]);

  const loadData = useCallback(async () => {
    await fetchMilestones();
    await fetchAllActivities();

    const today = new Date();
    let startDate: string | null = null;
    let endDate: string | null = null;

    switch (selectedDateRange) {
      case '7days':
        startDate = format(subDays(today, 7), 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case '30days':
        startDate = format(subDays(today, 30), 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case 'thisMonth':
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        endDate = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
        endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
        break;
      default:
        // All time - fetch all
        break;
    }

    if (startDate && endDate) {
      await fetchSessionsByDateRange(startDate, endDate);
    } else {
      await fetchAllSessions();
    }
  }, [
    selectedDateRange,
    fetchMilestones,
    fetchAllActivities,
    fetchAllSessions,
    fetchSessionsByDateRange,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let filtered = [...sessions];

    // Filter by activity
    if (selectedActivityId) {
      filtered = filtered.filter(s => s.activityLocalId === selectedActivityId);
    }

    // Filter by search query (activity name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => {
        const activity = activityMap[s.activityLocalId];
        return activity?.name.toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [sessions, selectedActivityId, searchQuery, activityMap]);

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const groups: Record<string, Session[]> = {};
    filteredSessions.forEach(session => {
      if (!groups[session.date]) {
        groups[session.date] = [];
      }
      groups[session.date].push(session);
    });
    return groups;
  }, [filteredSessions]);

  const sortedDates = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));

  const handleSessionPress = (session: Session) => {
    navigation.navigate('SessionDetail', { localId: session.localId });
  };

  const getSelectedActivityName = () => {
    if (!selectedActivityId) return 'All Activities';
    const activity = activityMap[selectedActivityId];
    return activity?.name || 'Unknown';
  };

  const getSelectedDateRangeLabel = () => {
    const range = DATE_RANGES.find(r => r.value === selectedDateRange);
    return range?.label || 'All time';
  };

  const renderSession = (session: Session) => {
    const activity = activityMap[session.activityLocalId];
    if (!activity) return null;

    return (
      <TouchableOpacity
        key={session.localId}
        style={styles.sessionItem}
        onPress={() => handleSessionPress(session)}
      >
        <View
          style={[
            styles.completionIndicator,
            session.isCompleted ? styles.completed : styles.incomplete,
          ]}
        >
          <Text style={styles.completionIcon}>
            {session.isCompleted ? '✓' : '○'}
          </Text>
        </View>

        <View style={styles.sessionInfo}>
          <Text style={styles.activityName}>{activity.name}</Text>
          <Text style={styles.milestoneName}>
            {milestoneNameMap[activity.milestoneLocalId]}
          </Text>
          {session.actualResult !== undefined && (
            <Text style={styles.resultText}>
              {session.actualResult} {activity.unitName}
              {activity.targetGoal && ` / ${activity.targetGoal} ${activity.unitName}`}
            </Text>
          )}
        </View>

        <View style={styles.chevron}>
          <Text style={styles.chevronText}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDateGroup = ({ item: date }: { item: string }) => {
    const sessionsForDate = groupedSessions[date];
    const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy');

    return (
      <View style={styles.dateGroup}>
        <Text style={styles.dateHeader}>{formattedDate}</Text>
        {sessionsForDate.map(renderSession)}
      </View>
    );
  };

  const renderActivityFilterModal = () => (
    <Modal
      visible={showActivityFilter}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowActivityFilter(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filter by Activity</Text>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView>
          <TouchableOpacity
            style={[
              styles.filterOption,
              !selectedActivityId && styles.filterOptionSelected,
            ]}
            onPress={() => {
              setSelectedActivityId(null);
              setShowActivityFilter(false);
            }}
          >
            <Text
              style={[
                styles.filterOptionText,
                !selectedActivityId && styles.filterOptionTextSelected,
              ]}
            >
              All Activities
            </Text>
            {!selectedActivityId && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          {activities.map(activity => (
            <TouchableOpacity
              key={activity.localId}
              style={[
                styles.filterOption,
                selectedActivityId === activity.localId && styles.filterOptionSelected,
              ]}
              onPress={() => {
                setSelectedActivityId(activity.localId);
                setShowActivityFilter(false);
              }}
            >
              <View style={styles.filterOptionContent}>
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedActivityId === activity.localId &&
                      styles.filterOptionTextSelected,
                  ]}
                >
                  {activity.name}
                </Text>
                <Text style={styles.filterOptionMilestone}>
                  {milestoneNameMap[activity.milestoneLocalId]}
                </Text>
              </View>
              {selectedActivityId === activity.localId && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  const renderDateFilterModal = () => (
    <Modal
      visible={showDateFilter}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowDateFilter(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Date Range</Text>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView>
          {DATE_RANGES.map(range => (
            <TouchableOpacity
              key={range.value}
              style={[
                styles.filterOption,
                selectedDateRange === range.value && styles.filterOptionSelected,
              ]}
              onPress={() => {
                setSelectedDateRange(range.value);
                setShowDateFilter(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  selectedDateRange === range.value && styles.filterOptionTextSelected,
                ]}
              >
                {range.label}
              </Text>
              {selectedDateRange === range.value && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search activities..."
          placeholderTextColor="#8E8E93"
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.filterChip}
            onPress={() => setShowActivityFilter(true)}
          >
            <Text style={styles.filterChipText}>{getSelectedActivityName()}</Text>
            <Text style={styles.filterChipArrow}>▼</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterChip}
            onPress={() => setShowDateFilter(true)}
          >
            <Text style={styles.filterChipText}>{getSelectedDateRangeLabel()}</Text>
            <Text style={styles.filterChipArrow}>▼</Text>
          </TouchableOpacity>

          {(selectedActivityId || selectedDateRange !== 'all' || searchQuery) && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSelectedActivityId(null);
                setSelectedDateRange('all');
                setSearchQuery('');
              }}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Sessions List */}
      <FlatList
        data={sortedDates}
        renderItem={renderDateGroup}
        keyExtractor={item => item}
        contentContainerStyle={[
          styles.listContent,
          sortedDates.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="📜"
              title="No Sessions Found"
              message={
                searchQuery || selectedActivityId || selectedDateRange !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Start logging sessions to see your history here.'
              }
            />
          ) : null
        }
      />

      {renderActivityFilterModal()}
      {renderDateFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  filterChipText: {
    fontSize: 14,
    color: '#000',
    marginRight: 4,
  },
  filterChipArrow: {
    fontSize: 10,
    color: '#8E8E93',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 32,
  },
  emptyListContent: {
    flex: 1,
  },
  dateGroup: {
    marginTop: 16,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  completionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  completed: {
    backgroundColor: '#34C75920',
  },
  incomplete: {
    backgroundColor: '#FF3B3020',
  },
  completionIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  milestoneName: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  resultText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  chevron: {
    paddingLeft: 8,
  },
  chevronText: {
    fontSize: 20,
    color: '#C7C7CC',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCancel: {
    fontSize: 17,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  modalSpacer: {
    width: 60,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterOptionSelected: {
    backgroundColor: '#007AFF10',
  },
  filterOptionContent: {
    flex: 1,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#000',
  },
  filterOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  filterOptionMilestone: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
