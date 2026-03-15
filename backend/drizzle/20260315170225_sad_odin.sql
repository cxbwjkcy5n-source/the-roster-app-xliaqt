CREATE TABLE "interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"type" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" text NOT NULL,
	"user_id" text NOT NULL,
	"flag_text" text NOT NULL,
	"flag_type" text DEFAULT 'red',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"profile_id" text,
	"type" text,
	"scheduled_for" timestamp with time zone,
	"message" text,
	"sent" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "matches" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "matches" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "dates" DROP CONSTRAINT "dates_profile_id_roster_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "dates" ALTER COLUMN "profile_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "dates" ALTER COLUMN "profile_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dates" ALTER COLUMN "status" SET DEFAULT 'upcoming';--> statement-breakpoint
ALTER TABLE "dates" ALTER COLUMN "type" SET DEFAULT 'casual';--> statement-breakpoint
ALTER TABLE "dates" ALTER COLUMN "date_time" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dates" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dates" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "roster_profiles" ALTER COLUMN "relationship_type" SET DEFAULT 'dating';--> statement-breakpoint
ALTER TABLE "roster_profiles" ALTER COLUMN "status" SET DEFAULT 'roster';--> statement-breakpoint
ALTER TABLE "roster_profiles" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "roster_profiles" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "roster_profiles" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "roster_profiles" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "dates" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "dates" ADD COLUMN "location_coords" text;--> statement-breakpoint
ALTER TABLE "dates" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "favorite_color" text;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "custom_relationship_type" text;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "how_you_met" text;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "facebook" text;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "snapchat" text;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "interest_level" text DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "profile_image_url" text;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "bench_reason" text;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "sort_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "favorite_food_type" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "profile_image_url" text;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_profile_id_roster_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."roster_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_flags" ADD CONSTRAINT "profile_flags_profile_id_roster_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."roster_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_flags" ADD CONSTRAINT "profile_flags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_profile_id_roster_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."roster_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dates" ADD CONSTRAINT "dates_profile_id_roster_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."roster_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dates" DROP COLUMN "location_name";--> statement-breakpoint
ALTER TABLE "dates" DROP COLUMN "location_address";--> statement-breakpoint
ALTER TABLE "dates" DROP COLUMN "location_coordinates";--> statement-breakpoint
ALTER TABLE "dates" DROP COLUMN "reminder_settings";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "how_we_met";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "photo_url";--> statement-breakpoint
ALTER TABLE "roster_profiles" DROP COLUMN "priority";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "favorite_food";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "photo_url";