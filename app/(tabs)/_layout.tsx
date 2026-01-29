
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { Href } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const router = useRouter();

  const tabs: TabBarItem[] = [
    {
      name: 'roster',
      route: '/(tabs)/(home)/' as Href,
      icon: 'home',
      label: 'Roster',
    },
    {
      name: 'bench',
      route: '/(tabs)/bench' as Href,
      icon: 'pause',
      label: 'Bench',
    },
    {
      name: 'dating',
      route: '/(tabs)/dating' as Href,
      icon: 'favorite',
      label: 'Dating',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile' as Href,
      icon: 'person',
      label: 'Profile',
    },
  ];

  const handleAddPress = () => {
    console.log('[TabLayout] Add button pressed - navigating to /person/add');
    router.push('/person/add' as Href);
  };

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <Slot />
        <FloatingTabBar tabs={tabs} onAddPress={handleAddPress} />
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
