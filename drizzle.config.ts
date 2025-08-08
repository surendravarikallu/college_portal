import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Use single migration file approach for better memory usage
  strict: false,
  // Generate a single migration file
  verbose: false,
  // Disable migration generation to use manual consolidated file
  migrations: {
    disable: true
  }
});
