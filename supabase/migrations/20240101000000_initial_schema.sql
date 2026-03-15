-- The Roster: Initial Schema Migration
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/bbtvdhdfzkyhrodgclkd/sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id),
  name TEXT,
  age INTEGER,
  location TEXT,
  phone_number TEXT,
  favorite_color TEXT,
  favorite_food_type TEXT,
  instagram TEXT,
  twitter TEXT,
  notes TEXT,
  image TEXT,
  profile_image_url TEXT,
  share_code TEXT,
  profile_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roster_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  age INTEGER,
  location TEXT,
  phone_number TEXT,
  birthday_month INTEGER,
  birthday_day INTEGER,
  birthday_year INTEGER,
  zodiac_sign TEXT,
  favorite_color TEXT,
  favorite_food TEXT,
  relationship_type TEXT,
  custom_relationship_type TEXT,
  how_you_met TEXT,
  instagram TEXT,
  twitter TEXT,
  facebook TEXT,
  snapchat TEXT,
  notes TEXT,
  interest_level INTEGER,
  profile_image_url TEXT,
  status TEXT DEFAULT 'active',
  bench_reason TEXT,
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES roster_profiles(id) ON DELETE CASCADE,
  flag_text TEXT,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  profile_id UUID REFERENCES roster_profiles(id),
  date TIMESTAMPTZ,
  location TEXT,
  notes TEXT,
  rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  profile_id UUID REFERENCES roster_profiles(id),
  title TEXT,
  notes TEXT,
  remind_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coaching_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
