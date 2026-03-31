import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { format } from 'date-fns';
import { useSessionStore, useActivityStore, useMilestoneStore } from '@store';
import { EmptyState } from '@components';
import type { Session, Activity } from '@types/entities';
import type { HistoryStackScreenProps } from '@types/navigation';

type Props = HistoryStackScreenProps<'SessionDetail'>;

export default function SessionDetailScreen({ navigation, route }: Props) {
  const { localId } = route.params;

  const { fetchSessionById, editSession, removeSession, isLoading } = useSessionStore();
  const { fetchActivityById } = useActivityStore();
  const { fetchMilestoneById } = useMilestoneStore();

  const [session, setSession] = useState<Session | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [milestoneName, setMilestoneName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Edit form state
  const [isCompleted, setIsCompleted] = useState(false);
  const [actualResult, setActualResult] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [localId]);

  const loadData = async () => {
    setPageLoading(true);
    const sessionData = await fetchSessionById(localId);
    setSession(sessionData);

    if (sessionData) {
      setIsCompleted(sessionData.isCompleted);
      setActualResult(sessionData.actualResult?.toString() || '');
      setNotes(sessionData.notes || '');

      const activityData = await fetchActivityById(sessionData.activityLocalId);
      setActivity(activityData);

      if (activityData) {
        const milestone = await fetchMilestoneById(activityData.milestoneLocalId);
        setMilestoneName(milestone?.name || '');
      }
    }
    setPageLoading(false);
  };

  const handleSave = useCallback(async () => {
    if (!session) return;

    try {
      await editSession(session.localId, {
        isCompleted,
        actualResult: actualResult ? Number(actualResult) : undefined,
        notes: notes.trim() || undefined,
      });

      setIsEditing(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    }
  }, [session, isCompleted, actualResult, notes, editSession]);

  const handleDelete = useCallback(() => {
    if (!session) return;

    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await removeSession(session.localId);
            if (success) {
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to delete session');
            }
          },
        },
      ]
    );
  }, [session, removeSession, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isEditing ? (
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => {
                setIsEditing(false);
                // Reset form
                if (session) {
                  setIsCompleted(session.isCompleted);
                  setActualResult(session.actualResult?.toString() || '');
                  setNotes(session.notes || '');
                }
              }}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              style={styles.headerButton}
            >
              <Text style={[styles.headerButtonText, isLoading && styles.disabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Edit</Text>
          </TouchableOpacity>
        ),
    });
  }, [navigation, isEditing, handleSave, isLoading, session]);

  if (pageLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!session || !activity) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="❌"
          title="Session Not Found"
          message="This session may have been deleted."
        />
      </View>
    );
  }

  const formattedDate = format(new Date(session.date), 'EEEE, MMMM d, yyyy');

  if (isEditing) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Activity Info */}
          <View style={styles.card}>
            <Text style={styles.activityName}>{activity.name}</Text>
            <Text style={styles.milestoneName}>{milestoneName}</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>

          {/* Completion Toggle */}
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.label}>Completed</Text>
                <Text style={styles.labelDescription}>
                  Did you complete this activity?
                </Text>
              </View>
              <Switch
                value={isCompleted}
                onValueChange={setIsCompleted}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Result Input */}
          <View style={styles.card}>
            <Text style={styles.label}>Result ({activity.unitName})</Text>
            <TextInput
              style={styles.input}
              value={actualResult}
              onChangeText={setActualResult}
              placeholder="Enter result"
              placeholderTextColor="#C7C7CC"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Notes Input */}
          <View style={styles.card}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes..."
              placeholderTextColor="#C7C7CC"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <View style={styles.card}>
        <Text style={styles.activityName}>{activity.name}</Text>
        <Text style={styles.milestoneName}>{milestoneName}</Text>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              session.isCompleted ? styles.statusCompleted : styles.statusIncomplete,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                session.isCompleted ? styles.statusTextCompleted : styles.statusTextIncomplete,
              ]}
            >
              {session.isCompleted ? 'Completed' : 'Not Completed'}
            </Text>
          </View>
        </View>
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Session Details</Text>

        {activity.targetGoal && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Target</Text>
            <Text style={styles.detailValue}>
              {activity.targetGoal} {activity.unitName}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Actual Result</Text>
          <Text
            style={[
              styles.detailValue,
              session.actualResult !== undefined && styles.detailValueHighlight,
            ]}
          >
            {session.actualResult !== undefined
              ? `${session.actualResult} ${activity.unitName}`
              : 'Not recorded'}
          </Text>
        </View>

        {activity.targetGoal && session.actualResult !== undefined && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Progress</Text>
            <Text
              style={[
                styles.detailValue,
                session.actualResult >= activity.targetGoal
                  ? styles.progressGood
                  : styles.progressBad,
              ]}
            >
              {Math.round((session.actualResult / activity.targetGoal) * 100)}%
            </Text>
          </View>
        )}

        {session.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.detailLabel}>Notes</Text>
            <Text style={styles.notesText}>{session.notes}</Text>
          </View>
        )}
      </View>

      {/* Metadata Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Metadata</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created</Text>
          <Text style={styles.detailValue}>
            {format(new Date(session.createdAt), 'MMM d, yyyy h:mm a')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Updated</Text>
          <Text style={styles.detailValue}>
            {format(new Date(session.updatedAt), 'MMM d, yyyy h:mm a')}
          </Text>
        </View>
      </View>

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Session</Text>
      </TouchableOpacity>

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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  activityName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  milestoneName: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  statusRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusCompleted: {
    backgroundColor: '#34C75920',
  },
  statusIncomplete: {
    backgroundColor: '#FF3B3020',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextCompleted: {
    color: '#34C759',
  },
  statusTextIncomplete: {
    color: '#FF3B30',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  detailLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 16,
    color: '#000',
  },
  detailValueHighlight: {
    fontWeight: '600',
    color: '#007AFF',
  },
  progressGood: {
    color: '#34C759',
    fontWeight: '600',
  },
  progressBad: {
    color: '#FF9500',
    fontWeight: '600',
  },
  notesSection: {
    paddingTop: 12,
  },
  notesText: {
    fontSize: 16,
    color: '#000',
    marginTop: 8,
    lineHeight: 22,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  labelDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: '#000',
    marginTop: 8,
  },
  notesInput: {
    minHeight: 100,
  },
  deleteButton: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  headerButtonCancel: {
    color: '#8E8E93',
    fontSize: 17,
  },
  disabled: {
    opacity: 0.5,
  },
  bottomPadding: {
    height: 32,
  },
});
