
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors } from '@/styles/commonStyles';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log('[AuthCallback] Processing callback with params:', params);
    
    // Handle the callback (both OAuth and email verification)
    const handleCallback = async () => {
      try {
        // Check if this is an email verification callback
        // Supabase email verification links include type=signup or type=recovery
        const type = params.type as string | undefined;
        const accessToken = params.access_token as string | undefined;
        const refreshToken = params.refresh_token as string | undefined;

        console.log('[AuthCallback] Callback type:', type);

        // If we have tokens in the URL, set the session
        if (accessToken && refreshToken) {
          console.log('[AuthCallback] Setting session from URL tokens...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[AuthCallback] Error setting session:', error);
            router.replace('/auth/login');
            return;
          }

          if (data.session) {
            console.log('[AuthCallback] Email verified and session set successfully!');
            // Redirect to profile for first-time setup
            router.replace('/(tabs)/profile');
            return;
          }
        }

        // Otherwise, check if we already have a session (OAuth flow)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthCallback] Error getting session:', error);
          router.replace('/auth/login');
          return;
        }

        if (session) {
          console.log('[AuthCallback] Session found, redirecting to home');
          router.replace('/(tabs)/(home)/');
        } else {
          console.log('[AuthCallback] No session found, redirecting to login');
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('[AuthCallback] Error handling callback:', error);
        router.replace('/auth/login');
      }
    };

    handleCallback();
  }, [router, params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Completing sign in...</Text>
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
