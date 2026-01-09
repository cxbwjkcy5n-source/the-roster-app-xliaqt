
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { authClient } from '@/lib/auth';
import { colors } from '@/styles/commonStyles';
import { BACKEND_URL } from '@/utils/api';

export default function Index() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  // Log backend URL on startup
  useEffect(() => {
    console.log('='.repeat(60));
    console.log('🚀 THE ROSTER - App Starting');
    console.log('='.repeat(60));
    console.log('📡 Backend URL:', BACKEND_URL || 'NOT CONFIGURED');
    console.log('='.repeat(60));
  }, []);

  useEffect(() => {
    if (!isPending) {
      if (session?.user) {
        router.replace('/(tabs)/roster');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [session, isPending]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
