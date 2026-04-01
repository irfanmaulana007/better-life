import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useActivityStore, useMilestoneStore } from '@store';
import {
  getVolumeOverTime,
  getCompletionRate,
  getStreakInfo,
  type VolumeDataPoint,
  type CompletionDataPoint,
  type StreakInfo,
  type TimeRange,
} from '@services/analytics';
import { EmptyState } from '@components';
import type { Activity } from '@types/entities';
import type { ChartsStackScreenProps } from '@types/navigation';

type Props = ChartsStackScreenProps<'Charts'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 200;
const BAR_CHART_HEIGHT = 180;

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '7days', label: '7 Days' },
  { value: '30days', label: '30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: '3months', label: '3 Months' },
];

type ChartTab = 'volume' | 'completion';

export default function ChartsScreen(_props: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<ChartTab>('completion');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7days');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [completionData, setCompletionData] = useState<CompletionDataPoint[]>([]);
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);

  const { activities, fetchAllActivities } = useActivityStore();
  const { milestones, fetchMilestones } = useMilestoneStore();

  const milestoneNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    milestones.forEach(m => {
      map[m.localId] = m.name;
    });
    return map;
  }, [milestones]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await fetchMilestones();
    await fetchAllActivities();

    const [volume, completion, streak] = await Promise.all([
      getVolumeOverTime(selectedActivityId, selectedRange, 'day'),
      getCompletionRate(selectedActivityId, selectedRange, 'day'),
      getStreakInfo(),
    ]);

    setVolumeData(volume);
    setCompletionData(completion);
    setStreakInfo(streak);
    setIsLoading(false);
  }, [selectedActivityId, selectedRange, fetchMilestones, fetchAllActivities]);

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

  // Simple bar chart component
  const renderBarChart = (data: { label: string; value: number }[], maxValue: number, color: string) => {
    if (data.length === 0) return null;

    const barWidth = Math.max(8, (SCREEN_WIDTH - 80) / data.length - 4);
    const actualMax = maxValue || Math.max(...data.map(d => d.value), 1);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.barChartArea}>
          {data.map((item, index) => {
            const barHeight = actualMax > 0 ? (item.value / actualMax) * (BAR_CHART_HEIGHT - 40) : 0;
            return (
              <View key={index} style={styles.barContainer}>
                <Text style={styles.barValue}>{item.value > 0 ? item.value : ''}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      width: barWidth,
                      height: Math.max(2, barHeight),
                      backgroundColor: item.value > 0 ? color : '#E5E5EA',
                    },
                  ]}
                />
                <Text style={styles.barLabel} numberOfLines={1}>
                  {data.length <= 7 ? item.label.split(' ')[0] : ''}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Completion rate chart with percentage
  const renderCompletionChart = () => {
    if (completionData.length === 0) return null;

    const barWidth = Math.max(8, (SCREEN_WIDTH - 80) / completionData.length - 4);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.barChartArea}>
          {completionData.map((item, index) => {
            const barHeight = (item.rate / 100) * (BAR_CHART_HEIGHT - 40);
            const barColor = item.rate >= 80 ? '#34C759' : item.rate >= 50 ? '#FF9500' : '#FF3B30';

            return (
              <View key={index} style={styles.barContainer}>
                <Text style={styles.barValue}>{item.rate > 0 ? `${item.rate}%` : ''}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      width: barWidth,
                      height: Math.max(2, barHeight),
                      backgroundColor: item.rate > 0 ? barColor : '#E5E5EA',
                    },
                  ]}
                />
                <Text style={styles.barLabel} numberOfLines={1}>
                  {completionData.length <= 7 ? item.label.split(' ')[0] : ''}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const averageCompletion = useMemo(() => {
    if (completionData.length === 0) return 0;
    const total = completionData.reduce((sum, d) => sum + d.rate, 0);
    return Math.round(total / completionData.length);
  }, [completionData]);

  const totalVolume = useMemo(() => {
    return volumeData.reduce((sum, d) => sum + d.value, 0);
  }, [volumeData]);

  const getSelectedActivityName = () => {
    if (!selectedActivityId) return 'All Activities';
    const activity = activities.find(a => a.localId === selectedActivityId);
    return activity?.name || 'Unknown';
  };

  if (isLoading && !streakInfo) {
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
      {/* Streak Cards */}
      {streakInfo && (
        <View style={styles.streakSection}>
          <View style={styles.streakCardPrimary}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakValuePrimary}>{streakInfo.currentStreak}</Text>
            <Text style={styles.streakLabelPrimary}>Current Streak</Text>
          </View>

          <View style={styles.streakCardsRow}>
            <View style={styles.streakCardSecondary}>
              <Text style={styles.streakValueSecondary}>{streakInfo.longestStreak}</Text>
              <Text style={styles.streakLabelSecondary}>Longest Streak</Text>
            </View>
            <View style={styles.streakCardSecondary}>
              <Text style={styles.streakValueSecondary}>{streakInfo.totalCompletedDays}</Text>
              <Text style={styles.streakLabelSecondary}>Active Days</Text>
            </View>
            <View style={styles.streakCardSecondary}>
              <Text style={styles.streakValueSecondary}>{streakInfo.totalSessions}</Text>
              <Text style={styles.streakLabelSecondary}>Total Sessions</Text>
            </View>
          </View>
        </View>
      )}

      {/* Time Range Selector */}
      <View style={styles.rangeSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TIME_RANGES.map(range => (
            <TouchableOpacity
              key={range.value}
              style={[
                styles.rangeChip,
                selectedRange === range.value && styles.rangeChipActive,
              ]}
              onPress={() => setSelectedRange(range.value)}
            >
              <Text
                style={[
                  styles.rangeChipText,
                  selectedRange === range.value && styles.rangeChipTextActive,
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Activity Filter */}
      <View style={styles.activityFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.activityChip,
              !selectedActivityId && styles.activityChipActive,
            ]}
            onPress={() => setSelectedActivityId(null)}
          >
            <Text
              style={[
                styles.activityChipText,
                !selectedActivityId && styles.activityChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {activities.map(activity => (
            <TouchableOpacity
              key={activity.localId}
              style={[
                styles.activityChip,
                selectedActivityId === activity.localId && styles.activityChipActive,
              ]}
              onPress={() => setSelectedActivityId(activity.localId)}
            >
              <Text
                style={[
                  styles.activityChipText,
                  selectedActivityId === activity.localId && styles.activityChipTextActive,
                ]}
                numberOfLines={1}
              >
                {activity.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chart Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'completion' && styles.tabActive]}
          onPress={() => setSelectedTab('completion')}
        >
          <Text
            style={[styles.tabText, selectedTab === 'completion' && styles.tabTextActive]}
          >
            Completion Rate
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'volume' && styles.tabActive]}
          onPress={() => setSelectedTab('volume')}
        >
          <Text
            style={[styles.tabText, selectedTab === 'volume' && styles.tabTextActive]}
          >
            Volume
          </Text>
        </TouchableOpacity>
      </View>

      {/* Charts */}
      <View style={styles.chartSection}>
        {selectedTab === 'completion' ? (
          <>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Daily Completion Rate</Text>
              <View style={styles.chartSummary}>
                <Text style={styles.chartSummaryValue}>{averageCompletion}%</Text>
                <Text style={styles.chartSummaryLabel}>Average</Text>
              </View>
            </View>
            {completionData.length > 0 ? (
              renderCompletionChart()
            ) : (
              <View style={styles.emptyChart}>
                <EmptyState
                  icon="chart"
                  title="No Data"
                  message="Start logging sessions to see your completion rate."
                />
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Daily Volume</Text>
              <View style={styles.chartSummary}>
                <Text style={styles.chartSummaryValue}>{totalVolume}</Text>
                <Text style={styles.chartSummaryLabel}>Total</Text>
              </View>
            </View>
            {volumeData.some(d => d.value > 0) ? (
              renderBarChart(
                volumeData.map(d => ({ label: d.label, value: d.value })),
                0,
                '#007AFF'
              )
            ) : (
              <View style={styles.emptyChart}>
                <EmptyState
                  icon="chart"
                  title="No Data"
                  message="Start logging results to see your volume trends."
                />
              </View>
            )}
          </>
        )}
      </View>

      {/* Legend */}
      {selectedTab === 'completion' && completionData.length > 0 && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
            <Text style={styles.legendText}>≥80%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
            <Text style={styles.legendText}>50-79%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
            <Text style={styles.legendText}>&lt;50%</Text>
          </View>
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
  streakSection: {
    padding: 16,
  },
  streakCardPrimary: {
    backgroundColor: '#FF9500',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  streakEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  streakValuePrimary: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  streakLabelPrimary: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  streakCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  streakCardSecondary: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  streakValueSecondary: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  streakLabelSecondary: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  rangeSelector: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rangeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
  rangeChipActive: {
    backgroundColor: '#007AFF',
  },
  rangeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  rangeChipTextActive: {
    color: '#fff',
  },
  activityFilter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 4,
  },
  activityChipActive: {
    backgroundColor: '#007AFF20',
  },
  activityChipText: {
    fontSize: 13,
    color: '#8E8E93',
    maxWidth: 100,
  },
  activityChipTextActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#000',
  },
  chartSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  chartSummary: {
    alignItems: 'flex-end',
  },
  chartSummaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  chartSummaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  chartContainer: {
    height: BAR_CHART_HEIGHT,
  },
  barChartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: BAR_CHART_HEIGHT,
    paddingTop: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    borderRadius: 4,
    minWidth: 8,
  },
  barValue: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 4,
    height: 14,
  },
  barLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyChart: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  bottomPadding: {
    height: 32,
  },
});
