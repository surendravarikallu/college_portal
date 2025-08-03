CREATE TABLE "alumni" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"roll_number" text NOT NULL,
	"pass_out_year" integer NOT NULL,
	"higher_education_college" text,
	"college_roll_number" text,
	"address" text NOT NULL,
	"contact_number" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"student_name" text NOT NULL,
	"roll_number" text NOT NULL,
	"marked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"company" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"roll_number" text NOT NULL,
	"branch" text,
	"email" text,
	"phone" text,
	"photo_url" text,
	"selected" boolean DEFAULT false,
	"company_name" text,
	"offer_letter_url" text,
	"package" integer,
	"role" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "students_roll_number_unique" UNIQUE("roll_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'tpo' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;