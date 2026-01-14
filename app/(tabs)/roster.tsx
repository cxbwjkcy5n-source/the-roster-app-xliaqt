
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { RosterPerson } from '@/types/roster';
import { authenticatedGet } from '@/utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const { roster, bench, dates } = useRoster();
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [datesTab, setDatesTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      console.log('[RosterScreen] Loading analytics...');
      const data = await authenticatedGet<Analytics>('/api/analytics');
      console.log('[RosterScreen] Analytics loaded:', data);
      setAnalytics(data);
    } catch (error) {
      console.error('[RosterScreen] Error loading analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    if (showAnalyticsModal && !analytics) {
      loadAnalytics();
    }
  }, [showAnalyticsModal, analytics, loadAnalytics]);

  const getInterestColor = (level: string) => {
    switch (level) {
      case 'high':
        return colors.primary;
      case 'medium':
        return colors.accent;
      case 'low':
        return colors.highlight;
      default:
        return colors.textSecondary;
    }
  };

  const upcomingDates = dates.filter(d => d.status === 'upcoming');
  const completedDates = dates.filter(d => d.status === 'completed');
  const displayDates = datesTab === 'upcoming' ? upcomingDates : completedDates;

  const renderPersonCard = (person: RosterPerson) => (
    <TouchableOpacity
      key={person.id}
      style={styles.personCard}
      onPress={() => router.push(`/person/${person.id}` as any)}
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
              color={colors.textSecondary}
            />
          </View>
        )}
        <View
          style={[
            styles.interestBadge,
            { backgroundColor: getInterestColor(person.interestLevel) },
          ]}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.cardGradient}
        >
          <Text style={styles.cardName}>{person.name}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardInfoText}>
              {person.age} • {person.location}
            </Text>
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
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <TouchableOpacity
      style={styles.emptyCard}
      onPress={() => router.push('/person/add')}
    >
      <View style={styles.emptyCardContent}>
        <IconSymbol
          ios_icon_name="plus.circle.fill"
          android_material_icon_name="add-circle"
          size={64}
          color={colors.primary}
        />
        <Text style={styles.emptyCardText}>Add Your First Person</Text>
        <Text style={styles.emptyCardSubtext}>
          Start building your roster by adding someone special
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Calculate percentages for visual bars
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
      console.log('[RosterScreen] Analytics is null, cannot render infographic');
      return null;
    }
    
    console.log('[RosterScreen] Rendering analytics infographic with data:', analytics);
    
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
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>THE ROSTER</Text>
            <Text style={styles.headerSubtitle}>Where You&apos;re The Coach and MVP</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                console.log('[RosterScreen] User tapped My Dates button');
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
                console.log('[RosterScreen] User tapped Analytics button');
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
        {roster.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.grid}>
            {roster.map(person => renderPersonCard(person))}
          </View>
        )}
      </ScrollView>

      {/* My Dates Modal */}
      <Modal
        visible={showDatesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDatesModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => {
          console.log('[RosterScreen] User tapped outside modal to dismiss');
          Keyboard.dismiss();
          setShowDatesModal(false);
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>My Dates</Text>
                  <TouchableOpacity onPress={() => setShowDatesModal(false)}>
                    <IconSymbol
                      ios_icon_name="xmark"
                      android_material_icon_name="close"
                      size={24}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[styles.tab, datesTab === 'upcoming' && styles.activeTab]}
                    onPress={() => setDatesTab('upcoming')}
                  >
                    <Text
                      style={[styles.tabText, datesTab === 'upcoming' && styles.activeTabText]}
                    >
                      Upcoming
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, datesTab === 'completed' && styles.activeTab]}
                    onPress={() => setDatesTab('completed')}
                  >
                    <Text
                      style={[styles.tabText, datesTab === 'completed' && styles.activeTabText]}
                    >
                      Completed
                    </Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll}>
                  {displayDates.length === 0 ? (
                    <Text style={styles.emptyText}>
                      {datesTab === 'upcoming' ? 'No upcoming dates' : 'No completed dates'}
                    </Text>
                  ) : (
                    displayDates.map((date) => {
                      // Find the person's name from roster or bench
                      const person = [...roster, ...bench].find(p => p.id === date.profileId);
                      const personName = person?.name || date.profileName || 'Unknown';
                      
                      return (
                        <View key={date.id} style={styles.dateCard}>
                          <Text style={styles.dateCardName}>{personName}</Text>
                          <Text style={styles.dateCardDate}>{new Date(date.date).toLocaleDateString()}</Text>
                          {date.notes && <Text style={styles.dateCardNotes}>{date.notes}</Text>}
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Analytics Modal - INFOGRAPHIC DESIGN - FIX: Ensure content is visible */}
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
                <ActivityIndicator size="large" color={colors.primary} />
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    padding: 16,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  personCard: {
    width: '47%',
    aspectRatio: 0.75,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
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
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.white,
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
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfoText: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
  },
  flagsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  flagBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  flagText: {
    fontSize: 10,
    color: colors.white,
  },
  emptyCard: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  emptyCardContent: {
    alignItems: 'center',
    padding: 24,
  },
  emptyCardText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyCardSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.white,
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 32,
  },
  dateCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  dateCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  dateCardDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateCardNotes: {
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
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
    color: colors.text,
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
    backgroundColor: colors.background,
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
    color: colors.text,
    marginBottom: 4,
  },
  dateBreakdownLabel: {
    fontSize: 12,
    color: colors.textSecondary,
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
    color: colors.text,
  },
  interestBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: colors.background,
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
    color: colors.text,
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
