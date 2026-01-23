
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { authenticatedGet } from '@/utils/api';

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
  datesPerMonth: Array<{ month: string; count: number }>;
  averageRating: number;
  totalRatings: number;
  wouldGoAgainPercentage: number;
  commonRedFlags: Array<{ flag: string; count: number }>;
  commonGreenFlags: Array<{ flag: string; count: number }>;
  topRatedDates: Array<{
    id: string;
    profileName: string;
    type: string;
    rating: number;
    date: string;
  }>;
}

export default function DatingAnalyticsScreen() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      console.log('[DatingAnalytics] Loading analytics...');
      setLoading(true);
      const data = await authenticatedGet('/api/analytics');
      console.log('[DatingAnalytics] Analytics loaded:', data);
      setAnalytics(data);
    } catch (error) {
      console.error('[DatingAnalytics] Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const averageRatingDisplay = analytics?.averageRating?.toFixed(1) || '0.0';
  const wouldGoAgainDisplay = analytics?.wouldGoAgainPercentage?.toFixed(0) || '0';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      
      <LinearGradient
        colors={['#FF6B9D', '#C44569']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log('[DatingAnalytics] User tapped back button');
            router.back();
          }}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dating Analytics</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : analytics ? (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Overview Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.totalDates}</Text>
              <Text style={styles.statLabel}>Total Dates</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.completedDates}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.upcomingDates}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.dateFrequency.thisMonth}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
          </View>

          {/* Date Ratings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date Ratings</Text>
            <View style={styles.ratingStatsRow}>
              <View style={styles.ratingStatCard}>
                <View style={styles.ratingStarRow}>
                  <IconSymbol
                    ios_icon_name="star.fill"
                    android_material_icon_name="star"
                    size={32}
                    color={colors.warning}
                  />
                  <Text style={styles.ratingValue}>{averageRatingDisplay}</Text>
                </View>
                <Text style={styles.ratingLabel}>Average Rating</Text>
                <Text style={styles.ratingSubtext}>
                  Based on {analytics.totalRatings} rating{analytics.totalRatings !== 1 ? 's' : ''}
                </Text>
              </View>
              
              <View style={styles.ratingStatCard}>
                <View style={styles.ratingStarRow}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={32}
                    color={colors.rosterGreen}
                  />
                  <Text style={styles.ratingValue}>{wouldGoAgainDisplay}%</Text>
                </View>
                <Text style={styles.ratingLabel}>Would Go Again</Text>
                <Text style={styles.ratingSubtext}>
                  {Math.round((analytics.wouldGoAgainPercentage / 100) * analytics.totalRatings)} of {analytics.totalRatings} dates
                </Text>
              </View>
            </View>
          </View>

          {/* Top Rated Dates */}
          {analytics.topRatedDates && analytics.topRatedDates.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Rated Dates</Text>
              {analytics.topRatedDates.map((date, index) => {
                const dateStr = date.date;
                const profileNameStr = date.profileName;
                const typeStr = date.type;
                const ratingNum = date.rating;
                
                return (
                  <View key={date.id || index} style={styles.topDateCard}>
                    <View style={styles.topDateHeader}>
                      <Text style={styles.topDateName}>{profileNameStr}</Text>
                      <View style={styles.topDateRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <IconSymbol
                            key={star}
                            ios_icon_name={star <= ratingNum ? "star.fill" : "star"}
                            android_material_icon_name={star <= ratingNum ? "star" : "star-border"}
                            size={14}
                            color={star <= ratingNum ? colors.warning : colors.grey}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.topDateType}>{typeStr}</Text>
                    <Text style={styles.topDateDate}>{dateStr}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Dates Per Month */}
          {analytics.datesPerMonth && analytics.datesPerMonth.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dates Per Month</Text>
              {analytics.datesPerMonth.map((item, index) => {
                const monthStr = item.month;
                const countNum = item.count;
                const maxCount = Math.max(...analytics.datesPerMonth.map(d => d.count));
                const widthPercent = (countNum / maxCount) * 100;
                
                return (
                  <View key={index} style={styles.barChartRow}>
                    <Text style={styles.barLabel}>{monthStr}</Text>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            width: `${widthPercent}%`,
                          },
                        ]}
                      />
                      <Text style={styles.barValue}>{countNum}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Common Red Flags */}
          {analytics.commonRedFlags && analytics.commonRedFlags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Common Red Flags</Text>
              {analytics.commonRedFlags.slice(0, 5).map((item, index) => {
                const flagStr = item.flag;
                const countNum = item.count;
                
                return (
                  <View key={index} style={styles.flagRow}>
                    <Text style={styles.flagEmoji}>🚩</Text>
                    <Text style={styles.flagText}>{flagStr}</Text>
                    <Text style={styles.flagCount}>{countNum}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Common Green Flags */}
          {analytics.commonGreenFlags && analytics.commonGreenFlags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Common Green Flags</Text>
              {analytics.commonGreenFlags.slice(0, 5).map((item, index) => {
                const flagStr = item.flag;
                const countNum = item.count;
                
                return (
                  <View key={index} style={styles.flagRow}>
                    <Text style={styles.flagEmoji}>✅</Text>
                    <Text style={styles.flagText}>{flagStr}</Text>
                    <Text style={styles.flagCount}>{countNum}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Interest Level Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interest Level Breakdown</Text>
            <View style={styles.interestBreakdown}>
              <View style={styles.interestRow}>
                <View style={[styles.interestDot, { backgroundColor: colors.green }]} />
                <Text style={styles.interestLabel}>High Interest</Text>
                <Text style={styles.interestValue}>{analytics.interestLevelBreakdown.high}</Text>
              </View>
              <View style={styles.interestRow}>
                <View style={[styles.interestDot, { backgroundColor: colors.yellow }]} />
                <Text style={styles.interestLabel}>Medium Interest</Text>
                <Text style={styles.interestValue}>{analytics.interestLevelBreakdown.medium}</Text>
              </View>
              <View style={styles.interestRow}>
                <View style={[styles.interestDot, { backgroundColor: colors.lowInterest }]} />
                <Text style={styles.interestLabel}>Low Interest</Text>
                <Text style={styles.interestValue}>{analytics.interestLevelBreakdown.low}</Text>
              </View>
            </View>
          </View>

          {/* Status Breakdown */}
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
                <Text style={styles.statusValue}>{analytics.statusBreakdown.roster}</Text>
              </View>
              <View style={styles.statusRow}>
                <IconSymbol
                  ios_icon_name="pause.fill"
                  android_material_icon_name="pause"
                  size={20}
                  color={colors.benchRed}
                />
                <Text style={styles.statusLabel}>Bench</Text>
                <Text style={styles.statusValue}>{analytics.statusBreakdown.bench}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No analytics data available</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingBottom: 100,
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
  ratingStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingStatCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ratingValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.darkText,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkText,
    marginBottom: 4,
  },
  ratingSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  topDateCard: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  topDateName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkText,
  },
  topDateRating: {
    flexDirection: 'row',
    gap: 2,
  },
  topDateType: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  topDateDate: {
    fontSize: 12,
    color: colors.grey,
  },
  barChartRow: {
    marginBottom: 12,
  },
  barLabel: {
    fontSize: 12,
    color: colors.darkText,
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
    color: colors.darkText,
    fontWeight: '600',
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flagEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  flagText: {
    flex: 1,
    fontSize: 14,
    color: colors.darkText,
  },
  flagCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
