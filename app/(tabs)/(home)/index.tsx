
import React, { useState, useEffect } from 'react';
import { RosterPerson } from '@/types/roster';
import { authenticatedGet } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRoster } from '@/contexts/RosterContext';
import { colors, gradients } from '@/styles/commonStyles';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateEvent } from '@/types/roster';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

interface Analytics {
  totalProfiles: number;
  totalDates: number;
  upcomingDates: number;
  completedDates: number;
  interestLevelBreakdown: {
    low: number;
    medium: number;
    high: number;
  };
  statusBreakdown: {
    roster: number;
    bench: number;
  };
}

export default function RosterScreen() {
  const router = useRouter();
  const { roster, bench, loading: rosterLoading, dates, refreshDates, updateDate, rateDate } = useRoster();
  const { user, loading: authLoading } = useAuth();
  const [showMyDates, setShowMyDates] = useState(false);
  const [datesTab, setDatesTab] = useState<'upcoming' | 'completed'>('upcoming');
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

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[Home] User not logged in, redirecting to auth');
      router.replace('/auth');
    }
  }, [user, authLoading, router]);

  if (authLoading || rosterLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.rosterGreen} />
      </View>
    );
  }

  const getInterestColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return colors.rosterGreen;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.actionRed;
      default:
        return colors.grey;
    }
  };

  const handleEditDate = (date: any) => {
    console.log('[Home] User tapped Edit Date button for:', date.id);
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
      console.log('[Home] Saving date edits');
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
      console.error('[Home] Error saving date edits:', error);
      Alert.alert('Error', 'Failed to update date. Please try again.');
    }
  };

  const handleRateDate = (date: any) => {
    console.log('[Home] User tapped Rate Date button for:', date.id);
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
      console.log('[Home] Saving rating:', { rating, wouldGoAgain, notes: ratingNotes });
      
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
      console.error('[Home] Error saving rating:', error);
      Alert.alert('Error', 'Failed to save rating. Please try again.');
    }
  };

  const renderPersonCard = ({ item }: { item: RosterPerson }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          console.log('[Home] User tapped person card:', item.name);
          router.push(`/person/${item.id}`);
        }}
        style={styles.personCard}
        activeOpacity={0.9}
      >
        <Image
          source={
            item.imageUrl
              ? { uri: item.imageUrl }
              : require('@/assets/images/final_quest_240x240.png')
          }
          style={styles.personImage}
        />
        <View
          style={[
            styles.interestBadge,
            { backgroundColor: getInterestColor(item.interestLevel) },
          ]}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.personInfoGradient}
        >
          <View style={styles.personInfo}>
            <Text style={styles.personName}>{item.name}</Text>
            <Text style={styles.personDetails}>
              {item.age} • {item.location}
            </Text>
            <View style={styles.flagsContainer}>
              {item.redFlags && item.redFlags.length > 0 && (
                <View style={[styles.flagBadge, { backgroundColor: 'rgba(233, 36, 63, 0.9)' }]}>
                  <IconSymbol 
                    ios_icon_name="flag.fill" 
                    android_material_icon_name="flag" 
                    size={12} 
                    color={colors.white} 
                  />
                  <Text style={styles.flagCount}>{item.redFlags.length}</Text>
                </View>
              )}
              {item.greenFlags && item.greenFlags.length > 0 && (
                <View style={[styles.flagBadge, { backgroundColor: 'rgba(17, 163, 106, 0.9)' }]}>
                  <IconSymbol 
                    ios_icon_name="flag.fill" 
                    android_material_icon_name="flag" 
                    size={12} 
                    color={colors.white} 
                  />
                  <Text style={styles.flagCount}>{item.greenFlags.length}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <TouchableOpacity
      style={styles.emptyCard}
      onPress={() => {
        console.log('[Home] User tapped empty state - navigating to add person');
        router.push('/person/add');
      }}
      activeOpacity={0.8}
    >
      <IconSymbol 
        ios_icon_name="plus.circle" 
        android_material_icon_name="add-circle-outline" 
        size={72} 
        color={colors.grey} 
      />
      <Text style={styles.emptyText}>Add your first person</Text>
      <Text style={styles.emptySubtext}>Tap to get started</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* GREEN Header with "WHERE EVERYONE PLAYS THEIR POSITION" */}
      <LinearGradient
        colors={['#2D8B4E', '#1F6B3A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>THE ROSTER</Text>
          <Text style={styles.headerSubtitle}>WHERE EVERYONE PLAYS THEIR POSITION</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              console.log('[Home] User tapped calendar button');
              setShowMyDates(true);
            }}
            activeOpacity={0.7}
          >
            <IconSymbol 
              ios_icon_name="calendar" 
              android_material_icon_name="calendar-today" 
              size={22} 
              color={colors.white} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              console.log('[Home] User tapped analytics button - navigating to full screen');
              router.push('/dating/analytics');
            }}
            activeOpacity={0.7}
          >
            <IconSymbol 
              ios_icon_name="chart.bar.fill" 
              android_material_icon_name="bar-chart" 
              size={22} 
              color={colors.white} 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Add transparent logo here */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/799535b5-0e83-4d1e-bf79-2fae663be2a2.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {roster.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            {renderEmptyState()}
          </View>
        ) : (
          <FlatList
            data={roster}
            renderItem={renderPersonCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* My Dates Modal */}
      <Modal
        visible={showMyDates}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMyDates(false)}
        presentationStyle="pageSheet"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlayTop}>
            <View style={styles.modalContentTop}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>My Dates</Text>
                <TouchableOpacity onPress={() => setShowMyDates(false)}>
                  <IconSymbol 
                    ios_icon_name="xmark" 
                    android_material_icon_name="close" 
                    size={24} 
                    color={colors.darkText} 
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, datesTab === 'upcoming' && styles.tabActive]}
                  onPress={() => setDatesTab('upcoming')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      datesTab === 'upcoming' && styles.tabTextActive,
                    ]}
                  >
                    Upcoming
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, datesTab === 'completed' && styles.tabActive]}
                  onPress={() => setDatesTab('completed')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      datesTab === 'completed' && styles.tabTextActive,
                    ]}
                  >
                    Completed
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Add Date Button */}
              <View style={styles.addDateButtonContainer}>
                <TouchableOpacity
                  style={styles.addDateButton}
                  onPress={() => {
                    console.log('[Home] User tapped Add a Date button');
                    setShowMyDates(false);
                    router.push('/dating/schedule');
                  }}
                >
                  <LinearGradient
                    colors={[colors.rosterGreen, '#1a7a4d']}
                    style={styles.addDateButtonGradient}
                  >
                    <IconSymbol
                      ios_icon_name="plus.circle.fill"
                      android_material_icon_name="add-circle"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.addDateButtonText}>Add a Date</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.datesScroll}>
                {dates.filter(d => d.status === datesTab).length === 0 ? (
                  <Text style={styles.emptyDatesText}>
                    No {datesTab} dates
                  </Text>
                ) : (
                  dates
                    .filter(d => d.status === datesTab)
                    .map((date) => {
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
                          onPress={() => {
                            console.log('[Home] User tapped date card:', date.id);
                            setSelectedDate(date);
                            setShowDateDetails(true);
                          }}
                        >
                          <View style={styles.dateCardHeader}>
                            {personImageUrl && (
                              <Image 
                                source={{ uri: personImageUrl }} 
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
                          
                          {datesTab === 'completed' && ratingNum > 0 && (
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
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Date Details Modal */}
      <Modal
        visible={showDateDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDateDetails(false)}
        presentationStyle="pageSheet"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlayTop}>
            <View style={styles.modalContentTop}>
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
                <ScrollView style={styles.dateDetailsScroll} contentContainerStyle={styles.dateDetailsContent}>
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
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Date Modal */}
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
                          console.log('[Home] User selected rating:', star);
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
                        console.log('[Home] User selected: Would go again');
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
                        console.log('[Home] User selected: Would not go again');
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
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.white,
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.95,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    position: 'absolute',
    top: 20,
    right: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    opacity: 0.15,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  listContent: {
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  personCard: {
    width: '47%',
    aspectRatio: 0.75,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  personImage: {
    width: '100%',
    height: '100%',
  },
  interestBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  personInfoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
  },
  personInfo: {
    padding: 16,
  },
  personName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  personDetails: {
    fontSize: 15,
    color: colors.white,
    marginTop: 4,
    fontWeight: '600',
    opacity: 0.95,
  },
  flagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  flagCount: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '700',
  },
  emptyCard: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.darkText,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 6,
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
    maxHeight: '70%',
    minHeight: 300,
    paddingBottom: 40,
    marginTop: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.darkText,
  },
  tabContainer: {
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
  tabActive: {
    backgroundColor: colors.rosterGreen,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.grey,
  },
  tabTextActive: {
    color: colors.white,
  },
  addDateButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  addDateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addDateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  addDateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  datesScroll: {
    padding: 16,
  },
  emptyDatesText: {
    textAlign: 'center',
    color: colors.grey,
    fontSize: 16,
    marginTop: 40,
    fontWeight: '500',
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
