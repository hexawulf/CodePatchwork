import { config } from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

// Load environment variables
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Successfully connected to PostgreSQL!');
    console.log('Current time from database:', res.rows[0].now);
  }
  pool.end();
});
