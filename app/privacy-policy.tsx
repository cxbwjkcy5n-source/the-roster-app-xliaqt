
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Privacy Policy',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.headerGradient}
          >
            <IconSymbol
              ios_icon_name="lock.shield.fill"
              android_material_icon_name="security"
              size={48}
              color="#fff"
            />
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <Text style={styles.headerSubtitle}>
              Your privacy is important to us
            </Text>
          </LinearGradient>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            
            <Text style={styles.subsectionTitle}>Information You Provide</Text>
            <Text style={styles.paragraph}>
              When using The Roster, you may choose to provide:
            </Text>
            <Text style={styles.bulletPoint}>
              - Names, nicknames, or labels you assign to people in your roster
            </Text>
            <Text style={styles.bulletPoint}>
              - Photos you upload
            </Text>
            <Text style={styles.bulletPoint}>
              - Notes, tags, or custom details you add (e.g., how you met, preferences, reminders)
            </Text>
            <Text style={styles.bulletPoint}>
              - Date details such as location, time, and type of date
            </Text>
            <Text style={styles.paragraph}>
              This information is user-generated and entered at your discretion.
            </Text>

            <Text style={styles.subsectionTitle}>Automatically Collected Information</Text>
            <Text style={styles.paragraph}>
              We may collect limited technical information, including:
            </Text>
            <Text style={styles.bulletPoint}>
              - Device type and operating system
            </Text>
            <Text style={styles.bulletPoint}>
              - App usage data (e.g., feature interactions, crash logs)
            </Text>
            <Text style={styles.bulletPoint}>
              - Approximate location (city-level), if enabled
            </Text>
            <Text style={styles.paragraph}>
              We do not collect precise GPS location unless explicitly required for a feature and approved by you.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.paragraph}>
              We use your information to:
            </Text>
            <Text style={styles.bulletPoint}>
              - Provide and operate core app features
            </Text>
            <Text style={styles.bulletPoint}>
              - Save and organize your roster data
            </Text>
            <Text style={styles.bulletPoint}>
              - Improve app performance and user experience
            </Text>
            <Text style={styles.bulletPoint}>
              - Troubleshoot issues and prevent abuse
            </Text>
            <Text style={styles.paragraph}>
              We do not sell your personal data.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Data Storage & Security</Text>
            <Text style={styles.paragraph}>
              Your data is stored securely using industry-standard safeguards. Access to user data is limited and protected. While no system is 100% secure, we take reasonable steps to protect your information from unauthorized access or disclosure.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Sharing</Text>
            <Text style={styles.paragraph}>
              We do not share your personal data with third parties except:
            </Text>
            <Text style={styles.bulletPoint}>
              - When required by law
            </Text>
            <Text style={styles.bulletPoint}>
              - To comply with legal processes
            </Text>
            <Text style={styles.bulletPoint}>
              - To protect the rights, safety, or security of users or the app
            </Text>
            <Text style={styles.paragraph}>
              If third-party services (e.g., analytics, crash reporting, or location services) are used, they only receive the minimum data necessary to perform their function.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Location Information (Optional Feature)</Text>
            <Text style={styles.paragraph}>
              If you choose to add a location to a date:
            </Text>
            <Text style={styles.bulletPoint}>
              - Location data is used only to save and display that date location
            </Text>
            <Text style={styles.bulletPoint}>
              - Location permissions can be disabled at any time in your device settings
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Your Choices & Controls</Text>
            <Text style={styles.paragraph}>
              You can:
            </Text>
            <Text style={styles.bulletPoint}>
              - Edit or delete roster entries at any time
            </Text>
            <Text style={styles.bulletPoint}>
              - Remove photos, notes, or saved locations
            </Text>
            <Text style={styles.bulletPoint}>
              - Delete your account (if applicable), which will remove associated data
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Children&apos;s Privacy</Text>
            <Text style={styles.paragraph}>
              The Roster is not intended for users under the age of 18. We do not knowingly collect personal information from children.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
            <Text style={styles.paragraph}>
              We may update this Privacy Policy from time to time. If changes are made, the updated version will be posted in the App and the effective date will be revised.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Last Updated: January 2026
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  headerGradient: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
