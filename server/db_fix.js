// Simplified database connection with column name mapping
import { Pool } from 'pg';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper to convert camelCase to snake_case for consistent column mapping
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// Helper to map result rows to camelCase property names
function mapRowsToCamelCase(rows) {
  return rows.map(row => {
    const newRow = {};
    Object.keys(row).forEach(key => {
      newRow[toCamelCase(key)] = row[key];
    });
    return newRow;
  });
}

// Export a query function that handles column name mapping
export async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    // Map column names to camelCase for result rows
    if (result.rows) {
      result.rows = mapRowsToCamelCase(result.rows);
    }
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Export the pool for direct use when needed
export { pool };
