
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('[Index] Auth state:', { user: user?.email, loading });
  }, [user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
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
