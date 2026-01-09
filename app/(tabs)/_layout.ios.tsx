
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="roster" name="roster">
        <Icon sf="house.fill" />
        <Label>Roster</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="bench" name="bench">
        <Icon sf="pause.fill" />
        <Label>Bench</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="add" name="add">
        <Icon sf="plus" />
        <Label>Add</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="dating" name="dating">
        <Icon sf="heart.fill" />
        <Label>Dating</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="profile" name="profile">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
