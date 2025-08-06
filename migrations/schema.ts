import { pgTable, serial, text, integer, timestamp, unique, boolean, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const alumni = pgTable("alumni", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	rollNumber: text("roll_number").notNull(),
	passOutYear: integer("pass_out_year").notNull(),
	currentStatus: text("current_status").notNull(),
	higherEducationCollege: text("higher_education_college"),
	collegeRollNumber: text("college_roll_number"),
	company: text(),
	package: integer(),
	role: text(),
	offerLetterUrl: text("offer_letter_url"),
	idCardUrl: text("id_card_url"),
	address: text().notNull(),
	contactNumber: text("contact_number").notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const heroNotifications = pgTable("hero_notifications", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	type: text().notNull(),
	link: text(),
	icon: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const importantNotifications = pgTable("important_notifications", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	type: text().notNull(),
	link: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const news = pgTable("news", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const students = pgTable("students", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	rollNumber: text("roll_number").notNull(),
	branch: text(),
	year: integer(),
	email: text(),
	phone: text(),
	photoUrl: text("photo_url"),
	selected: boolean().default(false),
	companyName: text("company_name"),
	offerLetterUrl: text("offer_letter_url"),
	package: integer(),
	role: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("students_roll_number_unique").on(table.rollNumber),
]);

export const events = pgTable("events", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	company: text().notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	link: text(),
	notificationLink: text("notification_link"),
	attachmentUrl: text("attachment_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	role: text().default('tpo').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_username_unique").on(table.username),
]);

export const attendance = pgTable("attendance", {
	id: serial().primaryKey().notNull(),
	eventId: integer("event_id"),
	studentName: text("student_name").notNull(),
	rollNumber: text("roll_number").notNull(),
	markedAt: timestamp("marked_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "attendance_event_id_events_id_fk"
		}),
]);
