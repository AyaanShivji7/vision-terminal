import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in .env.local");
}

export const sql = neon(process.env.DATABASE_URL);