
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={gradients.actionRed}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>DATING</Text>
            <Text style={styles.headerSubtitle}>Manage your dating life</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                console.log('[Dating] User tapped Dates button - navigating to dates');
                router.push('/dating/dates' as any);
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
                console.log('[Dating] User tapped Analytics button - navigating to analytics');
                router.push('/dating/analytics' as any);
              }}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="insert-chart"
                size={22}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>WHAT WOULD YOU LIKE TO DO?</Text>

        <View style={styles.menuList}>
          {DATING_MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuCard,
                index === DATING_MENU_ITEMS.length - 1 && styles.menuCardLast,
              ]}
              onPress={() => {
                console.log('[Dating] User tapped menu item:', item.title, '- navigating to', item.route);
                router.push(item.route as any);
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                <IconSymbol
                  ios_icon_name={item.iosIcon}
                  android_material_icon_name={item.androidIcon}
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={[styles.chevronContainer, { backgroundColor: item.color + '18' }]}>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron-right"
                  size={16}
                  color={item.color}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
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
  },
  contentContainer: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuList: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  menuCardLast: {
    borderBottomWidth: 0,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 3,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '400',
  },
  chevronContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
