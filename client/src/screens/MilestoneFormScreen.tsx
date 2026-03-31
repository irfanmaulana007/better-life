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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useMilestoneStore } from '@store';
import type { MilestoneStackScreenProps } from '@types/navigation';

type Props = MilestoneStackScreenProps<'MilestoneForm'>;

export default function MilestoneFormScreen({ navigation, route }: Props) {
  const { localId } = route.params || {};
  const isEditing = !!localId;

  const { fetchMilestoneById, addMilestone, editMilestone, isLoading } =
    useMilestoneStore();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; dates?: string }>({});

  useEffect(() => {
    if (isEditing && localId) {
      loadMilestone();
    }
  }, [isEditing, localId]);

  const loadMilestone = async () => {
    if (!localId) return;
    const milestone = await fetchMilestoneById(localId);
    if (milestone) {
      setName(milestone.name);
      setStartDate(new Date(milestone.startDate));
      if (milestone.endDate) {
        setEndDate(new Date(milestone.endDate));
        setHasEndDate(true);
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: { name?: string; dates?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (hasEndDate && endDate && endDate < startDate) {
      newErrors.dates = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    try {
      const data = {
        name: name.trim(),
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: hasEndDate && endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      };

      if (isEditing && localId) {
        await editMilestone(localId, data);
      } else {
        await addMilestone(data);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save milestone. Please try again.');
    }
  }, [
    name,
    startDate,
    endDate,
    hasEndDate,
    isEditing,
    localId,
    addMilestone,
    editMilestone,
    navigation,
  ]);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Milestone' : 'New Milestone',
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

  const handleStartDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      setErrors(prev => ({ ...prev, dates: undefined }));
    }
  };

  const handleEndDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
      setErrors(prev => ({ ...prev, dates: undefined }));
    }
  };

  const toggleEndDate = () => {
    setHasEndDate(!hasEndDate);
    if (!hasEndDate && !endDate) {
      // Set default end date to 30 days from start
      const defaultEnd = new Date(startDate);
      defaultEnd.setDate(defaultEnd.getDate() + 30);
      setEndDate(defaultEnd);
    }
  };

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
            placeholder="Enter milestone name"
            placeholderTextColor="#C7C7CC"
            autoFocus={!isEditing}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Start Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Start Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.dateText}>{format(startDate, 'MMMM d, yyyy')}</Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartDateChange}
            />
          )}
        </View>

        {/* End Date Toggle */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.toggleRow} onPress={toggleEndDate}>
            <Text style={styles.label}>Set End Date</Text>
            <View style={[styles.toggle, hasEndDate && styles.toggleActive]}>
              <View style={[styles.toggleThumb, hasEndDate && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* End Date */}
        {hasEndDate && (
          <View style={styles.section}>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity
              style={[styles.dateButton, errors.dates && styles.inputError]}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateText}>
                {endDate ? format(endDate, 'MMMM d, yyyy') : 'Select date'}
              </Text>
            </TouchableOpacity>
            {showEndPicker && endDate && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndDateChange}
                minimumDate={startDate}
              />
            )}
            {errors.dates && <Text style={styles.errorText}>{errors.dates}</Text>}
          </View>
        )}
      </ScrollView>
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
  dateButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E5EA',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#34C759',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
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
});
