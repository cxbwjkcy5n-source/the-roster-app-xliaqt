
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { useRouter } from 'expo-router';
import { RosterPerson } from '@/types/roster';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet } from '@/utils/api';
import { DateEvent } from '@/types/roster';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 64;

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
  const { roster, loading: rosterLoading, dates, refreshDates } = useRoster();
  const { user, loading: authLoading } = useAuth();
  const [showMyDates, setShowMyDates] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [datesTab, setDatesTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [showDateDetails, setShowDateDetails] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[Home] User not logged in, redirecting to auth');
      router.replace('/auth');
    }
  }, [user, authLoading, router]);

  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      console.log('[Home] Loading analytics...');
      const data = await authenticatedGet<Analytics>('/api/analytics');
      console.log('[Home] Analytics loaded:', data);
      setAnalytics(data);
    } catch (error) {
      console.error('[Home] Error loading analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (showAnalytics && !analytics) {
      loadAnalytics();
    }
  }, [showAnalytics]);

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
      console.log('[Home] Analytics is null, cannot render infographic');
      return null;
    }
    
    console.log('[Home] Rendering analytics infographic with data:', analytics);
    
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

  const renderPersonCard = ({ item }: { item: RosterPerson }) => {
    return (
      <View style={styles.cardWrapper}>
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
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.cardWrapper}>
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
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Roster Header - Green Gradient - FIX: Proper spacing */}
      <LinearGradient colors={gradients.rosterGreen} style={styles.header}>
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
              console.log('[Home] User tapped analytics button');
              setShowAnalytics(true);
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
        {roster.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={roster}
            renderItem={renderPersonCard}
            keyExtractor={(item) => item.id}
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
                            <Text style={styles.dateCardName}>{profileNameStr}</Text>
                            <View style={styles.dateCardTypeBadge}>
                              <Text style={styles.dateCardTypeText}>{typeStr}</Text>
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

      {/* Analytics Modal */}
      <Modal
        visible={showAnalytics}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnalytics(false)}
        presentationStyle="pageSheet"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlayTop}>
            <View style={styles.modalContentTop}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Dating Analytics</Text>
                <TouchableOpacity onPress={() => setShowAnalytics(false)}>
                  <IconSymbol 
                    ios_icon_name="xmark" 
                    android_material_icon_name="close" 
                    size={24} 
                    color={colors.darkText} 
                  />
                </TouchableOpacity>
              </View>

              {loadingAnalytics ? (
                <View style={styles.loadingAnalyticsContainer}>
                  <ActivityIndicator size="large" color={colors.rosterGreen} />
                  <Text style={styles.loadingText}>Loading analytics...</Text>
                </View>
              ) : analytics ? (
                renderAnalyticsInfographic()
              ) : (
                <View style={styles.loadingAnalyticsContainer}>
                  <Text style={styles.emptyDatesText}>Failed to load analytics</Text>
                </View>
              )}
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

                  <TouchableOpacity
                    style={styles.editDateButton}
                    onPress={() => {
                      console.log('[Home] User tapped Edit Date button');
                      setShowDateDetails(false);
                      setShowMyDates(false);
                      router.push('/dating/history');
                    }}
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
                </ScrollView>
              )}
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
  listContent: {
    paddingBottom: 120,
    alignItems: 'center',
  },
  cardWrapper: {
    width: screenWidth,
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  personCard: {
    width: CARD_WIDTH,
    height: 240,
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
    width: CARD_WIDTH,
    height: 240,
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
    maxHeight: '80%',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  editDateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
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
  loadingAnalyticsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.grey,
  },
  // INFOGRAPHIC STYLES
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
