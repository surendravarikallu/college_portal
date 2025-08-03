ALTER TABLE "attendance" ADD COLUMN "branch" text;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "attachment_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "notification_link" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "batch" text;