import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import type { UnitType, DayOfWeek } from '@types/entities';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  distance: 'Distance',
  time: 'Time',
  reps: 'Reps',
  counter: 'Counter',
};

interface ActivityCardProps {
  name: string;
  unitType: UnitType;
  unitName: string;
  targetGoal?: number;
  scheduleDays: DayOfWeek[];
  milestoneName?: string;
  onPress: () => void;
}

export default function ActivityCard({
  name,
  unitType,
  unitName,
  targetGoal,
  scheduleDays,
  milestoneName,
  onPress,
}: ActivityCardProps) {
  const getGoalText = () => {
    if (!targetGoal) return unitName;
    return `${targetGoal} ${unitName}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.unitBadge}>
          <Text style={styles.unitBadgeText}>{UNIT_TYPE_LABELS[unitType]}</Text>
        </View>
      </View>

      {milestoneName && (
        <View style={styles.milestoneRow}>
          <Text style={styles.milestoneLabel}>Milestone:</Text>
          <Text style={styles.milestoneName} numberOfLines={1}>
            {milestoneName}
          </Text>
        </View>
      )}

      <View style={styles.goalRow}>
        <Text style={styles.goalLabel}>Goal:</Text>
        <Text style={styles.goalValue}>{getGoalText()}</Text>
      </View>

      <View style={styles.scheduleRow}>
        <Text style={styles.scheduleLabel}>Schedule:</Text>
        <View style={styles.daysContainer}>
          {DAY_LABELS.map((day, index) => (
            <View
              key={index}
              style={[
                styles.dayBadge,
                scheduleDays.includes(index as DayOfWeek) && styles.dayBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  scheduleDays.includes(index as DayOfWeek) && styles.dayTextActive,
                ]}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>
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
  unitBadge: {
    backgroundColor: '#007AFF20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unitBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 4,
  },
  milestoneName: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 4,
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeActive: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  dayTextActive: {
    color: '#fff',
  },
});
