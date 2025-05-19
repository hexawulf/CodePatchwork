import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

console.log('DATABASE_URL from env:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function test() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    const result = await client.query('SELECT COUNT(*) FROM snippets');
    console.log('Snippets count:', result.rows[0].count);
    client.release();
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await pool.end();
  }
}

test();
