import { pool } from './db';
import { DatabaseStorage } from './storage';

async function testDatabaseStorage() {
  console.log('Testing DatabaseStorage...');
  const storage = new DatabaseStorage();
  
  try {
    console.log('Testing getSnippets()...');
    const snippets = await storage.getSnippets();
    console.log(`Found ${snippets.length} snippets`);
    
    console.log('Testing getTags()...');
    const tags = await storage.getTags();
    console.log(`Found ${tags.length} tags: ${tags.join(', ')}`);
    
    console.log('Testing getLanguages()...');
    const languages = await storage.getLanguages();
    console.log(`Found ${languages.length} languages: ${languages.join(', ')}`);
    
    console.log('Testing getCollections()...');
    const collections = await storage.getCollections();
    console.log(`Found ${collections.length} collections`);
    
  } catch (error) {
    console.error('Error testing DatabaseStorage:', error);
  } finally {
    // Close the database connection pool
    await pool.end();
  }
}

// Run the test
testDatabaseStorage();
