CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"profile_id" uuid,
	"compatibility_score" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text,
	"age" integer,
	"phone" text,
	"favorite_color" text,
	"favorite_food" text,
	"instagram" text,
	"twitter" text,
	"notes" text,
	"photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "emergency_contacts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "green_flags" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "interactions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "red_flags" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reminders" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "safety_dates" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "emergency_contacts" CASCADE;--> statement-breakpoint
DROP TABLE "green_flags" CASCADE;--> statement-breakpoint
DROP TABLE "interactions" CASCADE;--> statement-breakpoint
DROP TABLE "red_flags" CASCADE;--> statement-breakpoint
DROP TABLE "reminders" CASCADE;--> statement-breakpoint
DROP TABLE "safety_dates" CASCADE;--> statement-breakpoint
ALTER TABLE "dates" DROP CONSTRAINT "dates_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "dates" DROP CONSTRAINT "dates_profile_id_roster_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP CONSTRAINT "roster_profiles_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "dates" ALTER COLUMN "profile_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "dates" ALTER COLUMN "status" SET DEFAULT 'planned';--> statement-breakpoint
ALTER TABLE "dates" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "dates" ALTER COLUMN "location_coordinates" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "dates" ALTER COLUMN "reminder_settings" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "roster_profiles" ALTER COLUMN "birthday_month" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "roster_profiles" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "how_we_met" text;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "priority" text DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_profile_id_roster_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."roster_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dates" ADD CONSTRAINT "dates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dates" ADD CONSTRAINT "dates_profile_id_roster_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."roster_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD CONSTRAINT "roster_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "birthday_year";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "favorite_color";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "phone_number";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "facebook";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "snapchat";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "hobbies";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "interests";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "how_you_met";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "interest_level";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "profile_image_url";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "profile_image_key";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "bench_reason";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "display_order";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "last_contact_date";