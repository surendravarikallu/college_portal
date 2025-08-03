-- Complete Database Schema for College Portal
-- This file contains all tables and schema changes in one place

-- Create alumni table
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

-- Create attendance table
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"student_name" text NOT NULL,
	"roll_number" text NOT NULL,
	"branch" text,
	"year" integer,
	"marked_at" timestamp DEFAULT now()
);

-- Create events table
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"company" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"attachment_url" text,
	"notification_link" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create news table
CREATE TABLE "news" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create students table
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"roll_number" text NOT NULL,
	"branch" text,
	"year" integer,
	"batch" text,
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

-- Create users table with name column
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"name" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'tpo' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

-- Create session table
CREATE TABLE "session" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp NOT NULL
);

-- Create hero_notifications table
CREATE TABLE "hero_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"link" text,
	"icon" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create important_notifications table
CREATE TABLE "important_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"link" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;

-- Insert default TPO user if not exists
INSERT INTO "users" ("username", "name", "password", "role") 
VALUES ('tpo_admin', 'TPO Administrator', '$2b$16$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.g.0O6m', 'tpo')
ON CONFLICT ("username") DO NOTHING; 