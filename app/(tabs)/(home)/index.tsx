
import React, { useState, useEffect } from 'react';
import { colors } from '@/styles/commonStyles';
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

export default function RosterScreen() {
  const router = useRouter();
  const { roster, loading: rosterLoading } = useRoster();
  const { user, loading: authLoading } = useAuth();
  const [showMyDates, setShowMyDates] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [datesTab, setDatesTab] = useState<'upcoming' | 'completed'>('upcoming');

  // Redirect to auth if not logged in - REMOVED AUTO-NAVIGATION TO ADD PERSON
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[Home] User not logged in, redirecting to auth');
      router.replace('/auth');
    }
  }, [user, authLoading, router]);

  if (authLoading || rosterLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getInterestColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.danger;
      default:
        return colors.textSecondary;
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
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.personInfoGradient}
        >
          <View style={styles.personInfo}>
            <Text style={styles.personName}>{item.name}</Text>
            <Text style={styles.personDetails}>
              {item.age} • {item.location}
            </Text>
            <View style={styles.flagsContainer}>
              {item.redFlags && item.redFlags.length > 0 && (
                <View style={styles.flagBadge}>
                  <IconSymbol 
                    ios_icon_name="flag.fill" 
                    android_material_icon_name="flag" 
                    size={12} 
                    color={colors.danger} 
                  />
                  <Text style={styles.flagCount}>{item.redFlags.length}</Text>
                </View>
              )}
              {item.greenFlags && item.greenFlags.length > 0 && (
                <View style={styles.flagBadge}>
                  <IconSymbol 
                    ios_icon_name="flag.fill" 
                    android_material_icon_name="flag" 
                    size={12} 
                    color={colors.success} 
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
    >
      <IconSymbol 
        ios_icon_name="plus.circle" 
        android_material_icon_name="add-circle" 
        size={64} 
        color={colors.textSecondary} 
      />
      <Text style={styles.emptyText}>Add your first person to the roster</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
        <Text style={styles.headerTitle}>THE ROSTER</Text>
        <Text style={styles.headerSubtitle}>Where You&apos;re The Coach and MVP</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              console.log('[Home] User tapped calendar button');
              setShowMyDates(true);
            }}
          >
            <IconSymbol 
              ios_icon_name="calendar" 
              android_material_icon_name="calendar-today" 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              console.log('[Home] User tapped analytics button');
              setShowAnalytics(true);
            }}
          >
            <IconSymbol 
              ios_icon_name="chart.bar.fill" 
              android_material_icon_name="bar-chart" 
              size={24} 
              color="#fff" 
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
          />
        )}
      </View>

      {/* My Dates Modal - Opens from TOP */}
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
                    color={colors.text} 
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

      {/* Analytics Modal - Opens from TOP */}
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
                    color={colors.text} 
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 10,
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
    position: 'absolute',
    top: 10,
    right: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  personCard: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  personImage: {
    width: '100%',
    height: '100%',
  },
  interestBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  personInfoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
  },
  personInfo: {
    padding: 12,
  },
  personName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  personDetails: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
  },
  flagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  flagCount: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyCard: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  // Modal opens from TOP
  modalOverlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  modalContentTop: {
    backgroundColor: colors.background,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  datesScroll: {
    padding: 16,
  },
  emptyDatesText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 40,
  },
});
