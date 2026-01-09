
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import FloatingTabBar from '@/components/FloatingTabBar';
import { Href } from 'expo-router';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  const tabs = [
    {
      route: '/(tabs)/roster' as Href,
      label: 'Roster',
      ios_icon_name: 'house.fill',
      android_material_icon_name: 'home',
    },
    {
      route: '/(tabs)/bench' as Href,
      label: 'Bench',
      ios_icon_name: 'pause.fill',
      android_material_icon_name: 'pause',
    },
    {
      route: '/(tabs)/add' as Href,
      label: 'Add',
      ios_icon_name: 'plus',
      android_material_icon_name: 'add',
      isCenter: true,
    },
    {
      route: '/(tabs)/dating' as Href,
      label: 'Dating',
      ios_icon_name: 'heart.fill',
      android_material_icon_name: 'favorite',
    },
    {
      route: '/(tabs)/profile' as Href,
      label: 'Profile',
      ios_icon_name: 'person.fill',
      android_material_icon_name: 'person',
    },
  ];

  return (
    <View style={styles.container}>
      <FloatingTabBar tabs={tabs} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
