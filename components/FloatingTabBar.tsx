
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Href } from 'expo-router';
import { colors } from '@/styles/commonStyles';

const { width: screenWidth } = Dimensions.get('window');

export interface TabBarItem {
  name: string;
  route: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
  onAddPress?: () => void;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = screenWidth - 40, // FIX: Full width with margins
  borderRadius = 30,
  bottomMargin,
  onAddPress
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  const activeTabIndex = React.useMemo(() => {
    let bestMatch = -1;
    let bestMatchScore = 0;

    tabs.forEach((tab, index) => {
      let score = 0;
      if (pathname === tab.route) {
        score = 100;
      } else if (pathname.startsWith(tab.route as string)) {
        score = 80;
      } else if (pathname.includes(tab.name)) {
        score = 60;
      }

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = index;
      }
    });

    return bestMatch >= 0 ? bestMatch : 0;
  }, [pathname, tabs]);

  React.useEffect(() => {
    if (activeTabIndex >= 0) {
      Animated.spring(animatedValue, {
        toValue: activeTabIndex,
        useNativeDriver: true,
        damping: 20,
        stiffness: 120,
        mass: 1,
      }).start();
    }
  }, [activeTabIndex, animatedValue]);

  const handleTabPress = (route: Href) => {
    console.log('[FloatingTabBar] Tab pressed:', route);
    router.push(route);
  };

  const handleAddPress = () => {
    console.log('[FloatingTabBar] Add button pressed - navigating to add person');
    if (onAddPress) {
      onAddPress();
    } else {
      console.log('[FloatingTabBar] Navigating to /person/add');
      router.push('/person/add' as Href);
    }
  };

  const tabWidthPercent = ((100 / tabs.length) - 1).toFixed(2);
  const tabWidth = (containerWidth - 8) / tabs.length;

  const indicatorTranslateX = animatedValue.interpolate({
    inputRange: [0, tabs.length - 1],
    outputRange: [0, tabWidth * (tabs.length - 1)],
  });

  const dynamicStyles = {
    blurContainer: {
      ...styles.blurContainer,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.9)',
      ...Platform.select({
        ios: {
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
        },
        android: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
        },
        web: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        },
      }),
    },
    background: {
      ...styles.background,
    },
    indicator: {
      ...styles.indicator,
      backgroundColor: 'rgba(17, 163, 106, 0.1)', // Roster green tint
      width: `${tabWidthPercent}%` as `${number}%`,
    },
  };

  const ContainerComponent = Platform.OS === 'web' ? View : BlurView;
  const containerProps = Platform.OS === 'web' 
    ? {} 
    : { intensity: 80 };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={[
        styles.container,
        {
          width: containerWidth,
          marginBottom: bottomMargin ?? 16
        }
      ]}>
        {/* Center Add Button - Retro Red with White Phone Icon */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPress}
          activeOpacity={0.8}
        >
          <View style={styles.addButtonInner}>
            <MaterialIcons name="add" size={36} color={colors.white} />
          </View>
        </TouchableOpacity>

        <ContainerComponent
          {...containerProps}
          style={[dynamicStyles.blurContainer, { borderRadius }]}
        >
          <View style={dynamicStyles.background} />
          <Animated.View 
            style={[
              dynamicStyles.indicator, 
              {
                transform: [{ translateX: indicatorTranslateX }]
              }
            ]} 
          />
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => {
              const isActive = activeTabIndex === index;
              // FIX: High contrast icon colors - Active: Roster Green, Inactive: Grey
              const iconColor = isActive ? colors.navActive : colors.navInactive;

              return (
                <TouchableOpacity
                  key={`tab-${index}`}
                  style={styles.tab}
                  onPress={() => handleTabPress(tab.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabContent}>
                    <MaterialIcons
                      name={tab.icon}
                      size={24}
                      color={iconColor}
                      style={styles.iconStyle}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: colors.navInactive },
                        isActive && { color: colors.navActive, fontWeight: '700' },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ContainerComponent>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  container: {
    marginHorizontal: 20,
    alignSelf: 'center',
  },
  addButton: {
    position: 'absolute',
    top: -32,
    left: '50%',
    marginLeft: -36,
    zIndex: 1001,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  addButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.navFAB, // Retro Red
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 4,
    borderColor: colors.white,
  },
  blurContainer: {
    overflow: 'hidden',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 2,
    bottom: 4,
    borderRadius: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconStyle: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
