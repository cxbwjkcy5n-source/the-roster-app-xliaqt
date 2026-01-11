CREATE TABLE "emergency_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"safety_date_id" uuid NOT NULL,
	"contact_name" text NOT NULL,
	"phone_number" text NOT NULL,
	"shared_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safety_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"profile_name" text NOT NULL,
	"date_with_name" text NOT NULL,
	"date_with_description" text,
	"location" text NOT NULL,
	"location_address" text,
	"coordinates" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_safety_date_id_safety_dates_id_fk" FOREIGN KEY ("safety_date_id") REFERENCES "public"."safety_dates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_dates" ADD CONSTRAINT "safety_dates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;