ALTER TABLE "dates" ADD COLUMN "status" text DEFAULT 'upcoming';--> statement-breakpoint
ALTER TABLE "dates" ADD COLUMN "type" text DEFAULT 'casual';--> statement-breakpoint
ALTER TABLE "dates" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "birthday_day" integer;--> statement-breakpoint
ALTER TABLE "roster_profiles" ADD COLUMN "bench_reason" text;--> statement-breakpoint
ALTER TABLE "dates" DROP COLUMN "date_type";