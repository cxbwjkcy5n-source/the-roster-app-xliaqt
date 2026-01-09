
/**
 * OAuth Popup Page for Web
 * 
 * This page is opened in a popup window for OAuth authentication on web.
 * It redirects to the OAuth provider and then to the callback page.
 */

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { authClient } from '@/lib/auth';
import { colors } from '@/styles/commonStyles';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || '';

export default function AuthPopup() {
  const { provider } = useLocalSearchParams<{ provider: string }>();

  useEffect(() => {
    if (provider && BACKEND_URL) {
      // Redirect to OAuth provider
      const callbackUrl = `${window.location.origin}/auth-callback`;
      const oauthUrl = `${BACKEND_URL}/api/auth/signin/${provider}?callbackURL=${encodeURIComponent(callbackUrl)}`;
      
      console.log('[AuthPopup] Redirecting to OAuth provider:', provider);
      console.log('[AuthPopup] OAuth URL:', oauthUrl);
      
      window.location.href = oauthUrl;
    }
  }, [provider]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Connecting to {provider}...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
});
