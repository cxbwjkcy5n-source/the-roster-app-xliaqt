
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { authenticatedGet } from '@/utils/api';
import { useFocusEffect } from '@react-navigation/native';

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
  dateFrequency: {
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
}

const DATING_MENU_ITEMS = [
  {
    id: 'have-date',
    title: 'I Have a Date',
    subtitle: 'Schedule & track your date',
    iosIcon: 'calendar',
    androidIcon: 'calendar-today' as keyof typeof import('@expo/vector-icons/MaterialIcons').glyphMap,
    color: '#E91E8C',
    route: '/dating/schedule',
  },
  {
    id: 'plan-date',
    title: 'Plan a Date',
    subtitle: 'Get AI-powered suggestions',
    iosIcon: 'sparkles',
    androidIcon: 'auto-awesome' as keyof typeof import('@expo/vector-icons/MaterialIcons').glyphMap,
    color: '#9C27B0',
    route: '/dating/plan',
  },
  {
    id: 'on-date',
    title: "I'm On a Date",
    subtitle: 'Safety check-in & tracking',
    iosIcon: 'location.fill',
    androidIcon: 'location-on' as keyof typeof import('@expo/vector-icons/MaterialIcons').glyphMap,
    color: '#F44336',
    route: '/dating/safety',
  },
  {
    id: 'dating-coach',
    title: 'Dating Coach',
    subtitle: 'AI advice & conversation help',
    iosIcon: 'bubble.left.fill',
    androidIcon: 'chat' as keyof typeof import('@expo/vector-icons/MaterialIcons').glyphMap,
    color: '#2196F3',
    route: '/dating/coach',
  },
  {
    id: 'my-dates',
    title: 'My Dates',
    subtitle: 'View your date history',
    iosIcon: 'clock.fill',
    androidIcon: 'history' as keyof typeof import('@expo/vector-icons/MaterialIcons').glyphMap,
    color: '#4CAF50',
    route: '/dating/history',
  },
];

export default function DatingScreen() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const slideAnim = useRef(new Animated.Value(400)).current;

  const openMenu = () => {
    console.log('[Dating] User tapped menu button');
    setShowMenu(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeMenu = () => {
    console.log('[Dating] User closed dating menu');
    Animated.spring(slideAnim, {
      toValue: 400,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => setShowMenu(false));
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('[Dating] Screen focused - loading analytics');
      loadAnalytics();
    }, [])
  );

  const loadAnalytics = async () => {
    try {
      console.log('[Dating] Loading analytics...');
      setLoading(true);
      const data = await authenticatedGet('/api/analytics');
      console.log('[Dating] Analytics loaded:', data);
      setAnalytics(data);
    } catch (error: any) {
      console.error('[Dating] Error loading analytics:', error);
      setAnalytics({
        totalProfiles: 0,
        totalDates: 0,
        upcomingDates: 0,
        completedDates: 0,
        interestLevelBreakdown: { low: 0, medium: 0, high: 0 },
        statusBreakdown: { roster: 0, bench: 0 },
        dateFrequency: { thisWeek: 0, thisMonth: 0, lastMonth: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  const totalDates = analytics?.totalDates ?? 0;
  const completedDates = analytics?.completedDates ?? 0;
  const upcomingDates = analytics?.upcomingDates ?? 0;
  const thisMonthDates = analytics?.dateFrequency?.thisMonth ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Dating Header */}
      <LinearGradient 
        colors={gradients.actionRed} 
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>DATING</Text>
            <Text style={styles.headerSubtitle}>Manage your dating life</Text>
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={openMenu}
          >
            <IconSymbol
              ios_icon_name="line.3.horizontal"
              android_material_icon_name="menu"
              size={28}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalDates}</Text>
              <Text style={styles.statLabel}>Total Dates</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{completedDates}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{upcomingDates}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{thisMonthDates}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
          </View>

          {/* Interest Level Breakdown */}
          {analytics && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interest Level Breakdown</Text>
              <View style={styles.interestBreakdown}>
                <View style={styles.interestRow}>
                  <View style={[styles.interestDot, { backgroundColor: colors.green }]} />
                  <Text style={styles.interestLabel}>High Interest</Text>
                  <Text style={styles.interestValue}>{analytics.interestLevelBreakdown?.high ?? 0}</Text>
                </View>
                <View style={styles.interestRow}>
                  <View style={[styles.interestDot, { backgroundColor: colors.yellow }]} />
                  <Text style={styles.interestLabel}>Medium Interest</Text>
                  <Text style={styles.interestValue}>{analytics.interestLevelBreakdown?.medium ?? 0}</Text>
                </View>
                <View style={styles.interestRow}>
                  <View style={[styles.interestDot, { backgroundColor: colors.lowInterest }]} />
                  <Text style={styles.interestLabel}>Low Interest</Text>
                  <Text style={styles.interestValue}>{analytics.interestLevelBreakdown?.low ?? 0}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Status Breakdown */}
          {analytics && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status Breakdown</Text>
              <View style={styles.statusBreakdown}>
                <View style={styles.statusRow}>
                  <IconSymbol
                    ios_icon_name="star.fill"
                    android_material_icon_name="star"
                    size={20}
                    color={colors.rosterGreen}
                  />
                  <Text style={styles.statusLabel}>Roster</Text>
                  <Text style={styles.statusValue}>{analytics.statusBreakdown?.roster ?? 0}</Text>
                </View>
                <View style={styles.statusRow}>
                  <IconSymbol
                    ios_icon_name="pause.fill"
                    android_material_icon_name="pause"
                    size={20}
                    color={colors.benchRed}
                  />
                  <Text style={styles.statusLabel}>Bench</Text>
                  <Text style={styles.statusValue}>{analytics.statusBreakdown?.bench ?? 0}</Text>
                </View>
              </View>
            </View>
          )}

          {/* View Full Analytics Button */}
          <TouchableOpacity
            style={styles.fullAnalyticsButton}
            onPress={() => {
              console.log('[Dating] User tapped "View Full Analytics"');
              router.push('/dating/analytics' as any);
            }}
          >
            <Text style={styles.fullAnalyticsText}>View Full Analytics</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Dating Submenu Modal - Premium Dark Design */}
      <Modal
        visible={showMenu}
        animationType="none"
        transparent
        onRequestClose={closeMenu}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={closeMenu}
          />
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Dating</Text>
            <ScrollView 
              style={styles.modalScroll} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {DATING_MENU_ITEMS.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, index === DATING_MENU_ITEMS.length - 1 && styles.menuItemLast]}
                  onPress={() => {
                    console.log('[Dating] User tapped menu item:', item.title);
                    closeMenu();
                    setTimeout(() => router.push(item.route as any), 300);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconCircle, { backgroundColor: item.color }]}>
                    <IconSymbol
                      ios_icon_name={item.iosIcon}
                      android_material_icon_name={item.androidIcon}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={16}
                    color="#555555"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.cancelButton} onPress={closeMenu} activeOpacity={0.8}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
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
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120,
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
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.darkText,
    marginBottom: 12,
  },
  interestBreakdown: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  interestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  interestDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  interestLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.darkText,
  },
  interestValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkText,
  },
  statusBreakdown: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.darkText,
    marginLeft: 12,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkText,
  },
  fullAnalyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  fullAnalyticsText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 34,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#444444',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '400',
  },
  cancelButton: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
