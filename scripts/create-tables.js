import pg from "pg";

const { Pool } = pg;

async function createTables() {
  console.log("Connecting to PostgreSQL and ensuring tables exist...");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not found in environment variables");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY,
        email TEXT UNIQUE,
        display_name TEXT,
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS snippets (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        code TEXT NOT NULL,
        language TEXT NOT NULL,
        tags TEXT[],
        userid TEXT,
        createdat TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updatedat TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        viewcount INTEGER DEFAULT 0,
        isfavorite BOOLEAN DEFAULT FALSE,
        shareid TEXT UNIQUE,
        ispublic BOOLEAN DEFAULT FALSE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        userid TEXT,
        createdat TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updatedat TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "collectionItems" (
        id SERIAL PRIMARY KEY,
        collectionid INTEGER NOT NULL,
        snippetid INTEGER NOT NULL,
        createdat TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        snippetid INTEGER NOT NULL,
        content TEXT NOT NULL,
        userid TEXT,
        createdat TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updatedat TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);

    console.log("Tables created successfully.");
  } catch (error) {
    console.error("Error creating tables:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTables();
