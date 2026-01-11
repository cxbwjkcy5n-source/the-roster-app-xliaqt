ALTER TABLE "user" ADD COLUMN "image_key" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "profile_completed" boolean DEFAULT false NOT NULL;