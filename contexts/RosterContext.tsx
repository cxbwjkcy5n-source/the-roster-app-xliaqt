
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { RosterPerson, DateEvent } from '@/types/roster';
import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete, BACKEND_URL } from '@/utils/api';

interface RosterContextType {
  roster: RosterPerson[];
  bench: RosterPerson[];
  dates: DateEvent[];
  addPerson: (person: RosterPerson) => Promise<void>;
  updatePerson: (person: RosterPerson) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  moveToBench: (id: string, reason: string) => Promise<void>;
  moveToRoster: (id: string) => Promise<void>;
  addDate: (date: DateEvent) => Promise<void>;
  updateDate: (date: DateEvent) => Promise<void>;
  deleteDate: (id: string) => Promise<void>;
  addFlag: (profileId: string, flagText: string, flagType: 'red' | 'green') => Promise<void>;
  deleteFlag: (flagId: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
  refreshDates: () => Promise<void>;
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
  };
}

// Helper function to map RosterPerson to API profile data
function mapRosterPersonToProfileData(person: RosterPerson) {
  return {
    name: person.name,
    age: person.age,
    birthdayMonth: person.birthdayMonth,
    birthdayDay: person.birthdayDay,
    birthdayYear: new Date().getFullYear(), // Default to current year if not provided
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
  };
}

export function RosterProvider({ children }: { children: ReactNode }) {
  const [roster, setRoster] = useState<RosterPerson[]>([]);
  const [bench, setBench] = useState<RosterPerson[]>([]);
  const [dates, setDates] = useState<DateEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([refreshProfiles(), refreshDates()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfiles = async () => {
    try {
      console.log('[RosterContext] Fetching profiles...');
      const response = await authenticatedGet('/api/profiles');
      console.log('[RosterContext] Profiles fetched:', response);
      const profiles = response.map(mapProfileToRosterPerson);
      console.log('[RosterContext] Mapped profiles:', profiles);
      setRoster(profiles.filter((p: RosterPerson) => p.status === 'roster'));
      setBench(profiles.filter((p: RosterPerson) => p.status === 'bench'));
    } catch (err) {
      console.error('[RosterContext] Failed to refresh profiles:', err);
      throw err;
    }
  };

  const refreshDates = async () => {
    try {
      const response = await authenticatedGet('/api/dates');
      // Map backend date format to frontend format
      const mappedDates = response.map((date: any) => ({
        id: date.id,
        profileId: date.profileId,
        profileName: date.profileName,
        date: date.dateTime ? new Date(date.dateTime).toISOString().split('T')[0] : '',
        time: date.dateTime ? new Date(date.dateTime).toISOString().split('T')[1].substring(0, 5) : '',
        location: date.location || '',
        notes: date.notes,
        status: date.status || 'upcoming',
        type: date.type || 'casual',
      }));
      setDates(mappedDates);
    } catch (err) {
      console.error('Failed to refresh dates:', err);
    }
  };

  const addPerson = async (person: RosterPerson) => {
    try {
      const profileData = mapRosterPersonToProfileData(person);
      console.log('[RosterContext] Adding person:', profileData);
      const response = await authenticatedPost('/api/profiles', profileData);
      console.log('[RosterContext] Person added:', response);
      await refreshProfiles();
    } catch (err) {
      console.error('[RosterContext] Failed to add person:', err);
      Alert.alert('Error', 'Failed to add person');
      throw err;
    }
  };

  const updatePerson = async (person: RosterPerson) => {
    try {
      const profileData = mapRosterPersonToProfileData(person);
      await authenticatedPut(`/api/profiles/${person.id}`, profileData);
      await refreshProfiles();
    } catch (err) {
      Alert.alert('Error', 'Failed to update person');
      throw err;
    }
  };

  const deletePerson = async (id: string) => {
    try {
      await authenticatedDelete(`/api/profiles/${id}`);
      await refreshProfiles();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete person');
      throw err;
    }
  };

  const moveToBench = async (id: string, reason: string) => {
    try {
      await authenticatedPut(`/api/profiles/${id}/bench`, { reason });
      await refreshProfiles();
    } catch (err) {
      Alert.alert('Error', 'Failed to move to bench');
      throw err;
    }
  };

  const moveToRoster = async (id: string) => {
    try {
      await authenticatedPut(`/api/profiles/${id}/roster`, {});
      await refreshProfiles();
    } catch (err) {
      Alert.alert('Error', 'Failed to move to roster');
      throw err;
    }
  };

  const addDate = async (date: DateEvent) => {
    try {
      // Map frontend date format to backend format
      const dateData = {
        profileId: date.profileId,
        status: date.status,
        type: date.type,
        dateTime: `${date.date}T${date.time}:00.000Z`,
        location: date.location,
        notes: date.notes,
      };
      await authenticatedPost('/api/dates', dateData);
      await refreshDates();
    } catch (err) {
      Alert.alert('Error', 'Failed to add date');
      throw err;
    }
  };

  const updateDate = async (date: DateEvent) => {
    try {
      // Map frontend date format to backend format
      const dateData = {
        profileId: date.profileId,
        status: date.status,
        type: date.type,
        dateTime: `${date.date}T${date.time}:00.000Z`,
        location: date.location,
        notes: date.notes,
      };
      await authenticatedPut(`/api/dates/${date.id}`, dateData);
      await refreshDates();
    } catch (err) {
      Alert.alert('Error', 'Failed to update date');
      throw err;
    }
  };

  const deleteDate = async (id: string) => {
    try {
      await authenticatedDelete(`/api/dates/${id}`);
      await refreshDates();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete date');
      throw err;
    }
  };

  const addFlag = async (profileId: string, flagText: string, flagType: 'red' | 'green') => {
    try {
      await authenticatedPost(`/api/profiles/${profileId}/flags`, { flagText, type: flagType });
      await refreshProfiles();
    } catch (err) {
      Alert.alert('Error', 'Failed to add flag');
      throw err;
    }
  };

  const deleteFlag = async (flagId: string) => {
    try {
      await authenticatedDelete(`/api/flags/${flagId}`);
      await refreshProfiles();
    } catch (err) {
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
        addPerson,
        updatePerson,
        deletePerson,
        moveToBench,
        moveToRoster,
        addDate,
        updateDate,
        deleteDate,
        addFlag,
        deleteFlag,
        refreshProfiles,
        refreshDates,
        loading,
        error,
      }}
    >
      {children}
    </RosterContext.Provider>
  );
}
