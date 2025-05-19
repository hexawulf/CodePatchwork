const { Pool } = require('pg');

// Use the same connection string as your application
const pool = new Pool({
  connectionString: 'postgresql://codepatchwork_user:1S1HwpTVdmilD8tNeGmI@localhost:5432/codepatchwork'
});

async function testConnection() {
  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    
    // Test querying the snippets table
    const snippetsResult = await client.query('SELECT COUNT(*) FROM snippets');
    console.log('Snippets count:', snippetsResult.rows[0].count);
    
    // Test querying the tags table
    const tagsResult = await client.query('SELECT COUNT(*) FROM tags');
    console.log('Tags count:', tagsResult.rows[0].count);
    
    // Test querying the collections table
    const collectionsResult = await client.query('SELECT COUNT(*) FROM collections');
    console.log('Collections count:', collectionsResult.rows[0].count);
    
    client.release();
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    pool.end();
  }
}

testConnection();
