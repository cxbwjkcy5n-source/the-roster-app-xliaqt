
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useRoster } from '@/contexts/RosterContext';
import { getZodiacFromBirthday } from '@/utils/zodiac';

// ─── Analytics card colors ───────────────────────────────────────────────────

const DARK_GREEN = '#1B4332';
const PINK_PRIMARY = '#C2185B';
const PINK_DEEP = '#880E4F';
const PINK_LIGHT = '#FCE4EC';

// ─── Sparkline SVG ───────────────────────────────────────────────────────────

function Sparkline({ count }: { count: number }) {
  const W = 120;
  const H = 40;
  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * W;
      const progress = i / steps;
      const wave = Math.sin(i * 1.2) * 4;
      const y = H - 4 - progress * (H - 12) + wave;
      pts.push({ x, y: Math.max(4, Math.min(H - 4, y)) });
    }
    return pts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath = linePath + ` L ${W} ${H} L 0 ${H} Z`;

  return (
    <Svg width={W} height={H}>
      <Path d={areaPath} fill={PINK_PRIMARY + '22'} />
      <Path d={linePath} stroke={PINK_PRIMARY} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Chemistry ring ──────────────────────────────────────────────────────────

function ChemistryRing({ score }: { score: number }) {
  const SIZE = 110;
  const STROKE = 10;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progress = Math.min(score / 10, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const scoreInt = Math.round(score);
  const scoreStr = String(scoreInt);

  return (
    <View style={ringStyles.wrapper}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={PINK_LIGHT}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={PINK_PRIMARY}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={ringStyles.label}>
        <Text style={ringStyles.scoreText}>{scoreStr}</Text>
        <Text style={ringStyles.maxText}>/10</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '800',
    color: PINK_PRIMARY,
  },
  maxText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    marginLeft: 1,
  },
});

// ─── 2×2 Analytics grid ──────────────────────────────────────────────────────

interface AnalyticsGridProps {
  totalCount: number;
  avgChemistry: number;
  highestRatedName: string;
  bestZodiac: string;
}

