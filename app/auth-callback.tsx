
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors } from '@/styles/commonStyles';

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    console.log('[AuthCallback] Processing OAuth callback...');
    
    // Handle the OAuth callback
    const handleCallback = async () => {
      try {
        // Supabase automatically handles the OAuth callback
        // We just need to check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthCallback] Error getting session:', error);
          router.replace('/auth/login');
          return;
        }

        if (session) {
          console.log('[AuthCallback] OAuth successful, redirecting to home');
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
  }, [router]);

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
