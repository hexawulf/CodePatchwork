// server/__tests__/routes.test.ts

import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes, authMiddleware } from '../routes'; // Adjust path
import { storage } from '../storage'; // Adjust path
import { type Snippet } from '@shared/schema'; // Adjust path

// Mock the storage module
import admin from 'firebase-admin'; // Import firebase-admin

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
  credential: {
    cert: jest.fn(),
  },
  initializeApp: jest.fn(),
  auth: () => ({
    verifyIdToken: jest.fn(),
  }),
}));

// Mock the storage module
jest.mock('../storage', () => ({
  storage: {
    getSnippets: jest.fn(),
    getSnippet: jest.fn(),
    getUser: jest.fn(), // Add getUser to the mock
    upsertUser: jest.fn(), // Add upsertUser if it's called
    incrementSnippetViewCount: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock the authMiddleware
// We will use the actual authMiddleware but mock its dependencies (firebase-admin, storage.getUser)
// This is a change from the original approach of completely mocking out authMiddleware.
// This allows us to test the middleware's logic more accurately.
const originalRoutes = jest.requireActual('../routes');
jest.mock('../routes', () => {
  const original = jest.requireActual('../routes');
  return {
    ...original,
    // authMiddleware is NOT mocked here anymore, we use the real one.
  };
});


// Mock pool for health check
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
  app.use(express.json());
  // Use originalRoutes.registerRoutes from the actual module
  await originalRoutes.registerRoutes(app); 
  
  // Clear mock history before each test
  (storage.getSnippets as jest.Mock).mockClear();
  (storage.getSnippet as jest.Mock).mockClear();
  (storage.getUser as jest.Mock).mockClear();
  (storage.incrementSnippetViewCount as jest.Mock).mockClear();
  // Clear firebase-admin mocks
  (admin.auth().verifyIdToken as jest.Mock).mockClear();
});

// Define mock users and snippets
const user_A_id = 'user_A_id';
const user_B_id = 'user_B_id';
const user_C_id = 'user_C_id';

const mockUserA = { id: user_A_id, email: 'a@example.com', displayName: 'User A', photoURL: null, createdAt: new Date(), updatedAt: new Date(), username: 'usera', githubId: null, bio: null, location: null, website: null };
const mockUserB = { id: user_B_id, email: 'b@example.com', displayName: 'User B', photoURL: null, createdAt: new Date(), updatedAt: new Date(), username: 'userb', githubId: null, bio: null, location: null, website: null };
const mockUserC = { id: user_C_id, email: 'c@example.com', displayName: 'User C', photoURL: null, createdAt: new Date(), updatedAt: new Date(), username: 'userc', githubId: null, bio: null, location: null, website: null };


const snippet1: Partial<Snippet> = { id: 1, title: 'User A Snippet 1', code: 'code1', language: 'js', userId: user_A_id, isPublic: false };
const snippet2: Partial<Snippet> = { id: 2, title: 'User A Snippet 2', code: 'code2', language: 'ts', userId: user_A_id, isPublic: false };
const snippet3: Partial<Snippet> = { id: 3, title: 'User B Snippet 1', code: 'code3', language: 'py', userId: user_B_id, isPublic: false };
const publicSnippet: Partial<Snippet> = { id: 4, title: 'Public Snippet', code: 'public', language: 'md', userId: user_A_id, isPublic: true };

describe('GET /api/snippets (User-Specific)', () => {
  it('should return 401 if no token is provided', async () => {
    const response = await request(app).get('/api/snippets');
    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Unauthorized');
  });

  it('should return snippets for User A when authenticated as User A', async () => {
    (admin.auth().verifyIdToken as jest.Mock).mockResolvedValue({ uid: user_A_id });
    (storage.getUser as jest.Mock).mockResolvedValue(mockUserA);
    (storage.getSnippets as jest.Mock).mockImplementation(async (filters) => {
      if (filters.userId === user_A_id) {
        return [snippet1, snippet2];
      }
      return [];
    });

    const response = await request(app)
      .get('/api/snippets')
      .set('Authorization', 'Bearer test-token-user-a');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([snippet1, snippet2]);
    expect(storage.getSnippets).toHaveBeenCalledWith(expect.objectContaining({ userId: user_A_id }));
    expect(admin.auth().verifyIdToken).toHaveBeenCalledWith('test-token-user-a');
    expect(storage.getUser).toHaveBeenCalledWith(user_A_id);
  });

  it('should return snippets for User B when authenticated as User B', async () => {
    (admin.auth().verifyIdToken as jest.Mock).mockResolvedValue({ uid: user_B_id });
    (storage.getUser as jest.Mock).mockResolvedValue(mockUserB);
    (storage.getSnippets as jest.Mock).mockImplementation(async (filters) => {
      if (filters.userId === user_B_id) {
        return [snippet3];
      }
      return [];
    });

    const response = await request(app)
      .get('/api/snippets')
      .set('Authorization', 'Bearer test-token-user-b');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([snippet3]);
    expect(storage.getSnippets).toHaveBeenCalledWith(expect.objectContaining({ userId: user_B_id }));
  });

  it('should return an empty array for User C (who has no snippets) when authenticated as User C', async () => {
    (admin.auth().verifyIdToken as jest.Mock).mockResolvedValue({ uid: user_C_id });
    (storage.getUser as jest.Mock).mockResolvedValue(mockUserC);
    (storage.getSnippets as jest.Mock).mockImplementation(async (filters) => {
      if (filters.userId === user_C_id) {
        return [];
      }
      return [snippet1, snippet2, snippet3]; // Should not happen if filter is correct
    });

    const response = await request(app)
      .get('/api/snippets')
      .set('Authorization', 'Bearer test-token-user-c');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(storage.getSnippets).toHaveBeenCalledWith(expect.objectContaining({ userId: user_C_id }));
  });
  
  it('should return 401 if token is invalid', async () => {
    (admin.auth().verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));
    
    const response = await request(app)
      .get('/api/snippets')
      .set('Authorization', 'Bearer invalid-token');
      
    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Invalid token');
  });

  it('should return 404 if user from token is not found in storage', async () => {
    (admin.auth().verifyIdToken as jest.Mock).mockResolvedValue({ uid: 'nonexistent-user-id' });
    (storage.getUser as jest.Mock).mockResolvedValue(undefined); // User not found
    
    const response = await request(app)
      .get('/api/snippets')
      .set('Authorization', 'Bearer token-for-nonexistent-user');
      
    expect(response.status).toBe(404);
    expect(response.body.message).toContain('User not found');
  });
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

      const mockPublicSnippetsActual: Snippet[] = [ // Use actual Snippet type
        { id: 1, title: 'Public Snippet 1', isPublic: true, language: 'javascript', code: '', userId: user_A_id, createdAt: new Date(), updatedAt: new Date(), viewCount:0, isFavorite: false, shareId: null, tags: [] },
        { id: 2, title: 'Public Snippet 2', isPublic: true, language: 'python', code: '', userId: user_B_id, createdAt: new Date(), updatedAt: new Date(), viewCount:0, isFavorite: false, shareId: null, tags: []  },
      ];
      (storage.getSnippets as jest.Mock).mockResolvedValue(mockPublicSnippetsActual);

      const response = await request(app).get('/api/public/snippets');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPublicSnippetsActual.map(s => ({...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() }))); // Adjust for date serialization
      expect(storage.getSnippets).toHaveBeenCalledWith(expect.objectContaining({
        isPublic: true,
      }));
      // authMiddleware is part of the actual routes, so it WILL be called by Express
      // but it won't find a token and thus won't authenticate for public routes.
      // The important thing is that the route handler itself doesn't *require* req.user.
    });

    it('should pass query parameters (search, language, tag) to storage.getSnippets for public snippets', async () => {
      (storage.getSnippets as jest.Mock).mockResolvedValue([]);
      const query = { search: 'public test', language: 'javascript', tag: 'public_example' };
      
      await request(app).get('/api/public/snippets').query(query);

      expect(storage.getSnippets).toHaveBeenCalledWith(expect.objectContaining({ // objectContaining for flexibility
        isPublic: true,
        search: query.search,
        language: query.language,
        tag: query.tag,
      }));
    });
    
    it('should handle errors from storage.getSnippets gracefully for public snippets', async () => {
        (storage.getSnippets as jest.Mock).mockRejectedValue(new Error('Storage failure'));
        
        const response = await request(app).get('/api/public/snippets');
        
        expect(response.status).toBe(500);
        // Check against the actual error message in your route handler for GET /api/public/snippets
        expect(response.body).toEqual(expect.objectContaining({ message: 'Failed to get public snippets' }));
    });
  });

  describe('GET /api/public/snippets/:id', () => {
    it('should return a single public snippet if it exists and isPublic is true', async () => {
      const mockSnippetActual: Snippet = { id: 1, title: 'Test Snippet', isPublic: true, code: 'code', language: 'js', userId: user_A_id, createdAt: new Date(), updatedAt: new Date(), viewCount:0, isFavorite: false, shareId: null, tags: [] };
      (storage.getSnippet as jest.Mock).mockResolvedValue(mockSnippetActual);

      const response = await request(app).get('/api/public/snippets/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({...mockSnippetActual, createdAt: mockSnippetActual.createdAt.toISOString(), updatedAt: mockSnippetActual.updatedAt.toISOString() });
      expect(storage.getSnippet).toHaveBeenCalledWith(1);
      expect(storage.incrementSnippetViewCount).not.toHaveBeenCalled();
    });

    it('should return 404 if public snippet is not found by storage.getSnippet', async () => {
      (storage.getSnippet as jest.Mock).mockResolvedValue(null); // Snippet not found

      const response = await request(app).get('/api/public/snippets/999');

      expect(response.status).toBe(404);
      // Check against the actual error message in your route handler
      expect(response.body).toEqual({ message: "Snippet not found or not public" });
    });

    it('should return 404 if snippet is found but isPublic is false', async () => {
      const mockPrivateSnippetActual: Snippet = { id: 2, title: 'Private Snippet', isPublic: false, code: 'private', language: 'js', userId: user_A_id, createdAt: new Date(), updatedAt: new Date(), viewCount:0, isFavorite: false, shareId: null, tags: [] };
      (storage.getSnippet as jest.Mock).mockResolvedValue(mockPrivateSnippetActual);

      const response = await request(app).get('/api/public/snippets/2');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Snippet not found or not public" });
    });
    
    it('should handle errors from storage.getSnippet gracefully for public snippets', async () => {
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
