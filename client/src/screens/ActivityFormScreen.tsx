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
import { useSync } from '@hooks';
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
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowMilestonePicker(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Milestone</Text>
          <View style={styles.modalSpacer} />
        </View>
        <FlatList
          data={milestones}
          keyExtractor={item => item.localId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.milestoneOption,
                milestoneLocalId === item.localId && styles.milestoneOptionSelected,
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
                  milestoneLocalId === item.localId && styles.milestoneOptionTextSelected,
                ]}
              >
                {item.name}
              </Text>
              {milestoneLocalId === item.localId && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyMilestones}>
              <Text style={styles.emptyMilestonesText}>
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Name Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={name}
            onChangeText={text => {
              setName(text);
              setErrors(prev => ({ ...prev, name: undefined }));
            }}
            placeholder="Enter activity name"
            placeholderTextColor="#C7C7CC"
            autoFocus={!isEditing}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Milestone Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Milestone</Text>
          <TouchableOpacity
            style={[styles.pickerButton, errors.milestone && styles.inputError]}
            onPress={() => setShowMilestonePicker(true)}
          >
            <Text
              style={[
                styles.pickerButtonText,
                !milestoneLocalId && styles.pickerButtonPlaceholder,
              ]}
            >
              {getSelectedMilestoneName()}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
          {errors.milestone && <Text style={styles.errorText}>{errors.milestone}</Text>}
        </View>

        {/* Unit Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Unit Type</Text>
          <View style={styles.unitTypeGrid}>
            {UNIT_TYPES.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.unitTypeButton,
                  unitType === type.value && styles.unitTypeButtonActive,
                ]}
                onPress={() => setUnitType(type.value)}
              >
                <Text
                  style={[
                    styles.unitTypeLabel,
                    unitType === type.value && styles.unitTypeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
                <Text
                  style={[
                    styles.unitTypeDesc,
                    unitType === type.value && styles.unitTypeDescActive,
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
          <Text style={styles.label}>Unit Name</Text>
          <TextInput
            style={[styles.input, errors.unitName && styles.inputError]}
            value={unitName}
            onChangeText={text => {
              setUnitName(text);
              setErrors(prev => ({ ...prev, unitName: undefined }));
            }}
            placeholder="e.g., km, minutes, reps"
            placeholderTextColor="#C7C7CC"
          />
          {errors.unitName && <Text style={styles.errorText}>{errors.unitName}</Text>}
        </View>

        {/* Target Goal */}
        <View style={styles.section}>
          <Text style={styles.label}>Target Goal (Optional)</Text>
          <TextInput
            style={styles.input}
            value={targetGoal}
            onChangeText={setTargetGoal}
            placeholder="Enter target number"
            placeholderTextColor="#C7C7CC"
            keyboardType="numeric"
          />
          <Text style={styles.helpText}>
            Set a daily target for this activity
          </Text>
        </View>

        {/* Schedule Days */}
        <View style={styles.section}>
          <View style={styles.scheduleLabelRow}>
            <Text style={styles.label}>Schedule Days</Text>
            <View style={styles.scheduleQuickActions}>
              <TouchableOpacity onPress={selectAllDays}>
                <Text style={styles.quickAction}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={selectWeekdays}>
                <Text style={styles.quickAction}>Weekdays</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.daysContainer}>
            {DAYS_OF_WEEK.map(day => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  scheduleDays.includes(day.value) && styles.dayButtonActive,
                ]}
                onPress={() => toggleDay(day.value)}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    scheduleDays.includes(day.value) && styles.dayButtonTextActive,
                  ]}
                >
                  {day.short}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.scheduleDays && (
            <Text style={styles.errorText}>{errors.scheduleDays}</Text>
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
    backgroundColor: '#F2F2F7',
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
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  helpText: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 4,
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#000',
  },
  pickerButtonPlaceholder: {
    color: '#C7C7CC',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#8E8E93',
  },
  unitTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitTypeButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  unitTypeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF10',
  },
  unitTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  unitTypeLabelActive: {
    color: '#007AFF',
  },
  unitTypeDesc: {
    fontSize: 12,
    color: '#8E8E93',
  },
  unitTypeDescActive: {
    color: '#007AFF',
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
    color: '#007AFF',
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
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
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
  milestoneOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  milestoneOptionSelected: {
    backgroundColor: '#007AFF10',
  },
  milestoneOptionText: {
    fontSize: 16,
    color: '#000',
  },
  milestoneOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyMilestones: {
    padding: 32,
    alignItems: 'center',
  },
  emptyMilestonesText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
