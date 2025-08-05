import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import rateLimit from "express-rate-limit";
import { 
  insertUserSchema, insertNewsSchema, insertEventSchema, insertStudentSchema, 
  insertAlumniSchema, insertAttendanceSchema, insertHeroNotificationSchema, insertImportantNotificationSchema, insertPlacementStuffSchema 
} from "@shared/schema";
import { validateFileUpload, validateInput, validateRequest, securityRateLimit } from "./security";
import { csrfProtection, csrfTokenMiddleware } from "./csrf";
import { requirePermission, requireRole, Permissions } from "./rbac";
import { auditLog, logSecurityEvent } from "./audit";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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
      res.status(500).json({ message: "Test failed", error: error instanceof Error ? error.message : 'Unknown error' });
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
      const { department, year } = req.query;
      let students = await storage.getAllStudents();
      
      // Filter by department if provided
      if (department) {
        students = students.filter(student => student.branch === department);
      }
      
      // Filter by year if provided
      if (year) {
        const yearNum = parseInt(year as string);
        students = students.filter(student => {
          // Extract end year from batch format "2020-2024" or "2024"
          const batchStr = student.batch || '';
          const match = batchStr.match(/(\d{4})(?:-\d{4})?$/);
          const batchYear = match ? parseInt(match[1]) : null;
          return batchYear === yearNum;
        });
      }
      
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
      res.status(500).json({ message: "Simple route error", error: error instanceof Error ? error.message : 'Unknown error' });
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

  // Department-specific placement statistics export
  app.get("/api/export/placement-stats/:department/:year", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { department, year } = req.params;
      const yearNum = parseInt(year);
      
      if (isNaN(yearNum)) {
        return res.status(400).json({ message: "Invalid year parameter" });
      }

      // Get students for the specific department and year
      const students = await storage.getStudentsByDepartmentAndYear(department, yearNum);
      
      // Calculate placement statistics
      const totalStudents = students.length;
      const placedStudents = students.filter(s => s.selected).length;
      const unplacedStudents = totalStudents - placedStudents;
      const placementRate = totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(2) : '0';
      
      const packages = students
        .filter(s => s.selected && s.package)
        .map(s => s.package!)
        .sort((a, b) => b - a);
      
      const avgPackage = packages.length > 0 
        ? (packages.reduce((sum, pkg) => sum + pkg, 0) / packages.length).toFixed(2)
        : '0';
      
      const highestPackage = packages.length > 0 ? packages[0] : 0;
      const lowestPackage = packages.length > 0 ? packages[packages.length - 1] : 0;

      // Get company-wise statistics
      const companyStats = students
        .filter(s => s.selected && s.companyName)
        .reduce((acc, student) => {
          const company = student.companyName!;
          if (!acc[company]) {
            acc[company] = { count: 0, packages: [], roles: [] };
          }
          acc[company].count++;
          if (student.package) acc[company].packages.push(student.package);
          if (student.role) acc[company].roles.push(student.role);
          return acc;
        }, {} as Record<string, { count: number; packages: number[]; roles: string[] }>);

      // Get current date and year
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const currentYear = new Date().getFullYear();

      // Generate professional HTML report content
      const reportContent = `
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #1f2937; font-size: 28px; margin-bottom: 10px;">${department} Department Placement Statistics Report</h1>
          <p style="color: #6b7280; font-size: 14px;">Generated on ${currentDate}</p>
          <p style="color: #6b7280; font-size: 12px;">Academic Year: ${currentYear} | Batch Year: ${year}</p>
        </div>
        
        <div style="margin-bottom: 30px; background-color: #f8fafc; padding: 20px; border-radius: 8px;">
          <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">Executive Summary</h2>
          <p style="color: #4b5563; line-height: 1.8; margin-bottom: 15px;">
            This comprehensive placement report provides detailed analysis of student placement outcomes for the ${department} department, 
            including statistical breakdowns, trend analysis, and performance metrics. The report serves as a strategic document 
            for understanding placement effectiveness and identifying areas for improvement within the department.
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px;">
              <h3 style="color: #1e40af; margin-bottom: 10px;">Overall Performance</h3>
              <p style="color: #1e40af; font-size: 14px;">Total Students: <strong>${totalStudents}</strong></p>
              <p style="color: #1e40af; font-size: 14px;">Placement Rate: <strong>${placementRate}%</strong></p>
            </div>
            <div style="background-color: #dcfce7; padding: 15px; border-radius: 6px;">
              <h3 style="color: #166534; margin-bottom: 10px;">Package Analysis</h3>
              <p style="color: #166534; font-size: 14px;">Average Package: <strong>₹${avgPackage} LPA</strong></p>
              <p style="color: #166534; font-size: 14px;">Highest Package: <strong>₹${highestPackage} LPA</strong></p>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Detailed Key Metrics</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
            <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px;">
              <h4 style="color: #92400e; margin-bottom: 8px;">Student Distribution</h4>
              <ul style="color: #92400e; font-size: 13px; line-height: 1.6;">
                <li>Total Students: ${totalStudents}</li>
                <li>Placed Students: ${placedStudents}</li>
                <li>Unplaced Students: ${unplacedStudents}</li>
                <li>Placement Rate: ${placementRate}%</li>
              </ul>
            </div>
            <div style="background-color: #fce7f3; padding: 12px; border-radius: 6px;">
              <h4 style="color: #be185d; margin-bottom: 8px;">Package Statistics</h4>
              <ul style="color: #be185d; font-size: 13px; line-height: 1.6;">
                <li>Average Package: ₹${avgPackage} LPA</li>
                <li>Highest Package: ₹${highestPackage} LPA</li>
                <li>Lowest Package: ₹${lowestPackage} LPA</li>
                <li>Students with Packages: ${packages.length}</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Company-wise Analysis</h2>
          <p style="color: #6b7280; margin-bottom: 15px; font-size: 14px;">
            Detailed breakdown of placement performance by companies, showing total students placed, 
            average packages, and roles offered for each company.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Company</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Students Placed</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Avg Package</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Top Roles</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(companyStats).map(([company, stats]) => {
                const avgPackage = stats.packages.length > 0 ? (stats.packages.reduce((sum, pkg) => sum + pkg, 0) / stats.packages.length).toFixed(1) : 'N/A';
                const topRoles = Array.from(new Set(stats.roles)).slice(0, 3).join(', ') || 'N/A';
                return `
                  <tr>
                    <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 500;">${company}</td>
                    <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${stats.count}</td>
                    <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">₹${avgPackage} LPA</td>
                    <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${topRoles}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Student Details</h2>
          <p style="color: #6b7280; margin-bottom: 15px; font-size: 14px;">
            Complete list of students with their placement status, company details, and package information.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Name</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Roll Number</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Status</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Company</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Package</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Role</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(student => {
                const status = student.selected ? 'Placed' : 'Not Placed';
                const statusColor = student.selected ? '#059669' : '#dc2626';
                const company = student.selected ? (student.companyName || 'N/A') : 'N/A';
                const packageAmount = student.selected ? (student.package ? `₹${student.package} LPA` : 'N/A') : 'N/A';
                const role = student.selected ? (student.role || 'N/A') : 'N/A';
                return `
                  <tr>
                    <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: 500;">${student.name}</td>
                    <td style="border: 1px solid #d1d5db; padding: 10px;">${student.rollNumber}</td>
                    <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center; color: ${statusColor}; font-weight: 500;">${status}</td>
                    <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${company}</td>
                    <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${packageAmount}</td>
                    <td style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">${role}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="margin-bottom: 30px; background-color: #fef2f2; padding: 20px; border-radius: 8px;">
          <h2 style="color: #991b1b; border-bottom: 2px solid #fecaca; padding-bottom: 10px;">Recommendations & Insights</h2>
          <div style="color: #7f1d1d; line-height: 1.8;">
            <h3 style="margin-bottom: 10px;">Key Insights:</h3>
            <ul style="margin-bottom: 15px;">
              <li>Department placement rate of ${placementRate}% indicates ${parseFloat(placementRate) >= 80 ? 'excellent' : parseFloat(placementRate) >= 60 ? 'good' : parseFloat(placementRate) >= 40 ? 'moderate' : 'room for improvement'} performance</li>
              <li>Average package of ₹${avgPackage} LPA reflects the market value of ${department} graduates</li>
              <li>${Object.keys(companyStats).length} companies participated in the placement process for ${department}</li>
              <li>${unplacedStudents} students require additional support and career guidance</li>
            </ul>
            <h3 style="margin-bottom: 10px;">Strategic Recommendations:</h3>
            <ul>
              <li>Focus on skill development programs to improve placement rates</li>
              <li>Strengthen industry partnerships to increase company participation</li>
              <li>Enhance career counseling initiatives for unplaced students</li>
              <li>Implement targeted training programs based on market demands</li>
            </ul>
          </div>
        </div>
      `;

      // Generate PDF using html2canvas and jsPDF (same as export functions)
      try {
        const reportDiv = document.createElement('div');
        reportDiv.style.position = 'absolute';
        reportDiv.style.left = '-9999px';
        reportDiv.style.top = '0';
        reportDiv.style.width = '210mm';
        reportDiv.style.padding = '20mm';
        reportDiv.style.backgroundColor = '#ffffff';
        reportDiv.style.fontFamily = 'Arial, sans-serif';
        reportDiv.style.fontSize = '12px';
        reportDiv.style.lineHeight = '1.4';
        reportDiv.innerHTML = reportContent;
        
        document.body.appendChild(reportDiv);
        
        const canvas = await html2canvas(reportDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        document.body.removeChild(reportDiv);
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        // Set response headers
        res.setHeader('Content-Disposition', `attachment; filename="${department}_placement_report_${year}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');
        
        // Send PDF buffer
        const pdfBuffer = pdf.output('arraybuffer');
        res.send(Buffer.from(pdfBuffer));
        
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        res.status(500).json({ 
          message: "Failed to generate PDF", 
          error: pdfError instanceof Error ? pdfError.message : 'Unknown error'
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to export placement statistics" });
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
                // Skip this row by not setting the year value
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

        // Validate year field after processing all headers
        if (studentData.year !== undefined && (studentData.year < 1 || studentData.year > 4)) {
          errors.push(`Row ${i + 2}: Year must be between 1 and 4 (study year)`);
          continue;
        }

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

  // Placement Stuff API Routes
  app.get("/api/placement-stuff", async (req, res) => {
    try {
      const placementStuff = await storage.getAllPlacementStuff();
      res.json(placementStuff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch placement stuff" });
    }
  });

  app.post("/api/placement-stuff", 
    apiLimiter,
    requireRole(['admin', 'tpo']),
    validateRequest,
    auditLog('CREATE', 'PLACEMENT_STUFF'),
    async (req, res) => {
      try {
        const validatedData = insertPlacementStuffSchema.parse(req.body);
        const placementStuff = await storage.createPlacementStuff(validatedData);
        res.status(201).json(placementStuff);
      } catch (error) {
        if (error instanceof Error) {
          res.status(400).json({ message: error.message });
        } else {
          res.status(500).json({ message: "Failed to create placement stuff" });
        }
      }
    }
  );

  app.put("/api/placement-stuff/:id", 
    apiLimiter,
    requireRole(['admin', 'tpo']),
    validateRequest,
    auditLog('UPDATE', 'PLACEMENT_STUFF'),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid ID" });
        }
        
        const validatedData = insertPlacementStuffSchema.parse(req.body);
        const placementStuff = await storage.updatePlacementStuff(id, validatedData);
        
        if (!placementStuff) {
          return res.status(404).json({ message: "Placement stuff not found" });
        }
        
        res.json(placementStuff);
      } catch (error) {
        if (error instanceof Error) {
          res.status(400).json({ message: error.message });
        } else {
          res.status(500).json({ message: "Failed to update placement stuff" });
        }
      }
    }
  );

  app.delete("/api/placement-stuff/:id", 
    apiLimiter,
    requireRole(['admin', 'tpo']),
    auditLog('DELETE', 'PLACEMENT_STUFF'),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid ID" });
        }
        
        const success = await storage.deletePlacementStuff(id);
        
        if (!success) {
          return res.status(404).json({ message: "Placement stuff not found" });
        }
        
        res.json({ message: "Placement stuff deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete placement stuff" });
      }
    }
  );

  // File upload endpoint for PDFs
  app.post("/api/upload/pdf", 
    upload.single('file'),
    requireRole(['admin', 'tpo']),
    auditLog('UPLOAD', 'PDF_FILE'),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        // Check if file is PDF
        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        if (fileExtension !== '.pdf') {
          return res.status(400).json({ message: "Only PDF files are allowed" });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `placement_${timestamp}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(uploadDir, filename);

        // Write file to uploads directory
        fs.writeFileSync(filePath, req.file.buffer);

        // Return the web-accessible URL
        const fileUrl = `/uploads/${filename}`;
        
        res.json({ 
          success: true, 
          message: "PDF uploaded successfully",
          fileUrl: fileUrl,
          filename: filename
        });
      } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: "Failed to upload PDF file" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}