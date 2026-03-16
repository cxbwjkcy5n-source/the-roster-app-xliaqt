
import React, { useEffect, useState, useCallback } from 'react';
import { RosterPerson } from '@/types/roster';
import { useAuth } from '@/contexts/AuthContext';
import { useRoster } from '@/contexts/RosterContext';
import { colors } from '@/styles/commonStyles';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { scheduleInactivityNotification } from '@/utils/dateNotifications';
import { NotificationBell } from '@/components/NotificationBell';

const { width: screenWidth } = Dimensions.get('window');
const DARK_GREEN = '#1B4332';
const INACTIVITY_DAYS = 14;

async function loadRatingsMap(ids: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  await Promise.all(
    ids.map(async (id) => {
      try {
        const raw = await AsyncStorage.getItem(`ratingsMap_${id}`);
        if (raw) {
          const ratings = JSON.parse(raw);
          const values: number[] = Object.values(ratings);
          if (values.length > 0) {
            const avg = values.reduce((s, v) => s + Number(v), 0) / values.length;
            result[id] = Math.round(avg * 10) / 10;
          }
        }
      } catch {
        // ignore
      }
    })
  );
  return result;
}

/** Returns the most recent activity date for a person (ms). */
function getLastActivityMs(person: RosterPerson, dates: import('@/types/roster').DateEvent[]): number {
  const candidates: number[] = [];

  // createdAt / updatedAt from person
  if (person.createdAt) {
    const t = new Date(person.createdAt).getTime();
    if (!isNaN(t)) candidates.push(t);
  }

  // Most recent date event for this person
  const personDates = dates.filter(d => d.profileId === person.id);
  for (const d of personDates) {
    if (d.date) {
      const t = new Date(`${d.date}T${d.time || '00:00'}:00`).getTime();
      if (!isNaN(t)) candidates.push(t);
    }
  }

  return candidates.length > 0 ? Math.max(...candidates) : 0;
}

