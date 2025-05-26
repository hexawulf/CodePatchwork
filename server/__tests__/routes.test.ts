// server/__tests__/routes.test.ts

import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes, authMiddleware } from '../routes'; // Adjust path
import { storage } from '../storage'; // Adjust path
import { type Snippet } from '@shared/schema'; // Adjust path

// Mock the storage module
jest.mock('../storage', () => ({
  storage: {
    getSnippets: jest.fn(),
    getSnippet: jest.fn(),
    // Add any other storage methods if they get called by routes indirectly
    // For GET /api/public/snippets/:id, incrementSnippetViewCount might be called
    // Let's add it to avoid potential undefined function errors if the route calls it.
    incrementSnippetViewCount: jest.fn().mockResolvedValue(undefined), 
  },
}));

// Mock the authMiddleware to prevent actual auth logic from running
jest.mock('../routes', () => {
  const originalModule = jest.requireActual('../routes');
  return {
    ...originalModule,
    authMiddleware: jest.fn((req, res, next) => {
      // Simulate an authenticated user if needed for other tests, but not for public routes
      // req.user = { id: 'test-user', email: 'test@example.com' };
      next();
    }),
  };
});

// Mock pool for health check, not strictly necessary for these tests but good practice
// if registerRoutes touches it.
jest.mock('../db', () => ({
  pool: {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [{ now: new Date().toISOString() }] }),
      release: jest.fn(),
    }),
  },
}));


let app: Express;

beforeEach(async () => { // Make beforeEach async if registerRoutes is async
  app = express();
  app.use(express.json()); // Required for Express to parse JSON request bodies
  await registerRoutes(app); // Register all routes, ensure this completes if it's async
  
  // Clear mock history before each test
  (storage.getSnippets as jest.Mock).mockClear();
  (storage.getSnippet as jest.Mock).mockClear();
  (storage.incrementSnippetViewCount as jest.Mock).mockClear();
  (authMiddleware as jest.Mock).mockClear();
});

describe('Public API Snippet Routes', () => {
  describe('GET /api/public/snippets', () => {
    it('should return a list of public snippets and call storage.getSnippets with isPublic:true', async () => {
      const mockPublicSnippets: Partial<Snippet>[] = [
        { id: 1, title: 'Public Snippet 1', isPublic: true, language: 'javascript' },
        { id: 2, title: 'Public Snippet 2', isPublic: true, language: 'python' },
      ];
      (storage.getSnippets as jest.Mock).mockResolvedValue(mockPublicSnippets);

      const response = await request(app).get('/api/public/snippets');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPublicSnippets);
      expect(storage.getSnippets).toHaveBeenCalledWith(expect.objectContaining({ // Use objectContaining for flexibility
        isPublic: true,
      }));
      expect(authMiddleware).not.toHaveBeenCalled(); // Ensure authMiddleware is not called for this public route
    });

    it('should pass query parameters (search, language, tag) to storage.getSnippets', async () => {
      (storage.getSnippets as jest.Mock).mockResolvedValue([]);
      const query = { search: 'test', language: 'javascript', tag: 'example' };
      
      await request(app).get('/api/public/snippets').query(query);

      expect(storage.getSnippets).toHaveBeenCalledWith({
        isPublic: true,
        search: query.search,
        language: query.language,
        tag: query.tag,
      });
    });
    
    it('should handle errors from storage.getSnippets gracefully', async () => {
        (storage.getSnippets as jest.Mock).mockRejectedValue(new Error('Storage failure'));
        
        const response = await request(app).get('/api/public/snippets');
        
        expect(response.status).toBe(500);
        // Check against the actual error message in your route handler for GET /api/public/snippets
        expect(response.body).toEqual(expect.objectContaining({ message: 'Failed to get public snippets' }));
    });
  });

  describe('GET /api/public/snippets/:id', () => {
    it('should return a single public snippet if it exists and isPublic is true', async () => {
      const mockSnippet: Partial<Snippet> = { id: 1, title: 'Test Snippet', isPublic: true, code: 'code', language: 'js' };
      (storage.getSnippet as jest.Mock).mockResolvedValue(mockSnippet);

      const response = await request(app).get('/api/public/snippets/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSnippet);
      expect(storage.getSnippet).toHaveBeenCalledWith(1); // ID is number
      // The route for /api/public/snippets/:id in the provided routes.ts does NOT call incrementSnippetViewCount.
      // The /api/snippets/:id (non-public) and /api/shared/:shareId do.
      // So, we should expect it NOT to be called here.
      expect(storage.incrementSnippetViewCount).not.toHaveBeenCalled();
      expect(authMiddleware).not.toHaveBeenCalled();
    });

    it('should return 404 if snippet is not found by storage.getSnippet', async () => {
      (storage.getSnippet as jest.Mock).mockResolvedValue(null); // Snippet not found

      const response = await request(app).get('/api/public/snippets/999');

      expect(response.status).toBe(404);
      // Check against the actual error message in your route handler
      expect(response.body).toEqual({ message: "Snippet not found or not public" });
    });

    it('should return 404 if snippet is found but isPublic is false', async () => {
      const mockPrivateSnippet: Partial<Snippet> = { id: 2, title: 'Private Snippet', isPublic: false, code: 'private', language: 'js' };
      (storage.getSnippet as jest.Mock).mockResolvedValue(mockPrivateSnippet);

      const response = await request(app).get('/api/public/snippets/2');

      expect(response.status).toBe(404);
      // Check against the actual error message in your route handler
      expect(response.body).toEqual({ message: "Snippet not found or not public" });
    });
    
    it('should handle errors from storage.getSnippet gracefully', async () => {
        (storage.getSnippet as jest.Mock).mockRejectedValue(new Error('Storage failure for single snippet'));
        
        const response = await request(app).get('/api/public/snippets/1');
        
        expect(response.status).toBe(500);
        // Check against the actual error message in your route handler for GET /api/public/snippets/:id
        expect(response.body).toEqual(expect.objectContaining({ message: 'Failed to get public snippet' }));
    });
    
    it('should handle invalid ID format (e.g., non-numeric string)', async () => {
        // Express route matching with `Number(req.params.id)` will pass NaN to `storage.getSnippet`
        // if the ID is non-numeric. We need to simulate `storage.getSnippet` returning null for NaN.
        (storage.getSnippet as jest.Mock).mockImplementation(async (id) => {
            if (isNaN(id)) {
                return null; 
            }
            // Fallback for other ID types if needed, though this test focuses on NaN
            return null; 
        });
        
        const response = await request(app).get('/api/public/snippets/abc');
        
        expect(storage.getSnippet).toHaveBeenCalledWith(NaN);
        expect(response.status).toBe(404); 
        expect(response.body).toEqual({ message: "Snippet not found or not public" });
    });
  });
});
