
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { DateEvent, RosterPerson } from '@/types/roster';

// Conditionally import DateTimePicker only on native platforms
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
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

export default function DatingScreen() {
  const { roster, addDate, dates } = useRoster();
  const [showMenu, setShowMenu] = useState(false);
  const [showDateForm, setShowDateForm] = useState(false);
  const [showMyDates, setShowMyDates] = useState(false);
  
  // Date form state
  const [selectedPerson, setSelectedPerson] = useState('');
  const [selectedPersonName, setSelectedPersonName] = useState('');
  const [selectedPersonData, setSelectedPersonData] = useState<RosterPerson | null>(null);
  const [dateType, setDateType] = useState('casual');
  const [dateDate, setDateDate] = useState(new Date());
  const [dateTime, setDateTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState<string[]>(['1d']);
  
  const [showPersonPicker, setShowPersonPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [datesTab, setDatesTab] = useState<'upcoming' | 'completed'>('upcoming');

  const menuItems = [
    {
      title: 'I have a date',
      icon: 'calendar-today',
      iosIcon: 'calendar',
      description: 'Schedule an upcoming date',
      action: () => {
        setShowMenu(false);
        setShowDateForm(true);
      },
    },
    {
      title: "I'm on a date",
      icon: 'security',
      iosIcon: 'shield.fill',
      description: 'Safety features for your date',
      action: () => {
        setShowMenu(false);
        Alert.alert('Coming Soon', 'Safety features will be available soon!');
      },
    },
    {
      title: 'Plan a date',
      icon: 'edit',
      iosIcon: 'pencil',
      description: 'Get date ideas and planning help',
      action: () => {
        setShowMenu(false);
        Alert.alert('Coming Soon', 'Date planning features will be available soon!');
      },
    },
    {
      title: 'Dating Coach',
      icon: 'person',
      iosIcon: 'person.fill',
      description: 'Get advice and tips',
      action: () => {
        setShowMenu(false);
        Alert.alert('Coming Soon', 'Dating coach features will be available soon!');
      },
    },
    {
      title: 'My dates',
      icon: 'favorite',
      iosIcon: 'heart.fill',
      description: 'View your date history',
      action: () => {
        setShowMenu(false);
        setShowMyDates(true);
      },
    },
  ];

  const handleSaveDate = async () => {
    if (!selectedPerson) {
      Alert.alert('Error', 'Please select a person');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    try {
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

      await addDate(newDate);
      
      // Reset form
      setSelectedPerson('');
      setSelectedPersonName('');
      setSelectedPersonData(null);
      setDateType('casual');
      setDateDate(new Date());
      setDateTime(new Date());
      setLocation('');
      setNotes('');
      setNotesExpanded(false);
      setSelectedReminders(['1d']);
      setShowDateForm(false);
      
      Alert.alert('Success', 'Date added successfully!');
    } catch (error) {
      console.error('[Dating] Error saving date:', error);
    }
  };

  const toggleReminder = (value: string) => {
    if (selectedReminders.includes(value)) {
      setSelectedReminders(selectedReminders.filter(r => r !== value));
    } else {
      setSelectedReminders([...selectedReminders, value]);
    }
  };

  const upcomingDates = dates.filter(d => d.status === 'upcoming');
  const completedDates = dates.filter(d => d.status === 'completed');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Dating</Text>
        <Text style={styles.headerSubtitle}>Manage your dating life</Text>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => setShowMenu(true)}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.mainButtonGradient}
          >
            <IconSymbol
              ios_icon_name="heart.fill"
              android_material_icon_name="favorite"
              size={32}
              color={colors.white}
            />
            <Text style={styles.mainButtonText}>Dating Menu</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Tap to access dating features, schedule dates, and get coaching
        </Text>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dating Menu</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.action}
                >
                  <View style={styles.menuIconContainer}>
                    <IconSymbol
                      ios_icon_name={item.iosIcon}
                      android_material_icon_name={item.icon}
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Form Modal */}
      <Modal
        visible={showDateForm}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDateForm(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.formModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Schedule a Date</Text>
                <TouchableOpacity onPress={() => setShowDateForm(false)}>
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.formScroll}>
                {/* Person Selection with Profile Photo */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Person</Text>
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
                  <Text style={styles.formLabel}>Date</Text>
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
                  <Text style={styles.formLabel}>Time</Text>
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
                  <Text style={styles.formLabel}>Location</Text>
                  <TextInput
                    style={[styles.formInput, styles.textInput]}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Enter location or address"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={styles.helperText}>
                    Note: Map integration is not available in this version. Please enter the location name or address.
                  </Text>
                </View>

                {/* Collapsible Notes Field */}
                <View style={styles.formGroup}>
                  <TouchableOpacity
                    style={styles.notesToggle}
                    onPress={() => setNotesExpanded(!notesExpanded)}
                  >
                    <Text style={styles.notesToggleText}>Add notes (optional)</Text>
                    <IconSymbol
                      ios_icon_name={notesExpanded ? "chevron.up" : "chevron.down"}
                      android_material_icon_name={notesExpanded ? "expand-less" : "expand-more"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                  
                  {notesExpanded && (
                    <TextInput
                      style={[styles.formInput, styles.textInput, styles.textArea, styles.notesInput]}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Add any contextual information..."
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={3}
                    />
                  )}
                </View>

                {/* Reminders */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Reminders</Text>
                  {REMINDER_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.checkboxRow}
                      onPress={() => toggleReminder(option.value)}
                    >
                      <View style={styles.checkbox}>
                        {selectedReminders.includes(option.value) && (
                          <IconSymbol
                            ios_icon_name="checkmark"
                            android_material_icon_name="check"
                            size={16}
                            color={colors.primary}
                          />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveDate}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Save Date</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Person Picker Modal */}
      <Modal
        visible={showPersonPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPersonPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Select Person</Text>
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
            <Text style={styles.pickerTitle}>Select Date Type</Text>
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

      {/* Date Picker - Only render on native platforms */}
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

      {/* Time Picker - Only render on native platforms */}
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

      {/* My Dates Modal */}
      <Modal
        visible={showMyDates}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMyDates(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datesModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Dates</Text>
              <TouchableOpacity onPress={() => setShowMyDates(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, datesTab === 'upcoming' && styles.activeTab]}
                onPress={() => setDatesTab('upcoming')}
              >
                <Text style={[styles.tabText, datesTab === 'upcoming' && styles.activeTabText]}>
                  Upcoming ({upcomingDates.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, datesTab === 'completed' && styles.activeTab]}
                onPress={() => setDatesTab('completed')}
              >
                <Text style={[styles.tabText, datesTab === 'completed' && styles.activeTabText]}>
                  Completed ({completedDates.length})
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.datesContent}>
              {(datesTab === 'upcoming' ? upcomingDates : completedDates).map(date => (
                <View key={date.id} style={styles.dateItem}>
                  <Text style={styles.dateTitle}>{date.profileName}</Text>
                  <Text style={styles.dateDetails}>{date.date} at {date.time}</Text>
                  <Text style={styles.dateLocation}>{date.location}</Text>
                  <Text style={styles.dateType}>Type: {date.type}</Text>
                  {date.notes && (
                    <Text style={styles.dateNotes}>Notes: {date.notes}</Text>
                  )}
                </View>
              ))}
              {(datesTab === 'upcoming' ? upcomingDates : completedDates).length === 0 && (
                <Text style={styles.emptyDatesText}>No {datesTab} dates</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  mainButton: {
    width: '100%',
    maxWidth: 300,
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  mainButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  infoText: {
    marginTop: 24,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  formModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
  },
  formScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
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
    fontStyle: 'italic',
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
  pickerPersonPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  notesToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  notesToggleText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  notesInput: {
    marginTop: 8,
    opacity: 0.8,
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
  pickerModal: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingTop: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 16,
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
  datesModal: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  activeTabText: {
    color: '#fff',
    opacity: 1,
    fontWeight: '600',
  },
  datesContent: {
    padding: 16,
  },
  dateItem: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  dateDetails: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    marginTop: 4,
  },
  dateLocation: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
    marginTop: 2,
  },
  dateType: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  dateNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  emptyDatesText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 20,
  },
});
