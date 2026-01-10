
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { RosterPerson } from '@/types/roster';
import { colors } from '@/styles/commonStyles';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with padding

export default function RosterScreen() {
  const router = useRouter();
  const { roster, dates } = useRoster();
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [datesTab, setDatesTab] = useState<'upcoming' | 'completed'>('upcoming');

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

  const renderPersonCard = (person: RosterPerson) => (
    <TouchableOpacity
      key={person.id}
      style={styles.personCard}
      onPress={() => router.push(`/person/${person.id}`)}
    >
      <View style={styles.cardImageContainer}>
        {person.imageUrl ? (
          <Image source={{ uri: person.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.placeholderImage]}>
            <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={40} color={colors.grey} />
          </View>
        )}
        <View style={[styles.interestBadge, { backgroundColor: getInterestColor(person.interestLevel) }]} />
        <View style={styles.cardOverlay}>
          <Text style={styles.cardName}>{person.name}</Text>
          <Text style={styles.cardInfo}>{person.age} • {person.location}</Text>
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
      </View>
    </TouchableOpacity>
  );

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
            onPress={() => setShowDatesModal(true)}
          >
            <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar-today" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAnalyticsModal(true)}
          >
            <IconSymbol ios_icon_name="chart.bar.fill" android_material_icon_name="bar-chart" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsGrid}>
          {roster.length === 0 ? (
            renderEmptyState()
          ) : (
            roster.map(renderPersonCard)
          )}
        </View>
      </ScrollView>

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

      {/* My Dates Modal */}
      <Modal
        visible={showDatesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatesModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDatesModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
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
                  {(datesTab === 'upcoming' ? upcomingDates : completedDates).map(date => (
                    <View key={date.id} style={styles.dateItem}>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  personCard: {
    width: cardWidth,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
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
    width: cardWidth,
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
});
