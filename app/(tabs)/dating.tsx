
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRoster } from '@/contexts/RosterContext';
import { useAuth } from '@/contexts/AuthContext';

// ─── Constants ───────────────────────────────────────────────────────────────

const DARK_GREEN = '#1B4332';
const DARK_PINK = '#C2185B';
const BG = '#F8F8F8';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#1A1A1A';
const TEXT_MUTED = '#888888';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveImageSource(
  source: string | number | ImageSourcePropType | undefined,
): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function relativeTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDateParts(dateStr: string): { month: string; day: string } {
  const parts = dateStr.split('-');
  if (parts.length < 3) return { month: '', day: '' };
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return {
    month: MONTH_ABBR[monthIdx] ?? '',
    day: String(day),
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ActionCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  bg: string;
  iconColor: string;
  textColor: string;
  borderColor?: string;
  onPress: () => void;
}

function ActionCard({
  icon,
  title,
  subtitle,
  bg,
  iconColor,
  textColor,
  borderColor,
  onPress,
}: ActionCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.actionCard,
        { backgroundColor: bg },
        borderColor ? { borderWidth: 1.5, borderColor } : undefined,
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={styles.actionCardIcon}>
        <MaterialIcons name={icon} size={32} color={iconColor} />
      </View>
      <Text style={[styles.actionCardTitle, { color: textColor }]}>{title}</Text>
      <Text style={[styles.actionCardSubtitle, { color: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.72)' : TEXT_MUTED }]}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DatingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { roster, dates } = useRoster();

  // ── Stats ──────────────────────────────────────────────────────────────────
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const upcomingDates = useMemo(
    () =>
      dates
        .filter((d) => d.status === 'upcoming' && d.date >= todayStr)
        .sort((a, b) => {
          const aTime = `${a.date}T${a.time}`;
          const bTime = `${b.date}T${b.time}`;
          return aTime < bTime ? -1 : 1;
        }),
    [dates, todayStr],
  );

  const activeCount = roster.filter((p) => p.status === 'roster').length;

  const avgRating = useMemo(() => {
    const rated = dates.filter((d) => d.rating != null && d.rating > 0);
    if (rated.length === 0) return null;
    const sum = rated.reduce((acc, d) => acc + (d.rating ?? 0), 0);
    return (sum / rated.length).toFixed(1);
  }, [dates]);

  const totalDatesCount = dates.length;

  // ── Recent activity (last 4 roster members) ────────────────────────────────
  const recentActivity = useMemo(() => roster.slice(0, 4), [roster]);

  // ── User avatar ────────────────────────────────────────────────────────────
  const userInitials = user?.name ? getInitials(user.name) : 'ME';
  const userImage = user?.image;

  // ── Stat values ────────────────────────────────────────────────────────────
  const totalDatesStr = String(totalDatesCount);
  const activeCountStr = String(activeCount);
  const avgRatingStr = avgRating ?? '—';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Hero Header ─────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>Dating</Text>
            <Text style={styles.heroSubtitle}>Your love life, organized.</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => {
              console.log('[Dating] User tapped avatar — navigating to profile');
              router.push('/(tabs)/profile');
            }}
            activeOpacity={0.8}
          >
            {userImage ? (
              <Image source={resolveImageSource(userImage)} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{userInitials}</Text>
              </View>
            )}
          </TouchableOpacity>
          {/* Bottom fade edge */}
          <View style={styles.heroFade} />
        </View>

        {/* ── 2. Quick Stats Strip ───────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statEmoji}>🗓️</Text>
            <Text style={styles.statValue}>{totalDatesStr}</Text>
            <Text style={styles.statLabel}>Dates</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statEmoji}>👥</Text>
            <Text style={styles.statValue}>{activeCountStr}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>{avgRatingStr}</Text>
            <Text style={styles.statLabel}>Avg</Text>
          </View>
        </View>

        {/* ── 3. Action Cards Grid ───────────────────────────────────────── */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <ActionCard
              icon="event"
              title="Schedule a Date"
              subtitle="Plan your next outing"
              bg={DARK_GREEN}
              iconColor="#FFFFFF"
              textColor="#FFFFFF"
              onPress={() => {
                console.log('[Dating] User tapped Schedule a Date card');
                router.push('/dating/schedule' as any);
              }}
            />
            <ActionCard
              icon="map"
              title="Plan a Date"
              subtitle="Find activities & build itinerary"
              bg={CARD_BG}
              iconColor={DARK_PINK}
              textColor={TEXT_PRIMARY}
              borderColor="#E0E0E0"
              onPress={() => {
                console.log('[Dating] User tapped Plan a Date card');
                router.push('/dating/plan' as any);
              }}
            />
          </View>
          <View style={styles.gridRow}>
            <ActionCard
              icon="bar-chart"
              title="Analytics"
              subtitle="Track your dating patterns"
              bg={DARK_PINK}
              iconColor="#FFFFFF"
              textColor="#FFFFFF"
              onPress={() => {
                console.log('[Dating] User tapped Analytics card');
                router.push('/dating/analytics' as any);
              }}
            />
            <ActionCard
              icon="group"
              title="My Roster"
              subtitle="Manage your connections"
              bg={CARD_BG}
              iconColor={DARK_GREEN}
              textColor={TEXT_PRIMARY}
              borderColor="#E0E0E0"
              onPress={() => {
                console.log('[Dating] User tapped My Roster card');
                router.push('/(tabs)/(home)/' as any);
              }}
            />
          </View>
        </View>

        {/* ── 4. Upcoming Dates ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Dates</Text>
            <TouchableOpacity
              onPress={() => {
                console.log('[Dating] User tapped See all upcoming dates');
                router.push('/dating/schedule' as any);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {upcomingDates.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="event" size={40} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No dates scheduled yet</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => {
                  console.log('[Dating] User tapped Schedule one from empty state');
                  router.push('/dating/schedule' as any);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>Schedule one</Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingDates.slice(0, 3).map((dateItem) => {
              const { month, day } = parseDateParts(dateItem.date);
              const personName = dateItem.profileName ?? 'Unknown';
              const locationText = dateItem.location ?? '';
              const timeText = dateItem.time ?? '';

              return (
                <TouchableOpacity
                  key={dateItem.id}
                  style={styles.dateCard}
                  onPress={() => {
                    console.log('[Dating] User tapped upcoming date card:', dateItem.id);
                    router.push('/dating/schedule' as any);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateBlockMonth}>{month}</Text>
                    <Text style={styles.dateBlockDay}>{day}</Text>
                  </View>
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateName}>{personName}</Text>
                    {locationText.length > 0 && (
                      <View style={styles.dateLocationRow}>
                        <MaterialIcons name="place" size={12} color={TEXT_MUTED} />
                        <Text style={styles.dateLocation} numberOfLines={1}>
                          {locationText}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.dateTime}>{timeText}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── 5. Recent Activity ─────────────────────────────────────────── */}
        {recentActivity.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
            <View style={styles.activityCard}>
              {recentActivity.map((person, idx) => {
                const initials = getInitials(person.name);
                const isLast = idx === recentActivity.length - 1;
                const activityLabel = 'Added to roster';
                const timeLabel = relativeTime(person.createdAt);

                return (
                  <View key={person.id}>
                    <View style={styles.activityRow}>
                      {person.imageUrl ? (
                        <Image
                          source={resolveImageSource(person.imageUrl)}
                          style={styles.activityAvatar}
                        />
                      ) : (
                        <View style={styles.activityAvatarFallback}>
                          <Text style={styles.activityAvatarInitials}>{initials}</Text>
                        </View>
                      )}
                      <View style={styles.activityText}>
                        <Text style={styles.activityName}>{person.name}</Text>
                        <Text style={styles.activityDesc}>{activityLabel}</Text>
                      </View>
                      {timeLabel.length > 0 && (
                        <Text style={styles.activityTime}>{timeLabel}</Text>
                      )}
                    </View>
                    {!isLast && <View style={styles.activityDivider} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Bottom padding for floating tab bar */}
        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // Hero
  hero: {
    backgroundColor: DARK_GREEN,
    height: 160,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  },
  heroTextBlock: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.62)',
    marginTop: 4,
    fontWeight: '500',
  },
  heroFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  avatarButton: {
    marginTop: 2,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Stats strip
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 10,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: DARK_GREEN,
    backgroundColor: CARD_BG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statEmoji: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK_GREEN,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: DARK_GREEN,
  },

  // Action cards grid
  gridContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    minHeight: 140,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  actionCardIcon: {
    marginBottom: 10,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  actionCardSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_GREEN,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_PINK,
  },

  // Empty state
  emptyState: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingVertical: 36,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 15,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  emptyButton: {
    marginTop: 4,
    backgroundColor: DARK_GREEN,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Date cards
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  dateBlock: {
    width: 48,
    height: 52,
    backgroundColor: DARK_GREEN,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBlockMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateBlockDay: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  dateInfo: {
    flex: 1,
    gap: 3,
  },
  dateName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  dateLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateLocation: {
    fontSize: 13,
    color: TEXT_MUTED,
    flex: 1,
  },
  dateTime: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '500',
  },

  // Activity feed
  activityCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  activityAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DARK_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityAvatarInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activityText: {
    flex: 1,
    gap: 2,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  activityDesc: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  activityTime: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  activityDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EEEEEE',
    marginLeft: 52,
  },

  bottomPad: {
    height: 100,
  },
});
