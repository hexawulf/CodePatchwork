import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function migrateDatabase() {
  console.log('Starting database migration...');
  
  try {
    // Add share_id column to snippets table
    console.log('Adding share_id column to snippets table...');
    await db.execute(sql`
      ALTER TABLE snippets
      ADD COLUMN IF NOT EXISTS share_id TEXT UNIQUE
    `);
    
    // Add is_public column to snippets table
    console.log('Adding is_public column to snippets table...');
    await db.execute(sql`
      ALTER TABLE snippets
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE
    `);
    
    // Create comments table
    console.log('Creating comments table if it does not exist...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        snippet_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_email TEXT,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateDatabase();