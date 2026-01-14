
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
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';

const MENU_COLORS = {
  'have-date': ['#FF6B9D', '#C44569'],
  'plan-date': ['#4FACFE', '#00F2FE'],
  'on-date': ['#FA709A', '#FEE140'],
  'dating-coach': ['#A8E063', '#56AB2F'],
  'my-dates': ['#FF512F', '#DD2476'],
};

export default function DatingScreen() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  // FIX: Automatically show menu when this screen is focused
  useEffect(() => {
    console.log('[Dating] Screen focused - auto-opening submenu');
    // Small delay to ensure smooth animation
    const timer = setTimeout(() => {
      setShowMenu(true);
    }, 100);
    
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
      <LinearGradient 
        colors={['#FF6B9D', '#C44569']} 
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Dating</Text>
        <Text style={styles.headerSubtitle}>Manage your dating life</Text>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => {
            console.log('[Dating] User tapped main dating button');
            setShowMenu(true);
          }}
        >
          <LinearGradient
            colors={['#FF6B9D', '#C44569']}
            style={styles.mainButtonGradient}
          >
            <IconSymbol
              ios_icon_name="heart.fill"
              android_material_icon_name="favorite"
              size={32}
              color={colors.white}
            />
            <Text style={styles.mainButtonText}>Dating Menu</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Tap to access dating features, schedule dates, and get coaching
        </Text>
      </View>

      {/* FIX: Menu Modal - Opens from bottom with vibrant colored bubbles - AUTO-OPENS */}
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
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.modalScroll} 
              contentContainerStyle={styles.modalScrollContent}
            >
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.action}
                  activeOpacity={0.8}
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
                        color="#fff"
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
                      color="rgba(255,255,255,0.8)"
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
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  mainButton: {
    width: '100%',
    maxWidth: 300,
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  mainButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  infoText: {
    marginTop: 24,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  menuItem: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
});
