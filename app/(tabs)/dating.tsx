
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
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

export default function DatingScreen() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

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
      // Set empty analytics if error (e.g., no roster profiles yet)
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

  const menuItems = [
    {
      id: 'have-date',
      title: 'I have a date',
      icon: 'calendar-today' as keyof typeof import('@expo/vector-icons/MaterialIcons').glyphMap,
      iosIcon: 'calendar',
      description: 'Schedule an upcoming date',
      colors: MENU_COLORS['have-date'],
      action: () => {
        console.log('[Dating] User tapped "I have a date"');
        setShowMenu(false);
        router.push('/dating/schedule' as any);
      },
    },
    {
      id: 'plan-date',
      title: 'Plan a date',
      icon: 'edit' as keyof typeof import('@expo/vector-icons/MaterialIcons').glyphMap,
      iosIcon: 'pencil',
      description: 'Get AI-powered date ideas',
      colors: MENU_COLORS['plan-date'],
      action: () => {
        console.log('[Dating] User tapped "Plan a date"');
        setShowMenu(false);
        router.push('/dating/plan' as any);
      },
    },
    {
      id: 'on-date',
      title: "I'm on a date",
      icon: 'security' as keyof typeof import('@expo/vector-icons/MaterialIcons').glyphMap,
      iosIcon: 'shield.fill',
      description: 'Safety features for your date',
      colors: MENU_COLORS['on-date'],
      action: () => {
        console.log('[Dating] User tapped "I\'m on a date"');
        setShowMenu(false);
        router.push('/dating/safety' as any);
      },
    },
    {
      id: 'dating-coach',
      title: 'Dating Coach',
      icon: 'person' as keyof typeof import('@expo/vector-icons/MaterialIcons').glyphMap,
      iosIcon: 'person.fill',
      description: 'Get advice and tips',
      colors: MENU_COLORS['dating-coach'],
      action: () => {
        console.log('[Dating] User tapped "Dating Coach"');
        setShowMenu(false);
        router.push('/dating/coach' as any);
      },
    },
    {
      id: 'my-dates',
      title: 'My dates',
      icon: 'favorite' as keyof typeof import('@expo/vector-icons/MaterialIcons').glyphMap,
      iosIcon: 'heart.fill',
      description: 'View your date history',
      colors: MENU_COLORS['my-dates'],
      action: () => {
        console.log('[Dating] User tapped "My dates"');
        setShowMenu(false);
        router.push('/dating/history' as any);
      },
    },
  ];

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
            onPress={() => {
              console.log('[Dating] User tapped menu button');
              setShowMenu(true);
            }}
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

      {/* Dating Submenu Modal - Opens from BOTTOM */}
      <Modal
        visible={showMenu}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowMenu(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dating</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  console.log('[Dating] User closed dating menu');
                  setShowMenu(false);
                }}
              >
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.modalScroll} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, index === menuItems.length - 1 && styles.menuItemLast]}
                  onPress={item.action}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconContainer}>
                    <IconSymbol
                      ios_icon_name={item.iosIcon}
                      android_material_icon_name={item.icon}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={16}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              ))}
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
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '55%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '400',
  },
});
