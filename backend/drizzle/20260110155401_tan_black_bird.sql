CREATE TABLE "interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"profile_id" uuid NOT NULL,
	"type" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"profile_id" uuid,
	"type" text NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"message" text NOT NULL,
	"sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dates" ADD COLUMN "location_name" text;--> statement-breakpoint
ALTER TABLE "dates" ADD COLUMN "location_address" text;--> statement-breakpoint
ALTER TABLE "dates" ADD COLUMN "location_coordinates" jsonb;--> statement-breakpoint
ALTER TABLE "dates" ADD COLUMN "rating" integer;--> statement-breakpoint
ALTER TABLE "dates" ADD COLUMN "would_go_again" boolean;--> statement-breakpoint
ALTER TABLE "dates" ADD COLUMN "reminder_settings" jsonb;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "display_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "last_contact_date" timestamp;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_profile_id_roster_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."roster_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_profile_id_roster_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."roster_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dates" DROP COLUMN "location";