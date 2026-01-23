
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function DateHistoryScreen() {
  const router = useRouter();
  const { dates, rateDate, updateDate } = useRoster();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [wouldGoAgain, setWouldGoAgain] = useState<boolean | null>(null);
  const [ratingNotes, setRatingNotes] = useState('');
  const [showScheduleAnotherDate, setShowScheduleAnotherDate] = useState(false);
  
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTime, setEditTime] = useState('');

  const upcomingDates = dates.filter(d => d.status === 'upcoming');
  const completedDates = dates.filter(d => d.status === 'completed');

  const displayDates = activeTab === 'upcoming' ? upcomingDates : completedDates;

  const handleEditDate = (date: any) => {
    console.log('[DateHistory] User tapped to edit date:', date.id);
    setSelectedDate(date);
    setEditLocation(date.location || '');
    setEditNotes(date.notes || '');
    setEditTime(date.time || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDate) return;
    
    try {
      console.log('[DateHistory] Saving date edits');
      await updateDate({
        ...selectedDate,
        location: editLocation,
        notes: editNotes,
        time: editTime,
      });
      
      setShowEditModal(false);
      setSelectedDate(null);
      Alert.alert('Success', 'Date updated successfully!');
    } catch (error) {
      console.error('[DateHistory] Error saving date edits:', error);
      Alert.alert('Error', 'Failed to update date. Please try again.');
    }
  };

  const handleRateDate = (date: any) => {
    console.log('[DateHistory] User tapped to rate date:', date.id);
    setSelectedDate(date);
    setRating(date.rating || 0);
    setWouldGoAgain(date.wouldGoAgain ?? null);
    setRatingNotes(date.notes || '');
    setShowRatingModal(true);
  };

  const handleSaveRating = async () => {
    if (!selectedDate) return;
    
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before saving.');
      return;
    }
    
    if (wouldGoAgain === null) {
      Alert.alert('Decision Required', 'Please indicate if you would go on this date again.');
      return;
    }

    try {
      console.log('[DateHistory] Saving rating:', { rating, wouldGoAgain, notes: ratingNotes });
      
      await rateDate(selectedDate.id, rating, wouldGoAgain);
      
      if (ratingNotes !== selectedDate.notes) {
        await updateDate({
          ...selectedDate,
          notes: ratingNotes,
        });
      }
      
      setShowRatingModal(false);
      
      // If they would go again, ask if they want to schedule another date
      if (wouldGoAgain) {
        setShowScheduleAnotherDate(true);
      } else {
        // Reset and show success
        setSelectedDate(null);
        setRating(0);
        setWouldGoAgain(null);
        setRatingNotes('');
        Alert.alert('Success', 'Date rating saved successfully!');
      }
    } catch (error) {
      console.error('[DateHistory] Error saving rating:', error);
      Alert.alert('Error', 'Failed to save rating. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      
      <LinearGradient
        colors={['#FF6B9D', '#C44569']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log('[DateHistory] User tapped back button');
            router.back();
          }}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Dates</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => {
            console.log('[DateHistory] User switched to Upcoming tab');
            setActiveTab('upcoming');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming ({upcomingDates.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => {
            console.log('[DateHistory] User switched to Completed tab');
            setActiveTab('completed');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed ({completedDates.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {displayDates.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>
              No {activeTab} dates
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === 'upcoming' 
                ? 'Schedule a date to get started'
                : 'Your completed dates will appear here'}
            </Text>
          </View>
        ) : (
          displayDates.map(date => (
            <TouchableOpacity
              key={date.id}
              style={styles.dateCard}
              onPress={() => handleEditDate(date)}
            >
              <View style={styles.dateHeader}>
                <View style={styles.dateHeaderLeft}>
                  <Text style={styles.dateName}>{date.profileName}</Text>
                  <View style={styles.dateType}>
                    <Text style={styles.dateTypeText}>{date.type}</Text>
                  </View>
                </View>
                {date.status === 'completed' && date.rating && (
                  <View style={styles.ratingContainer}>
                    {[...Array(5)].map((_, i) => (
                      <IconSymbol
                        key={i}
                        ios_icon_name={i < date.rating! ? "star.fill" : "star"}
                        android_material_icon_name={i < date.rating! ? "star" : "star-border"}
                        size={16}
                        color={i < date.rating! ? colors.warning : colors.textSecondary}
                      />
                    ))}
                  </View>
                )}
              </View>
              
              <View style={styles.dateDetail}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.dateDetailText}>{date.date} at {date.time}</Text>
              </View>
              
              <View style={styles.dateDetail}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="location-on"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.dateDetailText}>{date.location}</Text>
              </View>
              
              {date.notes && (
                <View style={styles.dateNotes}>
                  <Text style={styles.dateNotesText}>{date.notes}</Text>
                </View>
              )}
              
              {date.status === 'completed' && date.wouldGoAgain !== undefined && (
                <View style={styles.wouldGoAgainContainer}>
                  <IconSymbol
                    ios_icon_name={date.wouldGoAgain ? "checkmark.circle.fill" : "xmark.circle.fill"}
                    android_material_icon_name={date.wouldGoAgain ? "check-circle" : "cancel"}
                    size={16}
                    color={date.wouldGoAgain ? colors.success : colors.danger}
                  />
                  <Text style={[styles.wouldGoAgainText, { color: date.wouldGoAgain ? colors.success : colors.danger }]}>
                    {date.wouldGoAgain ? 'Would go again' : 'Would not go again'}
                  </Text>
                </View>
              )}
              
              {date.status === 'completed' && (
                <TouchableOpacity
                  style={styles.rateButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRateDate(date);
                  }}
                >
                  <IconSymbol
                    ios_icon_name="star.fill"
                    android_material_icon_name="star"
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.rateButtonText}>
                    {date.rating ? 'Update Rating' : 'Rate Date'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {date.reminders && date.reminders.length > 0 && activeTab === 'upcoming' && (
                <View style={styles.remindersContainer}>
                  <IconSymbol
                    ios_icon_name="bell.fill"
                    android_material_icon_name="notifications"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.remindersText}>
                    {date.reminders.length} reminder{date.reminders.length > 1 ? 's' : ''} set
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit Date</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalContent}>
              {selectedDate && (
                <Text style={styles.editDateName}>{selectedDate.profileName}</Text>
              )}

              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Location</Text>
                <TextInput
                  style={styles.editInput}
                  value={editLocation}
                  onChangeText={setEditLocation}
                  placeholder="Enter location"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Time</Text>
                <TextInput
                  style={styles.editInput}
                  value={editTime}
                  onChangeText={setEditTime}
                  placeholder="Enter time"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.editSection}>
                <Text style={styles.editLabel}>Notes</Text>
                <TextInput
                  style={[styles.editInput, styles.notesInput]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Add notes..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={styles.saveEditButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveEditButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModal}>
            <View style={styles.ratingModalHeader}>
              <Text style={styles.ratingModalTitle}>Rate Your Date</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.ratingModalContent}>
              {selectedDate && (
                <Text style={styles.ratingDateName}>{selectedDate.profileName}</Text>
              )}

              {/* Star Rating */}
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>How was the date?</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => {
                        console.log('[DateHistory] User selected rating:', star);
                        setRating(star);
                      }}
                    >
                      <IconSymbol
                        ios_icon_name={star <= rating ? "star.fill" : "star"}
                        android_material_icon_name={star <= rating ? "star" : "star-border"}
                        size={40}
                        color={star <= rating ? colors.warning : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Would Go Again */}
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>Would you go on this date again?</Text>
                <View style={styles.wouldGoAgainButtons}>
                  <TouchableOpacity
                    style={[
                      styles.wouldGoAgainButton,
                      wouldGoAgain === true && styles.wouldGoAgainButtonActive,
                      { borderColor: colors.success }
                    ]}
                    onPress={() => {
                      console.log('[DateHistory] User selected: Would go again');
                      setWouldGoAgain(true);
                    }}
                  >
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={24}
                      color={wouldGoAgain === true ? '#fff' : colors.success}
                    />
                    <Text style={[
                      styles.wouldGoAgainButtonText,
                      wouldGoAgain === true && styles.wouldGoAgainButtonTextActive
                    ]}>
                      Yes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.wouldGoAgainButton,
                      wouldGoAgain === false && styles.wouldGoAgainButtonActive,
                      { borderColor: colors.danger }
                    ]}
                    onPress={() => {
                      console.log('[DateHistory] User selected: Would not go again');
                      setWouldGoAgain(false);
                    }}
                  >
                    <IconSymbol
                      ios_icon_name="xmark.circle.fill"
                      android_material_icon_name="cancel"
                      size={24}
                      color={wouldGoAgain === false ? '#fff' : colors.danger}
                    />
                    <Text style={[
                      styles.wouldGoAgainButtonText,
                      wouldGoAgain === false && styles.wouldGoAgainButtonTextActive
                    ]}>
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>Notes (optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  value={ratingNotes}
                  onChangeText={setRatingNotes}
                  placeholder="Add any notes about the date..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={styles.saveRatingButton}
                onPress={handleSaveRating}
              >
                <Text style={styles.saveRatingButtonText}>Save Rating</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Schedule Another Date Modal */}
      <Modal
        visible={showScheduleAnotherDate}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setShowScheduleAnotherDate(false);
          setSelectedDate(null);
          setRating(0);
          setWouldGoAgain(null);
          setRatingNotes('');
        }}
      >
        <View style={styles.scheduleAnotherOverlay}>
          <View style={styles.scheduleAnotherModal}>
            <IconSymbol
              ios_icon_name="heart.fill"
              android_material_icon_name="favorite"
              size={48}
              color={colors.primary}
            />
            <Text style={styles.scheduleAnotherTitle}>Great to hear!</Text>
            <Text style={styles.scheduleAnotherMessage}>
              Would you like to schedule another date with {selectedDate?.profileName}?
            </Text>
            
            <View style={styles.scheduleAnotherButtons}>
              <TouchableOpacity
                style={[styles.scheduleAnotherButton, styles.scheduleAnotherButtonSecondary]}
                onPress={() => {
                  console.log('[DateHistory] User declined to schedule another date');
                  setShowScheduleAnotherDate(false);
                  setSelectedDate(null);
                  setRating(0);
                  setWouldGoAgain(null);
                  setRatingNotes('');
                  Alert.alert('Success', 'Date rating saved successfully!');
                }}
              >
                <Text style={styles.scheduleAnotherButtonTextSecondary}>Not Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.scheduleAnotherButton, styles.scheduleAnotherButtonPrimary]}
                onPress={() => {
                  console.log('[DateHistory] User wants to schedule another date');
                  setShowScheduleAnotherDate(false);
                  setSelectedDate(null);
                  setRating(0);
                  setWouldGoAgain(null);
                  setRatingNotes('');
                  router.push('/dating/schedule');
                }}
              >
                <Text style={styles.scheduleAnotherButtonTextPrimary}>Yes, Schedule!</Text>
              </TouchableOpacity>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSpacer: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.card,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  dateCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  dateType: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dateTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  dateDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dateNotes: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  dateNotesText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  wouldGoAgainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  wouldGoAgainText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  remindersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  remindersText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  editModal: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  editModalContent: {
    padding: 20,
  },
  editDateName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  editSection: {
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveEditButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveEditButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingModal: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  ratingModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ratingModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  ratingModalContent: {
    padding: 20,
  },
  ratingDateName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  ratingSection: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  wouldGoAgainButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  wouldGoAgainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: colors.card,
  },
  wouldGoAgainButtonActive: {
    backgroundColor: colors.primary,
  },
  wouldGoAgainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  wouldGoAgainButtonTextActive: {
    color: '#fff',
  },
  notesInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
  },
  saveRatingButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveRatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleAnotherOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scheduleAnotherModal: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  scheduleAnotherTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  scheduleAnotherMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  scheduleAnotherButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  scheduleAnotherButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  scheduleAnotherButtonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scheduleAnotherButtonPrimary: {
    backgroundColor: colors.primary,
  },
  scheduleAnotherButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  scheduleAnotherButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
