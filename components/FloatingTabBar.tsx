
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
  containerWidth = screenWidth - 40,
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

  const [pressedTab, setPressedTab] = React.useState<number | null>(null);

  const handleTabPress = (route: Href, index: number) => {
    console.log('[FloatingTabBar] Tab pressed:', route);
    setPressedTab(index);
    setTimeout(() => setPressedTab(null), 200);
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
      backgroundColor: 'rgba(17, 163, 106, 0.1)',
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
        {/* Centered Add Button - positioned to align with center of navigation bar */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddPress}
            activeOpacity={0.8}
          >
            <View style={styles.addButtonInner}>
              <MaterialIcons name="add" size={36} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>

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
          {/* Updated layout: grouped tabs with center spacing for add button */}
          <View style={styles.tabsContainer}>
            {/* Left group: Roster and Bench */}
            <View style={styles.leftGroup}>
              {tabs.slice(0, 2).map((tab, index) => {
                const isActive = activeTabIndex === index;
                const isPressed = pressedTab === index;
                const iconColor = isActive ? colors.navActive : colors.navInactive;

                return (
                  <TouchableOpacity
                    key={`tab-${index}`}
                    style={styles.tab}
                    onPress={() => handleTabPress(tab.route, index)}
                    activeOpacity={0.7}
                  >
                    {isPressed && <View style={styles.pressOverlay} />}
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

            {/* Center spacer for add button */}
            <View style={styles.centerSpacer} />

            {/* Right group: Dating and Profile */}
            <View style={styles.rightGroup}>
              {tabs.slice(2, 4).map((tab, index) => {
                const actualIndex = index + 2;
                const isActive = activeTabIndex === actualIndex;
                const isPressed = pressedTab === actualIndex;
                const iconColor = isActive ? colors.navActive : colors.navInactive;

                return (
                  <TouchableOpacity
                    key={`tab-${actualIndex}`}
                    style={styles.tab}
                    onPress={() => handleTabPress(tab.route, actualIndex)}
                    activeOpacity={0.7}
                  >
                    {isPressed && <View style={styles.pressOverlay} />}
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
    position: 'relative',
  },
  addButtonContainer: {
    position: 'absolute',
    top: -28,
    left: '50%',
    marginLeft: -32,
    zIndex: 1001,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  addButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.navFAB,
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
    height: 70,
    alignItems: 'center',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 4,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 4,
  },
  centerSpacer: {
    width: 80,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    position: 'relative',
    minHeight: 62,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  pressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.navActive,
    opacity: 0.15,
    borderRadius: 12,
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
