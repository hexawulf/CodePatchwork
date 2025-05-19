import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Add event listeners for connection issues
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Test the connection immediately
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Initial database connection test: SUCCESS');
    const result = await client.query('SELECT NOW() as time');
    console.log('✅ Database server time:', result.rows[0].time);
    
    // Test the tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log('✅ Available tables:', tables.rows.map(r => r.table_name).join(', '));
    
    client.release();
  } catch (error) {
    console.error('❌ Initial database connection test: FAILED', error);
  }
})();

// Create a drizzle instance using the pool
export const db = drizzle(pool, { schema });

// Create a simple query wrapper for direct SQL queries
export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Error executing query', { text, duration, error });
    throw error;
  }
}
