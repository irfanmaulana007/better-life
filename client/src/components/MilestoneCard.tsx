import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';

interface MilestoneCardProps {
  name: string;
  startDate: string;
  endDate?: string;
  activitiesCount: number;
  onPress: () => void;
}

export default function MilestoneCard({
  name,
  startDate,
  endDate,
  activitiesCount,
  onPress,
}: MilestoneCardProps) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  const today = new Date();

  // Calculate days remaining or status
  const getDaysInfo = () => {
    if (!end) {
      return { text: 'No end date', color: '#8E8E93' };
    }

    if (isPast(end)) {
      return { text: 'Completed', color: '#34C759' };
    }

    if (isFuture(start)) {
      const daysUntilStart = differenceInDays(start, today);
      return { text: `Starts in ${daysUntilStart} days`, color: '#007AFF' };
    }

    const daysRemaining = differenceInDays(end, today);
    if (daysRemaining <= 7) {
      return { text: `${daysRemaining} days left`, color: '#FF9500' };
    }
    return { text: `${daysRemaining} days left`, color: '#007AFF' };
  };

  const daysInfo = getDaysInfo();

  // Calculate progress percentage
  const getProgress = () => {
    if (!end) return null;
    if (isPast(end)) return 100;
    if (isFuture(start)) return 0;

    const totalDays = differenceInDays(end, start);
    const elapsedDays = differenceInDays(today, start);
    return Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
  };

  const progress = getProgress();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <View style={[styles.badge, { backgroundColor: daysInfo.color + '20' }]}>
          <Text style={[styles.badgeText, { color: daysInfo.color }]}>
            {daysInfo.text}
          </Text>
        </View>
      </View>

      <View style={styles.dates}>
        <Text style={styles.dateText}>
          {format(start, 'MMM d, yyyy')}
          {end && ` → ${format(end, 'MMM d, yyyy')}`}
        </Text>
      </View>

      {progress !== null && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.activitiesText}>
          {activitiesCount} {activitiesCount === 1 ? 'activity' : 'activities'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dates: {
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    width: 35,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activitiesText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
