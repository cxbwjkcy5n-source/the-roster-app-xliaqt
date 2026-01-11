import { pgTable, text, integer, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth-schema.js';

export const rosterProfiles = pgTable('roster_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  age: integer('age'),
  birthdayMonth: integer('birthday_month'),
  birthdayDay: integer('birthday_day'),
  birthdayYear: integer('birthday_year'),
  zodiacSign: text('zodiac_sign'),
  favoriteColor: text('favorite_color'),
  favoriteFood: text('favorite_food'),
  relationshipType: text('relationship_type'),
  location: text('location'),
  phoneNumber: text('phone_number'),
  instagram: text('instagram'),
  twitter: text('twitter'),
  facebook: text('facebook'),
  snapchat: text('snapchat'),
  notes: text('notes'),
  interestLevel: text('interest_level', { enum: ['low', 'medium', 'high'] }).default('medium'),
  profileImageUrl: text('profile_image_url'),
  profileImageKey: text('profile_image_key'),
  status: text('status', { enum: ['roster', 'bench'] }).default('roster'),
  benchReason: text('bench_reason'),
  displayOrder: integer('display_order').default(0),
  lastContactDate: timestamp('last_contact_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const redFlags = pgTable('red_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => rosterProfiles.id, { onDelete: 'cascade' }),
  flagText: text('flag_text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const greenFlags = pgTable('green_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => rosterProfiles.id, { onDelete: 'cascade' }),
  flagText: text('flag_text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dates = pgTable('dates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').notNull().references(() => rosterProfiles.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['upcoming', 'completed'] }).default('upcoming'),
  type: text('type', { enum: ['casual', 'formal', 'activity', 'dinner', 'drinks', 'coffee'] }).default('casual'),
  dateTime: timestamp('date_time'),
  locationName: text('location_name'),
  locationAddress: text('location_address'),
  locationCoordinates: jsonb('location_coordinates').$type<{ lat: number; lng: number }>(),
  notes: text('notes'),
  rating: integer('rating'),
  wouldGoAgain: boolean('would_go_again'),
  reminderSettings: jsonb('reminder_settings').$type<{ oneHourBefore?: boolean; oneDayBefore?: boolean; oneWeekBefore?: boolean }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').references(() => rosterProfiles.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['morning_text', 'check_in', 'date_reminder', 'auto_nudge'] }).notNull(),
  scheduledFor: timestamp('scheduled_for').notNull(),
  message: text('message').notNull(),
  sent: boolean('sent').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const interactions = pgTable('interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').notNull().references(() => rosterProfiles.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['date', 'morning_text', 'check_in', 'call', 'message'] }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const safetyDates = pgTable('safety_dates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  profileName: text('profile_name').notNull(),
  dateWithName: text('date_with_name').notNull(),
  dateWithDescription: text('date_with_description'),
  location: text('location').notNull(),
  locationAddress: text('location_address'),
  coordinates: jsonb('coordinates').$type<{ latitude: number; longitude: number }>(),
  status: text('status', { enum: ['active', 'completed', 'emergency'] }).default('active').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const emergencyContacts = pgTable('emergency_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  safetyDateId: uuid('safety_date_id').notNull().references(() => safetyDates.id, { onDelete: 'cascade' }),
  contactName: text('contact_name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  sharedAt: timestamp('shared_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const rosterProfilesRelations = relations(rosterProfiles, ({ one, many }) => ({
  user: one(user, {
    fields: [rosterProfiles.userId],
    references: [user.id],
  }),
  redFlags: many(redFlags),
  greenFlags: many(greenFlags),
  dates: many(dates),
  reminders: many(reminders),
  interactions: many(interactions),
}));

export const redFlagsRelations = relations(redFlags, ({ one }) => ({
  profile: one(rosterProfiles, {
    fields: [redFlags.profileId],
    references: [rosterProfiles.id],
  }),
}));

export const greenFlagsRelations = relations(greenFlags, ({ one }) => ({
  profile: one(rosterProfiles, {
    fields: [greenFlags.profileId],
    references: [rosterProfiles.id],
  }),
}));

export const datesRelations = relations(dates, ({ one }) => ({
  user: one(user, {
    fields: [dates.userId],
    references: [user.id],
  }),
  profile: one(rosterProfiles, {
    fields: [dates.profileId],
    references: [rosterProfiles.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(user, {
    fields: [reminders.userId],
    references: [user.id],
  }),
  profile: one(rosterProfiles, {
    fields: [reminders.profileId],
    references: [rosterProfiles.id],
  }),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  user: one(user, {
    fields: [interactions.userId],
    references: [user.id],
  }),
  profile: one(rosterProfiles, {
    fields: [interactions.profileId],
    references: [rosterProfiles.id],
  }),
}));

export const safetyDatesRelations = relations(safetyDates, ({ one, many }) => ({
  user: one(user, {
    fields: [safetyDates.userId],
    references: [user.id],
  }),
  emergencyContacts: many(emergencyContacts),
}));

export const emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
  user: one(user, {
    fields: [emergencyContacts.userId],
    references: [user.id],
  }),
  safetyDate: one(safetyDates, {
    fields: [emergencyContacts.safetyDateId],
    references: [safetyDates.id],
  }),
}));
