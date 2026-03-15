
export type InterestLevel = 'low' | 'medium' | 'high';
export type RelationshipType = 'dating' | 'casual' | 'serious' | 'friendzone' | 'booty call' | 'someone to drink with' | 'exploring' | 'other';
export type ProfileStatus = 'roster' | 'bench';
export type DateType = 'casual' | 'formal' | 'activity' | 'coffee' | 'dinner' | 'drinks' | 'movie' | 'outdoor' | 'other';
export type ReminderType = 'morning_text' | 'check_in' | 'date' | 'custom';
export type InteractionType = 'date' | 'text' | 'call' | 'morning_text' | 'check_in';

export interface Flag {
  id: string;
  text: string;
  type: 'red' | 'green';
}

export interface RosterPerson {
  id: string;
  name: string;
  age: number;
  birthdayMonth: number;
  birthdayDay: number;
  zodiacSign: string;
  favoriteColor: string;
  favoriteFoodType: string;
  relationshipType: RelationshipType;
  customRelationshipType?: string;
  howMet?: string;
  location: string;
  phoneNumber: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  snapchat?: string;
  notes?: string;
  interestLevel: InterestLevel;
  imageUrl?: string;
  redFlags: Flag[];
  greenFlags: Flag[];
  status: ProfileStatus;
  benchReason?: string;
  sortOrder?: number;
  createdAt?: string;
  // New rating fields
  sexualChemistry?: number | null;
  attractiveness?: number | null;
  compatibilityScore?: number | null;
  // camelCase API fields
  profileImageUrl?: string;
  howYouMet?: string;
  instagramHandle?: string;
  snapchatHandle?: string;
}

export interface DateEvent {
  id: string;
  profileId: string;
  profileName?: string;
  date: string;
  time: string;
  location: string;
  locationCoords?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  status: 'upcoming' | 'completed';
  type: DateType;
  rating?: number; // 1-5 stars
  wouldGoAgain?: boolean;
  reminders?: string[]; // Array of reminder IDs
}

export interface Reminder {
  id: string;
  profileId?: string;
  dateId?: string;
  type: ReminderType;
  title: string;
  description?: string;
  scheduledFor: string; // ISO date string
  completed: boolean;
  recurring?: boolean;
  customMessage?: string;
}

export interface Interaction {
  id: string;
  profileId: string;
  type: InteractionType;
  date: string; // ISO date string
  notes?: string;
}

export interface Analytics {
  totalProfiles: number;
  totalDates: number;
  upcomingDates: number;
  completedDates: number;
  datesPerMonth: { month: string; count: number }[];
  commonRedFlags: { flag: string; count: number }[];
  commonGreenFlags: { flag: string; count: number }[];
  dateFrequency: {
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
  interestLevelBreakdown: {
    low: number;
    medium: number;
    high: number;
  };
  statusBreakdown: {
    roster: number;
    bench: number;
  };
}

export interface Nudge {
  id: string;
  profileId: string;
  profileName: string;
  message: string;
  daysSinceLastContact: number;
  lastContactDate: string;
}
