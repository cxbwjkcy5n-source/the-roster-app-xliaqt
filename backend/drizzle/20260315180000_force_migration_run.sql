-- Force migration to run by ensuring tables are properly set up
-- This migration verifies the schema for users, roster_profiles, dates, and user_profiles

-- Ensure users table exists with proper structure
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    CREATE TABLE "users" (
      "id" text PRIMARY KEY NOT NULL,
      "email" text NOT NULL DEFAULT '',
      "name" text NOT NULL DEFAULT '',
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  END IF;
END $$;

--> statement-breakpoint

-- Ensure user_profiles table exists with proper structure
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    CREATE TABLE "user_profiles" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" text NOT NULL UNIQUE REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
      "name" text,
      "age" integer,
      "location" text,
      "phone_number" text,
      "favorite_color" text,
      "favorite_food_type" text,
      "instagram" text,
      "twitter" text,
      "notes" text,
      "profile_image_url" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  END IF;
END $$;

--> statement-breakpoint

-- Ensure roster_profiles table exists with proper structure
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roster_profiles') THEN
    CREATE TABLE "roster_profiles" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" text NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
      "name" text NOT NULL,
      "age" integer,
      "birthday_month" text,
      "birthday_day" integer,
      "zodiac_sign" text,
      "favorite_color" text,
      "favorite_food" text,
      "relationship_type" text DEFAULT 'dating',
      "custom_relationship_type" text,
      "how_you_met" text,
      "location" text,
      "phone_number" text,
      "instagram" text,
      "twitter" text,
      "facebook" text,
      "snapchat" text,
      "notes" text,
      "interest_level" text DEFAULT 'medium',
      "profile_image_url" text,
      "status" text DEFAULT 'roster',
      "bench_reason" text,
      "sort_order" integer DEFAULT 0,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  END IF;
END $$;

--> statement-breakpoint

-- Ensure dates table exists with proper structure
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dates') THEN
    CREATE TABLE "dates" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" text NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
      "profile_id" text NOT NULL REFERENCES "public"."roster_profiles"("id") ON DELETE cascade ON UPDATE no action,
      "date_time" timestamp with time zone,
      "location" text,
      "location_coords" text,
      "notes" text,
      "status" text DEFAULT 'upcoming',
      "type" text DEFAULT 'casual',
      "rating" integer,
      "would_go_again" boolean,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  END IF;
END $$;

--> statement-breakpoint

-- Ensure reminders table exists with proper structure
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reminders') THEN
    CREATE TABLE "reminders" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" text NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
      "profile_id" text REFERENCES "public"."roster_profiles"("id") ON DELETE cascade ON UPDATE no action,
      "type" text,
      "scheduled_for" timestamp with time zone,
      "message" text,
      "sent" boolean DEFAULT false,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  END IF;
END $$;

--> statement-breakpoint

-- Ensure profile_flags table exists with proper structure
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_flags') THEN
    CREATE TABLE "profile_flags" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "profile_id" text NOT NULL REFERENCES "public"."roster_profiles"("id") ON DELETE cascade ON UPDATE no action,
      "user_id" text NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
      "flag_text" text NOT NULL,
      "flag_type" text DEFAULT 'red',
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  END IF;
END $$;

--> statement-breakpoint

-- Ensure interactions table exists with proper structure
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interactions') THEN
    CREATE TABLE "interactions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" text NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
      "profile_id" text NOT NULL REFERENCES "public"."roster_profiles"("id") ON DELETE cascade ON UPDATE no action,
      "type" text,
      "notes" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  END IF;
END $$;
