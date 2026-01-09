
export type InterestLevel = 'low' | 'medium' | 'high';

export type RelationshipType = 
  | 'dating' 
  | 'casual' 
  | 'serious' 
  | 'friendzone' 
  | 'booty-call' 
  | 'drink-buddy' 
  | 'exploring' 
  | 'other';

export interface Flag {
  id: string;
  text: string;
  type: 'red' | 'green';
}

export interface RosterPerson {
  id: string;
  name: string;
  age: number;
  birthday: {
    month: number;
    year: number;
  };
  zodiacSign: string;
  favoriteColor?: string;
  favoriteFoodType?: string;
  relationshipType: RelationshipType;
  customRelationshipType?: string;
  location: string;
  phoneNumber?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  snapchat?: string;
  notes?: string;
  redFlags: Flag[];
  greenFlags: Flag[];
  interestLevel: InterestLevel;
  photoUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DateEvent {
  id: string;
  personId: string;
  personName: string;
  title: string;
  date: string;
  location?: string;
  notes?: string;
  status: 'upcoming' | 'completed';
  type: 'have-date' | 'on-date' | 'planned';
}
