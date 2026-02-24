
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';

// Lazy import supabase to avoid Platform initialization issues
let supabase: any = null;
async function getSupabase() {
  if (!supabase) {
    const { supabase: supabaseClient } = await import('@/lib/supabase');
    supabase = supabaseClient;
  }
  return supabase;
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[AuthCallback Web] Processing callback with params:', params);
    
    // Handle the callback (both OAuth and email verification)
    const handleCallback = async () => {
      try {
        // Get supabase client lazily
        const supabaseClient = await getSupabase();
        
        // Check if this is an email verification callback
        // Supabase email verification links include type=signup or type=recovery
        const type = params.type as string | undefined;
        const accessToken = params.access_token as string | undefined;
        const refreshToken = params.refresh_token as string | undefined;

        console.log('[AuthCallback Web] Callback type:', type);

        // If we have tokens in the URL, set the session
        if (accessToken && refreshToken) {
          console.log('[AuthCallback Web] Setting session from URL tokens...');
          const { data, error } = await supabaseClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[AuthCallback Web] Error setting session:', error);
            setError('Failed to verify email. Please try again.');
            setTimeout(() => router.replace('/auth/login'), 2000);
            return;
          }

          if (data.session) {
            console.log('[AuthCallback Web] Email verified and session set successfully!');
            // Redirect to profile for first-time setup
            router.replace('/(tabs)/profile');
            return;
          }
        }

        // Otherwise, check if we already have a session (OAuth flow)
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
          console.error('[AuthCallback Web] Error getting session:', error);
          setError('Authentication failed. Please try again.');
          setTimeout(() => router.replace('/auth/login'), 2000);
          return;
        }

        if (session) {
          console.log('[AuthCallback Web] Session found, redirecting to home');
          router.replace('/(tabs)/(home)/');
        } else {
          console.log('[AuthCallback Web] No session found, redirecting to login');
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('[AuthCallback Web] Error handling callback:', error);
        setError('An unexpected error occurred. Please try again.');
        setTimeout(() => router.replace('/auth/login'), 2000);
      }
    };

    // Small delay to ensure DOM is ready on web
    const timer = setTimeout(() => {
      handleCallback();
    }, 100);

    return () => clearTimeout(timer);
  }, [router, params]);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.subText}>Redirecting...</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.text}>Completing sign in...</Text>
        </>
      )}
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
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  subText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