function AnalyticsGrid({ totalCount, avgChemistry, highestRatedName, bestZodiac }: AnalyticsGridProps) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 16 * 2 - 12) / 2;
  const totalStr = String(totalCount).padStart(2, '0');

  return (
    <View style={gridStyles.container}>
      <Text style={gridStyles.sectionHeader}>Your Dating Analytics</Text>
      <View style={gridStyles.row}>
        {/* Card 1 — Total People */}
        <View style={[gridStyles.card, gridStyles.cardBorderPink, { width: cardWidth }]}>
          <Text style={gridStyles.bigNumber}>{totalStr}</Text>
          <Text style={gridStyles.cardLabel}>Total people on your roster</Text>
          <View style={gridStyles.sparklineWrap}>
            <Sparkline count={totalCount} />
          </View>
          <Text style={gridStyles.sparklineCaption}>Growth Trend (Past 30d)</Text>
        </View>

        {/* Card 2 — Avg Chemistry */}
        <View style={[gridStyles.card, gridStyles.cardBorderPink, { width: cardWidth, alignItems: 'center', justifyContent: 'center' }]}>
          <ChemistryRing score={avgChemistry} />
          <Text style={[gridStyles.cardLabel, { textAlign: 'center', marginTop: 12 }]}>
            Average Chemistry Score
          </Text>
        </View>
      </View>

      <View style={[gridStyles.row, { marginTop: 12 }]}>
        {/* Card 3 — Highest Rated */}
        <View style={[gridStyles.card, gridStyles.cardNoBorder, { width: cardWidth, padding: 0, overflow: 'hidden' }]}>
          <View style={gridStyles.splitCardTop}>
            <Text style={gridStyles.splitCardName} numberOfLines={1} adjustsFontSizeToFit>
              {highestRatedName || '—'}
            </Text>
          </View>
          <View style={[gridStyles.splitCardBottom, { backgroundColor: PINK_DEEP }]}>
            <Text style={gridStyles.splitCardBottomLabel}>Highest Rated{'\n'}Person</Text>
            <View style={gridStyles.splitCardIcon}>
              <IconSymbol
                ios_icon_name="star"
                android_material_icon_name="star-border"
                size={28}
                color="rgba(255,255,255,0.7)"
              />
            </View>
          </View>
        </View>

        {/* Card 4 — Best Zodiac */}
        <View style={[gridStyles.card, gridStyles.cardNoBorder, { width: cardWidth, padding: 0, overflow: 'hidden' }]}>
          <View style={gridStyles.splitCardTop}>
            <Text style={[gridStyles.splitCardName, { color: PINK_PRIMARY }]} numberOfLines={1} adjustsFontSizeToFit>
              {bestZodiac || '—'}
            </Text>
          </View>
          <View style={[gridStyles.splitCardBottom, { backgroundColor: PINK_PRIMARY }]}>
            <Text style={gridStyles.splitCardBottomLabel}>Best Zodiac{'\n'}Match</Text>
            <View style={gridStyles.splitCardIcon}>
              <IconSymbol
                ios_icon_name="heart"
                android_material_icon_name="favorite-border"
                size={28}
                color="rgba(255,255,255,0.7)"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const gridStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_GREEN,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardBorderPink: {
    borderWidth: 1.5,
    borderColor: PINK_PRIMARY,
  },
  cardNoBorder: {
    borderWidth: 0,
  },
  bigNumber: {
    fontSize: 52,
    fontWeight: '800',
    color: DARK_GREEN,
    lineHeight: 58,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 6,
    lineHeight: 18,
  },
  sparklineWrap: {
    marginTop: 'auto',
    paddingTop: 12,
  },
  sparklineCaption: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  splitCardTop: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  splitCardName: {
    fontSize: 44,
    fontWeight: '800',
    color: PINK_DEEP,
    lineHeight: 50,
  },
  splitCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 72,
  },
  splitCardBottomLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 18,
    flex: 1,
  },
  splitCardIcon: {
    marginLeft: 8,
  },
});

// ─── Derived helpers ────────────────────────────────────────────────────────

function getAvgRating(ratings: number[]): string {
  if (ratings.length === 0) return '—';
  const sum = ratings.reduce((a, b) => a + b, 0);
  return (sum / ratings.length).toFixed(1);
}

function getMostActiveDay(dateDates: string[]): string {
  if (dateDates.length === 0) return '—';
  const dayCounts: Record<string, number> = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  dateDates.forEach((d) => {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      const name = dayNames[parsed.getDay()];
      dayCounts[name] = (dayCounts[name] || 0) + 1;
    }
  });
  const entries = Object.entries(dayCounts);
  if (entries.length === 0) return '—';
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

function getMatchRate(total: number, completed: number): string {
  if (total === 0) return '0%';
  return Math.round((completed / total) * 100) + '%';
}

// ─── Bar chart row ───────────────────────────────────────────────────────────

interface BarRowProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

function BarRow({ label, value, max, color }: BarRowProps) {
  const pct = max === 0 ? 0 : Math.min((value / max) * 100, 100);
  const pctStr = pct.toFixed(0) + '%';
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: pctStr, backgroundColor: color }]} />
      </View>
      <Text style={barStyles.value}>{value}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    width: 36,
    fontSize: 12,
    fontWeight: '600',
    color: colors.grey,
  },
  track: {
    flex: 1,
    height: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  fill: {
    height: '100%',
    borderRadius: 10,
  },
  value: {
    width: 24,
    fontSize: 13,
    fontWeight: '700',
    color: colors.darkText,
    textAlign: 'right',
  },
});

// ─── Star display ────────────────────────────────────────────────────────────

function StarDisplay({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <IconSymbol
          key={s}
          ios_icon_name={s <= filled ? 'star.fill' : 'star'}
          android_material_icon_name={s <= filled ? 'star' : 'star-border'}
          size={18}
          color={s <= filled ? colors.warning : colors.border}
        />
      ))}
    </View>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: string;
  androidIcon: string;
  label: string;
  value: string;
  accent: string;
}

function StatCard({ icon, androidIcon, label, value, accent }: StatCardProps) {
  return (
    <View style={[statStyles.card, { borderTopColor: accent, borderTopWidth: 3 }]}>
      <View style={[statStyles.iconWrap, { backgroundColor: accent + '18' }]}>
        <IconSymbol
          ios_icon_name={icon}
          android_material_icon_name={androidIcon}
          size={22}
          color={accent}
        />
      </View>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.darkText,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.grey,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkText,
    marginBottom: 16,
  },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const router = useRouter();
  const { dates, roster, bench } = useRoster();

  // ─── Analytics grid data ────────────────────────────────────────────────
  const allPeople = useMemo(() => [...roster, ...bench], [roster, bench]);

  const totalPeopleCount = allPeople.length;

  const avgChemistry = useMemo(() => {
    const scores = allPeople
      .map((p) => {
        if (p.sexualChemistry != null) return Number(p.sexualChemistry);
        if (p.compatibilityScore != null) return Number(p.compatibilityScore) * 10;
        return null;
      })
      .filter((s): s is number => s !== null && !isNaN(s));
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [allPeople]);

  const highestRatedName = useMemo(() => {
    if (allPeople.length === 0) return '';
    let best = allPeople[0];
    let bestScore = -1;
    for (const p of allPeople) {
      const vals = [p.sexualChemistry, p.attractiveness, p.compatibilityScore]
        .filter((v): v is number => v != null && !isNaN(Number(v)))
        .map(Number);
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      if (avg > bestScore) {
        bestScore = avg;
        best = p;
      }
    }
    const firstName = best.name ? best.name.split(' ')[0] : '';
    return firstName;
  }, [allPeople]);

  const bestZodiac = useMemo(() => {
    if (allPeople.length === 0) return '';
    const counts: Record<string, number> = {};
    for (const p of allPeople) {
      let sign = p.zodiacSign;
      if (!sign && p.birthdayMonth && p.birthdayDay) {
        sign = getZodiacFromBirthday(p.birthdayMonth, p.birthdayDay);
      }
      if (sign) {
        counts[sign] = (counts[sign] || 0) + 1;
      }
    }
    const entries = Object.entries(counts);
    if (entries.length === 0) return '';
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }, [allPeople]);

  // ─── Derived stats from real data ───────────────────────────────────────
  const totalDates = dates.length;
  const completedDates = dates.filter((d) => d.status === 'completed');
  const upcomingDates = dates.filter((d) => d.status === 'upcoming');
  const completedCount = completedDates.length;
  const upcomingCount = upcomingDates.length;

  const ratings = completedDates.map((d) => d.rating || 0).filter((r) => r > 0);
  const avgRatingNum = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const avgRatingStr = getAvgRating(ratings);
  const matchRateStr = getMatchRate(totalDates, completedCount);
  const mostActiveDayStr = getMostActiveDay(dates.map((d) => d.date || ''));

  const totalPeople = totalPeopleCount;
  const rosterCount = roster.length;
  const benchCount = bench.length;

  const typeCounts: Record<string, number> = {};
  dates.forEach((d) => {
    const t = d.type || 'casual';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const maxTypeCount = typeEntries.length > 0 ? typeEntries[0][1] : 1;

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratings.filter((r) => r === star).length,
  }));
  const maxRatingCount = Math.max(...ratingDist.map((r) => r.count), 1);

  const wouldGoAgainCount = completedDates.filter((d) => d.wouldGoAgain === true).length;
  const wouldNotGoAgainCount = completedDates.filter((d) => d.wouldGoAgain === false).length;

  const typeColors = [PINK_PRIMARY, PINK_DEEP, '#9C27B0', '#2196F3', '#4CAF50'];

  const wouldGoAgainPct = completedCount > 0 ? Math.round((wouldGoAgainCount / completedCount) * 100) : 0;
  const wouldGoAgainPctStr = wouldGoAgainPct + '%';
  const wouldNotGoAgainPctStr = (100 - wouldGoAgainPct) + '%';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Dark pink gradient header */}
      <LinearGradient colors={[PINK_PRIMARY, PINK_DEEP]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log('[Analytics] User tapped back button');
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Your dating insights</Text>
        </View>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2×2 Analytics grid */}
        <AnalyticsGrid
          totalCount={totalPeopleCount}
          avgChemistry={avgChemistry}
          highestRatedName={highestRatedName}
          bestZodiac={bestZodiac}
        />

        {/* Hero stat cards */}
        <View style={styles.statRow}>
          <StatCard
            icon="calendar.badge.checkmark"
            androidIcon="event-available"
            label="Total Dates"
            value={String(totalDates)}
            accent={PINK_PRIMARY}
          />
          <View style={styles.statGap} />
          <StatCard
            icon="percent"
            androidIcon="percent"
            label="Match Rate"
            value={matchRateStr}
            accent={PINK_DEEP}
          />
        </View>

        <View style={[styles.statRow, { marginTop: 12 }]}>
          <StatCard
            icon="star.fill"
            androidIcon="star"
            label="Avg Rating"
            value={avgRatingStr}
            accent={colors.warning}
          />
          <View style={styles.statGap} />
          <StatCard
            icon="person.2.fill"
            androidIcon="group"
            label="Total People"
            value={String(totalPeople)}
            accent={colors.rosterGreen}
          />
        </View>

        {/* Dates overview */}
        <View style={{ marginTop: 20 }}>
          <Section title="Dates Overview">
            <View style={styles.overviewRow}>
              <View style={[styles.overviewCard, { borderColor: PINK_PRIMARY }]}>
                <IconSymbol
                  ios_icon_name="calendar.badge.clock"
                  android_material_icon_name="event"
                  size={28}
                  color={PINK_PRIMARY}
                />
                <Text style={[styles.overviewValue, { color: PINK_PRIMARY }]}>{upcomingCount}</Text>
                <Text style={styles.overviewLabel}>Upcoming</Text>
              </View>
              <View style={[styles.overviewCard, { borderColor: colors.rosterGreen }]}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={28}
                  color={colors.rosterGreen}
                />
                <Text style={[styles.overviewValue, { color: colors.rosterGreen }]}>{completedCount}</Text>
                <Text style={styles.overviewLabel}>Completed</Text>
              </View>
              <View style={[styles.overviewCard, { borderColor: colors.warning }]}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={28}
                  color={colors.warning}
                />
                <Text style={[styles.overviewValue, { color: colors.warning }]}>{totalDates}</Text>
                <Text style={styles.overviewLabel}>Total</Text>
              </View>
            </View>
          </Section>
        </View>

        {/* Most active day + avg rating */}
        <Section title="Highlights">
          <View style={styles.highlightRow}>
            <View style={styles.highlightItem}>
              <View style={[styles.highlightIcon, { backgroundColor: PINK_PRIMARY + '18' }]}>
                <IconSymbol
                  ios_icon_name="sun.max.fill"
                  android_material_icon_name="wb-sunny"
                  size={22}
                  color={PINK_PRIMARY}
                />
              </View>
              <Text style={styles.highlightLabel}>Most Active Day</Text>
              <Text style={styles.highlightValue}>{mostActiveDayStr}</Text>
            </View>
            <View style={styles.highlightDivider} />
            <View style={styles.highlightItem}>
              <View style={[styles.highlightIcon, { backgroundColor: colors.warning + '18' }]}>
                <IconSymbol
                  ios_icon_name="star.fill"
                  android_material_icon_name="star"
                  size={22}
                  color={colors.warning}
                />
              </View>
              <Text style={styles.highlightLabel}>Avg Rating</Text>
              {avgRatingNum > 0 ? (
                <StarDisplay rating={avgRatingNum} />
              ) : (
                <Text style={styles.highlightValue}>—</Text>
              )}
            </View>
          </View>

          <View style={[styles.highlightRow, { marginTop: 16 }]}>
            <View style={styles.highlightItem}>
              <View style={[styles.highlightIcon, { backgroundColor: colors.rosterGreen + '18' }]}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={22}
                  color={colors.rosterGreen}
                />
              </View>
              <Text style={styles.highlightLabel}>On Roster</Text>
              <Text style={styles.highlightValue}>{rosterCount}</Text>
            </View>
            <View style={styles.highlightDivider} />
            <View style={styles.highlightItem}>
              <View style={[styles.highlightIcon, { backgroundColor: colors.rosterRed + '18' }]}>
                <IconSymbol
                  ios_icon_name="pause.circle.fill"
                  android_material_icon_name="pause-circle-outline"
                  size={22}
                  color={colors.rosterRed}
                />
              </View>
              <Text style={styles.highlightLabel}>On Bench</Text>
              <Text style={styles.highlightValue}>{benchCount}</Text>
            </View>
          </View>
        </Section>

        {/* Rating distribution */}
        {ratings.length > 0 && (
          <Section title="Rating Distribution">
            {ratingDist.map(({ star, count }) => (
              <BarRow
                key={star}
                label={String(star) + '★'}
                value={count}
                max={maxRatingCount}
                color={colors.warning}
              />
            ))}
          </Section>
        )}

        {/* Date type breakdown */}
        {typeEntries.length > 0 && (
          <Section title="Date Types">
            {typeEntries.map(([type, count], i) => (
              <BarRow
                key={type}
                label={type.slice(0, 3)}
                value={count}
                max={maxTypeCount}
                color={typeColors[i % typeColors.length]}
              />
            ))}
          </Section>
        )}

        {/* Would go again */}
        {completedCount > 0 && (
          <Section title="Would Go Again?">
            <View style={styles.wouldGoRow}>
              <View style={styles.wouldGoItem}>
                <LinearGradient
                  colors={[colors.rosterGreen, '#1F6B3A']}
                  style={styles.wouldGoCircle}
                >
                  <Text style={styles.wouldGoCircleText}>{wouldGoAgainPctStr}</Text>
                </LinearGradient>
                <Text style={styles.wouldGoLabel}>Yes</Text>
                <Text style={styles.wouldGoCount}>{wouldGoAgainCount} dates</Text>
              </View>
              <View style={styles.wouldGoItem}>
                <LinearGradient
                  colors={[PINK_PRIMARY, PINK_DEEP]}
                  style={styles.wouldGoCircle}
                >
                  <Text style={styles.wouldGoCircleText}>{wouldNotGoAgainPctStr}</Text>
                </LinearGradient>
                <Text style={styles.wouldGoLabel}>No</Text>
                <Text style={styles.wouldGoCount}>{wouldNotGoAgainCount} dates</Text>
              </View>
            </View>
          </Section>
        )}

        {/* Empty state */}
        {totalDates === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="chart.bar"
              android_material_icon_name="bar-chart"
              size={64}
              color={colors.border}
            />
            <Text style={styles.emptyTitle}>No Data Yet</Text>
            <Text style={styles.emptySubtext}>
              Schedule and complete dates to see your analytics here.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => {
                console.log('[Analytics] User tapped Schedule a Date CTA');
                router.push('/dating/schedule' as any);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaButtonText}>Schedule a Date</Text>
            </TouchableOpacity>
          </View>
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statRow: {
    flexDirection: 'row',
  },
  statGap: {
    width: 12,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: 10,
  },
  overviewCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1.5,
    gap: 6,
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.grey,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  highlightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.grey,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  highlightValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.darkText,
  },
  highlightDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  wouldGoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  wouldGoItem: {
    alignItems: 'center',
    gap: 8,
  },
  wouldGoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  wouldGoCircleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  wouldGoLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.darkText,
  },
  wouldGoCount: {
    fontSize: 12,
    color: colors.grey,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.darkText,
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  ctaButton: {
    backgroundColor: PINK_PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: PINK_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
