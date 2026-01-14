
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';

const MENU_COLORS = {
  'have-date': ['#11A36A', '#0d8555'],
  'plan-date': ['#2FB8A8', '#26a69a'],
  'on-date': ['#E9243F', '#c41e35'],
  'dating-coach': ['#C8A04F', '#b8903f'],
  'my-dates': ['#E9243F', '#ff4757'],
};

export default function DatingScreen() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    console.log('[Dating] Screen focused - auto-opening submenu');
    const timer = setTimeout(() => {
      setShowMenu(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

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
        Alert.alert('Coming Soon', 'Dating coach features will be available soon!');
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Dating Header - Action Red Gradient */}
      <LinearGradient 
        colors={gradients.actionRed} 
        style={styles.header}
      >
        <Text style={styles.headerTitle}>DATING</Text>
        <Text style={styles.headerSubtitle}>Manage your dating life</Text>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => {
            console.log('[Dating] User tapped main dating button');
            setShowMenu(true);
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={gradients.actionRed}
            style={styles.mainButtonGradient}
          >
            <IconSymbol
              ios_icon_name="heart.fill"
              android_material_icon_name="favorite"
              size={48}
              color={colors.white}
            />
            <Text style={styles.mainButtonText}>Dating Menu</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Tap to access dating features, schedule dates, and get coaching
        </Text>
      </View>

      {/* Dating Submenu Modal */}
      <Modal
        visible={showMenu}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dating Menu</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.darkText}
                />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.modalScroll} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.action}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={item.colors}
                    style={styles.menuItemGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.menuIconBubble}>
                      <IconSymbol
                        ios_icon_name={item.iosIcon}
                        android_material_icon_name={item.icon}
                        size={28}
                        color={colors.white}
                      />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      <Text style={styles.menuItemDescription}>{item.description}</Text>
                    </View>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron-right"
                      size={24}
                      color="rgba(255,255,255,0.9)"
                    />
                  </LinearGradient>
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
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.white,
    opacity: 0.95,
    marginTop: 6,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  mainButton: {
    width: '100%',
    maxWidth: 280,
    aspectRatio: 1,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#E9243F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  mainButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  mainButtonText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  infoText: {
    marginTop: 28,
    fontSize: 15,
    color: colors.charcoal,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.darkText,
    letterSpacing: -0.5,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  menuItem: {
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  menuItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  menuIconBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  menuItemDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },
});
