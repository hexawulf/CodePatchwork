import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from "ws";
import * as schema from '../shared/schema.js';

// Set up for Neon serverless
neonConfig.webSocketConstructor = ws;

async function createTables() {
  console.log('Connecting to database and creating tables...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found in environment variables');
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  try {
    // Create tables explicitly based on our schema
    console.log('Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);
    
    console.log('Creating snippets table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS snippets (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        code TEXT NOT NULL,
        language TEXT NOT NULL,
        tags TEXT[],
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        view_count INTEGER DEFAULT 0,
        is_favorite BOOLEAN DEFAULT FALSE
      );
    `);
    
    console.log('Creating collections table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    console.log('Creating collection_items table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS collection_items (
        id SERIAL PRIMARY KEY,
        collection_id INTEGER NOT NULL,
        snippet_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    console.log('Tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTables();