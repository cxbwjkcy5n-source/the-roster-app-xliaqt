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
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
  phone: text('phone'),
  favoriteColor: text('favorite_color'),
  favoriteFood: text('favorite_food'),
  instagram: text('instagram'),
  twitter: text('twitter'),
  notes: text('notes'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Roster profiles (people the user adds)
export const rosterProfiles = pgTable('roster_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  location: text('location'),
  age: integer('age'),
  birthdayMonth: text('birthday_month'),
  birthdayDay: integer('birthday_day'),
  zodiacSign: text('zodiac_sign'),
  favoriteFood: text('favorite_food'),
  relationshipType: text('relationship_type'),
  howWeMet: text('how_we_met'),
  phone: text('phone'),
  instagram: text('instagram'),
  twitter: text('twitter'),
  notes: text('notes'),
  photoUrl: text('photo_url'),
  priority: text('priority').default('medium'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Dates table
export const dates = pgTable('dates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').references(() => rosterProfiles.id, {
    onDelete: 'set null',
  }),
  status: text('status').default('planned'),
  type: text('type'),
  dateTime: timestamp('date_time'),
  locationName: text('location_name'),
  locationAddress: text('location_address'),
  locationCoordinates: text('location_coordinates'),
  notes: text('notes'),
  rating: integer('rating'),
  wouldGoAgain: boolean('would_go_again'),
  reminderSettings: text('reminder_settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Matches table
export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').references(() => rosterProfiles.id, {
    onDelete: 'cascade',
  }),
  compatibilityScore: integer('compatibility_score'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles),
  rosterProfiles: many(rosterProfiles),
  dates: many(dates),
  matches: many(matches),
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
    dates: many(dates),
    matches: many(matches),
  })
);

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

export const matchesRelations = relations(matches, ({ one }) => ({
  user: one(users, {
    fields: [matches.userId],
    references: [users.id],
  }),
  profile: one(rosterProfiles, {
    fields: [matches.profileId],
    references: [rosterProfiles.id],
  }),
}));
