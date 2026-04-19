#!/usr/bin/env node
/**
 * Applies SQL migrations in db/migrations/ in lexicographical order.
 *
 * Tracks applied migrations in a `_migrations` table so re-running the
 * script is safe. Each migration is expected to be self-contained
 * (its own BEGIN/COMMIT).
 *
 * Usage:
 *   DATABASE_URL=... node scripts/migrate.mjs
 */

import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "db", "migrations");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      name        text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )
  `;
}

async function getApplied() {
  const rows = await sql`SELECT name FROM _migrations`;
  return new Set(rows.map((row) => row.name));
}

async function main() {
  await ensureTable();
  const applied = await getApplied();

  const files = (await readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migrations found.");
    return;
  }

  for (const name of files) {
    if (applied.has(name)) {
      console.log(`✓ ${name} (already applied)`);
      continue;
    }

    const path = join(migrationsDir, name);
    const body = await readFile(path, "utf8");

    console.log(`→ applying ${name}`);
    // Neon's tagged-template driver requires a helper to run raw SQL:
    await sql.query(body);
    await sql`INSERT INTO _migrations (name) VALUES (${name})`;
    console.log(`✓ ${name}`);
  }

  console.log("Migrations complete.");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
