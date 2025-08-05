import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import rateLimit from "express-rate-limit";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function createDefaultUsers() {
  try {
    // Test database connection first
    await storage.testConnection();
    
    // Create default TPO user
    const existingTpoUser = await storage.getUserByUsername("tpo_admin");
    if (!existingTpoUser) {
      const defaultTpoUser = {
        username: "tpo_admin",
        name: "TPO Administrator",
        password: await hashPassword("admin123"),
        role: "tpo"
      };
      await storage.createUser(defaultTpoUser);
      console.log("Default TPO user created: username=tpo_admin, password=admin123");
    } else {
      // Update existing user to have name field if missing
      if (!existingTpoUser.name) {
        await storage.updateUserByName("tpo_admin", "TPO Administrator");
        console.log("Updated existing TPO user with name field");
      } else {
        console.log("Default TPO user already exists with name");
      }
    }

    // Create default Admin user
    const existingAdminUser = await storage.getUserByUsername("admin");
    if (!existingAdminUser) {
      const defaultAdminUser = {
        username: "admin",
        name: "System Administrator",
        password: await hashPassword("admin123"),
        role: "admin"
      };
      await storage.createUser(defaultAdminUser);
      console.log("Default Admin user created: username=admin, password=admin123");
    } else {
      console.log("Default Admin user already exists");
    }
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error("Database connection failed. Please check your DATABASE_URL in .env file:");
      console.error("- Ensure PostgreSQL is running on your local machine");
      console.error("- Verify the connection string format: postgresql://username:password@host:port/database");
      console.error("- Make sure the database 'tpo_portal' exists");
    } else {
      console.error("Error creating default user:", error.message);
    }
  }
}

export function setupAuth(app: Express) {
  // Rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'development-secret-key',
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to false for development
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' as const,
    },
    name: 'sessionId',
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Create default users if they don't exist
  createDefaultUsers();

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(null, false);
    }
  });

  app.post("/api/register", authLimiter, async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", authLimiter, passport.authenticate("local"), (req, res) => {
    // Force session save
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Session save failed" });
      }
      res.status(200).json(req.user);
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Test session endpoint
  app.get("/api/test-session", (req, res) => {
    res.json({ 
      sessionId: req.sessionID,
      sessionExists: !!req.session,
      sessionData: req.session,
      cookies: req.headers.cookie
    });
  });

  // Clear all sessions (for schema updates)
  app.post("/api/clear-sessions", async (req, res) => {
    try {
      await storage.sessionStore.clear();
      res.json({ message: "All sessions cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear sessions" });
    }
  });
}
