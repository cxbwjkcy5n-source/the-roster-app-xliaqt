
import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 64) / 2;

export default function BenchScreen() {
  const router = useRouter();
  const { bench, dates } = useRoster();
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [datesTab, setDatesTab] = useState<'upcoming' | 'completed'>('upcoming');

  const upcomingDates = dates.filter(d => d.status === 'upcoming');
  const completedDates = dates.filter(d => d.status === 'completed');
  const displayDates = datesTab === 'upcoming' ? upcomingDates : completedDates;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* FIX: Bench Header - Same size and rounded as Roster */}
      <LinearGradient colors={gradients.benchRed} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>THE BENCH</Text>
            <Text style={styles.headerSubtitle}>Paused connections</Text>
          </View>
          {/* FIX: Add header icons (calendar and dating analytics) */}
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

      {/* My Dates Modal */}
      <Modal
        visible={showDatesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDatesModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => {
          console.log('[Bench] User tapped outside modal to dismiss');
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
                      const person = bench.find(p => p.id === date.profileId);
                      const personName = person?.name || date.profileName || 'Unknown';
                      
                      return (
                        <TouchableOpacity
                          key={date.id}
                          style={styles.dateCard}
                          onPress={() => {
                            console.log('[Bench] User tapped date card:', date.id);
                            router.push('/dating/history' as any);
                          }}
                        >
                          <Text style={styles.dateCardName}>{personName}</Text>
                          <Text style={styles.dateCardDate}>{new Date(date.date).toLocaleDateString()}</Text>
                          {date.notes && <Text style={styles.dateCardNotes}>{date.notes}</Text>}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
            <View style={styles.analyticsContent}>
              <Text style={styles.analyticsText}>
                View detailed analytics on the Roster screen
              </Text>
              <TouchableOpacity
                style={styles.goToRosterButton}
                onPress={() => {
                  setShowAnalyticsModal(false);
                  router.push('/(tabs)/roster' as any);
                }}
              >
                <Text style={styles.goToRosterButtonText}>Go to Roster</Text>
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
  dateCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
  analyticsContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  analyticsText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  goToRosterButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  goToRosterButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
