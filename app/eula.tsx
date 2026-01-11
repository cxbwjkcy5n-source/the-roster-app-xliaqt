
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';

export default function EULAScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>End User License Agreement</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.effectiveDate}>Effective Date: January 12, 2025</Text>

        <Text style={styles.paragraph}>
          This End User License Agreement (&quot;Agreement&quot;) is a legal agreement between you (&quot;User&quot;) and The Roster (&quot;Developer,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your use of the The Roster mobile application (&quot;App&quot;).
        </Text>

        <Text style={styles.paragraph}>
          By downloading, installing, or using the App, you agree to be bound by this Agreement. If you do not agree, do not use the App.
        </Text>

        <Text style={styles.sectionTitle}>1. License Grant</Text>
        <Text style={styles.paragraph}>
          We grant you a limited, non-exclusive, non-transferable, revocable license to download and use The Roster for your personal, non-commercial use on any Apple-branded device that you own or control, as permitted by Apple&apos;s App Store Terms of Service.
        </Text>

        <Text style={styles.sectionTitle}>2. Ownership</Text>
        <Text style={styles.paragraph}>
          The App, including all content, features, design, code, trademarks, and intellectual property, is owned by The Roster and is protected by applicable copyright and intellectual property laws.
        </Text>
        <Text style={styles.paragraph}>
          This Agreement does not transfer ownership of the App to you.
        </Text>

        <Text style={styles.sectionTitle}>3. User Content</Text>
        <Text style={styles.paragraph}>
          The App allows you to input and store personal notes, photos, names, and other information (&quot;User Content&quot;).
        </Text>
        <Text style={styles.bulletPoint}>• You retain ownership of your User Content.</Text>
        <Text style={styles.bulletPoint}>
          • You are solely responsible for the accuracy, legality, and appropriateness of the content you enter.
        </Text>
        <Text style={styles.bulletPoint}>
          • We do not review or monitor User Content unless required to comply with legal obligations.
        </Text>

        <Text style={styles.sectionTitle}>4. Acceptable Use</Text>
        <Text style={styles.paragraph}>You agree not to:</Text>
        <Text style={styles.bulletPoint}>• Use the App for unlawful purposes</Text>
        <Text style={styles.bulletPoint}>
          • Attempt to reverse engineer, modify, or distribute the App
        </Text>
        <Text style={styles.bulletPoint}>
          • Use the App to harass, threaten, or violate the rights of others
        </Text>
        <Text style={styles.bulletPoint}>• Circumvent security or access controls</Text>
        <Text style={styles.paragraph}>
          We reserve the right to suspend or terminate access if this Agreement is violated.
        </Text>

        <Text style={styles.sectionTitle}>5. Privacy</Text>
        <Text style={styles.paragraph}>
          Your use of the App is subject to our Privacy Policy, which explains how we collect, use, and protect your information. By using the App, you consent to the practices described in the Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>6. No Professional Advice</Text>
        <Text style={styles.paragraph}>
          The Roster is an organizational and informational tool only.
        </Text>
        <Text style={styles.bulletPoint}>
          • The App does not provide dating, relationship, legal, medical, or professional advice.
        </Text>
        <Text style={styles.bulletPoint}>
          • Any decisions you make based on information stored in the App are made at your own discretion and risk.
        </Text>

        <Text style={styles.sectionTitle}>7. Disclaimer of Warranties</Text>
        <Text style={styles.paragraph}>
          The App is provided &quot;AS IS&quot; and &quot;AS AVAILABLE.&quot;
        </Text>
        <Text style={styles.paragraph}>
          We make no warranties, express or implied, including but not limited to:
        </Text>
        <Text style={styles.bulletPoint}>• Merchantability</Text>
        <Text style={styles.bulletPoint}>• Fitness for a particular purpose</Text>
        <Text style={styles.bulletPoint}>• Accuracy or reliability of content</Text>
        <Text style={styles.paragraph}>
          We do not guarantee that the App will be uninterrupted or error-free.
        </Text>

        <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
        <Text style={styles.paragraph}>To the maximum extent permitted by law:</Text>
        <Text style={styles.bulletPoint}>
          • The Roster shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App.
        </Text>
        <Text style={styles.bulletPoint}>
          • Our total liability shall not exceed the amount you paid (if any) to use the App.
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using The Roster, you acknowledge that you have read, understood, and agree to be bound by this End User License Agreement.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  effectiveDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    marginBottom: 8,
    paddingLeft: 16,
  },
  footer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
