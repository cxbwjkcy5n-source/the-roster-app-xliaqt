
import { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we check auth
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const { user, loading } = useAuth();
  const [splashReady, setSplashReady] = useState(false);

  useEffect(() => {
    console.log('[Index] Auth state:', { user: user?.email, loading });
  }, [user, loading]);

  useEffect(() => {
    // Show splash screen for 3 seconds
    const timer = setTimeout(() => {
      console.log('[Index] Splash screen timeout complete');
      setSplashReady(true);
      SplashScreen.hideAsync();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Show splash screen while loading or waiting for 3 seconds
  if (loading || !splashReady) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('@/assets/images/d136fc08-2fbc-4902-972a-c9d16c00fa3b.png')}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('[Index] No user, redirecting to login');
    return <Redirect href="/auth/login" />;
  }

  // Redirect to roster home page after login
  console.log('[Index] User authenticated, redirecting to roster');
  return <Redirect href="/(tabs)/(home)/" />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  splashImage: {
    width: '80%',
    height: '80%',
  },
});
