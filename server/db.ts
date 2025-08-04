import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set!");
  console.log("🔧 To fix this:");
  console.log("   1. Go to the Database tab in Replit");
  console.log("   2. Click 'Create a database'");
  console.log("   3. This will set up the DATABASE_URL automatically");
  process.exit(1);
}

console.log("Connecting to database:", process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@'));

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

// Test the connection
pool.on('error', (err) => {
  console.error('❌ Database pool error:', err);
});

// Test connection on startup
pool.connect()
  .then(client => {
    console.log("✅ Database connected successfully");
    client.release();
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err.message);
    console.log("🔧 Please set up PostgreSQL database in Replit's Database tab");
  });

export const db = drizzle({ client: pool, schema });