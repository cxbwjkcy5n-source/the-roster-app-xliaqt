import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().default(''),
  name: text('name').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// User's own profile
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name'),
  age: integer('age'),
  location: text('location'),
  phoneNumber: text('phone_number'),
  favoriteColor: text('favorite_color'),
  favoriteFoodType: text('favorite_food_type'),
  instagram: text('instagram'),
  twitter: text('twitter'),
  notes: text('notes'),
  profileImageUrl: text('profile_image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Roster profiles (people the user adds)
export const rosterProfiles = pgTable('roster_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  age: integer('age'),
  birthdayMonth: text('birthday_month'),
  birthdayDay: integer('birthday_day'),
  zodiacSign: text('zodiac_sign'),
  favoriteColor: text('favorite_color'),
  favoriteFood: text('favorite_food'),
  relationshipType: text('relationship_type').default('dating'),
  customRelationshipType: text('custom_relationship_type'),
  howYouMet: text('how_you_met'),
  location: text('location'),
  phoneNumber: text('phone_number'),
  instagram: text('instagram'),
  twitter: text('twitter'),
  facebook: text('facebook'),
  snapchat: text('snapchat'),
  notes: text('notes'),
  interestLevel: text('interest_level').default('medium'),
  profileImageUrl: text('profile_image_url'),
  status: text('status').default('roster'),
  benchReason: text('bench_reason'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Profile flags
export const profileFlags = pgTable('profile_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: text('profile_id')
    .notNull()
    .references(() => rosterProfiles.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  flagText: text('flag_text').notNull(),
  flagType: text('flag_type').default('red'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Dates table
export const dates = pgTable('dates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  profileId: text('profile_id')
    .notNull()
    .references(() => rosterProfiles.id, { onDelete: 'cascade' }),
  dateTime: timestamp('date_time', { withTimezone: true }),
  location: text('location'),
  locationCoords: text('location_coords'),
  notes: text('notes'),
  status: text('status').default('upcoming'),
  type: text('type').default('casual'),
  rating: integer('rating'),
  wouldGoAgain: boolean('would_go_again'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Reminders table
export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  profileId: text('profile_id').references(() => rosterProfiles.id, {
    onDelete: 'cascade',
  }),
  type: text('type'),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  message: text('message'),
  sent: boolean('sent').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Interactions table
export const interactions = pgTable('interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  profileId: text('profile_id')
    .notNull()
    .references(() => rosterProfiles.id, { onDelete: 'cascade' }),
  type: text('type'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles),
  rosterProfiles: many(rosterProfiles),
  profileFlags: many(profileFlags),
  dates: many(dates),
  reminders: many(reminders),
  interactions: many(interactions),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const rosterProfilesRelations = relations(
  rosterProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [rosterProfiles.userId],
      references: [users.id],
    }),
    flags: many(profileFlags),
    dates: many(dates),
    reminders: many(reminders),
    interactions: many(interactions),
  })
);

export const profileFlagsRelations = relations(profileFlags, ({ one }) => ({
  profile: one(rosterProfiles, {
    fields: [profileFlags.profileId],
    references: [rosterProfiles.id],
  }),
  user: one(users, {
    fields: [profileFlags.userId],
    references: [users.id],
  }),
}));

export const datesRelations = relations(dates, ({ one }) => ({
  user: one(users, {
    fields: [dates.userId],
    references: [users.id],
  }),
  profile: one(rosterProfiles, {
    fields: [dates.profileId],
    references: [rosterProfiles.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
  profile: one(rosterProfiles, {
    fields: [reminders.profileId],
    references: [rosterProfiles.id],
  }),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  user: one(users, {
    fields: [interactions.userId],
    references: [users.id],
  }),
  profile: one(rosterProfiles, {
    fields: [interactions.profileId],
    references: [rosterProfiles.id],
  }),
}));
