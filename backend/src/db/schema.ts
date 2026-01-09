import { pgTable, text, integer, timestamp, uuid, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth-schema.js';

export const rosterProfiles = pgTable('roster_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  age: integer('age'),
  birthdayMonth: integer('birthday_month'),
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
  dateType: text('date_type', { enum: ['upcoming', 'completed'] }).default('upcoming'),
  dateTime: timestamp('date_time'),
  notes: text('notes'),
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
