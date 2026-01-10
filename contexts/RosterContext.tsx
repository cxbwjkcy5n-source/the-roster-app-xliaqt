
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { RosterPerson, DateEvent, Reminder, Interaction, Analytics, Nudge } from '@/types/roster';
import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete, BACKEND_URL } from '@/utils/api';

interface RosterContextType {
  roster: RosterPerson[];
  bench: RosterPerson[];
  dates: DateEvent[];
  reminders: Reminder[];
  interactions: Interaction[];
  analytics: Analytics | null;
  nudges: Nudge[];
  addPerson: (person: RosterPerson) => Promise<void>;
  updatePerson: (person: RosterPerson) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  moveToBench: (id: string, reason: string) => Promise<void>;
  moveToRoster: (id: string) => Promise<void>;
  reorderRoster: (reorderedRoster: RosterPerson[]) => Promise<void>;
  addDate: (date: DateEvent) => Promise<void>;
  updateDate: (date: DateEvent) => Promise<void>;
  deleteDate: (id: string) => Promise<void>;
  rateDate: (dateId: string, rating: number, wouldGoAgain: boolean) => Promise<void>;
  addReminder: (reminder: Reminder) => Promise<void>;
  updateReminder: (reminder: Reminder) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  completeReminder: (id: string) => Promise<void>;
  addInteraction: (interaction: Interaction) => Promise<void>;
  addFlag: (profileId: string, flagText: string, flagType: 'red' | 'green') => Promise<void>;
  deleteFlag: (flagId: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
  refreshDates: () => Promise<void>;
  refreshReminders: () => Promise<void>;
  refreshInteractions: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  refreshNudges: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const RosterContext = createContext<RosterContextType | undefined>(undefined);

export function useRoster() {
  const context = useContext(RosterContext);
  if (!context) {
    throw new Error('useRoster must be used within a RosterProvider');
  }
  return context;
}

// Helper function to map API profile to RosterPerson
function mapProfileToRosterPerson(profile: any): RosterPerson {
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    birthdayMonth: profile.birthdayMonth,
    birthdayDay: profile.birthdayDay,
    zodiacSign: profile.zodiacSign,
    favoriteColor: profile.favoriteColor || '',
    favoriteFoodType: profile.favoriteFood || '',
    relationshipType: profile.relationshipType || 'dating',
    customRelationshipType: profile.customRelationshipType,
    location: profile.location || '',
    phoneNumber: profile.phoneNumber || '',
    instagram: profile.instagram,
    twitter: profile.twitter,
    facebook: profile.facebook,
    snapchat: profile.snapchat,
    notes: profile.notes,
    interestLevel: profile.interestLevel || 'medium',
    imageUrl: profile.profileImageUrl,
    redFlags: (profile.redFlags || []).map((flag: any) => ({
      id: flag.id,
      text: flag.flagText,
      type: 'red' as const,
    })),
    greenFlags: (profile.greenFlags || []).map((flag: any) => ({
      id: flag.id,
      text: flag.flagText,
      type: 'green' as const,
    })),
    status: profile.status || 'roster',
    benchReason: profile.benchReason,
    sortOrder: profile.sortOrder || 0,
  };
}

// Helper function to map RosterPerson to API profile data
function mapRosterPersonToProfileData(person: RosterPerson) {
  return {
    name: person.name,
    age: person.age,
    birthdayMonth: person.birthdayMonth,
    birthdayDay: person.birthdayDay,
    birthdayYear: new Date().getFullYear(),
    zodiacSign: person.zodiacSign,
    favoriteColor: person.favoriteColor,
    favoriteFood: person.favoriteFoodType,
    relationshipType: person.relationshipType,
    location: person.location,
    phoneNumber: person.phoneNumber,
    instagram: person.instagram,
    twitter: person.twitter,
    facebook: person.facebook,
    snapchat: person.snapchat,
    notes: person.notes,
    interestLevel: person.interestLevel,
    profileImageUrl: person.imageUrl,
    status: person.status,
    benchReason: person.benchReason,
    sortOrder: person.sortOrder || 0,
  };
}

export function RosterProvider({ children }: { children: ReactNode }) {
  const [roster, setRoster] = useState<RosterPerson[]>([]);
  const [bench, setBench] = useState<RosterPerson[]>([]);
  const [dates, setDates] = useState<DateEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        refreshProfiles(),
        refreshDates(),
        refreshReminders(),
        refreshInteractions(),
        refreshAnalytics(),
        refreshNudges(),
      ]);
    } catch (err) {
      console.error('[RosterContext] Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfiles = async () => {
    try {
      console.log('[RosterContext] Fetching profiles from backend...');
      const response = await authenticatedGet('/api/profiles');
      console.log('[RosterContext] Profiles fetched successfully:', response.length, 'profiles');
      const profiles = response.map(mapProfileToRosterPerson);
      // Sort by sortOrder
      profiles.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setRoster(profiles.filter((p: RosterPerson) => p.status === 'roster'));
      setBench(profiles.filter((p: RosterPerson) => p.status === 'bench'));
    } catch (err) {
      console.error('[RosterContext] Failed to refresh profiles:', err);
      throw err;
    }
  };

  const refreshDates = async () => {
    try {
      console.log('[RosterContext] Fetching dates from backend...');
      const response = await authenticatedGet('/api/dates');
      console.log('[RosterContext] Dates fetched successfully:', response.length, 'dates');
      const mappedDates = response.map((date: any) => {
        let dateStr = '';
        let timeStr = '';
        if (date.dateTime) {
          const dateObj = new Date(date.dateTime);
          dateStr = dateObj.toISOString().split('T')[0];
          timeStr = dateObj.toISOString().split('T')[1].substring(0, 5);
        }
        
        return {
          id: date.id,
          profileId: date.profileId,
          profileName: date.profile?.name || date.profileName,
          date: dateStr,
          time: timeStr,
          location: date.location || '',
          locationCoords: date.locationCoords,
          notes: date.notes,
          status: date.status || 'upcoming',
          type: date.type || 'casual',
          rating: date.rating,
          wouldGoAgain: date.wouldGoAgain,
          reminders: date.reminders || [],
        };
      });
      setDates(mappedDates);
    } catch (err) {
      console.error('[RosterContext] Failed to refresh dates:', err);
    }
  };

  const refreshReminders = async () => {
    try {
      console.log('[RosterContext] Fetching reminders from backend...');
      const response = await authenticatedGet('/api/reminders');
      console.log('[RosterContext] Reminders fetched successfully:', response.length, 'reminders');
      setReminders(response);
    } catch (err) {
      console.error('[RosterContext] Failed to refresh reminders:', err);
    }
  };

  const refreshInteractions = async () => {
    try {
      console.log('[RosterContext] Fetching interactions from backend...');
      const response = await authenticatedGet('/api/interactions');
      console.log('[RosterContext] Interactions fetched successfully:', response.length, 'interactions');
      setInteractions(response);
    } catch (err) {
      console.error('[RosterContext] Failed to refresh interactions:', err);
    }
  };

  const refreshAnalytics = async () => {
    try {
      console.log('[RosterContext] Fetching analytics from backend...');
      const response = await authenticatedGet('/api/analytics');
      console.log('[RosterContext] Analytics fetched successfully');
      setAnalytics(response);
    } catch (err) {
      console.error('[RosterContext] Failed to refresh analytics:', err);
    }
  };

  const refreshNudges = async () => {
    try {
      console.log('[RosterContext] Fetching nudges from backend...');
      const response = await authenticatedGet('/api/nudges');
      console.log('[RosterContext] Nudges fetched successfully:', response.length, 'nudges');
      setNudges(response);
    } catch (err) {
      console.error('[RosterContext] Failed to refresh nudges:', err);
    }
  };

  const addPerson = async (person: RosterPerson) => {
    try {
      const profileData = mapRosterPersonToProfileData(person);
      console.log('[RosterContext] Adding person to backend:', profileData.name);
      const response = await authenticatedPost('/api/profiles', profileData);
      console.log('[RosterContext] Person added successfully with ID:', response.id);
      await refreshProfiles();
    } catch (err) {
      console.error('[RosterContext] Failed to add person:', err);
      Alert.alert('Error', 'Failed to add person. Please try again.');
      throw err;
    }
  };

  const updatePerson = async (person: RosterPerson) => {
    try {
      const profileData = mapRosterPersonToProfileData(person);
      console.log('[RosterContext] Updating person:', person.id);
      await authenticatedPut(`/api/profiles/${person.id}`, profileData);
      console.log('[RosterContext] Person updated successfully');
      await refreshProfiles();
    } catch (err) {
      console.error('[RosterContext] Failed to update person:', err);
      Alert.alert('Error', 'Failed to update person');
      throw err;
    }
  };

  const deletePerson = async (id: string) => {
    try {
      console.log('[RosterContext] Deleting person:', id);
      await authenticatedDelete(`/api/profiles/${id}`);
      console.log('[RosterContext] Person deleted successfully');
      await refreshProfiles();
    } catch (err) {
      console.error('[RosterContext] Failed to delete person:', err);
      Alert.alert('Error', 'Failed to delete person');
      throw err;
    }
  };

  const moveToBench = async (id: string, reason: string) => {
    try {
      console.log('[RosterContext] Moving person to bench:', id);
      await authenticatedPut(`/api/profiles/${id}/bench`, { reason });
      console.log('[RosterContext] Person moved to bench successfully');
      await refreshProfiles();
    } catch (err) {
      console.error('[RosterContext] Failed to move to bench:', err);
      Alert.alert('Error', 'Failed to move to bench');
      throw err;
    }
  };

  const moveToRoster = async (id: string) => {
    try {
      console.log('[RosterContext] Moving person to roster:', id);
      await authenticatedPut(`/api/profiles/${id}/roster`, {});
      console.log('[RosterContext] Person moved to roster successfully');
      await refreshProfiles();
    } catch (err) {
      console.error('[RosterContext] Failed to move to roster:', err);
      Alert.alert('Error', 'Failed to move to roster');
      throw err;
    }
  };

  const reorderRoster = async (reorderedRoster: RosterPerson[]) => {
    try {
      console.log('[RosterContext] Reordering roster...');
      // Update local state immediately for smooth UX
      setRoster(reorderedRoster);
      
      const orderData = reorderedRoster.map((person, index) => ({
        id: person.id,
        displayOrder: index,
      }));
      await authenticatedPut('/api/profiles/reorder', { profiles: orderData });
      console.log('[RosterContext] Roster reordered successfully');
    } catch (err) {
      console.error('[RosterContext] Failed to reorder roster:', err);
      Alert.alert('Error', 'Failed to save new order');
      // Refresh to get correct order from backend
      await refreshProfiles();
      throw err;
    }
  };

  const addDate = async (date: DateEvent) => {
    try {
      console.log('[RosterContext] Adding date for profile:', date.profileId);
      const dateData = {
        profileId: date.profileId,
        status: date.status,
        type: date.type,
        dateTime: `${date.date}T${date.time}:00.000Z`,
        locationName: date.location,
        locationCoordinates: date.locationCoords ? {
          lat: date.locationCoords.latitude,
          lng: date.locationCoords.longitude,
        } : undefined,
        notes: date.notes,
        reminderSettings: date.reminders ? {
          oneHourBefore: date.reminders.includes('1hour'),
          oneDayBefore: date.reminders.includes('1day'),
          oneWeekBefore: date.reminders.includes('1week'),
        } : undefined,
      };
      await authenticatedPost('/api/dates', dateData);
      console.log('[RosterContext] Date added successfully');
      await refreshDates();
    } catch (err) {
      console.error('[RosterContext] Failed to add date:', err);
      Alert.alert('Error', 'Failed to add date');
      throw err;
    }
  };

  const updateDate = async (date: DateEvent) => {
    try {
      console.log('[RosterContext] Updating date:', date.id);
      const dateData = {
        profileId: date.profileId,
        status: date.status,
        type: date.type,
        dateTime: `${date.date}T${date.time}:00.000Z`,
        locationName: date.location,
        locationCoordinates: date.locationCoords ? {
          lat: date.locationCoords.latitude,
          lng: date.locationCoords.longitude,
        } : undefined,
        notes: date.notes,
        rating: date.rating,
        wouldGoAgain: date.wouldGoAgain,
        reminderSettings: date.reminders ? {
          oneHourBefore: date.reminders.includes('1hour'),
          oneDayBefore: date.reminders.includes('1day'),
          oneWeekBefore: date.reminders.includes('1week'),
        } : undefined,
      };
      await authenticatedPut(`/api/dates/${date.id}`, dateData);
      console.log('[RosterContext] Date updated successfully');
      await refreshDates();
    } catch (err) {
      console.error('[RosterContext] Failed to update date:', err);
      Alert.alert('Error', 'Failed to update date');
      throw err;
    }
  };

  const deleteDate = async (id: string) => {
    try {
      console.log('[RosterContext] Deleting date:', id);
      await authenticatedDelete(`/api/dates/${id}`);
      console.log('[RosterContext] Date deleted successfully');
      await refreshDates();
    } catch (err) {
      console.error('[RosterContext] Failed to delete date:', err);
      Alert.alert('Error', 'Failed to delete date');
      throw err;
    }
  };

  const rateDate = async (dateId: string, rating: number, wouldGoAgain: boolean) => {
    try {
      console.log('[RosterContext] Rating date:', dateId);
      // Update the date with rating and wouldGoAgain
      await authenticatedPut(`/api/dates/${dateId}`, { rating, wouldGoAgain });
      console.log('[RosterContext] Date rated successfully');
      await refreshDates();
      await refreshAnalytics();
    } catch (err) {
      console.error('[RosterContext] Failed to rate date:', err);
      Alert.alert('Error', 'Failed to rate date');
      throw err;
    }
  };

  const addReminder = async (reminder: Reminder) => {
    try {
      console.log('[RosterContext] Adding reminder...');
      const reminderData = {
        profileId: reminder.profileId,
        type: reminder.type,
        scheduledFor: reminder.scheduledFor,
        message: reminder.customMessage || reminder.title,
      };
      await authenticatedPost('/api/reminders', reminderData);
      console.log('[RosterContext] Reminder added successfully');
      await refreshReminders();
    } catch (err) {
      console.error('[RosterContext] Failed to add reminder:', err);
      Alert.alert('Error', 'Failed to add reminder');
      throw err;
    }
  };

  const updateReminder = async (reminder: Reminder) => {
    try {
      console.log('[RosterContext] Updating reminder:', reminder.id);
      const reminderData = {
        profileId: reminder.profileId,
        type: reminder.type,
        scheduledFor: reminder.scheduledFor,
        message: reminder.customMessage || reminder.title,
      };
      await authenticatedPut(`/api/reminders/${reminder.id}`, reminderData);
      console.log('[RosterContext] Reminder updated successfully');
      await refreshReminders();
    } catch (err) {
      console.error('[RosterContext] Failed to update reminder:', err);
      Alert.alert('Error', 'Failed to update reminder');
      throw err;
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      console.log('[RosterContext] Deleting reminder:', id);
      await authenticatedDelete(`/api/reminders/${id}`);
      console.log('[RosterContext] Reminder deleted successfully');
      await refreshReminders();
    } catch (err) {
      console.error('[RosterContext] Failed to delete reminder:', err);
      Alert.alert('Error', 'Failed to delete reminder');
      throw err;
    }
  };

  const completeReminder = async (id: string) => {
    try {
      console.log('[RosterContext] Completing reminder:', id);
      // Mark reminder as sent/completed by updating it
      await authenticatedPut(`/api/reminders/${id}`, { sent: true });
      console.log('[RosterContext] Reminder completed successfully');
      await refreshReminders();
    } catch (err) {
      console.error('[RosterContext] Failed to complete reminder:', err);
      Alert.alert('Error', 'Failed to complete reminder');
      throw err;
    }
  };

  const addInteraction = async (interaction: Interaction) => {
    try {
      console.log('[RosterContext] Adding interaction...');
      const interactionData = {
        profileId: interaction.profileId,
        type: interaction.type,
        notes: interaction.notes,
      };
      await authenticatedPost('/api/interactions', interactionData);
      console.log('[RosterContext] Interaction added successfully');
      await refreshInteractions();
      await refreshNudges();
    } catch (err) {
      console.error('[RosterContext] Failed to add interaction:', err);
      Alert.alert('Error', 'Failed to add interaction');
      throw err;
    }
  };

  const addFlag = async (profileId: string, flagText: string, flagType: 'red' | 'green') => {
    try {
      console.log('[RosterContext] Adding flag to profile:', profileId);
      await authenticatedPost(`/api/profiles/${profileId}/flags`, { flagText, type: flagType });
      console.log('[RosterContext] Flag added successfully');
      await refreshProfiles();
      await refreshAnalytics();
    } catch (err) {
      console.error('[RosterContext] Failed to add flag:', err);
      Alert.alert('Error', 'Failed to add flag');
      throw err;
    }
  };

  const deleteFlag = async (flagId: string) => {
    try {
      console.log('[RosterContext] Deleting flag:', flagId);
      await authenticatedDelete(`/api/flags/${flagId}`);
      console.log('[RosterContext] Flag deleted successfully');
      await refreshProfiles();
      await refreshAnalytics();
    } catch (err) {
      console.error('[RosterContext] Failed to delete flag:', err);
      Alert.alert('Error', 'Failed to delete flag');
      throw err;
    }
  };

  return (
    <RosterContext.Provider
      value={{
        roster,
        bench,
        dates,
        reminders,
        interactions,
        analytics,
        nudges,
        addPerson,
        updatePerson,
        deletePerson,
        moveToBench,
        moveToRoster,
        reorderRoster,
        addDate,
        updateDate,
        deleteDate,
        rateDate,
        addReminder,
        updateReminder,
        deleteReminder,
        completeReminder,
        addInteraction,
        addFlag,
        deleteFlag,
        refreshProfiles,
        refreshDates,
        refreshReminders,
        refreshInteractions,
        refreshAnalytics,
        refreshNudges,
        loading,
        error,
      }}
    >
      {children}
    </RosterContext.Provider>
  );
}
