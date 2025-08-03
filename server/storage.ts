import { 
  users, news, events, students, alumni, attendance,
  type User, type InsertUser,
  type News, type InsertNews,
  type Event, type InsertEvent,
  type Student, type InsertStudent,
  type Alumni, type InsertAlumni,
  type Attendance, type InsertAttendance,
  heroNotifications, importantNotifications, type HeroNotification, type InsertHeroNotification, type ImportantNotification, type InsertImportantNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, asc } from "drizzle-orm";
import session from "express-session";
import type { Store as SessionStoreType } from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // News methods
  getAllNews(): Promise<News[]>;
  createNews(news: InsertNews): Promise<News>;
  updateNews(id: number, news: Partial<InsertNews>): Promise<News | undefined>;
  deleteNews(id: number): Promise<boolean>;

  // Event methods
  getAllEvents(): Promise<Event[]>;
  getEventById(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Student methods
  getAllStudents(): Promise<Student[]>;
  getStudentsByDepartmentAndYear(branch?: string, year?: number, batch?: string): Promise<Student[]>;
  getStudentById(id: number): Promise<Student | undefined>;
  getStudentByRollNumber(rollNumber: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;

  // Alumni methods
  getAllAlumni(): Promise<Alumni[]>;
  createAlumni(alumni: InsertAlumni): Promise<Alumni>;
  updateAlumni(id: number, alumni: Partial<InsertAlumni>): Promise<Alumni | undefined>;
  deleteAlumni(id: number): Promise<boolean>;

  // Attendance methods
  getAllAttendance(): Promise<Attendance[]>;
  getAttendanceByEvent(eventId: number): Promise<Attendance[]>;
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined>;

  // Hero Notifications CRUD
  getAllHeroNotifications(): Promise<HeroNotification[]>;
  getHeroNotificationById(id: number): Promise<HeroNotification | undefined>;
  createHeroNotification(data: InsertHeroNotification): Promise<HeroNotification>;
  updateHeroNotification(id: number, data: Partial<InsertHeroNotification>): Promise<HeroNotification | undefined>;
  deleteHeroNotification(id: number): Promise<boolean>;

  // Important Notifications CRUD
  getAllImportantNotifications(): Promise<ImportantNotification[]>;
  getImportantNotificationById(id: number): Promise<ImportantNotification | undefined>;
  createImportantNotification(data: InsertImportantNotification): Promise<ImportantNotification>;
  updateImportantNotification(id: number, data: Partial<InsertImportantNotification>): Promise<ImportantNotification | undefined>;
  deleteImportantNotification(id: number): Promise<boolean>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool: pool, 
      createTableIfMissing: true 
    });
  }

  async testConnection(): Promise<void> {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log("Database connection successful");
    } catch (error: any) {
      console.error("Database connection test failed:", error.message);
      throw error;
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // News methods
  async getAllNews(): Promise<News[]> {
    return await db.select().from(news).orderBy(desc(news.createdAt));
  }

  async createNews(insertNews: InsertNews): Promise<News> {
    const [newsItem] = await db
      .insert(news)
      .values(insertNews)
      .returning();
    return newsItem;
  }

  async updateNews(id: number, updateNews: Partial<InsertNews>): Promise<News | undefined> {
    const [updatedNews] = await db
      .update(news)
      .set({ ...updateNews, updatedAt: new Date() })
      .where(eq(news.id, id))
      .returning();
    return updatedNews || undefined;
  }

  async deleteNews(id: number): Promise<boolean> {
    const result = await db.delete(news).where(eq(news.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Event methods
  async getAllEvents(): Promise<Event[]> {
    try {
      return await db.select().from(events).orderBy(desc(events.startDate));
    } catch (error) {
      console.error("Database error in getAllEvents:", error);
      throw new Error("Failed to fetch events from database");
    }
  }

  async getEventById(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }

  async updateEvent(id: number, updateEvent: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updatedEvent] = await db
      .update(events)
      .set({ ...updateEvent, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Student methods
  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(desc(students.createdAt));
  }

  async getStudentsByDepartmentAndYear(branch?: string, year?: number, batch?: string): Promise<Student[]> {
    let conditions = [];
    
    // Apply filters if provided
    if (branch) {
      conditions.push(eq(students.branch, branch));
    }
    if (year) {
      conditions.push(eq(students.year, year));
    }
    if (batch) {
      conditions.push(eq(students.batch, batch));
    }
    
    let query = db.select().from(students);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Order by branch, year, batch, and rollNumber for proper organization
    return await query.orderBy(asc(students.branch), asc(students.year), asc(students.batch), asc(students.rollNumber));
  }

  async getStudentById(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getStudentByRollNumber(rollNumber: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.rollNumber, rollNumber));
    return student || undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    try {
      console.log("=== STORAGE CREATE STUDENT ===");
      console.log("Input data:", insertStudent);
      
      const [student] = await db
        .insert(students)
        .values(insertStudent)
        .returning();
      
      console.log("Created student:", student);
      return student;
    } catch (error: any) {
      console.error("=== DATABASE ERROR ===");
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error detail:", error.detail);
      console.error("Error constraint:", error.constraint);
      console.error("Full error:", error);
      
      if (error.code === '23505') {
        // Unique constraint violation
        if (error.constraint === 'students_roll_number_key') {
          throw new Error("Roll number already exists");
        }
      }
      throw error;
    }
  }

  async updateStudent(id: number, updateStudent: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updatedStudent] = await db
      .update(students)
      .set({ ...updateStudent, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updatedStudent || undefined;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Alumni methods
  async getAllAlumni(): Promise<Alumni[]> {
    return await db.select().from(alumni).orderBy(desc(alumni.createdAt));
  }

  async createAlumni(insertAlumni: InsertAlumni): Promise<Alumni> {
    const [alumniRecord] = await db
      .insert(alumni)
      .values(insertAlumni)
      .returning();
    return alumniRecord;
  }

  async updateAlumni(id: number, updateAlumni: Partial<InsertAlumni>): Promise<Alumni | undefined> {
    const [updatedAlumni] = await db
      .update(alumni)
      .set(updateAlumni)
      .where(eq(alumni.id, id))
      .returning();
    return updatedAlumni || undefined;
  }

  async deleteAlumni(id: number): Promise<boolean> {
    const result = await db.delete(alumni).where(eq(alumni.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Attendance methods
  async getAllAttendance(): Promise<Attendance[]> {
    return await db.select().from(attendance).orderBy(desc(attendance.markedAt));
  }

  async getAttendanceByEvent(eventId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.eventId, eventId));
  }

  async markAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [attendanceRecord] = await db
      .insert(attendance)
      .values(insertAttendance)
      .returning();
    return attendanceRecord;
  }

  async updateAttendance(id: number, updateAttendance: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const [updatedAttendance] = await db
      .update(attendance)
      .set(updateAttendance)
      .where(eq(attendance.id, id))
      .returning();
    return updatedAttendance || undefined;
  }

  // Hero Notifications CRUD
  async getAllHeroNotifications(): Promise<HeroNotification[]> {
    return await db.select().from(heroNotifications).orderBy(desc(heroNotifications.createdAt));
  }
  async getHeroNotificationById(id: number): Promise<HeroNotification | undefined> {
    const [item] = await db.select().from(heroNotifications).where(eq(heroNotifications.id, id));
    return item || undefined;
  }
  async createHeroNotification(data: InsertHeroNotification): Promise<HeroNotification> {
    const [item] = await db.insert(heroNotifications).values(data).returning();
    return item;
  }
  async updateHeroNotification(id: number, data: Partial<InsertHeroNotification>): Promise<HeroNotification | undefined> {
    const [item] = await db.update(heroNotifications).set({ ...data, updatedAt: new Date() }).where(eq(heroNotifications.id, id)).returning();
    return item || undefined;
  }
  async deleteHeroNotification(id: number): Promise<boolean> {
    const result = await db.delete(heroNotifications).where(eq(heroNotifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Important Notifications CRUD
  async getAllImportantNotifications(): Promise<ImportantNotification[]> {
    return await db.select().from(importantNotifications).orderBy(desc(importantNotifications.createdAt));
  }
  async getImportantNotificationById(id: number): Promise<ImportantNotification | undefined> {
    const [item] = await db.select().from(importantNotifications).where(eq(importantNotifications.id, id));
    return item || undefined;
  }
  async createImportantNotification(data: InsertImportantNotification): Promise<ImportantNotification> {
    const [item] = await db.insert(importantNotifications).values(data).returning();
    return item;
  }
  async updateImportantNotification(id: number, data: Partial<InsertImportantNotification>): Promise<ImportantNotification | undefined> {
    const [item] = await db.update(importantNotifications).set({ ...data, updatedAt: new Date() }).where(eq(importantNotifications.id, id)).returning();
    return item || undefined;
  }
  async deleteImportantNotification(id: number): Promise<boolean> {
    const result = await db.delete(importantNotifications).where(eq(importantNotifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getPlacementStats(): Promise<{ studentsPlaced: number; activeCompanies: number; avgPackage: number; highestPackage: number; }> {
    const students = await this.getAllStudents();
    const placed = students.filter(s => s.selected);
    const studentsPlaced = placed.length;
    const activeCompanies = new Set(placed.map(s => s.companyName).filter(Boolean)).size;
    // If you have a package field, use it. Otherwise, set avgPackage and highestPackage to 0.
    const packages = placed.map(s => (s as any).package).filter((p: any) => typeof p === 'number');
    const avgPackage = packages.length > 0 ? (packages.reduce((a, b) => a + b, 0) / packages.length) : 0;
    const highestPackage = packages.length > 0 ? Math.max(...packages) : 0;
    return { studentsPlaced, activeCompanies, avgPackage, highestPackage };
  }

  async getRecentPlacements(): Promise<{ studentName: string; company: string; role: string; }[]> {
    const students = await this.getAllStudents();
    const placed = students.filter(s => s.selected);
    // Sort by updatedAt or createdAt desc
    placed.sort((a, b) => {
      const aDate = a.updatedAt || a.createdAt;
      const bDate = b.updatedAt || b.createdAt;
      return (bDate?.getTime?.() || 0) - (aDate?.getTime?.() || 0);
    });
    return placed.slice(0, 5).map(s => ({
      studentName: s.name,
      company: s.companyName || '',
      role: (s as any).role || ''
    }));
  }
}

export const storage = new DatabaseStorage();