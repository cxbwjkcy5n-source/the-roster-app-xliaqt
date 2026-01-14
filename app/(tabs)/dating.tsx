
import React, { useState } from 'react';
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

export default function DatingScreen() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  // Automatically show menu when this screen is focused
  React.useEffect(() => {
    console.log('[Dating] Screen focused - opening submenu');
    setShowMenu(true);
  }, []);

  const menuItems = [
    {
      id: 'have-date',
      title: 'I have a date',
      icon: 'calendar-today',
      iosIcon: 'calendar',
      description: 'Schedule an upcoming date',
      action: () => {
        console.log('[Dating] User tapped "I have a date"');
        setShowMenu(false);
        router.push('/dating/schedule' as any);
      },
    },
    {
      id: 'plan-date',
      title: 'Plan a date',
      icon: 'edit',
      iosIcon: 'pencil',
      description: 'Get AI-powered date ideas',
      action: () => {
        console.log('[Dating] User tapped "Plan a date"');
        setShowMenu(false);
        router.push('/dating/plan' as any);
      },
    },
    {
      id: 'on-date',
      title: "I'm on a date",
      icon: 'security',
      iosIcon: 'shield.fill',
      description: 'Safety features for your date',
      action: () => {
        console.log('[Dating] User tapped "I\'m on a date"');
        setShowMenu(false);
        router.push('/dating/safety' as any);
      },
    },
    {
      id: 'dating-coach',
      title: 'Dating Coach',
      icon: 'person',
      iosIcon: 'person.fill',
      description: 'Get advice and tips',
      action: () => {
        console.log('[Dating] User tapped "Dating Coach"');
        setShowMenu(false);
        Alert.alert('Coming Soon', 'Dating coach features will be available soon!');
      },
    },
    {
      id: 'my-dates',
      title: 'My dates',
      icon: 'favorite',
      iosIcon: 'heart.fill',
      description: 'View your date history',
      action: () => {
        console.log('[Dating] User tapped "My dates"');
        setShowMenu(false);
        router.push('/dating/history' as any);
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.header}>
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
            colors={[colors.primary, colors.primaryDark]}
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

      {/* Menu Modal - Opens from top */}
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
            <ScrollView style={styles.modalScroll}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.action}
                >
                  <View style={styles.menuIconContainer}>
                    <IconSymbol
                      ios_icon_name={item.iosIcon}
                      android_material_icon_name={item.icon}
                      size={24}
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
                    size={20}
                    color={colors.textSecondary}
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
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    shadowColor: colors.primary,
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
    justifyContent: 'flex-start',
    paddingTop: 60,
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
