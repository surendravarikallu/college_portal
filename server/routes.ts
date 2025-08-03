import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import rateLimit from "express-rate-limit";
import { 
  insertUserSchema, insertNewsSchema, insertEventSchema, insertStudentSchema, 
  insertAlumniSchema, insertAttendanceSchema, insertHeroNotificationSchema, insertImportantNotificationSchema 
} from "@shared/schema";
import { validateFileUpload, validateInput, validateRequest, securityRateLimit } from "./security";
import { csrfProtection, csrfTokenMiddleware } from "./csrf";
import { requirePermission, requireRole, Permissions } from "./rbac";
import { auditLog, logSecurityEvent } from "./audit";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper function to parse CSV lines with proper handling of quoted values
const parseCSVLine = (line: string) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  // Remove quotes from the beginning and end of each field
  return result.map(field => {
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1);
    }
    return field;
  });
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export function registerRoutes(app: Express): Server {
  // Rate limiting
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Setup authentication routes
  setupAuth(app);

  // Admin management routes
  app.get("/api/admins", 
    requireRole(['admin', 'tpo']), // Allow both admin and tpo roles
    auditLog('VIEW', 'ADMINS'),
    async (req, res) => {
      try {
        const admins = await storage.getAllUsers();
        res.json(admins);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch admins" });
      }
    }
  );



  app.post("/api/admins", 
    apiLimiter,
    requireRole(['admin', 'tpo']), // Allow both admin and tpo roles
    // csrfProtection, // Temporarily disabled for testing
    validateRequest,
    auditLog('CREATE', 'ADMIN'),
    async (req, res) => {
      try {
        const validatedData = insertUserSchema.parse(req.body);
        
        // Hash the password before saving
        const { hashPassword } = await import('./auth');
        const hashedPassword = await hashPassword(validatedData.password);
        
        const admin = await storage.createUser({
          ...validatedData,
          password: hashedPassword
        });
        
        res.status(201).json(admin);
      } catch (error: any) {
        console.error("=== Admin Creation Error ===");
        console.error("Request body:", req.body);
        console.error("Error type:", error.constructor.name);
        console.error("Error message:", error.message);
        
        if (error && error.errors) {
          console.error("Zod validation error (admin):", error.errors);
          res.status(400).json({ message: "Invalid admin data", details: error.errors });
        } else {
          console.error("Non-Zod error:", error);
          res.status(400).json({ message: "Invalid admin data", error: error.message });
        }
      }
    }
  );

  app.delete("/api/admins/:id", 
    requireRole(['admin', 'tpo']), // Allow both admin and tpo roles
    // csrfProtection, // Temporarily disabled for testing
    auditLog('DELETE', 'ADMIN'),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteUser(id);
        
        if (!success) {
          return res.status(404).json({ message: "Admin not found" });
        }
        
        res.sendStatus(204);
      } catch (error) {
        res.status(500).json({ message: "Failed to delete admin" });
      }
    }
  );

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    // Add authentication check for file access if needed
    next();
  }, (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });

  // News routes
  app.get("/api/news", async (req, res) => {
    try {
      const newsItems = await storage.getAllNews();
      res.json(newsItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.post("/api/news", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertNewsSchema.parse(req.body);
      const newsItem = await storage.createNews(validatedData);
      res.status(201).json(newsItem);
    } catch (error: any) {
      if (error && error.errors) {
        console.error("Zod validation error (news):", error.errors);
        res.status(400).json({ message: "Invalid news data", details: error.errors });
      } else {
        res.status(400).json({ message: "Invalid news data" });
      }
    }
  });

  app.put("/api/news/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const allowedFields = ["title", "content"];
      const updateData: Record<string, any> = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined && req.body[key] !== null) {
          updateData[key] = req.body[key];
        }
      }
      const validatedData = insertNewsSchema.partial().parse(updateData);
      const updatedNews = await storage.updateNews(id, validatedData);
      if (!updatedNews) {
        return res.status(404).json({ message: "News not found" });
      }
      res.json(updatedNews);
    } catch (error: any) {
      if (error && error.errors) {
        console.error("Zod validation error (news):", error.errors);
        res.status(400).json({ message: "Invalid news data", details: error.errors });
      } else {
        res.status(400).json({ message: "Invalid news data" });
      }
    }
  });

  app.delete("/api/news/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNews(id);

      if (!success) {
        return res.status(404).json({ message: "News not found" });
      }

      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete news" });
    }
  });

  // Test route to verify routing works
  app.post("/api/test", async (req, res) => {
    console.log("=== BASIC TEST ROUTE ===");
    res.json({ message: "Basic test route working" });
  });

  // Test student creation without any middleware
  app.post("/api/students/create", async (req, res) => {
    console.log("=== SIMPLE STUDENT CREATE ===");
    console.log("Request body:", req.body);

    try {
      const student = await storage.createStudent({
        name: "Test Student",
        rollNumber: "TEST123",
      });
      res.json({ message: "Test student created", student });
    } catch (error) {
      console.error("Test student creation error:", error);
      res.status(500).json({ message: "Test failed", error: error.message });
    }
  });

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      const now = new Date();
      const eventsWithStatus = events.map(event => {
        let status = "upcoming";
        // Ensure dates are properly handled
        const startDate = event.startDate ? new Date(event.startDate) : null;
        const endDate = event.endDate ? new Date(event.endDate) : null;

        if (startDate && endDate) {
          if (startDate <= now && now <= endDate) status = "ongoing";
          else if (endDate < now) status = "past";
        }
        return { ...event, status };
      });
      res.json(eventsWithStatus);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const allowedFields = ["title", "description", "company", "startDate", "endDate", "notificationLink", "attachmentUrl"];
      const eventData: Record<string, any> = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined && req.body[key] !== null && req.body[key] !== "") {
          eventData[key] = req.body[key];
        }
      }
      if (eventData.startDate && typeof eventData.startDate === "string") {
        eventData.startDate = new Date(eventData.startDate);
      }
      if (eventData.endDate && typeof eventData.endDate === "string") {
        eventData.endDate = new Date(eventData.endDate);
      }
      console.log("Event data before validation:", eventData);
      const validatedData = insertEventSchema.parse(eventData);
      console.log("Event data after validation:", validatedData);
      const event = await storage.createEvent(validatedData);
      // Compute status
      const now = new Date();
      let status = "upcoming";
      if (event.startDate <= now && event.endDate >= now) status = "ongoing";
      else if (event.endDate < now) status = "past";
      res.status(201).json({ ...event, status });
    } catch (error: any) {
      if (error && error.errors) {
        console.error("Zod validation error (event):", error.errors);
        res.status(400).json({ message: "Invalid event data", details: error.errors });
      } else {
        console.error("Event creation error:", error);
        res.status(400).json({ message: "Invalid event data" });
      }
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const allowedFields = ["title", "description", "company", "startDate", "endDate", "notificationLink", "attachmentUrl"];
      const updateData: Record<string, any> = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined && req.body[key] !== null) {
          updateData[key] = req.body[key];
        }
      }
      if (updateData.startDate && typeof updateData.startDate === "string") {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate && typeof updateData.endDate === "string") {
        updateData.endDate = new Date(updateData.endDate);
      }
      const validatedData = insertEventSchema.partial().parse(updateData);
      const updatedEvent = await storage.updateEvent(id, validatedData);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      // Compute status
      const now = new Date();
      let status = "upcoming";
      if (updatedEvent.startDate <= now && updatedEvent.endDate >= now) status = "ongoing";
      else if (updatedEvent.endDate < now) status = "past";
      res.json({ ...updatedEvent, status });
    } catch (error: any) {
      if (error && error.errors) {
        console.error("Zod validation error (event):", error.errors);
        res.status(400).json({ message: "Invalid event data", details: error.errors });
      } else {
        res.status(400).json({ message: "Invalid event data" });
      }
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEvent(id);

      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Student routes
  app.get("/api/students", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Test route without file upload
  app.post("/api/students/test", async (req, res) => {
    console.log("=== TEST ROUTE ===");
    console.log("Test route body:", req.body);
    res.json({ message: "Test route working", body: req.body });
  });

  // Test route with authentication but no file upload
  app.post("/api/students/simple", async (req, res) => {
    console.log("=== SIMPLE STUDENT ROUTE ===");
    console.log("Request body:", req.body);

    if (!req.isAuthenticated()) {
      console.log("Authentication failed");
      return res.sendStatus(401);
    }

    console.log("Authentication passed");

    try {
      const studentData = { ...req.body };
      console.log("Student data:", studentData);

      // Test database connection
      const allStudents = await storage.getAllStudents();
      console.log("Database connection test - Current students count:", allStudents.length);

      res.json({ message: "Simple route working", data: studentData });
    } catch (error) {
      console.error("Simple route error:", error);
      res.status(500).json({ message: "Simple route error", error: error.message });
    }
  });

  app.post("/api/students", upload.fields([
    { name: 'offerLetter', maxCount: 1 }
  ]), validateFileUpload, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { name, rollNumber, branch, year, email, phone, selected, companyName, package: packageAmount, role } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Simple validation
      if (!name || !rollNumber) {
        return res.status(400).json({ message: "Name and roll number are required" });
      }

      const studentData: any = {
        name,
        rollNumber,
      };

      // Only add optional fields if they have values
      if (branch) studentData.branch = branch;
      if (year) studentData.year = parseInt(year);
      if (email) studentData.email = email;
      if (phone) studentData.phone = phone;
      if (companyName) studentData.companyName = companyName;
      if (packageAmount) studentData.package = parseInt(packageAmount);
      if (role) studentData.role = role;

      // Handle boolean field
      studentData.selected = selected === true || selected === 'true';

      // Handle offer letter file upload
      if (files.offerLetter && files.offerLetter[0]) {
        const file = files.offerLetter[0];
        const fileName = `offer_${Date.now()}_${file.originalname}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        studentData.offerLetterUrl = `/uploads/${fileName}`;
      }

      console.log("Final student data being sent to database:", studentData);

      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error: any) {
      console.error("Student creation error:", error);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error detail:", error.detail);
      console.error("Full error:", error);

      if (error.message === "Roll number already exists") {
        res.status(400).json({ message: "Roll number already exists" });
      } else {
        res.status(400).json({ message: "Failed to create student", error: error.message });
      }
    }
  });

  app.put("/api/students/:id", upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'offerLetter', maxCount: 1 }
  ]), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { name, rollNumber, branch, year, email, phone, selected, companyName, package: packageAmount, role } = req.body;

      console.log("Update student request body:", req.body);
      console.log("Update student files:", files);

      const studentData: any = {};

      // Only add fields that are provided
      if (name !== undefined) studentData.name = name;
      if (rollNumber !== undefined) studentData.rollNumber = rollNumber;
      if (branch !== undefined) studentData.branch = branch;
      if (year !== undefined) studentData.year = parseInt(year);
      if (email !== undefined) studentData.email = email;
      if (phone !== undefined) studentData.phone = phone;
      if (companyName !== undefined) studentData.companyName = companyName;
      if (packageAmount !== undefined && packageAmount !== "") studentData.package = parseInt(packageAmount);
      if (role !== undefined) studentData.role = role;

      // Handle boolean field
      if (selected !== undefined) {
        studentData.selected = selected === true || selected === 'true';
      }

      // Handle file uploads
      if (files?.photo && files.photo[0]) {
        studentData.photoUrl = `/uploads/${files.photo[0].filename}`;
      }
      if (files?.offerLetter && files.offerLetter[0]) {
        studentData.offerLetterUrl = `/uploads/${files.offerLetter[0].filename}`;
      }

      console.log("Final student update data:", studentData);

      const updatedStudent = await storage.updateStudent(id, studentData);
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(updatedStudent);
    } catch (error: any) {
      console.error("Student update error:", error);
      if (error.message === "Roll number already exists") {
        res.status(400).json({ message: "Roll number already exists" });
      } else {
        res.status(400).json({ message: "Failed to update student", error: error.message });
      }
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStudent(id);

      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Alumni routes
  app.get("/api/alumni", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const alumni = await storage.getAllAlumni();
      res.json(alumni);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alumni" });
    }
  });

  app.post("/api/alumni", async (req, res) => {
    try {
      const validatedData = insertAlumniSchema.parse(req.body);
      const alumni = await storage.createAlumni(validatedData);
      res.status(201).json(alumni);
    } catch (error: any) {
      if (error && error.errors) {
        console.error("Zod validation error (alumni):", error.errors);
        res.status(400).json({ message: "Invalid alumni data", details: error.errors });
      } else {
        res.status(400).json({ message: "Invalid alumni data" });
      }
    }
  });

  app.put("/api/alumni/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const allowedFields = [
        "name", "rollNumber", "passOutYear", "higherEducationCollege", "collegeRollNumber", "address", "contactNumber", "email"
      ];
      const updateData: Record<string, any> = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined && req.body[key] !== null) {
          updateData[key] = req.body[key];
        }
      }
      const validatedData = insertAlumniSchema.partial().parse(updateData);
      const updatedAlumni = await storage.updateAlumni(id, validatedData);
      if (!updatedAlumni) {
        return res.status(404).json({ message: "Alumni not found" });
      }
      res.json(updatedAlumni);
    } catch (error: any) {
      if (error && error.errors) {
        console.error("Zod validation error (alumni):", error.errors);
        res.status(400).json({ message: "Invalid alumni data", details: error.errors });
      } else {
        res.status(400).json({ message: "Invalid alumni data" });
      }
    }
  });

  app.delete("/api/alumni/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAlumni(id);

      if (!success) {
        return res.status(404).json({ message: "Alumni not found" });
      }

      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete alumni" });
    }
  });

  // Placement stats endpoint
  app.get("/api/placements/stats", async (req, res) => {
    try {
      const stats = await storage.getPlacementStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch placement stats" });
    }
  });

  // Recent placements endpoint
  app.get("/api/placements/recent", async (req, res) => {
    try {
      const recent = await storage.getRecentPlacements();
      res.json(recent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent placements" });
    }
  });

  // Attendance routes
  app.get("/api/attendance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const attendanceRecords = await storage.getAllAttendance();
      res.json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.markAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error: any) {
      if (error && error.errors) {
        console.error("Zod validation error (attendance):", error.errors);
        res.status(400).json({ message: "Invalid attendance data", details: error.errors });
      } else {
        res.status(400).json({ message: "Invalid attendance data" });
      }
    }
  });

  app.put("/api/attendance/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const allowedFields = ["eventId", "studentName", "rollNumber", "markedAt"];
      const updateData: Record<string, any> = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined && req.body[key] !== null) {
          updateData[key] = req.body[key];
        }
      }
      const validatedData = insertAttendanceSchema.partial().parse(updateData);
      const updatedAttendance = await storage.updateAttendance(id, validatedData);
      if (!updatedAttendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      res.json(updatedAttendance);
    } catch (error: any) {
      if (error && error.errors) {
        console.error("Zod validation error (attendance):", error.errors);
        res.status(400).json({ message: "Invalid attendance data", details: error.errors });
      } else {
        res.status(400).json({ message: "Invalid attendance data" });
      }
    }
  });

  // Hero Notifications API
  app.get("/api/hero-notifications", async (req, res) => {
    try {
      const items = await storage.getAllHeroNotifications();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hero notifications" });
    }
  });
  app.get("/api/hero-notifications/:id", async (req, res) => {
    try {
      const item = await storage.getHeroNotificationById(Number(req.params.id));
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hero notification" });
    }
  });
  app.post("/api/hero-notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const validated = insertHeroNotificationSchema.parse(req.body);
      const item = await storage.createHeroNotification(validated);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid data", details: error.errors || error });
    }
  });
  app.put("/api/hero-notifications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = Number(req.params.id);
      const validated = insertHeroNotificationSchema.partial().parse(req.body);
      const item = await storage.updateHeroNotification(id, validated);
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid data", details: error.errors || error });
    }
  });
  app.delete("/api/hero-notifications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = Number(req.params.id);
      const ok = await storage.deleteHeroNotification(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete hero notification" });
    }
  });
  // Important Notifications API
  app.get("/api/important-notifications", async (req, res) => {
    try {
      const items = await storage.getAllImportantNotifications();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch important notifications" });
    }
  });
  app.get("/api/important-notifications/:id", async (req, res) => {
    try {
      const item = await storage.getImportantNotificationById(Number(req.params.id));
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch important notification" });
    }
  });
  app.post("/api/important-notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const validated = insertImportantNotificationSchema.parse(req.body);
      const item = await storage.createImportantNotification(validated);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid data", details: error.errors || error });
    }
  });
  app.put("/api/important-notifications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = Number(req.params.id);
      const validated = insertImportantNotificationSchema.partial().parse(req.body);
      const item = await storage.updateImportantNotification(id, validated);
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid data", details: error.errors || error });
    }
  });
  app.delete("/api/important-notifications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = Number(req.params.id);
      const ok = await storage.deleteImportantNotification(id);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete important notification" });
    }
  });

  // Export routes
  app.get("/api/export/students", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { branch, year, batch } = req.query;
      
      let students;
      if (branch || year || batch) {
        // Use filtered query with department, year, and batch organization
        students = await storage.getStudentsByDepartmentAndYear(
          branch as string, 
          year ? parseInt(year as string) : undefined,
          batch as string
        );
      } else {
        // Use default query but still organize by department, year, and batch
        students = await storage.getStudentsByDepartmentAndYear();
      }
      
      // Exclude createdAt and updatedAt fields
      const exportStudents = students.map(({ createdAt, updatedAt, ...rest }) => rest);
      const worksheet = XLSX.utils.json_to_sheet(exportStudents);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

      // Generate filename based on filters
      let filename = "students";
      if (branch) filename += `_${branch}`;
      if (year) filename += `_${year}`;
      if (batch) filename += `_${batch}`;
      filename += ".xlsx";

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to export students" });
    }
  });

  app.get("/api/export/alumni", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const alumni = await storage.getAllAlumni();
      const worksheet = XLSX.utils.json_to_sheet(alumni);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Alumni");

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="alumni.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to export alumni" });
    }
  });

  app.get("/api/export/attendance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const attendance = await storage.getAllAttendance();
      const worksheet = XLSX.utils.json_to_sheet(attendance);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="attendance.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to export attendance" });
    }
  });

  // Import routes
  app.post("/api/import/students", upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded", imported: 0, errors: [] });
      }

      const csvContent = req.file.buffer.toString();
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ 
          success: false, 
          message: "CSV file must have at least a header row and one data row", 
          imported: 0, 
          errors: [] 
        });
      }
      
      const headers = parseCSVLine(lines[0]);
      const data = lines.slice(1);

      let imported = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row.trim()) continue;

        const values = parseCSVLine(row);
        const studentData: any = {};

        headers.forEach((header, index) => {
          const value = values[index] || '';
          // Skip empty values for optional fields
          if (value === '' || value === undefined || value === null) {
            return;
          }
          
          switch (header) {
            case 'name':
            case 'rollNumber':
            case 'branch':
            case 'email':
            case 'phone':
            case 'companyName':
            case 'role':
            case 'photoUrl':
            case 'offerLetterUrl':
            case 'batch':
              studentData[header] = value;
              break;
            case 'year':
              const yearValue = parseInt(value);
              if (!isNaN(yearValue) && yearValue >= 1 && yearValue <= 4) {
                studentData[header] = yearValue;
              } else {
                errors.push(`Row ${i + 2}: Year must be between 1 and 4 (study year)`);
                continue;
              }
              break;
            case 'package':
              const numValue = parseInt(value);
              if (!isNaN(numValue)) {
                studentData[header] = numValue;
              }
              break;
            case 'selected':
              studentData[header] = value.toLowerCase() === 'true';
              break;
          }
        });

        try {
          // Validate required fields
          if (!studentData.name || !studentData.rollNumber) {
            errors.push(`Row ${i + 2}: Name and rollNumber are required fields`);
            continue;
          }
          
          const validatedData = insertStudentSchema.parse(studentData);
          await storage.createStudent(validatedData);
          imported++;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Row ${i + 2}: ${errorMessage}`);
        }
      }

      res.json({
        success: imported > 0,
        message: `Imported ${imported} students successfully${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        imported,
        errors
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, message: "Failed to import students", imported: 0, errors: [errorMessage] });
    }
  });

  app.post("/api/import/events", upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded", imported: 0, errors: [] });
      }

      const csvContent = req.file.buffer.toString();
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = parseCSVLine(lines[0]);
      const data = lines.slice(1);

      let imported = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row.trim()) continue;

        const values = parseCSVLine(row);
        const eventData: any = {};

        headers.forEach((header, index) => {
          const value = values[index] || '';
          // Skip empty values for optional fields
          if (value === '' || value === undefined || value === null) {
            return;
          }
          
          switch (header) {
            case 'title':
            case 'description':
            case 'company':
            case 'notificationLink':
            case 'attachmentUrl':
              eventData[header] = value;
              break;
            case 'startDate':
              eventData.startDate = value;
              break;
            case 'endDate':
              eventData.endDate = value;
              break;
          }
        });

        try {
          // Validate required fields
          if (!eventData.title || !eventData.description || !eventData.company || !eventData.startDate || !eventData.endDate) {
            errors.push(`Row ${i + 2}: title, description, company, startDate, and endDate are required fields`);
            continue;
          }
          
          const validatedData = insertEventSchema.parse(eventData);
          await storage.createEvent(validatedData);
          imported++;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Row ${i + 2}: ${errorMessage}`);
        }
      }

      res.json({
        success: imported > 0,
        message: `Imported ${imported} events successfully${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        imported,
        errors
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, message: "Failed to import events", imported: 0, errors: [errorMessage] });
    }
  });

  app.post("/api/import/alumni", upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded", imported: 0, errors: [] });
      }

      const csvContent = req.file.buffer.toString();
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = parseCSVLine(lines[0]);
      const data = lines.slice(1);

      let imported = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row.trim()) continue;

        const values = parseCSVLine(row);
        const alumniData: any = {};

        headers.forEach((header, index) => {
          const value = values[index] || '';
          // Skip empty values for optional fields
          if (value === '' || value === undefined || value === null) {
            return;
          }
          
          switch (header) {
            case 'name':
            case 'rollNumber':
            case 'higherEducationCollege':
            case 'collegeRollNumber':
            case 'address':
            case 'contactNumber':
            case 'email':
              alumniData[header] = value;
              break;
            case 'passOutYear':
              const numValue = parseInt(value);
              if (!isNaN(numValue)) {
                alumniData[header] = numValue;
              }
              break;
          }
        });

        try {
          // Validate required fields
          if (!alumniData.name || !alumniData.rollNumber || !alumniData.passOutYear || !alumniData.address || !alumniData.contactNumber || !alumniData.email) {
            errors.push(`Row ${i + 2}: name, rollNumber, passOutYear, address, contactNumber, and email are required fields`);
            continue;
          }
          
          const validatedData = insertAlumniSchema.parse(alumniData);
          await storage.createAlumni(validatedData);
          imported++;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Row ${i + 2}: ${errorMessage}`);
        }
      }

      res.json({
        success: imported > 0,
        message: `Imported ${imported} alumni successfully${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        imported,
        errors
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, message: "Failed to import alumni", imported: 0, errors: [errorMessage] });
    }
  });

  app.post("/api/import/attendance", upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded", imported: 0, errors: [] });
      }

      const csvContent = req.file.buffer.toString();
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = parseCSVLine(lines[0]);
      const data = lines.slice(1);

      let imported = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row.trim()) continue;

        const values = parseCSVLine(row);
        const attendanceData: any = {};

        headers.forEach((header, index) => {
          const value = values[index] || '';
          // Skip empty values for optional fields
          if (value === '' || value === undefined || value === null) {
            return;
          }
          
          switch (header) {
            case 'studentName':
            case 'rollNumber':
            case 'branch':
              attendanceData[header] = value;
              break;
            case 'eventId':
            case 'year':
              const numValue = parseInt(value);
              if (!isNaN(numValue)) {
                attendanceData[header] = numValue;
              }
              break;
          }
        });

        try {
          // Validate required fields
          if (!attendanceData.studentName || !attendanceData.rollNumber) {
            errors.push(`Row ${i + 2}: studentName and rollNumber are required fields`);
            continue;
          }
          
          const validatedData = insertAttendanceSchema.parse(attendanceData);
          await storage.markAttendance(validatedData);
          imported++;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Row ${i + 2}: ${errorMessage}`);
        }
      }

      res.json({
        success: imported > 0,
        message: `Imported ${imported} attendance records successfully${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        imported,
        errors
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, message: "Failed to import attendance", imported: 0, errors: [errorMessage] });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}