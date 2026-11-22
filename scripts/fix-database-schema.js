#!/usr/bin/env node

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

const { Pool } = pg;

async function fixDatabaseSchema() {
  console.log("Starting database schema check...");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    const userTableExists = tables.rows.some((row) => row.table_name === "users");

    if (userTableExists) {
      const columnsResult = await db.execute(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users' AND table_schema = 'public'
      `);

      const columns = columnsResult.rows.map((row) => row.column_name);

      if (!columns.includes("email")) {
        console.log("Adding email column to users table...");
        await db.execute(sql`ALTER TABLE users ADD COLUMN email TEXT UNIQUE`);
      } else {
        console.log("Email column already exists in users table.");
      }
    }

    console.log("Database schema check completed.");
  } finally {
    await pool.end();
  }
}

fixDatabaseSchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to check database schema:", err);
    process.exit(1);
  });
