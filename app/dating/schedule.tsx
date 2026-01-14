
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { DateEvent, RosterPerson } from '@/types/roster';

let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const DATE_TYPES = ['casual', 'formal', 'activity', 'coffee', 'dinner', 'drinks', 'movie', 'outdoor', 'other'];

const REMINDER_OPTIONS = [
  { label: '1 hour before', value: '1h' },
  { label: '3 hours before', value: '3h' },
  { label: '1 day before', value: '1d' },
  { label: '2 days before', value: '2d' },
  { label: '1 week before', value: '1w' },
];

export default function ScheduleDateScreen() {
  const router = useRouter();
  const { roster, addDate } = useRoster();
  
  const [selectedPerson, setSelectedPerson] = useState('');
  const [selectedPersonName, setSelectedPersonName] = useState('');
  const [selectedPersonData, setSelectedPersonData] = useState<RosterPerson | null>(null);
  const [dateType, setDateType] = useState('casual');
  const [dateDate, setDateDate] = useState(new Date());
  const [dateTime, setDateTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedReminders, setSelectedReminders] = useState<string[]>(['1d']);
  
  const [showPersonPicker, setShowPersonPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    console.log('[ScheduleDate] User tapped Save button');
    
    if (!selectedPerson) {
      Alert.alert('Error', 'Please select a person');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    try {
      setSaving(true);
      const dateStr = dateDate.toISOString().split('T')[0];
      const timeStr = dateTime.toTimeString().split(' ')[0].substring(0, 5);

      const newDate: DateEvent = {
        id: Date.now().toString(),
        profileId: selectedPerson,
        profileName: selectedPersonName,
        date: dateStr,
        time: timeStr,
        location,
        notes,
        status: 'upcoming',
        type: dateType as any,
        reminders: selectedReminders,
      };

      console.log('[ScheduleDate] Saving date:', newDate);
      await addDate(newDate);
      
      Alert.alert('Success', 'Date scheduled successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('[ScheduleDate] Error saving date:', error);
      Alert.alert('Error', 'Failed to schedule date');
    } finally {
      setSaving(false);
    }
  };

  const toggleReminder = (value: string) => {
    if (selectedReminders.includes(value)) {
      setSelectedReminders(selectedReminders.filter(r => r !== value));
    } else {
      setSelectedReminders([...selectedReminders, value]);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'Schedule a Date',
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }} 
        />
        
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Person Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Person *</Text>
            <TouchableOpacity
              style={styles.formInput}
              onPress={() => setShowPersonPicker(true)}
            >
              <View style={styles.personDisplay}>
                {selectedPersonData?.imageUrl && (
                  <Image
                    source={{ uri: selectedPersonData.imageUrl }}
                    style={styles.personPhoto}
                  />
                )}
                <Text style={[styles.formInputText, !selectedPersonName && styles.placeholder]}>
                  {selectedPersonName || 'Select person'}
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="arrow-drop-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Date Type */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date Type</Text>
            <TouchableOpacity
              style={styles.formInput}
              onPress={() => setShowTypePicker(true)}
            >
              <Text style={styles.formInputText}>{dateType}</Text>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="arrow-drop-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date *</Text>
            <TouchableOpacity
              style={styles.formInput}
              onPress={() => {
                if (Platform.OS === 'web') {
                  Alert.alert('Web Support', 'Date picker is not available on web. Please use the text input format: YYYY-MM-DD');
                } else {
                  setShowDatePicker(true);
                }
              }}
            >
              <Text style={styles.formInputText}>
                {dateDate.toLocaleDateString()}
              </Text>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Time */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Time *</Text>
            <TouchableOpacity
              style={styles.formInput}
              onPress={() => {
                if (Platform.OS === 'web') {
                  Alert.alert('Web Support', 'Time picker is not available on web. Please use the text input format: HH:MM');
                } else {
                  setShowTimePicker(true);
                }
              }}
            >
              <Text style={styles.formInputText}>
                {dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <IconSymbol
                ios_icon_name="clock"
                android_material_icon_name="access-time"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Location */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Location / Address *</Text>
            <TextInput
              style={[styles.formInput, styles.textInput]}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter location or address"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.helperText}>
              💡 Tip: Enter the full address for better directions
            </Text>
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.formInput, styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about the date..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Reminders */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Set Reminders</Text>
            <Text style={styles.helperText}>
              Choose when you want to be reminded about this date
            </Text>
            {REMINDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.checkboxRow}
                onPress={() => toggleReminder(option.value)}
              >
                <View style={[styles.checkbox, selectedReminders.includes(option.value) && styles.checkboxActive]}>
                  {selectedReminders.includes(option.value) && (
                    <IconSymbol
                      ios_icon_name="checkmark"
                      android_material_icon_name="check"
                      size={16}
                      color={colors.white}
                    />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Scheduling...' : 'Schedule Date'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* Person Picker Modal */}
        <Modal
          visible={showPersonPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPersonPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Person</Text>
                <TouchableOpacity onPress={() => setShowPersonPicker(false)}>
                  <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {roster.map((person) => (
                  <TouchableOpacity
                    key={person.id}
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedPerson(person.id);
                      setSelectedPersonName(person.name);
                      setSelectedPersonData(person);
                      setShowPersonPicker(false);
                    }}
                  >
                    {person.imageUrl && (
                      <Image
                        source={{ uri: person.imageUrl }}
                        style={styles.pickerPersonPhoto}
                      />
                    )}
                    <Text style={styles.pickerItemText}>{person.name}</Text>
                    {selectedPerson === person.id && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Type Picker Modal */}
        <Modal
          visible={showTypePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTypePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Date Type</Text>
                <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                  <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {DATE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.pickerItem}
                    onPress={() => {
                      setDateType(type);
                      setShowTypePicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{type}</Text>
                    {dateType === type && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Date Picker */}
        {Platform.OS !== 'web' && showDatePicker && DateTimePicker && (
          <DateTimePicker
            value={dateDate}
            mode="date"
            display="default"
            onChange={(event: any, selectedDate?: Date) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDateDate(selectedDate);
              }
            }}
          />
        )}

        {/* Time Picker */}
        {Platform.OS !== 'web' && showTimePicker && DateTimePicker && (
          <DateTimePicker
            value={dateTime}
            mode="time"
            display="default"
            onChange={(event: any, selectedTime?: Date) => {
              setShowTimePicker(false);
              if (selectedTime) {
                setDateTime(selectedTime);
              }
            }}
          />
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formInputText: {
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  textInput: {
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  personDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  personPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  pickerPersonPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
});
