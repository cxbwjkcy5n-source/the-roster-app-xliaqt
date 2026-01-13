
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useRoster } from '@/contexts/RosterContext';

export default function DateHistoryScreen() {
  const router = useRouter();
  const { dates } = useRoster();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  const upcomingDates = dates.filter(d => d.status === 'upcoming');
  const completedDates = dates.filter(d => d.status === 'completed');

  const displayDates = activeTab === 'upcoming' ? upcomingDates : completedDates;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'My Dates',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => {
            console.log('[DateHistory] User switched to Upcoming tab');
            setActiveTab('upcoming');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming ({upcomingDates.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => {
            console.log('[DateHistory] User switched to Completed tab');
            setActiveTab('completed');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed ({completedDates.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {displayDates.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>
              No {activeTab} dates
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === 'upcoming' 
                ? 'Schedule a date to get started'
                : 'Your completed dates will appear here'}
            </Text>
          </View>
        ) : (
          displayDates.map(date => (
            <View key={date.id} style={styles.dateCard}>
              <View style={styles.dateHeader}>
                <View style={styles.dateHeaderLeft}>
                  <Text style={styles.dateName}>{date.profileName}</Text>
                  <View style={styles.dateType}>
                    <Text style={styles.dateTypeText}>{date.type}</Text>
                  </View>
                </View>
                {date.status === 'completed' && date.rating && (
                  <View style={styles.ratingContainer}>
                    {[...Array(5)].map((_, i) => (
                      <IconSymbol
                        key={i}
                        ios_icon_name={i < date.rating! ? "star.fill" : "star"}
                        android_material_icon_name={i < date.rating! ? "star" : "star-border"}
                        size={16}
                        color={i < date.rating! ? colors.yellow : colors.textSecondary}
                      />
                    ))}
                  </View>
                )}
              </View>
              
              <View style={styles.dateDetail}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.dateDetailText}>{date.date} at {date.time}</Text>
              </View>
              
              <View style={styles.dateDetail}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="location-on"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.dateDetailText}>{date.location}</Text>
              </View>
              
              {date.notes && (
                <View style={styles.dateNotes}>
                  <Text style={styles.dateNotesText}>{date.notes}</Text>
                </View>
              )}
              
              {date.reminders && date.reminders.length > 0 && activeTab === 'upcoming' && (
                <View style={styles.remindersContainer}>
                  <IconSymbol
                    ios_icon_name="bell.fill"
                    android_material_icon_name="notifications"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.remindersText}>
                    {date.reminders.length} reminder{date.reminders.length > 1 ? 's' : ''} set
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  activeTabText: {
    color: '#fff',
    opacity: 1,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  dateCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  dateType: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dateTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  dateDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dateNotes: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  dateNotesText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  remindersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  remindersText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
});
