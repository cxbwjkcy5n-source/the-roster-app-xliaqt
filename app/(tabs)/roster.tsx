
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { RosterPerson } from '@/types/roster';
import { authenticatedGet } from '@/utils/api';

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

  useEffect(() => {
    if (showAnalyticsModal && !analytics) {
      loadAnalytics();
    }
  }, [showAnalyticsModal]);

  const loadAnalytics = async () => {
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
  };

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
              onPress={() => setShowDatesModal(true)}
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
              onPress={() => setShowAnalyticsModal(true)}
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
        <View style={styles.modalOverlay}>
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
        </View>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        visible={showAnalyticsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAnalyticsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dating Analytics</Text>
              <TouchableOpacity onPress={() => setShowAnalyticsModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {loadingAnalytics ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading analytics...</Text>
                </View>
              ) : analytics ? (
                <>
                  <View style={styles.analyticsCard}>
                    <Text style={styles.analyticsTitle}>Total Profiles</Text>
                    <Text style={styles.analyticsValue}>{analytics.totalProfiles}</Text>
                  </View>
                  <View style={styles.analyticsCard}>
                    <Text style={styles.analyticsTitle}>Total Dates</Text>
                    <Text style={styles.analyticsValue}>{analytics.totalDates}</Text>
                  </View>
                  <View style={styles.analyticsRow}>
                    <View style={[styles.analyticsCard, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.analyticsTitle}>Upcoming</Text>
                      <Text style={styles.analyticsValue}>{analytics.upcomingDates}</Text>
                    </View>
                    <View style={[styles.analyticsCard, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.analyticsTitle}>Completed</Text>
                      <Text style={styles.analyticsValue}>{analytics.completedDates}</Text>
                    </View>
                  </View>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Interest Level</Text>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>High:</Text>
                      <Text style={styles.breakdownValue}>{analytics.interestLevelBreakdown.high}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Medium:</Text>
                      <Text style={styles.breakdownValue}>{analytics.interestLevelBreakdown.medium}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Low:</Text>
                      <Text style={styles.breakdownValue}>{analytics.interestLevelBreakdown.low}</Text>
                    </View>
                  </View>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Status</Text>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Roster:</Text>
                      <Text style={styles.breakdownValue}>{analytics.statusBreakdown.roster}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Bench:</Text>
                      <Text style={styles.breakdownValue}>{analytics.statusBreakdown.bench}</Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={styles.emptyText}>Failed to load analytics</Text>
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
  analyticsCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  analyticsValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
  },
  analyticsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  breakdownLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
