
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

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 64; // FIX: Narrower cards with more padding

export default function RosterScreen() {
  const router = useRouter();
  const { roster, loading: rosterLoading } = useRoster();
  const { user, loading: authLoading } = useAuth();
  const [showMyDates, setShowMyDates] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [datesTab, setDatesTab] = useState<'upcoming' | 'completed'>('upcoming');

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[Home iOS] User not logged in, redirecting to auth');
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

  const renderPersonCard = ({ item }: { item: RosterPerson }) => {
    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          onPress={() => {
            console.log('[Home iOS] User tapped person card:', item.name);
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
          console.log('[Home iOS] User tapped empty state - navigating to add person');
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
      {/* Roster Header - Green Gradient */}
      <LinearGradient colors={gradients.rosterGreen} style={styles.header}>
        <Text style={styles.headerTitle}>THE ROSTER</Text>
        <Text style={styles.headerSubtitle}>Where You're The Coach and MVP</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              console.log('[Home iOS] User tapped calendar button');
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
              console.log('[Home iOS] User tapped analytics button');
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
                <Text style={styles.emptyDatesText}>No dates yet</Text>
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

              <ScrollView style={styles.datesScroll}>
                <Text style={styles.emptyDatesText}>Analytics coming soon</Text>
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
    padding: 20,
    paddingTop: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.white,
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.95,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    position: 'absolute',
    top: 16,
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
});
