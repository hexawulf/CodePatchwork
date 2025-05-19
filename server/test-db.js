import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://codepatchwork_user:1S1HwpTVdmilD8tNeGmI@localhost:5432/codepatchwork';
console.log("Using connection string:", connectionString.replace(/:[^:]*@/, ':***@')); // Hide password in logs

const pool = new Pool({ connectionString });

async function testDatabase() {
  console.log("Testing database connection...");
  let client;
  
  try {
    client = await pool.connect();
    console.log("✅ Successfully connected to database!");
    
    // Basic query test
    const timeResult = await client.query('SELECT NOW() as time');
    console.log("✅ Database time:", timeResult.rows[0].time);
    
    // List tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log("\nTables in database:");
    if (tablesResult.rows.length === 0) {
      console.log("❌ No tables found in public schema!");
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
    // Try queries on specific tables
    try {
      const snippetsResult = await client.query('SELECT COUNT(*) FROM snippets');
      console.log(`✅ Found ${snippetsResult.rows[0].count} records in snippets table`);
    } catch (e) {
      console.log(`❌ Error querying snippets table: ${e.message}`);
    }
    
    try {
      const tagsResult = await client.query('SELECT COUNT(*) FROM tags');
      console.log(`✅ Found ${tagsResult.rows[0].count} records in tags table`);
    } catch (e) {
      console.log(`❌ Error querying tags table: ${e.message}`);
    }
    
    try {
      const collectionsResult = await client.query('SELECT COUNT(*) FROM collections');
      console.log(`✅ Found ${collectionsResult.rows[0].count} records in collections table`);
    } catch (e) {
      console.log(`❌ Error querying collections table: ${e.message}`);
    }
    
    // Check users table
    try {
      const usersResult = await client.query('SELECT COUNT(*) FROM users');
      console.log(`✅ Found ${usersResult.rows[0].count} records in users table`);
      
      if (usersResult.rows[0].count > 0) {
        // Check column types for the first user
        const userColumns = await client.query('SELECT * FROM users LIMIT 1');
        console.log("\nUser table structure:");
        Object.entries(userColumns.rows[0]).forEach(([key, value]) => {
          console.log(`- ${key}: ${typeof value} (${value === null ? 'null' : value})`);
        });
      }
    } catch (e) {
      console.log(`❌ Error querying users table: ${e.message}`);
    }
    
  } catch (connectionError) {
    console.error("❌ Failed to connect to database:", connectionError);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Run the test
testDatabase();
