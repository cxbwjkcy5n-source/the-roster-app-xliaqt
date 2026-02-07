
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
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { LinearGradient } from 'expo-linear-gradient';

// Helper to resolve image sources (handles both local and remote URLs)
function resolveImageSource(source: string | number | undefined): { uri: string } | number {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as number;
}

export default function DateHistoryScreen() {
  const router = useRouter();
  const { dates, roster, bench, rateDate, updateDate, refreshDates } = useRoster();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [showDateDetails, setShowDateDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  // Edit state
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDate, setEditDate] = useState('');
  
  // Rating state
  const [rating, setRating] = useState(0);
  const [wouldGoAgain, setWouldGoAgain] = useState<boolean | null>(null);
  const [ratingNotes, setRatingNotes] = useState('');

  const upcomingDates = dates.filter(d => d.status === 'upcoming');
  const completedDates = dates.filter(d => d.status === 'completed');
  const displayDates = activeTab === 'upcoming' ? upcomingDates : completedDates;

  const handleDateCardPress = (date: any) => {
    console.log('[DateHistory] User tapped date card:', date.id);
    setSelectedDate(date);
    setShowDateDetails(true);
  };

  const handleEditDate = (date: any) => {
    console.log('[DateHistory] User tapped Edit Date button for:', date.id);
    setEditLocation(date.location || '');
    setEditNotes(date.notes || '');
    setEditTime(date.time || '');
    setEditDate(date.date || '');
    setShowDateDetails(false);
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
        date: editDate,
      });
      
      setShowEditModal(false);
      setSelectedDate(null);
      Alert.alert('Success', 'Date updated successfully!');
      await refreshDates();
    } catch (error) {
      console.error('[DateHistory] Error saving date edits:', error);
      Alert.alert('Error', 'Failed to update date. Please try again.');
    }
  };

  const handleRateDate = (date: any) => {
    console.log('[DateHistory] User tapped Rate Date button for:', date.id);
    setRating(date.rating || 0);
    setWouldGoAgain(date.wouldGoAgain ?? null);
    setRatingNotes(date.notes || '');
    setShowDateDetails(false);
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
      setSelectedDate(null);
      setRating(0);
      setWouldGoAgain(null);
      setRatingNotes('');
      Alert.alert('Success', 'Date rating saved successfully!');
      await refreshDates();
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
        colors={[colors.rosterGreen, '#1F6B3A']}
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
            Upcoming
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
            Completed
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
              color={colors.grey}
            />
            <Text style={styles.emptyStateText}>
              No {activeTab} dates
            </Text>
          </View>
        ) : (
          displayDates.map(date => {
            const dateStr = date.date;
            const timeStr = date.time;
            const profileNameStr = date.profileName || 'Unknown';
            const locationStr = date.location || 'No location';
            const typeStr = date.type || 'casual';
            const ratingNum = date.rating || 0;
            
            // Find the person's image
            const allPeople = [...roster, ...bench];
            const person = allPeople.find(p => p.id === date.profileId);
            const personImageUrl = person?.imageUrl;
            
            return (
              <TouchableOpacity
                key={date.id}
                style={styles.dateCard}
                onPress={() => handleDateCardPress(date)}
              >
                <View style={styles.dateCardHeader}>
                  {personImageUrl && (
                    <Image 
                      source={resolveImageSource(personImageUrl)} 
                      style={styles.dateCardImage}
                    />
                  )}
                  <View style={styles.dateCardHeaderText}>
                    <Text style={styles.dateCardName}>{profileNameStr}</Text>
                    <View style={styles.dateCardTypeBadge}>
                      <Text style={styles.dateCardTypeText}>{typeStr}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.dateCardRow}>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={14}
                    color={colors.grey}
                  />
                  <Text style={styles.dateCardDetail}>{dateStr} at {timeStr}</Text>
                </View>
                
                <View style={styles.dateCardRow}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={14}
                    color={colors.grey}
                  />
                  <Text style={styles.dateCardDetail}>{locationStr}</Text>
                </View>
                
                {activeTab === 'completed' && ratingNum > 0 && (
                  <View style={styles.dateCardRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <IconSymbol
                        key={star}
                        ios_icon_name={star <= ratingNum ? "star.fill" : "star"}
                        android_material_icon_name={star <= ratingNum ? "star" : "star-border"}
                        size={14}
                        color={star <= ratingNum ? colors.warning : colors.grey}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Date Details Modal - FIX: Full screen modal with proper scrolling */}
      <Modal
        visible={showDateDetails}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowDateDetails(false)}
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Date Details</Text>
            <TouchableOpacity onPress={() => setShowDateDetails(false)}>
              <IconSymbol 
                ios_icon_name="xmark" 
                android_material_icon_name="close" 
                size={24} 
                color={colors.darkText} 
              />
            </TouchableOpacity>
          </View>

          {selectedDate && (
            <ScrollView 
              style={styles.dateDetailsScroll} 
              contentContainerStyle={styles.dateDetailsContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.dateDetailsName}>{selectedDate.profileName || 'Unknown'}</Text>
              
              <View style={styles.dateDetailsSection}>
                <View style={styles.dateDetailsRow}>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={20}
                    color={colors.rosterGreen}
                  />
                  <View style={styles.dateDetailsTextContainer}>
                    <Text style={styles.dateDetailsLabel}>Date & Time</Text>
                    <Text style={styles.dateDetailsValue}>
                      {selectedDate.date} at {selectedDate.time}
                    </Text>
                  </View>
                </View>

                <View style={styles.dateDetailsRow}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={20}
                    color={colors.rosterGreen}
                  />
                  <View style={styles.dateDetailsTextContainer}>
                    <Text style={styles.dateDetailsLabel}>Location</Text>
                    <Text style={styles.dateDetailsValue}>{selectedDate.location || 'No location'}</Text>
                  </View>
                </View>

                <View style={styles.dateDetailsRow}>
                  <IconSymbol
                    ios_icon_name="tag.fill"
                    android_material_icon_name="label"
                    size={20}
                    color={colors.rosterGreen}
                  />
                  <View style={styles.dateDetailsTextContainer}>
                    <Text style={styles.dateDetailsLabel}>Type</Text>
                    <Text style={styles.dateDetailsValue}>{selectedDate.type || 'casual'}</Text>
                  </View>
                </View>

                {selectedDate.notes && (
                  <View style={styles.dateDetailsRow}>
                    <IconSymbol
                      ios_icon_name="note.text"
                      android_material_icon_name="description"
                      size={20}
                      color={colors.rosterGreen}
                    />
                    <View style={styles.dateDetailsTextContainer}>
                      <Text style={styles.dateDetailsLabel}>Notes</Text>
                      <Text style={styles.dateDetailsValue}>{selectedDate.notes}</Text>
                    </View>
                  </View>
                )}

                {selectedDate.status === 'completed' && selectedDate.rating && (
                  <View style={styles.dateDetailsRow}>
                    <IconSymbol
                      ios_icon_name="star.fill"
                      android_material_icon_name="star"
                      size={20}
                      color={colors.warning}
                    />
                    <View style={styles.dateDetailsTextContainer}>
                      <Text style={styles.dateDetailsLabel}>Rating</Text>
                      <View style={styles.dateDetailsRatingRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <IconSymbol
                            key={star}
                            ios_icon_name={star <= (selectedDate.rating || 0) ? "star.fill" : "star"}
                            android_material_icon_name={star <= (selectedDate.rating || 0) ? "star" : "star-border"}
                            size={18}
                            color={star <= (selectedDate.rating || 0) ? colors.warning : colors.grey}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                )}

                {selectedDate.status === 'completed' && selectedDate.wouldGoAgain !== undefined && (
                  <View style={styles.dateDetailsRow}>
                    <IconSymbol
                      ios_icon_name={selectedDate.wouldGoAgain ? "checkmark.circle.fill" : "xmark.circle.fill"}
                      android_material_icon_name={selectedDate.wouldGoAgain ? "check-circle" : "cancel"}
                      size={20}
                      color={selectedDate.wouldGoAgain ? colors.rosterGreen : colors.actionRed}
                    />
                    <View style={styles.dateDetailsTextContainer}>
                      <Text style={styles.dateDetailsLabel}>Would Go Again?</Text>
                      <Text style={[
                        styles.dateDetailsValue,
                        { color: selectedDate.wouldGoAgain ? colors.rosterGreen : colors.actionRed }
                      ]}>
                        {selectedDate.wouldGoAgain ? 'Yes' : 'No'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.dateActionButtons}>
                <TouchableOpacity
                  style={styles.editDateButton}
                  onPress={() => handleEditDate(selectedDate)}
                >
                  <LinearGradient
                    colors={[colors.rosterGreen, '#1a7a4d']}
                    style={styles.editDateButtonGradient}
                  >
                    <IconSymbol
                      ios_icon_name="pencil"
                      android_material_icon_name="edit"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.editDateButtonText}>Edit Date</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {selectedDate.status === 'completed' && (
                  <TouchableOpacity
                    style={styles.rateDateButton}
                    onPress={() => handleRateDate(selectedDate)}
                  >
                    <LinearGradient
                      colors={['#FF6B9D', '#C44569']}
                      style={styles.editDateButtonGradient}
                    >
                      <IconSymbol
                        ios_icon_name="star.fill"
                        android_material_icon_name="star"
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.editDateButtonText}>
                        {selectedDate.rating ? 'Update Rating' : 'Rate Date'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
        presentationStyle="pageSheet"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlayTop}>
            <View style={styles.modalContentTop}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Date</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <IconSymbol 
                    ios_icon_name="xmark" 
                    android_material_icon_name="close" 
                    size={24} 
                    color={colors.darkText} 
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.editModalContent}>
                {selectedDate && (
                  <Text style={styles.editDateName}>{selectedDate.profileName}</Text>
                )}

                <View style={styles.editSection}>
                  <Text style={styles.editLabel}>Date</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editDate}
                    onChangeText={setEditDate}
                    placeholder="Enter date (e.g., Jan 15, 2024)"
                    placeholderTextColor={colors.grey}
                  />
                </View>

                <View style={styles.editSection}>
                  <Text style={styles.editLabel}>Time</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editTime}
                    onChangeText={setEditTime}
                    placeholder="Enter time (e.g., 7:00 PM)"
                    placeholderTextColor={colors.grey}
                  />
                </View>

                <View style={styles.editSection}>
                  <Text style={styles.editLabel}>Location</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editLocation}
                    onChangeText={setEditLocation}
                    placeholder="Enter location"
                    placeholderTextColor={colors.grey}
                  />
                </View>

                <View style={styles.editSection}>
                  <Text style={styles.editLabel}>Notes</Text>
                  <TextInput
                    style={[styles.editInput, styles.notesInput]}
                    value={editNotes}
                    onChangeText={setEditNotes}
                    placeholder="Add notes..."
                    placeholderTextColor={colors.grey}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveEditButton}
                  onPress={handleSaveEdit}
                >
                  <LinearGradient
                    colors={[colors.rosterGreen, '#1a7a4d']}
                    style={styles.saveEditButtonGradient}
                  >
                    <Text style={styles.saveEditButtonText}>Save Changes</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRatingModal(false)}
        presentationStyle="pageSheet"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlayTop}>
            <View style={styles.modalContentTop}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Rate Your Date</Text>
                <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                  <IconSymbol 
                    ios_icon_name="xmark" 
                    android_material_icon_name="close" 
                    size={24} 
                    color={colors.darkText} 
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.ratingModalContent}>
                {selectedDate && (
                  <Text style={styles.ratingDateName}>{selectedDate.profileName}</Text>
                )}

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
                          color={star <= rating ? colors.warning : colors.grey}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.ratingSection}>
                  <Text style={styles.ratingLabel}>Would you go on this date again?</Text>
                  <View style={styles.wouldGoAgainButtons}>
                    <TouchableOpacity
                      style={[
                        styles.wouldGoAgainButton,
                        wouldGoAgain === true && styles.wouldGoAgainButtonActiveYes,
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
                        color={wouldGoAgain === true ? '#fff' : colors.rosterGreen}
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
                        wouldGoAgain === false && styles.wouldGoAgainButtonActiveNo,
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
                        color={wouldGoAgain === false ? '#fff' : colors.actionRed}
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

                <View style={styles.ratingSection}>
                  <Text style={styles.ratingLabel}>Notes (optional)</Text>
                  <TextInput
                    style={styles.ratingNotesInput}
                    value={ratingNotes}
                    onChangeText={setRatingNotes}
                    placeholder="Add any notes about the date..."
                    placeholderTextColor={colors.grey}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveRatingButton}
                  onPress={handleSaveRating}
                >
                  <LinearGradient
                    colors={['#FF6B9D', '#C44569']}
                    style={styles.saveRatingButtonGradient}
                  >
                    <Text style={styles.saveRatingButtonText}>Save Rating</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
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
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.rosterGreen,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.grey,
  },
  activeTabText: {
    color: colors.white,
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
    color: colors.darkText,
    marginTop: 16,
  },
  dateCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  dateCardImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundAlt,
  },
  dateCardHeaderText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.darkText,
    flex: 1,
  },
  dateCardTypeBadge: {
    backgroundColor: colors.rosterGreen + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateCardTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.rosterGreen,
    textTransform: 'capitalize',
  },
  dateCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateCardDetail: {
    fontSize: 14,
    color: colors.grey,
  },
  dateCardRating: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalOverlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  modalContentTop: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    maxHeight: '90%',
    minHeight: 400,
    paddingBottom: 40,
    marginTop: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.darkText,
  },
  dateDetailsScroll: {
    flex: 1,
  },
  dateDetailsContent: {
    padding: 20,
    paddingBottom: 40,
  },
  dateDetailsName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.darkText,
    marginBottom: 24,
    textAlign: 'center',
  },
  dateDetailsSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateDetailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  dateDetailsTextContainer: {
    flex: 1,
  },
  dateDetailsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.grey,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateDetailsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkText,
  },
  dateDetailsRatingRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  dateActionButtons: {
    gap: 12,
  },
  editDateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  rateDateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  editDateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  editDateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  editModalContent: {
    padding: 20,
  },
  editDateName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.darkText,
    marginBottom: 24,
    textAlign: 'center',
  },
  editSection: {
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkText,
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.darkText,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInput: {
    minHeight: 100,
  },
  saveEditButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveEditButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveEditButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingModalContent: {
    padding: 20,
  },
  ratingDateName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.darkText,
    marginBottom: 24,
    textAlign: 'center',
  },
  ratingSection: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkText,
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
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  wouldGoAgainButtonActiveYes: {
    backgroundColor: colors.rosterGreen,
    borderColor: colors.rosterGreen,
  },
  wouldGoAgainButtonActiveNo: {
    backgroundColor: colors.actionRed,
    borderColor: colors.actionRed,
  },
  wouldGoAgainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkText,
  },
  wouldGoAgainButtonTextActive: {
    color: '#fff',
  },
  ratingNotesInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.darkText,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
  },
  saveRatingButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveRatingButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveRatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
