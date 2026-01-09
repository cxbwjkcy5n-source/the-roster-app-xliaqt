
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RosterPerson, DateEvent } from '@/types/roster';
import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete, BACKEND_URL } from '@/utils/api';
import { Alert } from 'react-native';

interface RosterContextType {
  roster: RosterPerson[];
  bench: RosterPerson[];
  dates: DateEvent[];
  addPerson: (person: RosterPerson) => Promise<void>;
  updatePerson: (person: RosterPerson) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  moveToBench: (id: string) => Promise<void>;
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

// Helper to map backend profile to RosterPerson
function mapProfileToRosterPerson(profile: any): RosterPerson {
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    birthday: {
      month: profile.birthdayMonth || 1,
      year: profile.birthdayYear || new Date().getFullYear(),
    },
    zodiacSign: profile.zodiacSign || '',
    favoriteColor: profile.favoriteColor,
    favoriteFoodType: profile.favoriteFood,
    relationshipType: profile.relationshipType || 'dating',
    customRelationshipType: undefined,
    location: profile.location || '',
    phoneNumber: profile.phoneNumber,
    instagram: profile.instagram,
    twitter: profile.twitter,
    facebook: profile.facebook,
    snapchat: profile.snapchat,
    notes: profile.notes,
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
    interestLevel: profile.interestLevel || 'medium',
    photoUri: profile.profileImageUrl,
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: profile.updatedAt || new Date().toISOString(),
  };
}

// Helper to map RosterPerson to backend profile data
function mapRosterPersonToProfileData(person: RosterPerson) {
  return {
    name: person.name,
    age: person.age,
    birthdayMonth: person.birthday.month,
    birthdayYear: person.birthday.year,
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
    profileImageUrl: person.photoUri,
    status: 'roster', // Default to roster when creating
  };
}