export default function RosterScreen() {
  const router = useRouter();
  const { roster, dates, loading: rosterLoading, error, backendReady, retryLoading, moveToBench } = useRoster();
  const { user, loading: authLoading, profileIncomplete } = useAuth();
  const [ratingsMap, setRatingsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[Home] User not logged in, redirecting to auth');
      router.replace('/auth');
    }
  }, [user, authLoading, router]);

  // Load ratings from AsyncStorage when roster changes
  useEffect(() => {
    if (roster.length > 0) {
      const ids = roster.map(p => p.id);
      console.log('[Home] Loading ratings from AsyncStorage for', ids.length, 'people');
      loadRatingsMap(ids).then(map => {
        setRatingsMap(map);
        console.log('[Home] Ratings loaded:', Object.keys(map).length, 'entries');
      });
    }
  }, [roster]);

  // Check inactivity on focus
  useFocusEffect(
    useCallback(() => {
      if (!roster.length) return;
      console.log('[Home] Checking inactivity for', roster.length, 'roster members');
      const now = Date.now();
      const cutoff = now - INACTIVITY_DAYS * 24 * 60 * 60 * 1000;

      roster.forEach(person => {
        const lastActivity = getLastActivityMs(person, dates);
        const isInactive = lastActivity === 0 || lastActivity < cutoff;
        if (isInactive) {
          console.log('[Home] Person inactive for 14+ days:', person.name, '— scheduling notification');
          scheduleInactivityNotification({ personId: person.id, personName: person.name });
        }
      });
    }, [roster, dates])
  );

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.rosterGreen} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!backendReady && error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={['#000000', '#1a1a1a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>THE ROSTER</Text>
            <Text style={styles.headerSubtitle}>WHERE EVERYONE PLAYS THEIR POSITION</Text>
          </View>
        </LinearGradient>

        <View style={styles.errorContainer}>
          <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={64} color={colors.warning} />
          <Text style={styles.errorTitle}>App is Starting Up</Text>
          <Text style={styles.errorMessage}>The app is initializing. This usually takes a few seconds.</Text>
          <Text style={styles.errorSubtext}>{rosterLoading ? 'Retrying...' : 'Please wait or tap retry below.'}</Text>
          {rosterLoading ? (
            <ActivityIndicator size="large" color={colors.rosterGreen} style={styles.retrySpinner} />
          ) : (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                console.log('[Home] User tapped retry button');
                retryLoading();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.rosterGreen, '#0d8555']}
                style={styles.retryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <IconSymbol ios_icon_name="arrow.clockwise" android_material_icon_name="refresh" size={20} color={colors.white} />
                <Text style={styles.retryButtonText}>Retry Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const getInterestColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return colors.rosterGreen;
      case 'medium': return colors.warning;
      case 'low': return colors.actionRed;
      default: return colors.grey;
    }
  };

  const renderPersonCard = ({ item }: { item: RosterPerson }) => {
    const avgRating = ratingsMap[item.id];
    const hasRating = avgRating !== undefined;
    const ratingStr = hasRating ? String(avgRating) : '';

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
        <View style={[styles.interestBadge, { backgroundColor: getInterestColor(item.interestLevel) }]} />
        {hasRating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingBadgeText}>{ratingStr}</Text>
            <Text style={styles.ratingBadgeStar}>★</Text>
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.personInfoGradient}>
          <View style={styles.personInfo}>
            <Text style={styles.personName}>{item.name}</Text>
            <Text style={styles.personDetails}>{item.age}</Text>
            <Text style={styles.personDetails}>{item.location}</Text>
            <View style={styles.flagsContainer}>
              {item.redFlags && item.redFlags.length > 0 && (
                <View style={[styles.flagBadge, { backgroundColor: 'rgba(233, 36, 63, 0.9)' }]}>
                  <IconSymbol ios_icon_name="flag.fill" android_material_icon_name="flag" size={12} color={colors.white} />
                  <Text style={styles.flagCount}>{item.redFlags.length}</Text>
                </View>
              )}
              {item.greenFlags && item.greenFlags.length > 0 && (
                <View style={[styles.flagBadge, { backgroundColor: 'rgba(17, 163, 106, 0.9)' }]}>
                  <IconSymbol ios_icon_name="flag.fill" android_material_icon_name="flag" size={12} color={colors.white} />
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
      <IconSymbol ios_icon_name="plus.circle" android_material_icon_name="add-circle-outline" size={72} color={colors.grey} />
      <Text style={styles.emptyText}>Add your first person</Text>
      <Text style={styles.emptySubtext}>Tap to get started</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {profileIncomplete && (
        <TouchableOpacity
          style={styles.profileBanner}
          onPress={() => {
            console.log('[Home] User tapped complete profile banner');
            router.push('/(tabs)/profile');
          }}
          activeOpacity={0.85}
        >
          <IconSymbol ios_icon_name="person.crop.circle.badge.exclamationmark" android_material_icon_name="account-circle" size={20} color="#fff" />
          <Text style={styles.profileBannerText}>Complete your profile to get started</Text>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={16} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      )}
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>THE ROSTER</Text>
          <Text style={styles.headerSubtitle}>WHERE EVERYONE PLAYS THEIR POSITION</Text>
        </View>
        <View style={styles.headerButtons}>
          <NotificationBell color={colors.white} />
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              console.log('[Home] User tapped Dates button - navigating to dates');
              router.push('/dating/dates' as any);
            }}
            activeOpacity={0.7}
          >
            <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar-today" size={22} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              console.log('[Home] User tapped Dating Analytics button - navigating to analytics');
              router.push('/dating/analytics' as any);
            }}
            activeOpacity={0.7}
          >
            <IconSymbol ios_icon_name="chart.bar.fill" android_material_icon_name="insert-chart" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.grey, fontWeight: '600' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  errorTitle: { fontSize: 24, fontWeight: '800', color: colors.darkText, marginTop: 24, textAlign: 'center' },
  errorMessage: { fontSize: 16, color: colors.grey, marginTop: 12, textAlign: 'center', lineHeight: 24 },
  errorSubtext: { fontSize: 14, color: colors.grey, marginTop: 8, textAlign: 'center' },
  retryButton: { marginTop: 32, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  retryButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 32, paddingVertical: 16 },
  retryButtonText: { fontSize: 18, fontWeight: '700', color: colors.white },
  retrySpinner: { marginTop: 32 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerContent: { alignItems: 'flex-start', marginBottom: 8 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: colors.white, textAlign: 'left', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: colors.white, textAlign: 'left', marginTop: 6, opacity: 0.95, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  headerButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, position: 'absolute', top: 20, right: 20 },
  headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  content: { flex: 1, paddingTop: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
  logo: { width: 120, height: 120, opacity: 0.15 },
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 100 },
  listContent: { paddingBottom: 120, paddingHorizontal: 16 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  personCard: { width: '47%', aspectRatio: 0.75, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
  personImage: { width: '100%', height: '100%' },
  interestBadge: { position: 'absolute', top: 16, left: 16, width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  ratingBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: DARK_GREEN, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  ratingBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  ratingBadgeStar: { fontSize: 10, color: '#FFD700', fontWeight: '700' },
  personInfoGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, justifyContent: 'flex-end' },
  personInfo: { padding: 16 },
  personName: { fontSize: 24, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  personDetails: { fontSize: 15, color: colors.white, marginTop: 4, fontWeight: '600', opacity: 0.95 },
  flagsContainer: { flexDirection: 'row', gap: 8, marginTop: 8 },
  flagBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  flagCount: { fontSize: 13, color: colors.white, fontWeight: '700' },
  emptyCard: { width: '100%', aspectRatio: 1.5, borderRadius: 20, borderWidth: 3, borderColor: colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.darkText, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: colors.grey, marginTop: 6 },
  profileBanner: { backgroundColor: colors.rosterRed, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  profileBannerText: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
});
