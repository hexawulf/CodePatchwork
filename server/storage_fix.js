// This is a simplified database storage implementation that works with lowercase column names
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Sample implementation for a basic snippet retrieval
async function getSnippets() {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        description, 
        code, 
        language, 
        tags, 
        userid as "userId", 
        createdat as "createdAt", 
        updatedat as "updatedAt", 
        viewcount as "viewCount", 
        isfavorite as "isFavorite", 
        shareid as "shareId", 
        ispublic as "isPublic"
      FROM snippets
      ORDER BY createdat DESC
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error retrieving snippets:', error);
    throw error;
  }
}

// You can test this function
getSnippets()
  .then(snippets => {
    console.log(`Retrieved ${snippets.length} snippets`);
    console.log('First snippet:', snippets[0]);
  })
  .catch(err => {
    console.error('Error:', err);
  })
  .finally(() => {
    pool.end();
  });
