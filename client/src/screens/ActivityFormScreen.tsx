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
  Modal,
  FlatList,
} from 'react-native';
import { useActivityStore, useMilestoneStore } from '@store';
import { useSync, useTheme } from '@hooks';
import { Icon } from '@components';
import type { UnitType, DayOfWeek } from '@types/entities';
import type { ActivityStackScreenProps } from '@types/navigation';

type Props = ActivityStackScreenProps<'ActivityForm'>;

const UNIT_TYPES: { value: UnitType; label: string; description: string }[] = [
  { value: 'distance', label: 'Distance', description: 'km, miles, meters' },
  { value: 'time', label: 'Time', description: 'minutes, hours' },
  { value: 'reps', label: 'Reps', description: 'repetitions, sets' },
  { value: 'counter', label: 'Counter', description: 'count anything' },
];

const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 0, label: 'Sunday', short: 'S' },
  { value: 1, label: 'Monday', short: 'M' },
  { value: 2, label: 'Tuesday', short: 'T' },
  { value: 3, label: 'Wednesday', short: 'W' },
  { value: 4, label: 'Thursday', short: 'T' },
  { value: 5, label: 'Friday', short: 'F' },
  { value: 6, label: 'Saturday', short: 'S' },
];

export default function ActivityFormScreen({ navigation, route }: Props) {
  const { localId, milestoneLocalId: initialMilestoneId } = route.params || {};
  const isEditing = !!localId;
  const theme = useTheme();

  const { triggerSync } = useSync();

  const { fetchActivityById, addActivity, editActivity, isLoading } = useActivityStore();
  const { milestones, fetchMilestones } = useMilestoneStore();

  const [name, setName] = useState('');
  const [milestoneLocalId, setMilestoneLocalId] = useState<string>(initialMilestoneId || '');
  const [unitType, setUnitType] = useState<UnitType>('counter');
  const [unitName, setUnitName] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [scheduleDays, setScheduleDays] = useState<DayOfWeek[]>([]);
  const [showMilestonePicker, setShowMilestonePicker] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    milestone?: string;
    unitName?: string;
    scheduleDays?: string;
  }>({});

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  useEffect(() => {
    if (isEditing && localId) {
      loadActivity();
    }
  }, [isEditing, localId]);

  const loadActivity = async () => {
    if (!localId) return;
    const activity = await fetchActivityById(localId);
    if (activity) {
      setName(activity.name);
      setMilestoneLocalId(activity.milestoneLocalId);
      setUnitType(activity.unitType);
      setUnitName(activity.unitName);
      setTargetGoal(activity.targetGoal?.toString() || '');
      setScheduleDays(activity.scheduleDays);
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!milestoneLocalId) {
      newErrors.milestone = 'Please select a milestone';
    }

    if (!unitName.trim()) {
      newErrors.unitName = 'Unit name is required';
    }

    if (scheduleDays.length === 0) {
      newErrors.scheduleDays = 'Select at least one day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    try {
      const data = {
        milestoneLocalId,
        name: name.trim(),
        unitType,
        unitName: unitName.trim(),
        targetGoal: targetGoal ? Number(targetGoal) : undefined,
        scheduleDays,
      };

      if (isEditing && localId) {
        await editActivity(localId, data);
      } else {
        await addActivity(data);
      }

      // Trigger sync
      triggerSync();

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save activity. Please try again.');
    }
  }, [
    name,
    milestoneLocalId,
    unitType,
    unitName,
    targetGoal,
    scheduleDays,
    isEditing,
    localId,
    addActivity,
    editActivity,
    navigation,
    triggerSync,
  ]);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Activity' : 'New Activity',
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
  }, [navigation, isEditing, handleSave, isLoading]);

  const toggleDay = (day: DayOfWeek) => {
    setScheduleDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
    setErrors(prev => ({ ...prev, scheduleDays: undefined }));
  };

  const selectAllDays = () => {
    setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
    setErrors(prev => ({ ...prev, scheduleDays: undefined }));
  };

  const selectWeekdays = () => {
    setScheduleDays([1, 2, 3, 4, 5]);
    setErrors(prev => ({ ...prev, scheduleDays: undefined }));
  };

  const getSelectedMilestoneName = () => {
    const milestone = milestones.find(m => m.localId === milestoneLocalId);
    return milestone?.name || 'Select milestone';
  };

  const renderMilestonePicker = () => (
    <Modal
      visible={showMilestonePicker}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => setShowMilestonePicker(false)}>
            <Text style={[styles.modalCancel, { color: theme.colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Milestone</Text>
          <View style={styles.modalSpacer} />
        </View>
        <FlatList
          data={milestones}
          keyExtractor={item => item.localId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.milestoneOption,
                { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border },
                milestoneLocalId === item.localId && { backgroundColor: theme.colors.primaryLight },
              ]}
              onPress={() => {
                setMilestoneLocalId(item.localId);
                setErrors(prev => ({ ...prev, milestone: undefined }));
                setShowMilestonePicker(false);
              }}
            >
              <Text
                style={[
                  styles.milestoneOptionText,
                  { color: theme.colors.text },
                  milestoneLocalId === item.localId && { color: theme.colors.primary, fontWeight: '500' },
                ]}
              >
                {item.name}
              </Text>
              {milestoneLocalId === item.localId && (
                <Icon name="check" size={18} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyMilestones}>
              <Text style={[styles.emptyMilestonesText, { color: theme.colors.textSecondary }]}>
                No milestones available. Create a milestone first.
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Name Input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text },
              errors.name && { borderColor: theme.colors.error },
            ]}
            value={name}
            onChangeText={text => {
              setName(text);
              setErrors(prev => ({ ...prev, name: undefined }));
            }}
            placeholder="Enter activity name"
            placeholderTextColor={theme.colors.placeholder}
            autoFocus={!isEditing}
          />
          {errors.name && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.name}</Text>}
        </View>

        {/* Milestone Selector */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Milestone</Text>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              errors.milestone && { borderColor: theme.colors.error },
            ]}
            onPress={() => setShowMilestonePicker(true)}
          >
            <Text
              style={[
                styles.pickerButtonText,
                { color: theme.colors.text },
                !milestoneLocalId && { color: theme.colors.placeholder },
              ]}
            >
              {getSelectedMilestoneName()}
            </Text>
            <Text style={[styles.pickerArrow, { color: theme.colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>
          {errors.milestone && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.milestone}</Text>}
        </View>

        {/* Unit Type */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Unit Type</Text>
          <View style={styles.unitTypeGrid}>
            {UNIT_TYPES.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.unitTypeButton,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  unitType === type.value && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
                ]}
                onPress={() => setUnitType(type.value)}
              >
                <Text
                  style={[
                    styles.unitTypeLabel,
                    { color: theme.colors.text },
                    unitType === type.value && { color: theme.colors.primary },
                  ]}
                >
                  {type.label}
                </Text>
                <Text
                  style={[
                    styles.unitTypeDesc,
                    { color: theme.colors.textSecondary },
                    unitType === type.value && { color: theme.colors.primary },
                  ]}
                >
                  {type.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Unit Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Unit Name</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text },
              errors.unitName && { borderColor: theme.colors.error },
            ]}
            value={unitName}
            onChangeText={text => {
              setUnitName(text);
              setErrors(prev => ({ ...prev, unitName: undefined }));
            }}
            placeholder="e.g., km, minutes, reps"
            placeholderTextColor={theme.colors.placeholder}
          />
          {errors.unitName && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.unitName}</Text>}
        </View>

        {/* Target Goal */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Target Goal (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
            value={targetGoal}
            onChangeText={setTargetGoal}
            placeholder="Enter target number"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            Set a daily target for this activity
          </Text>
        </View>

        {/* Schedule Days */}
        <View style={styles.section}>
          <View style={styles.scheduleLabelRow}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Schedule Days</Text>
            <View style={styles.scheduleQuickActions}>
              <TouchableOpacity onPress={selectAllDays}>
                <Text style={[styles.quickAction, { color: theme.colors.primary }]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={selectWeekdays}>
                <Text style={[styles.quickAction, { color: theme.colors.primary }]}>Weekdays</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.daysContainer}>
            {DAYS_OF_WEEK.map(day => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  { backgroundColor: theme.colors.border },
                  scheduleDays.includes(day.value) && { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => toggleDay(day.value)}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    { color: theme.colors.textSecondary },
                    scheduleDays.includes(day.value) && styles.dayButtonTextActive,
                  ]}
                >
                  {day.short}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.scheduleDays && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.scheduleDays}</Text>
          )}
        </View>
      </ScrollView>

      {renderMilestonePicker()}
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  helpText: {
    fontSize: 14,
    marginTop: 4,
  },
  pickerButton: {
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
  },
  pickerArrow: {
    fontSize: 12,
  },
  unitTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitTypeButton: {
    width: '48%',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
  },
  unitTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  unitTypeDesc: {
    fontSize: 12,
  },
  scheduleLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleQuickActions: {
    flexDirection: 'row',
    gap: 16,
  },
  quickAction: {
    fontSize: 14,
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: '#fff',
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 17,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalSpacer: {
    width: 60,
  },
  milestoneOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  milestoneOptionText: {
    fontSize: 16,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyMilestones: {
    padding: 32,
    alignItems: 'center',
  },
  emptyMilestonesText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
