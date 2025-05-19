import { query, pool } from './db';

class SimpleStorage {
  async getSnippets(filters?: any): Promise<any[]> {
    try {
      console.log('SimpleStorage: Getting snippets with filters:', filters);
      
      // Simple implementation without filters for debugging
      const result = await query('SELECT * FROM snippets ORDER BY id DESC', []);
      console.log(`SimpleStorage: Found ${result.rows.length} snippets`);
      
      return result.rows;
    } catch (error) {
      console.error('SimpleStorage: Error getting snippets:', error);
      throw error;
    }
  }
  
  async getSnippet(id: number): Promise<any> {
    try {
      console.log('SimpleStorage: Getting snippet by id:', id);
      
      const result = await query('SELECT * FROM snippets WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        console.log(`SimpleStorage: No snippet found with id ${id}`);
        return null;
      }
      
      console.log(`SimpleStorage: Found snippet with id ${id}`);
      return result.rows[0];
    } catch (error) {
      console.error('SimpleStorage: Error getting snippet:', error);
      throw error;
    }
  }
  
  async incrementSnippetViewCount(id: number): Promise<void> {
    try {
      console.log('SimpleStorage: Incrementing view count for snippet:', id);
      
      await query('UPDATE snippets SET viewcount = viewcount + 1 WHERE id = $1', [id]);
      console.log(`SimpleStorage: View count incremented for snippet ${id}`);
    } catch (error) {
      console.error('SimpleStorage: Error incrementing view count:', error);
      throw error;
    }
  }
  
  async getTags(): Promise<string[]> {
    try {
      console.log('SimpleStorage: Getting tags');
      
      // Get tags directly with SQL query
      const result = await query(`
        SELECT DISTINCT unnest(tags) as tag 
        FROM snippets 
        WHERE tags IS NOT NULL 
        ORDER BY tag
      `, []);
      
      const tags = result.rows.map(row => row.tag);
      console.log(`SimpleStorage: Found ${tags.length} tags`);
      
      return tags;
    } catch (error) {
      console.error('SimpleStorage: Error getting tags:', error);
      throw error;
    }
  }
  
  async getLanguages(): Promise<string[]> {
    try {
      console.log('SimpleStorage: Getting languages');
      
      const result = await query(`
        SELECT DISTINCT language 
        FROM snippets 
        WHERE language IS NOT NULL 
        ORDER BY language
      `, []);
      
      const languages = result.rows.map(row => row.language);
      console.log(`SimpleStorage: Found ${languages.length} languages`);
      
      return languages;
    } catch (error) {
      console.error('SimpleStorage: Error getting languages:', error);
      throw error;
    }
  }
  
  async getCollections(): Promise<any[]> {
    try {
      console.log('SimpleStorage: Getting collections');
      
      const result = await query('SELECT * FROM collections ORDER BY id DESC', []);
      console.log(`SimpleStorage: Found ${result.rows.length} collections`);
      
      return result.rows;
    } catch (error) {
      console.error('SimpleStorage: Error getting collections:', error);
      throw error;
    }
  }
}

export const simpleStorage = new SimpleStorage();
