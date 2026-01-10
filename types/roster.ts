
export type InterestLevel = 'low' | 'medium' | 'high';
export type RelationshipType = 'dating' | 'casual' | 'serious' | 'friendzone' | 'booty call' | 'someone to drink with' | 'exploring' | 'other';
export type ProfileStatus = 'roster' | 'bench';

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
}

export interface DateEvent {
  id: string;
  profileId: string;
  profileName?: string;
  date: string;
  time: string;
  location: string;
  notes?: string;
  status: 'upcoming' | 'completed';
  type: 'casual' | 'formal' | 'activity';
}