export function RosterProvider({ children }: { children: ReactNode }) {
  const [roster, setRoster] = useState<RosterPerson[]>([]);
  const [bench, setBench] = useState<RosterPerson[]>([]);
  const [dates, setDates] = useState<DateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[RosterContext] Initializing...');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[RosterContext] Loading data from backend:', BACKEND_URL);
      
      // Load profiles and dates in parallel
      const [profilesData, datesData] = await Promise.all([
        authenticatedGet<any[]>('/api/roster/profiles'),
        authenticatedGet<any[]>('/api/dates'),
      ]);

      console.log('[RosterContext] Loaded profiles:', profilesData?.length || 0);
      console.log('[RosterContext] Loaded dates:', datesData?.length || 0);

      // Separate profiles into roster and bench based on status
      const rosterProfiles: RosterPerson[] = [];
      const benchProfiles: RosterPerson[] = [];

      (profilesData || []).forEach((profile: any) => {
        const person = mapProfileToRosterPerson(profile);
        if (profile.status === 'bench') {
          benchProfiles.push(person);
        } else {
          rosterProfiles.push(person);
        }
      });

      setRoster(rosterProfiles);
      setBench(benchProfiles);
      setDates(datesData || []);
    } catch (error: any) {
      console.error('[RosterContext] Error loading data:', error);
      setError(error.message || 'Failed to load data');
      // Don't show alert on initial load - user might not be logged in yet
    } finally {
      setLoading(false);
    }
  };

  const refreshProfiles = async () => {
    try {
      console.log('[RosterContext] Refreshing profiles...');
      const profilesData = await authenticatedGet<any[]>('/api/roster/profiles');
      
      const rosterProfiles: RosterPerson[] = [];
      const benchProfiles: RosterPerson[] = [];

      (profilesData || []).forEach((profile: any) => {
        const person = mapProfileToRosterPerson(profile);
        if (profile.status === 'bench') {
          benchProfiles.push(person);
        } else {
          rosterProfiles.push(person);
        }
      });

      setRoster(rosterProfiles);
      setBench(benchProfiles);
    } catch (error: any) {
      console.error('[RosterContext] Error refreshing profiles:', error);
      throw error;
    }
  };

  const refreshDates = async () => {
    try {
      console.log('[RosterContext] Refreshing dates...');
      const datesData = await authenticatedGet<any[]>('/api/dates');
      setDates(datesData || []);
    } catch (error: any) {
      console.error('[RosterContext] Error refreshing dates:', error);
      throw error;
    }
  };

  const addPerson = async (person: RosterPerson) => {
    try {
      console.log('[RosterContext] Adding person:', person.name);
      const profileData = mapRosterPersonToProfileData(person);
      
      const createdProfile = await authenticatedPost<any>('/api/roster/profiles', profileData);
      console.log('[RosterContext] Person added successfully:', createdProfile.id);
      
      // Add flags if any
      if (person.redFlags.length > 0 || person.greenFlags.length > 0) {
        const flagPromises = [
          ...person.redFlags.map(flag => 
            authenticatedPost(`/api/roster/profiles/${createdProfile.id}/flags`, {
              flagText: flag.text,
              flagType: 'red',
            })
          ),
          ...person.greenFlags.map(flag => 
            authenticatedPost(`/api/roster/profiles/${createdProfile.id}/flags`, {
              flagText: flag.text,
              flagType: 'green',
            })
          ),
        ];
        await Promise.all(flagPromises);
      }
      
      // Refresh to get updated data with flags
      await refreshProfiles();
    } catch (error: any) {
      console.error('[RosterContext] Error adding person:', error);
      Alert.alert('Error', error.message || 'Failed to add person');
      throw error;
    }
  };

  const updatePerson = async (person: RosterPerson) => {
    try {
      console.log('[RosterContext] Updating person:', person.id);
      const profileData = mapRosterPersonToProfileData(person);
      
      await authenticatedPut(`/api/roster/profiles/${person.id}`, profileData);
      console.log('[RosterContext] Person updated successfully');
      
      await refreshProfiles();
    } catch (error: any) {
      console.error('[RosterContext] Error updating person:', error);
      Alert.alert('Error', error.message || 'Failed to update person');
      throw error;
    }
  };

  const deletePerson = async (id: string) => {
    try {
      console.log('[RosterContext] Deleting person:', id);
      await authenticatedDelete(`/api/roster/profiles/${id}`);
      console.log('[RosterContext] Person deleted successfully');
      
      // Update local state immediately
      setRoster(roster.filter(p => p.id !== id));
      setBench(bench.filter(p => p.id !== id));
    } catch (error: any) {
      console.error('[RosterContext] Error deleting person:', error);
      Alert.alert('Error', error.message || 'Failed to delete person');
      throw error;
    }
  };

  const moveToBench = async (id: string) => {
    try {
      console.log('[RosterContext] Moving to bench:', id);
      await authenticatedPut(`/api/roster/profiles/${id}`, { status: 'bench' });
      console.log('[RosterContext] Moved to bench successfully');
      
      await refreshProfiles();
    } catch (error: any) {
      console.error('[RosterContext] Error moving to bench:', error);
      Alert.alert('Error', error.message || 'Failed to move to bench');
      throw error;
    }
  };

  const moveToRoster = async (id: string) => {
    try {
      console.log('[RosterContext] Moving to roster:', id);
      await authenticatedPut(`/api/roster/profiles/${id}`, { status: 'roster' });
      console.log('[RosterContext] Moved to roster successfully');
      
      await refreshProfiles();
    } catch (error: any) {
      console.error('[RosterContext] Error moving to roster:', error);
      Alert.alert('Error', error.message || 'Failed to move to roster');
      throw error;
    }
  };

  const addDate = async (date: DateEvent) => {
    try {
      console.log('[RosterContext] Adding date:', date);
      const dateData = {
        profileId: date.personId,
        dateType: date.status,
        dateTime: date.date,
        notes: date.notes,
      };
      
      await authenticatedPost('/api/dates', dateData);
      console.log('[RosterContext] Date added successfully');
      
      await refreshDates();
    } catch (error: any) {
      console.error('[RosterContext] Error adding date:', error);
      Alert.alert('Error', error.message || 'Failed to add date');
      throw error;
    }
  };

  const updateDate = async (date: DateEvent) => {
    try {
      console.log('[RosterContext] Updating date:', date.id);
      const dateData = {
        dateType: date.status,
        dateTime: date.date,
        notes: date.notes,
      };
      
      await authenticatedPut(`/api/dates/${date.id}`, dateData);
      console.log('[RosterContext] Date updated successfully');
      
      await refreshDates();
    } catch (error: any) {
      console.error('[RosterContext] Error updating date:', error);
      Alert.alert('Error', error.message || 'Failed to update date');
      throw error;
    }
  };

  const deleteDate = async (id: string) => {
    try {
      console.log('[RosterContext] Deleting date:', id);
      await authenticatedDelete(`/api/dates/${id}`);
      console.log('[RosterContext] Date deleted successfully');
      
      setDates(dates.filter(d => d.id !== id));
    } catch (error: any) {
      console.error('[RosterContext] Error deleting date:', error);
      Alert.alert('Error', error.message || 'Failed to delete date');
      throw error;
    }
  };

  const addFlag = async (profileId: string, flagText: string, flagType: 'red' | 'green') => {
    try {
      console.log('[RosterContext] Adding flag:', flagType, 'to profile:', profileId);
      await authenticatedPost(`/api/roster/profiles/${profileId}/flags`, {
        flagText,
        flagType,
      });
      console.log('[RosterContext] Flag added successfully');
      
      await refreshProfiles();
    } catch (error: any) {
      console.error('[RosterContext] Error adding flag:', error);
      Alert.alert('Error', error.message || 'Failed to add flag');
      throw error;
    }
  };

  const deleteFlag = async (flagId: string) => {
    try {
      console.log('[RosterContext] Deleting flag:', flagId);
      await authenticatedDelete(`/api/roster/flags/${flagId}`);
      console.log('[RosterContext] Flag deleted successfully');
      
      await refreshProfiles();
    } catch (error: any) {
      console.error('[RosterContext] Error deleting flag:', error);
      Alert.alert('Error', error.message || 'Failed to delete flag');
      throw error;
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

export function useRoster() {
  const context = useContext(RosterContext);
  if (!context) {
    throw new Error('useRoster must be used within RosterProvider');
  }
  return context;
}
