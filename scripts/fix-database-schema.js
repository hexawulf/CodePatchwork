#!/usr/bin/env node

const { drizzle } = require('drizzle-orm/neon-serverless');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const { sql } = require('drizzle-orm');

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

async function fixDatabaseSchema() {
  console.log('🛠️ Starting database schema fix...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Create a connection pool
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    // Check if users table exists
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const userTableExists = tables.some(row => row.table_name === 'users');
    
    if (userTableExists) {
      // Check if the 'email' column exists in the users table
      const columnsResult = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
      `);
      
      const columns = columnsResult.map(row => row.column_name);
      
      if (!columns.includes('email')) {
        console.log('Adding email column to users table...');
        await db.execute(sql`
          ALTER TABLE users 
          ADD COLUMN email TEXT UNIQUE
        `);
        console.log('Added email column to users table.');
      } else {
        console.log('Email column already exists in users table.');
      }
    }

    console.log('✅ Database schema fix completed successfully!');
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixDatabaseSchema()
  .then(() => {
    console.log('Database schema update completed.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to update database schema:', err);
    process.exit(1);
  });