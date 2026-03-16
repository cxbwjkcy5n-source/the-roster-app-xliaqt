
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

const GREEN_DARK = '#1B4332';
const GREEN_TRACK = '#A8D5A2';
const GREEN_LABEL = '#1B4332';

interface RatingCategory {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORIES: RatingCategory[] = [
  { key: 'sexualChemistry',       label: 'Sexual chemistry',       icon: 'heart-circle-outline' },
  { key: 'overallChemistry',      label: 'Overall chemistry',      icon: 'star-outline' },
  { key: 'communication',         label: 'Communication',          icon: 'chatbubble-outline' },
  { key: 'consistency',           label: 'Consistency',            icon: 'calendar-outline' },
  { key: 'emotionalAvailability', label: 'Emotional availability', icon: 'happy-outline' },
  { key: 'datePlanning',          label: 'Date planning',          icon: 'map-outline' },
  { key: 'alignment',             label: 'Alignment',              icon: 'reorder-three-outline' },
];

export type RatingsValues = {
  sexualChemistry: number;
  overallChemistry: number;
  communication: number;
  consistency: number;
  emotionalAvailability: number;
  datePlanning: number;
  alignment: number;
};

const DEFAULT_RATINGS: RatingsValues = {
  sexualChemistry: 5,
  overallChemistry: 5,
  communication: 5,
  consistency: 5,
  emotionalAvailability: 5,
  datePlanning: 5,
  alignment: 5,
};

interface Props {
  initialRatings?: Partial<RatingsValues>;
  onChange?: (ratings: RatingsValues) => void;
  onExcludedChange?: (excluded: string[]) => void;
}

// Circular progress indicator
function CircularProgress({ value, max }: { value: number; max: number }) {
  const SIZE = 72;
  const STROKE = 6;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const scoreInt = Math.round(value * 10) / 10;
  const scoreStr = String(scoreInt);

  return (
    <View style={circleStyles.wrapper}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={GREEN_TRACK}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={GREEN_DARK}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={circleStyles.labelContainer}>
        <Text style={circleStyles.scoreText}>{scoreStr}</Text>
        <Text style={circleStyles.maxText}>/{max}</Text>
      </View>
    </View>
  );
}

const circleStyles = StyleSheet.create({
  wrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '700',
    color: GREEN_DARK,
  },
  maxText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
});

// Single rating row with slider and exclude toggle
function RatingRow({
  category,
  value,
  excluded,
  onValueChange,
  onToggleExclude,
}: {
  category: RatingCategory;
  value: number;
  excluded: boolean;
  onValueChange: (key: string, val: number) => void;
  onToggleExclude: (key: string) => void;
}) {
  const scoreStr = String(value);

  const handleChange = useCallback(
    (val: number) => {
      onValueChange(category.key, val);
    },
    [category.key, onValueChange],
  );

  const handleSlidingComplete = useCallback(
    (val: number) => {
      console.log(`[RatingsSection] Slider released — ${category.label}: ${val}/10`);
      onValueChange(category.key, val);
    },
    [category.key, category.label, onValueChange],
  );

  const handleToggle = useCallback(() => {
    console.log(`[RatingsSection] Toggle exclude — ${category.label}: ${excluded ? 'including' : 'excluding'}`);
    onToggleExclude(category.key);
  }, [category.key, category.label, excluded, onToggleExclude]);

  return (
    <View style={[rowStyles.container, excluded && rowStyles.containerExcluded]}>
      <View style={rowStyles.labelRow}>
        <View style={rowStyles.labelLeft}>
          <Ionicons name={category.icon} size={22} color={excluded ? '#9CA3AF' : GREEN_DARK} />
          <Text style={[rowStyles.labelText, excluded && rowStyles.labelTextExcluded]}>
            {category.label}
          </Text>
        </View>
        <View style={rowStyles.rightSide}>
          <View style={rowStyles.scoreContainer}>
            <Text style={[rowStyles.scoreBold, excluded && rowStyles.scoreDimmed]}>{scoreStr}</Text>
            <Text style={rowStyles.scoreDim}>/10</Text>
          </View>
          <TouchableOpacity
            onPress={handleToggle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={rowStyles.toggleBtn}
          >
            <Ionicons
              name={excluded ? 'remove-circle-outline' : 'checkmark-circle'}
              size={24}
              color={excluded ? '#9CA3AF' : GREEN_DARK}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Slider
        style={[rowStyles.slider, excluded && rowStyles.sliderExcluded]}
        minimumValue={0}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={handleChange}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={excluded ? '#D1D5DB' : GREEN_DARK}
        maximumTrackTintColor={excluded ? '#E5E7EB' : GREEN_TRACK}
        thumbTintColor={excluded ? '#9CA3AF' : GREEN_DARK}
        disabled={excluded}
      />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  containerExcluded: {
    opacity: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  labelText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  labelTextExcluded: {
    color: '#9CA3AF',
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreBold: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN_DARK,
  },
  scoreDimmed: {
    color: '#9CA3AF',
  },
  scoreDim: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  toggleBtn: {
    padding: 2,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  sliderExcluded: {
    opacity: 0.4,
  },
});

export default function RatingsSection({ initialRatings, onChange, onExcludedChange }: Props) {
  const [ratings, setRatings] = useState<RatingsValues>({
    ...DEFAULT_RATINGS,
    ...initialRatings,
  });
  const [excludedKeys, setExcludedKeys] = useState<string[]>([]);

  const handleValueChange = useCallback(
    (key: string, val: number) => {
      setRatings(prev => {
        const next = { ...prev, [key]: val };
        onChange?.(next);
        return next;
      });
    },
    [onChange],
  );

  const handleToggleExclude = useCallback(
    (key: string) => {
      setExcludedKeys(prev => {
        const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
        onExcludedChange?.(next);
        return next;
      });
    },
    [onExcludedChange],
  );

  // Average only included categories, out of 5
  const includedCategories = CATEGORIES.filter(c => !excludedKeys.includes(c.key));
  const includedCount = includedCategories.length;
  const total = includedCount > 0
    ? includedCategories.reduce((sum, c) => sum + ratings[c.key as keyof RatingsValues], 0)
    : 0;
  const avgOf5 = includedCount > 0 ? (total / includedCount) / 2 : 0;
  const avgRounded = Math.round(avgOf5 * 10) / 10;

  const excludedCountNum = excludedKeys.length;
  const excludedCountStr = String(excludedCountNum);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CircularProgress value={avgRounded} max={5} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Ratings</Text>
          <Text style={styles.subtitle}>
            Select how much you rate the below factors
          </Text>
          {excludedCountNum > 0 && (
            <Text style={styles.excludedNote}>
              {excludedCountStr}
              {' '}
              {excludedCountNum === 1 ? 'category' : 'categories'}
              {' excluded from average'}
            </Text>
          )}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Sliders */}
      {CATEGORIES.map(cat => (
        <RatingRow
          key={cat.key}
          category={cat}
          value={ratings[cat.key as keyof RatingsValues]}
          excluded={excludedKeys.includes(cat.key)}
          onValueChange={handleValueChange}
          onToggleExclude={handleToggleExclude}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN_LABEL,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  excludedNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
});
