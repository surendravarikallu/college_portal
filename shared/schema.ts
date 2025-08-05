import { pgTable, text, serial, integer, boolean, timestamp, varchar, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("tpo"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  company: text("company").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  attachmentUrl: text("attachment_url"), // For PDFs and other files
  notificationLink: text("notification_link"), // For web links
  // status: text("status").notNull(), // Status is now computed, not stored
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rollNumber: text("roll_number").notNull().unique(),
  branch: text("branch"),
  year: integer("year"), // Added year field
  batch: text("batch"), // Study period/batch (e.g., "2020-2024", "2021-2025")
  email: text("email"),
  phone: text("phone"),
  photoUrl: text("photo_url"),
  selected: boolean("selected").default(false),
  companyName: text("company_name"),
  offerLetterUrl: text("offer_letter_url"),
  package: integer("package"), // LPA, only for placed students
  role: text("role"), // only for placed students
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const alumni = pgTable("alumni", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rollNumber: text("roll_number").notNull(),
  passOutYear: integer("pass_out_year").notNull(),
  higherEducationCollege: text("higher_education_college"),
  collegeRollNumber: text("college_roll_number"),
  address: text("address").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id),
  studentName: text("student_name").notNull(),
  rollNumber: text("roll_number").notNull(),
  branch: text("branch"),
  year: integer("year"),
  markedAt: timestamp("marked_at").defaultNow(),
});

export const heroNotifications = pgTable("hero_notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  link: text("link"),
  icon: text("icon"), // icon name for frontend
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const importantNotifications = pgTable("important_notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const placementStuff = pgTable("placement_stuff", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const eventsRelations = relations(events, ({ many }) => ({
  attendance: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  event: one(events, {
    fields: [attendance.eventId],
    references: [events.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertNewsSchema = createInsertSchema(news).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events, {
  startDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  endDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
}).extend({
  notificationLink: z.string().optional().transform(val => val === "" ? undefined : val),
  attachmentUrl: z.string().optional().transform(val => val === "" ? undefined : val),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlumniSchema = createInsertSchema(alumni).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  markedAt: true,
});

export const insertHeroNotificationSchema = createInsertSchema(heroNotifications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertImportantNotificationSchema = createInsertSchema(importantNotifications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPlacementStuffSchema = createInsertSchema(placementStuff).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Session = typeof sessions.$inferSelect;
export type News = typeof news.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Alumni = typeof alumni.$inferSelect;
export type InsertAlumni = z.infer<typeof insertAlumniSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type HeroNotification = typeof heroNotifications.$inferSelect;
export type InsertHeroNotification = z.infer<typeof insertHeroNotificationSchema>;
export type ImportantNotification = typeof importantNotifications.$inferSelect;
export type InsertImportantNotification = z.infer<typeof insertImportantNotificationSchema>;
export type PlacementStuff = typeof placementStuff.$inferSelect;
export type InsertPlacementStuff = z.infer<typeof insertPlacementStuffSchema>;