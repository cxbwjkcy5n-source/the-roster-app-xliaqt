
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { RosterPerson } from '@/types/roster';
import { colors } from '@/styles/commonStyles';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

const { width } = Dimensions.get('window');

export default function RosterScreen() {
  const router = useRouter();
  const { roster, dates, analytics, nudges, reorderRoster, refreshAnalytics, refreshNudges } = useRoster();
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showNudgesModal, setShowNudgesModal] = useState(false);
  const [datesTab, setDatesTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [localRoster, setLocalRoster] = useState<RosterPerson[]>([]);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    setLocalRoster(roster);
  }, [roster]);

  const refreshData = useCallback(() => {
    refreshAnalytics();
    refreshNudges();
  }, [refreshAnalytics, refreshNudges]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const upcomingDates = dates.filter(d => d.status === 'upcoming');
  const completedDates = dates.filter(d => d.status === 'completed');

  const getInterestColor = (level: string) => {
    switch (level) {
      case 'high': return colors.green;
      case 'medium': return colors.yellow;
      case 'low': return colors.lowInterest;
      default: return colors.grey;
    }
  };

  const renderPersonCard = ({ item, drag, isActive }: RenderItemParams<RosterPerson>) => (
    <ScaleDecorator>
      <TouchableOpacity
        onPress={() => {
          if (!isReordering) {
            router.push(`/person/${item.id}`);
          }
        }}
        onLongPress={isReordering ? drag : undefined}
        disabled={isActive}
        style={[styles.personCard, isActive && styles.personCardActive]}
      >
        <View style={styles.cardImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.placeholderImage]}>
              <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={40} color={colors.grey} />
            </View>
          )}
          <View style={[styles.interestBadge, { backgroundColor: getInterestColor(item.interestLevel) }]} />
          {isReordering && (
            <View style={styles.dragHandle}>
              <IconSymbol ios_icon_name="line.3.horizontal" android_material_icon_name="drag-handle" size={24} color="#fff" />
            </View>
          )}
          <View style={styles.cardOverlay}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardInfo}>{item.age} • {item.location}</Text>
            <View style={styles.flagsContainer}>
              {item.redFlags.length > 0 && (
                <View style={styles.flagBadge}>
                  <Text style={styles.flagText}>🚩 {item.redFlags.length}</Text>
                </View>
              )}
              {item.greenFlags.length > 0 && (
                <View style={styles.flagBadge}>
                  <Text style={styles.flagText}>✅ {item.greenFlags.length}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </ScaleDecorator>
  );

  const handleSaveReorder = async () => {
    try {
      console.log('[RosterScreen] Saving new roster order');
      await reorderRoster(localRoster);
      setIsReordering(false);
      Alert.alert('Success', 'Roster order saved!');
    } catch (error) {
      console.error('[RosterScreen] Error saving roster order:', error);
      Alert.alert('Error', 'Failed to save roster order');
    }
  };

  const renderEmptyState = () => (
    <TouchableOpacity
      style={styles.emptyCard}
      onPress={() => router.push('/person/add')}
    >
      <View style={styles.emptyCardContent}>
        <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add-circle" size={60} color={colors.primary} />
        <Text style={styles.emptyText}>Add your first person</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>THE ROSTER</Text>
        <Text style={styles.headerSubtitle}>Where You&apos;re The Coach and MVP</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              console.log('[RosterScreen] User tapped Reorder button');
              if (isReordering) {
                handleSaveReorder();
              } else {
                setIsReordering(true);
              }
            }}
          >
            <IconSymbol 
              ios_icon_name={isReordering ? "checkmark" : "line.3.horizontal"} 
              android_material_icon_name={isReordering ? "check" : "reorder"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              console.log('[RosterScreen] User tapped My Dates button');
              setShowDatesModal(true);
            }}
          >
            <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar-today" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              console.log('[RosterScreen] User tapped Analytics button');
              setShowAnalyticsModal(true);
            }}
          >
            <IconSymbol ios_icon_name="chart.bar.fill" android_material_icon_name="bar-chart" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Nudges Banner */}
      {nudges.length > 0 && (
        <TouchableOpacity
          style={styles.nudgesBanner}
          onPress={() => setShowNudgesModal(true)}
        >
          <IconSymbol
            ios_icon_name="bell.fill"
            android_material_icon_name="notifications"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.nudgesText}>
            {nudges.length} reminder{nudges.length > 1 ? 's' : ''} - Tap to view
          </Text>
        </TouchableOpacity>
      )}

      {localRoster.length === 0 ? (
        <View style={styles.emptyContainer}>
          {renderEmptyState()}
        </View>
      ) : (
        <DraggableFlatList
          data={localRoster}
          renderItem={renderPersonCard}
          keyExtractor={(item) => item.id}
          onDragEnd={({ data }) => setLocalRoster(data)}
          contentContainerStyle={styles.listContent}
          activationDistance={isReordering ? 0 : 999999}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingAddButton}
        onPress={() => router.push('/person/add')}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.addButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={32} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* My Dates Modal - FIX: Opens at top now */}
      <Modal
        visible={showDatesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatesModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => {
          console.log('[RosterScreen] User tapped outside modal to dismiss');
          Keyboard.dismiss();
          setShowDatesModal(false);
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.datesModal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>My Dates</Text>
                  <TouchableOpacity onPress={() => setShowDatesModal(false)}>
                    <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
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
                  {(datesTab === 'upcoming' ? upcomingDates : completedDates).map((date, index) => (
                    <View key={date.id || index} style={styles.dateItem}>
                      <Text style={styles.dateTitle}>{date.profileName}</Text>
                      <Text style={styles.dateDetails}>{date.date} at {date.time}</Text>
                      <Text style={styles.dateLocation}>{date.location}</Text>
                    </View>
                  ))}
                  {(datesTab === 'upcoming' ? upcomingDates : completedDates).length === 0 && (
                    <Text style={styles.emptyDatesText}>No {datesTab} dates</Text>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Analytics Modal - FIX: Opens at top now */}
      <Modal
        visible={showAnalyticsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnalyticsModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => {
          console.log('[RosterScreen] User tapped outside analytics modal to dismiss');
          Keyboard.dismiss();
          setShowAnalyticsModal(false);
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.analyticsModal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Analytics</Text>
                  <TouchableOpacity onPress={() => setShowAnalyticsModal(false)}>
                    <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.analyticsContent}>
                  {analytics ? (
                    <>
                      {/* Overview Stats */}
                      <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                          <Text style={styles.statValue}>{analytics.totalDates}</Text>
                          <Text style={styles.statLabel}>Total Dates</Text>
                        </View>
                        <View style={styles.statCard}>
                          <Text style={styles.statValue}>{analytics.upcomingDates}</Text>
                          <Text style={styles.statLabel}>Upcoming</Text>
                        </View>
                        <View style={styles.statCard}>
                          <Text style={styles.statValue}>{analytics.dateFrequency.thisMonth}</Text>
                          <Text style={styles.statLabel}>This Month</Text>
                        </View>
                        <View style={styles.statCard}>
                          <Text style={styles.statValue}>{analytics.dateFrequency.thisWeek}</Text>
                          <Text style={styles.statLabel}>This Week</Text>
                        </View>
                      </View>

                      {/* Dates Per Month */}
                      {analytics.datesPerMonth && analytics.datesPerMonth.length > 0 && (
                        <View style={styles.analyticsSection}>
                          <Text style={styles.sectionTitle}>Dates Per Month</Text>
                          {analytics.datesPerMonth.map((item, index) => (
                            <View key={index} style={styles.barChartRow}>
                              <Text style={styles.barLabel}>{item.month}</Text>
                              <View style={styles.barContainer}>
                                <View
                                  style={[
                                    styles.bar,
                                    {
                                      width: `${(item.count / Math.max(...analytics.datesPerMonth.map(d => d.count))) * 100}%`,
                                    },
                                  ]}
                                />
                                <Text style={styles.barValue}>{item.count}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Common Red Flags */}
                      {analytics.commonRedFlags && analytics.commonRedFlags.length > 0 && (
                        <View style={styles.analyticsSection}>
                          <Text style={styles.sectionTitle}>Common Red Flags</Text>
                          {analytics.commonRedFlags.slice(0, 5).map((item, index) => (
                            <View key={index} style={styles.flagRow}>
                              <Text style={styles.flagEmoji}>🚩</Text>
                              <Text style={styles.flagText}>{item.flag}</Text>
                              <Text style={styles.flagCount}>{item.count}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Common Green Flags */}
                      {analytics.commonGreenFlags && analytics.commonGreenFlags.length > 0 && (
                        <View style={styles.analyticsSection}>
                          <Text style={styles.sectionTitle}>Common Green Flags</Text>
                          {analytics.commonGreenFlags.slice(0, 5).map((item, index) => (
                            <View key={index} style={styles.flagRow}>
                              <Text style={styles.flagEmoji}>✅</Text>
                              <Text style={styles.flagText}>{item.flag}</Text>
                              <Text style={styles.flagCount}>{item.count}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={styles.emptyText}>Loading analytics...</Text>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Nudges Modal */}
      <Modal
        visible={showNudgesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNudgesModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setShowNudgesModal(false);
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.nudgesModal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Reminders</Text>
                  <TouchableOpacity onPress={() => setShowNudgesModal(false)}>
                    <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.nudgesContent}>
                  {nudges.map((nudge, index) => (
                    <TouchableOpacity
                      key={nudge.id || index}
                      style={styles.nudgeItem}
                      onPress={() => {
                        setShowNudgesModal(false);
                        router.push(`/person/${nudge.profileId}`);
                      }}
                    >
                      <IconSymbol
                        ios_icon_name="bell.fill"
                        android_material_icon_name="notifications"
                        size={24}
                        color={colors.primary}
                      />
                      <View style={styles.nudgeContent}>
                        <Text style={styles.nudgeMessage}>{nudge.message}</Text>
                        <Text style={styles.nudgeDate}>
                          Last contact: {nudge.daysSinceLastContact} days ago
                        </Text>
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
            </TouchableWithoutFeedback>
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
    padding: 20,
    paddingTop: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nudgesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  nudgesText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  personCard: {
    width: width - 32,
    marginBottom: 16,
    marginHorizontal: 0,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  personCardActive: {
    opacity: 0.8,
    transform: [{ scale: 1.05 }],
  },
  dragHandle: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 280,
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
  interestBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardInfo: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  flagsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  flagBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  flagText: {
    fontSize: 10,
    color: '#fff',
  },
  emptyCard: {
    width: (width - 48) / 2,
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCardContent: {
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  datesModal: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  analyticsModal: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  nudgesModal: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey + '30',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
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
  emptyDatesText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 20,
  },
  analyticsContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  analyticsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  barChartRow: {
    marginBottom: 12,
  },
  barLabel: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 4,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    height: 24,
    backgroundColor: colors.primary,
    borderRadius: 4,
    minWidth: 20,
  },
  barValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  flagEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  flagCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  nudgesContent: {
    padding: 16,
  },
  nudgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  nudgeContent: {
    flex: 1,
  },
  nudgeMessage: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  nudgeDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
