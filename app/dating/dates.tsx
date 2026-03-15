
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useRoster } from '@/contexts/RosterContext';

export default function DatesScreen() {
  const router = useRouter();
  const { dates, roster, bench } = useRoster();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  const upcomingDates = dates.filter(d => d.status === 'upcoming');
  const completedDates = dates.filter(d => d.status === 'completed');
  const displayDates = activeTab === 'upcoming' ? upcomingDates : completedDates;

  const allPeople = [...roster, ...bench];

  const upcomingCount = upcomingDates.length;
  const completedCount = completedDates.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={['#E91E8C', '#C2185B']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log('[Dates] User tapped back button');
            router.back();
          }}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dates</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <IconSymbol
            ios_icon_name="calendar.badge.clock"
            android_material_icon_name="event"
            size={24}
            color="#E91E8C"
          />
          <Text style={styles.summaryValue}>{upcomingCount}</Text>
          <Text style={styles.summaryLabel}>Upcoming</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCard}>
          <IconSymbol
            ios_icon_name="checkmark.circle.fill"
            android_material_icon_name="check-circle"
            size={24}
            color={colors.rosterGreen}
          />
          <Text style={styles.summaryValue}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => {
            console.log('[Dates] User switched to Upcoming tab');
            setActiveTab('upcoming');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
          {upcomingCount > 0 && (
            <View style={[styles.tabBadge, activeTab === 'upcoming' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'upcoming' && styles.tabBadgeTextActive]}>
                {upcomingCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => {
            console.log('[Dates] User switched to Completed tab');
            setActiveTab('completed');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed
          </Text>
          {completedCount > 0 && (
            <View style={[styles.tabBadge, activeTab === 'completed' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'completed' && styles.tabBadgeTextActive]}>
                {completedCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {displayDates.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={64}
              color={colors.grey}
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming' ? 'No Upcoming Dates' : 'No Completed Dates'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'upcoming'
                ? 'Schedule a date from the Dating tab to see it here.'
                : 'Your completed dates will appear here once they are done.'}
            </Text>
            {activeTab === 'upcoming' && (
              <TouchableOpacity
                style={styles.scheduleButton}
                onPress={() => {
                  console.log('[Dates] User tapped Schedule a Date button');
                  router.push('/dating/schedule' as any);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.scheduleButtonText}>Schedule a Date</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayDates.map((date) => {
            const person = allPeople.find(p => p.id === date.profileId);
            const personImageUrl = person?.imageUrl;
            const profileNameStr = date.profileName || 'Unknown';
            const dateStr = date.date || '';
            const timeStr = date.time || '';
            const locationStr = date.location || 'No location set';
            const typeStr = date.type || 'casual';
            const ratingNum = date.rating || 0;

            return (
              <TouchableOpacity
                key={date.id}
                style={styles.dateCard}
                onPress={() => {
                  console.log('[Dates] User tapped date card:', date.id, 'for', profileNameStr);
                  router.push(`/person/${date.profileId}` as any);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.dateCardLeft}>
                  {personImageUrl ? (
                    <Image source={{ uri: personImageUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <IconSymbol
                        ios_icon_name="person.fill"
                        android_material_icon_name="person"
                        size={28}
                        color={colors.grey}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.dateCardBody}>
                  <View style={styles.dateCardTopRow}>
                    <Text style={styles.dateCardName}>{profileNameStr}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: '#E91E8C18' }]}>
                      <Text style={styles.typeBadgeText}>{typeStr}</Text>
                    </View>
                  </View>

                  <View style={styles.dateCardRow}>
                    <IconSymbol
                      ios_icon_name="calendar"
                      android_material_icon_name="calendar-today"
                      size={13}
                      color={colors.grey}
                    />
                    <Text style={styles.dateCardDetail}>
                      {dateStr}
                      {timeStr ? ` at ${timeStr}` : ''}
                    </Text>
                  </View>

                  <View style={styles.dateCardRow}>
                    <IconSymbol
                      ios_icon_name="location.fill"
                      android_material_icon_name="location-on"
                      size={13}
                      color={colors.grey}
                    />
                    <Text style={styles.dateCardDetail}>{locationStr}</Text>
                  </View>

                  {activeTab === 'completed' && ratingNum > 0 && (
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <IconSymbol
                          key={star}
                          ios_icon_name={star <= ratingNum ? 'star.fill' : 'star'}
                          android_material_icon_name={star <= ratingNum ? 'star' : 'star-border'}
                          size={13}
                          color={star <= ratingNum ? colors.warning : colors.grey}
                        />
                      ))}
                    </View>
                  )}
                </View>

                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron-right"
                  size={16}
                  color={colors.grey}
                />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSpacer: {
    width: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.darkText,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.grey,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.grey,
  },
  tabTextActive: {
    color: colors.darkText,
  },
  tabBadge: {
    backgroundColor: colors.grey,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: '#E91E8C',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  tabBadgeTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.darkText,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  scheduleButton: {
    backgroundColor: '#E91E8C',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#E91E8C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateCardLeft: {
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.backgroundAlt,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCardBody: {
    flex: 1,
    gap: 4,
  },
  dateCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkText,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E91E8C',
    textTransform: 'capitalize',
  },
  dateCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateCardDetail: {
    fontSize: 13,
    color: colors.grey,
    flex: 1,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
});
