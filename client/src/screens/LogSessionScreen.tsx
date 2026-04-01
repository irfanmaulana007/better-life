import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { format } from 'date-fns';
import { useActivityStore, useSessionStore, useMilestoneStore } from '@store';
import { useSync, useTheme } from '@hooks';
import { Loading } from '@components';
import type { Activity, Session } from '@types/entities';
import type { HomeStackScreenProps } from '@types/navigation';

type Props = HomeStackScreenProps<'LogSession'>;

const UNIT_TYPE_PLACEHOLDERS = {
  distance: 'e.g., 5.5',
  time: 'e.g., 30',
  reps: 'e.g., 15',
  counter: 'e.g., 3',
};

export default function LogSessionScreen({ navigation, route }: Props) {
  const { activityLocalId, date } = route.params;
  const theme = useTheme();

  const { triggerSync } = useSync();

  const { fetchActivityById } = useActivityStore();
  const { fetchMilestoneById } = useMilestoneStore();
  const {
    getSessionForActivityOnDate,
    addSession,
    editSession,
    removeSession,
    isLoading,
  } = useSessionStore();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [milestoneName, setMilestoneName] = useState<string>('');
  const [existingSession, setExistingSession] = useState<Session | null>(null);

  const [isCompleted, setIsCompleted] = useState(true);
  const [actualResult, setActualResult] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [activityLocalId, date]);

  const loadData = async () => {
    const activityData = await fetchActivityById(activityLocalId);
    setActivity(activityData);

    if (activityData) {
      const milestone = await fetchMilestoneById(activityData.milestoneLocalId);
      setMilestoneName(milestone?.name || '');

      // Check for existing session
      const session = await getSessionForActivityOnDate(activityLocalId, date);
      if (session) {
        setExistingSession(session);
        setIsCompleted(session.isCompleted);
        setActualResult(session.actualResult?.toString() || '');
        setNotes(session.notes || '');
      }
    }
  };

  const handleSave = useCallback(async () => {
    if (!activity) return;

    try {
      const sessionData = {
        activityLocalId,
        date,
        isCompleted,
        actualResult: actualResult ? Number(actualResult) : undefined,
        targetGoal: activity.targetGoal,
        notes: notes.trim() || undefined,
      };

      if (existingSession) {
        await editSession(existingSession.localId, sessionData);
      } else {
        await addSession(sessionData);
      }

      // Trigger sync
      triggerSync();

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save session. Please try again.');
    }
  }, [
    activity,
    activityLocalId,
    date,
    isCompleted,
    actualResult,
    notes,
    existingSession,
    addSession,
    editSession,
    navigation,
  ]);

  const handleDelete = useCallback(() => {
    if (!existingSession) return;

    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await removeSession(existingSession.localId);
            if (success) {
              // Trigger sync
              triggerSync();
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to delete session');
            }
          },
        },
      ]
    );
  }, [existingSession, removeSession, navigation]);

  useEffect(() => {
    navigation.setOptions({
      title: existingSession ? 'Edit Session' : 'Log Session',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          style={styles.headerButton}
        >
          <Text style={[styles.headerButtonText, isLoading && styles.disabled]}>
            Save
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, existingSession, handleSave, isLoading]);

  if (!activity) {
    return <Loading message="Loading activity..." />;
  }

  const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy');

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Activity Info Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.activityName, { color: theme.colors.text }]}>{activity.name}</Text>
          <Text style={[styles.milestoneName, { color: theme.colors.primary }]}>{milestoneName}</Text>
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>{formattedDate}</Text>
          {activity.targetGoal && (
            <View style={[styles.targetRow, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.targetLabel, { color: theme.colors.textSecondary }]}>Target:</Text>
              <Text style={[styles.targetValue, { color: theme.colors.text }]}>
                {activity.targetGoal} {activity.unitName}
              </Text>
            </View>
          )}
        </View>

        {/* Completion Toggle */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>Mark as Completed</Text>
              <Text style={[styles.toggleDescription, { color: theme.colors.textSecondary }]}>
                Did you complete this activity?
              </Text>
            </View>
            <Switch
              value={isCompleted}
              onValueChange={setIsCompleted}
              trackColor={{ false: theme.colors.border, true: theme.colors.success }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Result Input */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Actual Result ({activity.unitName})
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
            value={actualResult}
            onChangeText={setActualResult}
            placeholder={UNIT_TYPE_PLACEHOLDERS[activity.unitType]}
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="decimal-pad"
          />
          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            {activity.unitType === 'distance' && 'Enter the distance you covered'}
            {activity.unitType === 'time' && 'Enter the time in minutes'}
            {activity.unitType === 'reps' && 'Enter the number of repetitions'}
            {activity.unitType === 'counter' && 'Enter the count'}
          </Text>
        </View>

        {/* Notes Input */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes about this session..."
            placeholderTextColor={theme.colors.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Delete Button (only for existing sessions) */}
        {existingSession && (
          <TouchableOpacity style={[styles.deleteButton, { backgroundColor: theme.colors.card }]} onPress={handleDelete}>
            <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>Delete Session</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  activityName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  milestoneName: {
    fontSize: 16,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    marginBottom: 12,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  targetLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  targetValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 100,
  },
  helpText: {
    fontSize: 14,
    marginTop: 8,
  },
  deleteButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  bottomPadding: {
    height: 32,
  },
});
