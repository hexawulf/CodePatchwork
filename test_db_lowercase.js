// Direct database test with lowercase column names
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://codepatchwork_user:1S1HwpTVdmilD8tNeGmI@localhost:5432/codepatchwork'
});

async function testLowercaseQueries() {
  const client = await pool.connect();
  try {
    console.log('Connected to database successfully');
    
    // Test snippets table with lowercase column names
    console.log('Testing snippets table:');
    const snippetsResult = await client.query('SELECT COUNT(*) FROM snippets');
    console.log(`- Found ${snippetsResult.rows[0].count} snippets`);
    
    const snippetsSample = await client.query('SELECT id, title, language, userid, createdat, updatedat FROM snippets LIMIT 3');
    console.log('- Sample snippets:', JSON.stringify(snippetsSample.rows, null, 2));
    
    // Test collectionItems table
    console.log('\nTesting collectionItems table:');
    try {
      const collectionItemsResult = await client.query('SELECT COUNT(*) FROM "collectionItems"');
      console.log(`- Found ${collectionItemsResult.rows[0].count} collection items`);
      
      const columnInfo = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'collectionItems'
      `);
      console.log('- Column information:', columnInfo.rows);
    } catch (err) {
      console.error('- Error testing collectionItems:', err.message);
    }
    
  } catch (err) {
    console.error('Database test error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

testLowercaseQueries();
