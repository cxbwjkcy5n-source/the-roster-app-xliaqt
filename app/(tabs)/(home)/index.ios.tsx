
import React, { useState, useEffect, useRef } from 'react';
import { colors } from '@/styles/commonStyles';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';
import { useRouter } from 'expo-router';
import { RosterPerson } from '@/types/roster';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

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

export default function RosterScreen() {
  const router = useRouter();
  const { roster, bench, loading: rosterLoading, dates, refreshDates, updateDate, rateDate } = useRoster();
  const { user, loading: authLoading, profileIncomplete } = useAuth();
  const [showDatingMenu, setShowDatingMenu] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  const openDatingMenu = () => {
    console.log('[Home] User tapped dating menu button - opening submenu');
    setShowDatingMenu(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeDatingMenu = () => {
    console.log('[Home] User closed dating menu');
    Animated.spring(slideAnim, {
      toValue: 400,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => setShowDatingMenu(false));
  };

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[Home] User not logged in, redirecting to auth');
      router.replace('/auth');
    }
  }, [user, authLoading, router]);

  if (authLoading || rosterLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.rosterGreen} />
      </View>
    );
  }

  const getInterestColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return colors.rosterGreen;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.actionRed;
      default:
        return colors.grey;
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
        <View
          style={[
            styles.interestBadge,
            { backgroundColor: getInterestColor(item.interestLevel) },
          ]}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.personInfoGradient}
        >
          <View style={styles.personInfo}>
            <Text style={styles.personName}>{item.name}</Text>
            <Text style={styles.personDetails}>
              {item.age} • {item.location}
            </Text>
            <View style={styles.flagsContainer}>
              {item.redFlags && item.redFlags.length > 0 && (
                <View style={[styles.flagBadge, { backgroundColor: 'rgba(233, 36, 63, 0.9)' }]}>
                  <IconSymbol 
                    ios_icon_name="flag.fill" 
                    android_material_icon_name="flag" 
                    size={12} 
                    color={colors.white} 
                  />
                  <Text style={styles.flagCount}>{item.redFlags.length}</Text>
                </View>
              )}
              {item.greenFlags && item.greenFlags.length > 0 && (
                <View style={[styles.flagBadge, { backgroundColor: 'rgba(17, 163, 106, 0.9)' }]}>
                  <IconSymbol 
                    ios_icon_name="flag.fill" 
                    android_material_icon_name="flag" 
                    size={12} 
                    color={colors.white} 
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
      activeOpacity={0.8}
    >
      <IconSymbol 
        ios_icon_name="plus.circle" 
        android_material_icon_name="add-circle-outline" 
        size={72} 
        color={colors.grey} 
      />
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
          <IconSymbol
            ios_icon_name="person.crop.circle.badge.exclamationmark"
            android_material_icon_name="account-circle"
            size={20}
            color="#fff"
          />
          <Text style={styles.profileBannerText}>Complete your profile to get started</Text>
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron-right"
            size={16}
            color="rgba(255,255,255,0.8)"
          />
        </TouchableOpacity>
      )}
      {/* Roster Header - Black Gradient */}
      <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>THE ROSTER</Text>
          <Text style={styles.headerSubtitle}>WHERE EVERYONE PLAYS THEIR POSITION</Text>
        </View>
        <View style={styles.headerButtons}>
          {/* FIX: Calendar button now navigates to /dating/history */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              console.log('[Home] User tapped calendar button - navigating to My Dates screen');
              router.push('/dating/history');
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
          {/* FIX: Changed icon to menu and opens dating submenu modal */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={openDatingMenu}
            activeOpacity={0.7}
          >
            <IconSymbol 
              ios_icon_name="line.3.horizontal" 
              android_material_icon_name="menu" 
              size={22} 
              color={colors.white} 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
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

      <Modal
        visible={showDatingMenu}
        animationType="none"
        transparent
        onRequestClose={closeDatingMenu}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeDatingMenu}
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
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      console.log('[Home] User tapped dating menu item:', item.title);
                      closeDatingMenu();
                      setTimeout(() => router.push(item.route as any), 300);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuIconCircle, { backgroundColor: item.color }]}>
                      <IconSymbol
                        ios_icon_name={item.iosIcon}
                        android_material_icon_name={item.androidIcon}
                        size={22}
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
                  {index < DATING_MENU_ITEMS.length - 1 && (
                    <View style={styles.menuSeparator} />
                  )}
                </React.Fragment>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.cancelButton} onPress={closeDatingMenu} activeOpacity={0.8}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'left',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.white,
    textAlign: 'left',
    marginTop: 6,
    opacity: 0.95,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    position: 'absolute',
    top: 20,
    right: 20,
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
    paddingTop: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  listContent: {
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  personCard: {
    width: '47%',
    aspectRatio: 0.75,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  personImage: {
    width: '100%',
    height: '100%',
  },
  interestBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  personInfoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
  },
  personInfo: {
    padding: 16,
  },
  personName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  personDetails: {
    fontSize: 15,
    color: colors.white,
    marginTop: 4,
    fontWeight: '600',
    opacity: 0.95,
  },
  flagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  flagCount: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '700',
  },
  emptyCard: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.darkText,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 6,
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
    width: 40,
    height: 4,
    backgroundColor: '#444444',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 0,
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
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
  menuSeparator: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginLeft: 58,
  },
  cancelButton: {
    marginHorizontal: 16,
    marginBottom: 32,
    marginTop: 8,
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
  profileBanner: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  profileBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
