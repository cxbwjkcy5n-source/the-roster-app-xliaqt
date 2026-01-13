
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function SafetyScreen() {
  const router = useRouter();
  const [emergencyActive, setEmergencyActive] = useState(false);

  const safetyFeatures = [
    {
      title: 'Share Location',
      icon: 'location-on',
      iosIcon: 'location.fill',
      description: 'Share your real-time location with trusted contacts',
      action: () => {
        console.log('[Safety] User tapped Share Location');
        Alert.alert('Coming Soon', 'Location sharing will be available soon!');
      },
    },
    {
      title: 'Emergency Contacts',
      icon: 'contacts',
      iosIcon: 'person.2.fill',
      description: 'Set up emergency contacts who can check on you',
      action: () => {
        console.log('[Safety] User tapped Emergency Contacts');
        Alert.alert('Coming Soon', 'Emergency contacts setup will be available soon!');
      },
    },
    {
      title: 'Check-In Timer',
      icon: 'alarm',
      iosIcon: 'timer',
      description: 'Set a timer to check in - contacts notified if you miss it',
      action: () => {
        console.log('[Safety] User tapped Check-In Timer');
        Alert.alert('Coming Soon', 'Check-in timer will be available soon!');
      },
    },
    {
      title: 'Quick Exit Call',
      icon: 'phone',
      iosIcon: 'phone.fill',
      description: 'Receive a fake emergency call to leave the date',
      action: () => {
        console.log('[Safety] User tapped Quick Exit Call');
        Alert.alert('Coming Soon', 'Quick exit call will be available soon!');
      },
    },
  ];

  const safetyTips = [
    {
      icon: 'people',
      iosIcon: 'person.2',
      title: 'Meet in Public',
      description: 'Always meet in a public place for first dates',
    },
    {
      icon: 'directions-car',
      iosIcon: 'car',
      title: 'Arrange Your Own Transport',
      description: 'Don\'t rely on your date for transportation',
    },
    {
      icon: 'no-drinks',
      iosIcon: 'cup.and.saucer',
      title: 'Watch Your Drink',
      description: 'Never leave your drink unattended',
    },
    {
      icon: 'info',
      iosIcon: 'info.circle',
      title: 'Tell Someone',
      description: 'Let a friend know where you\'re going and who you\'re with',
    },
    {
      icon: 'phone-in-talk',
      iosIcon: 'phone.circle',
      title: 'Trust Your Instincts',
      description: 'If something feels off, leave immediately',
    },
  ];

  const handleEmergency = async () => {
    console.log('[Safety] User activated emergency');
    Alert.alert(
      'Emergency',
      'This will notify your emergency contacts and share your location. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          style: 'destructive',
          onPress: async () => {
            try {
              setEmergencyActive(true);
              
              // Note: This requires an active safety date to be created first
              // For now, show a message that the feature requires setup
              Alert.alert(
                'Safety Feature Setup Required',
                'To use emergency alerts, you need to:\n\n1. Create a safety date with emergency contacts\n2. Start the safety date when you\'re on your date\n3. Then you can activate emergency alerts\n\nThis feature will be fully integrated in a future update.',
                [{ text: 'OK' }]
              );
              
              // Future implementation when safety dates are fully integrated:
              // const { authenticatedGet, authenticatedPut } = await import('@/utils/api');
              // 
              // // Get active safety date
              // const activeSafetyDate = await authenticatedGet('/api/safety-dates/active');
              // 
              // if (!activeSafetyDate || !activeSafetyDate.id) {
              //   Alert.alert('No Active Safety Date', 'Please create and start a safety date first.');
              //   setEmergencyActive(false);
              //   return;
              // }
              // 
              // // Mark as emergency
              // await authenticatedPut(`/api/safety-dates/${activeSafetyDate.id}/emergency`, {});
              // Alert.alert('Emergency Activated', 'Your emergency contacts have been notified.');
              
            } catch (error) {
              console.error('[Safety] Error activating emergency:', error);
              Alert.alert('Error', 'Failed to activate emergency alert. Please try again.');
              setEmergencyActive(false);
            }
          },
        },
      ]
    );
  };

  const handleCall911 = () => {
    console.log('[Safety] User tapped Call 911');
    Alert.alert(
      'Call Emergency Services',
      'This will call 911. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL('tel:911');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: "I'm on a Date",
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.headerSection}>
          <IconSymbol
            ios_icon_name="shield.fill"
            android_material_icon_name="security"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.headerTitle}>Stay Safe</Text>
          <Text style={styles.headerSubtitle}>
            Your safety is our priority. Use these features to stay safe on your date.
          </Text>
        </View>

        {/* Emergency Button */}
        <TouchableOpacity
          style={[styles.emergencyButton, emergencyActive && styles.emergencyButtonActive]}
          onPress={handleEmergency}
          disabled={emergencyActive}
        >
          <LinearGradient
            colors={emergencyActive ? ['#FF6B6B', '#C92A2A'] : ['#FF4444', '#CC0000']}
            style={styles.emergencyButtonGradient}
          >
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={32}
              color="#fff"
            />
            <Text style={styles.emergencyButtonText}>
              {emergencyActive ? 'Emergency Active' : 'Emergency Alert'}
            </Text>
            <Text style={styles.emergencyButtonSubtext}>
              {emergencyActive ? 'Contacts notified' : 'Tap to notify emergency contacts'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Call 911 Button */}
        <TouchableOpacity
          style={styles.call911Button}
          onPress={handleCall911}
        >
          <IconSymbol
            ios_icon_name="phone.fill"
            android_material_icon_name="phone"
            size={20}
            color="#fff"
          />
          <Text style={styles.call911ButtonText}>Call 911</Text>
        </TouchableOpacity>

        {/* Safety Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Features</Text>
          {safetyFeatures.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureCard}
              onPress={feature.action}
            >
              <View style={styles.featureIconContainer}>
                <IconSymbol
                  ios_icon_name={feature.iosIcon}
                  android_material_icon_name={feature.icon}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Tips</Text>
          {safetyTips.map((tip, index) => (
            <View key={index} style={styles.tipCard}>
              <View style={styles.tipIconContainer}>
                <IconSymbol
                  ios_icon_name={tip.iosIcon}
                  android_material_icon_name={tip.icon}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <View style={styles.resourceCard}>
            <Text style={styles.resourceTitle}>National Domestic Violence Hotline</Text>
            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => Linking.openURL('tel:18007997233')}
            >
              <Text style={styles.resourceButtonText}>1-800-799-7233</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.resourceCard}>
            <Text style={styles.resourceTitle}>Crisis Text Line</Text>
            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => Linking.openURL('sms:741741')}
            >
              <Text style={styles.resourceButtonText}>Text HOME to 741741</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  emergencyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emergencyButtonActive: {
    opacity: 0.7,
  },
  emergencyButtonGradient: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emergencyButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  emergencyButtonSubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  call911Button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CC0000',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  call911ButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resourceCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  resourceButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resourceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
