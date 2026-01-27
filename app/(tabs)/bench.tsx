
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { authenticatedGet } from '@/utils/api';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 64) / 2;

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

export default function BenchScreen() {
  const router = useRouter();
  const { bench, dates, roster, updateDate, rateDate, refreshDates } = useRoster();
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [datesTab, setDatesTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
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
  const displayDates = datesTab === 'upcoming' ? upcomingDates : completedDates;

  const loadAnalytics = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      console.log('[Bench] Loading analytics...');
      const data = await authenticatedGet<Analytics>('/api/analytics');
      console.log('[Bench] Analytics loaded:', data);
      setAnalytics(data);
    } catch (error) {
      console.error('[Bench] Error loading analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    if (showAnalyticsModal && !analytics) {
      loadAnalytics();
    }
  }, [showAnalyticsModal, analytics, loadAnalytics]);

  const handleEditDate = (date: any) => {
    console.log('[Bench] User tapped Edit Date button for:', date.id);
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
      console.log('[Bench] Saving date edits');
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
      console.error('[Bench] Error saving date edits:', error);
      Alert.alert('Error', 'Failed to update date. Please try again.');
    }
  };

  const handleRateDate = (date: any) => {
    console.log('[Bench] User tapped Rate Date button for:', date.id);
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
      console.log('[Bench] Saving rating:', { rating, wouldGoAgain, notes: ratingNotes });
      
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
      console.error('[Bench] Error saving rating:', error);
      Alert.alert('Error', 'Failed to save rating. Please try again.');
    }
  };

  const getInterestPercentages = () => {
    if (!analytics) return { high: 0, medium: 0, low: 0 };
    const total = analytics.interestLevelBreakdown.high + 
                  analytics.interestLevelBreakdown.medium + 
                  analytics.interestLevelBreakdown.low;
    if (total === 0) return { high: 0, medium: 0, low: 0 };
    return {
      high: (analytics.interestLevelBreakdown.high / total) * 100,
      medium: (analytics.interestLevelBreakdown.medium / total) * 100,
      low: (analytics.interestLevelBreakdown.low / total) * 100,
    };
  };

  const renderAnalyticsInfographic = () => {
    if (!analytics) {
      console.log('[Bench] Analytics is null, cannot render infographic');
      return null;
    }
    
    console.log('[Bench] Rendering analytics infographic with data:', analytics);
    
    const interestPercentages = getInterestPercentages();
    const totalProfiles = analytics.totalProfiles;
    const rosterPercentage = totalProfiles > 0 ? (analytics.statusBreakdown.roster / totalProfiles) * 100 : 0;
    const benchPercentage = totalProfiles > 0 ? (analytics.statusBreakdown.bench / totalProfiles) * 100 : 0;

    return (
      <ScrollView style={styles.analyticsScroll} contentContainerStyle={styles.analyticsContent}>
        {/* Hero Stats */}
        <View style={styles.heroStatsContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.heroStatCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <IconSymbol
              ios_icon_name="person.3.fill"
              android_material_icon_name="group"
              size={32}
              color="#fff"
            />
            <Text style={styles.heroStatValue}>{analytics.totalProfiles}</Text>
            <Text style={styles.heroStatLabel}>Total Profiles</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#FF6B9D', '#C44569']}
            style={styles.heroStatCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={32}
              color="#fff"
            />
            <Text style={styles.heroStatValue}>{analytics.totalDates}</Text>
            <Text style={styles.heroStatLabel}>Total Dates</Text>
          </LinearGradient>
        </View>

        {/* Dates Breakdown */}
        <View style={styles.infographicSection}>
          <Text style={styles.sectionTitle}>📅 Dates Overview</Text>
          <View style={styles.datesBreakdownContainer}>
            <View style={styles.dateBreakdownCard}>
              <View style={[styles.dateIconCircle, { backgroundColor: '#4FACFE' }]}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="schedule"
                  size={24}
                  color="#fff"
                />
              </View>
              <Text style={styles.dateBreakdownValue}>{analytics.upcomingDates}</Text>
              <Text style={styles.dateBreakdownLabel}>Upcoming</Text>
            </View>

            <View style={styles.dateBreakdownCard}>
              <View style={[styles.dateIconCircle, { backgroundColor: '#2E7D32' }]}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={24}
                  color="#fff"
                />
              </View>
              <Text style={styles.dateBreakdownValue}>{analytics.completedDates}</Text>
              <Text style={styles.dateBreakdownLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Interest Level Breakdown */}
        <View style={styles.infographicSection}>
          <Text style={styles.sectionTitle}>💚 Interest Levels</Text>
          
          {/* High Interest */}
          <View style={styles.interestRow}>
            <View style={styles.interestLabelContainer}>
              <View style={[styles.interestDot, { backgroundColor: '#2E7D32' }]} />
              <Text style={styles.interestLabel}>High</Text>
            </View>
            <View style={styles.interestBarContainer}>
              <View 
                style={[
                  styles.interestBar, 
                  { 
                    width: `${interestPercentages.high}%`,
                    backgroundColor: '#2E7D32'
                  }
                ]} 
              />
            </View>
            <Text style={styles.interestValue}>{analytics.interestLevelBreakdown.high}</Text>
          </View>

          {/* Medium Interest */}
          <View style={styles.interestRow}>
            <View style={styles.interestLabelContainer}>
              <View style={[styles.interestDot, { backgroundColor: '#FFC107' }]} />
              <Text style={styles.interestLabel}>Medium</Text>
            </View>
            <View style={styles.interestBarContainer}>
              <View 
                style={[
                  styles.interestBar, 
                  { 
                    width: `${interestPercentages.medium}%`,
                    backgroundColor: '#FFC107'
                  }
                ]} 
              />
            </View>
            <Text style={styles.interestValue}>{analytics.interestLevelBreakdown.medium}</Text>
          </View>

          {/* Low Interest */}
          <View style={styles.interestRow}>
            <View style={styles.interestLabelContainer}>
              <View style={[styles.interestDot, { backgroundColor: '#DC3545' }]} />
              <Text style={styles.interestLabel}>Low</Text>
            </View>
            <View style={styles.interestBarContainer}>
              <View 
                style={[
                  styles.interestBar, 
                  { 
                    width: `${interestPercentages.low}%`,
                    backgroundColor: '#DC3545'
                  }
                ]} 
              />
            </View>
            <Text style={styles.interestValue}>{analytics.interestLevelBreakdown.low}</Text>
          </View>
        </View>

        {/* Roster vs Bench */}
        <View style={styles.infographicSection}>
          <Text style={styles.sectionTitle}>⚡ Status Distribution</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusCard}>
              <LinearGradient
                colors={['#2E7D32', '#1a4d2e']}
                style={styles.statusCardGradient}
              >
                <IconSymbol
                  ios_icon_name="star.fill"
                  android_material_icon_name="star"
                  size={28}
                  color="#fff"
                />
                <Text style={styles.statusValue}>{analytics.statusBreakdown.roster}</Text>
                <Text style={styles.statusLabel}>Roster</Text>
                <Text style={styles.statusPercentage}>{rosterPercentage.toFixed(0)}%</Text>
              </LinearGradient>
            </View>

            <View style={styles.statusCard}>
              <LinearGradient
                colors={['#DC3545', '#a02834']}
                style={styles.statusCardGradient}
              >
                <IconSymbol
                  ios_icon_name="pause.circle.fill"
                  android_material_icon_name="pause-circle"
                  size={28}
                  color="#fff"
                />
                <Text style={styles.statusValue}>{analytics.statusBreakdown.bench}</Text>
                <Text style={styles.statusLabel}>Bench</Text>
                <Text style={styles.statusPercentage}>{benchPercentage.toFixed(0)}%</Text>
              </LinearGradient>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradients.benchRed} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>THE BENCH</Text>
            <Text style={styles.headerSubtitle}>Paused connections</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                console.log('[Bench] User tapped My Dates button');
                setShowDatesModal(true);
              }}
            >
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={24}
                color={colors.white}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                console.log('[Bench] User tapped Analytics button');
                setShowAnalyticsModal(true);
              }}
            >
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="insert-chart"
                size={24}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {bench.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="pause.circle"
              android_material_icon_name="pause-circle-outline"
              size={72}
              color={colors.grey}
            />
            <Text style={styles.emptyText}>No one on the bench</Text>
            <Text style={styles.emptySubtext}>
              People you pause will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {bench.map(person => (
              <TouchableOpacity
                key={person.id}
                style={styles.personCard}
                onPress={() => {
                  console.log('[Bench] User tapped person card:', person.name);
                  router.push(`/person/${person.id}` as any);
                }}
                activeOpacity={0.9}
              >
                <View style={styles.cardImageContainer}>
                  {person.imageUrl ? (
                    <Image source={{ uri: person.imageUrl }} style={styles.cardImage} />
                  ) : (
                    <View style={[styles.cardImage, styles.placeholderImage]}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={48}
                        color={colors.grey}
                      />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.85)']}
                    style={styles.cardGradient}
                  >
                    <Text style={styles.cardName}>{person.name}</Text>
                    <Text style={styles.cardInfo}>
                      {person.age} • {person.location}
                    </Text>
                    {/* FIX: Show red and green flags */}
                    <View style={styles.flagsContainer}>
                      {person.redFlags.length > 0 && (
                        <View style={styles.flagBadge}>
                          <Text style={styles.flagText}>🚩 {person.redFlags.length}</Text>
                        </View>
                      )}
                      {person.greenFlags.length > 0 && (
                        <View style={styles.flagBadge}>
                          <Text style={styles.flagText}>✅ {person.greenFlags.length}</Text>
                        </View>
                      )}
                    </View>
                    {person.benchReason && (
                      <View style={styles.reasonBadge}>
                        <Text style={styles.reasonText} numberOfLines={2}>{person.benchReason}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* My Dates Modal - Opens from top */}
      <Modal
        visible={showDatesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatesModal(false)}
        presentationStyle="pageSheet"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlayTop}>
            <View style={styles.modalContentTop}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>My Dates</Text>
                <TouchableOpacity onPress={() => setShowDatesModal(false)}>
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
                      const notesStr = date.notes || '';
                      const ratingNum = date.rating || 0;
                      const wouldGoAgainBool = date.wouldGoAgain;
                      
                      // Find the person's image
                      const allPeople = [...roster, ...bench];
                      const person = allPeople.find(p => p.id === date.profileId);
                      const personImageUrl = person?.imageUrl;
                      
                      return (
                        <TouchableOpacity
                          key={date.id}
                          style={styles.dateCard}
                          onPress={() => {
                            console.log('[Bench] User tapped date card:', date.id);
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

      {/* Analytics Modal - Opens from top */}
      <Modal
        visible={showAnalyticsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAnalyticsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📊 Dating Analytics</Text>
              <TouchableOpacity onPress={() => setShowAnalyticsModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            {loadingAnalytics ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.actionRed} />
                <Text style={styles.loadingText}>Loading analytics...</Text>
              </View>
            ) : analytics ? (
              renderAnalyticsInfographic()
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={styles.emptyText}>Failed to load analytics</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Date Details Modal - FIX: Increased maxHeight to 85% */}
      <Modal
        visible={showDateDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDateDetails(false)}
        presentationStyle="pageSheet"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlayTop}>
            <View style={styles.modalContentTopLarge}>
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
                          console.log('[Bench] User selected rating:', star);
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
                        wouldGoAgain === true && styles.wouldGoAgainButtonActive,
                      ]}
                      onPress={() => {
                        console.log('[Bench] User selected: Would go again');
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
                        wouldGoAgain === false && styles.wouldGoAgainButtonActive,
                      ]}
                      onPress={() => {
                        console.log('[Bench] User selected: Would not go again');
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.darkText,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: colors.grey,
    marginTop: 8,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  personCard: {
    width: CARD_WIDTH,
    aspectRatio: 0.7,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.benchCardOutline,
  },
  cardImageContainer: {
    flex: 1,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardInfo: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.95,
    fontWeight: '600',
  },
  flagsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  flagBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  flagText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '600',
  },
  reasonBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(233, 36, 63, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reasonText: {
    fontSize: 11,
    color: colors.white,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
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
  modalContentTopLarge: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    maxHeight: '85%',
    minHeight: 400,
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
  wouldGoAgainButtonActive: {
    backgroundColor: colors.rosterGreen,
    borderColor: colors.rosterGreen,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  analyticsScroll: {
    flex: 1,
  },
  analyticsContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  heroStatCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  heroStatValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
  heroStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  infographicSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.darkText,
    marginBottom: 16,
  },
  datesBreakdownContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateBreakdownCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
  },
  dateIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBreakdownValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.darkText,
    marginBottom: 4,
  },
  dateBreakdownLabel: {
    fontSize: 12,
    color: colors.grey,
  },
  interestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  interestLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  interestDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  interestLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkText,
  },
  interestBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  interestBar: {
    height: '100%',
    borderRadius: 12,
  },
  interestValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkText,
    width: 40,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statusCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginTop: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  statusPercentage: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
});
