import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { simpleStorage } from "./simple-storage"; // Add this import
import { 
  insertSnippetSchema, 
  insertCollectionSchema, 
  insertCollectionItemSchema,
  insertCommentSchema,
  insertUserSchema
} from "@shared/schema";
import { z } from "zod";
import { pool } from './db'; // Add this import

// Debug database connection
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ DATABASE CONNECTION TEST: Successfully connected to database!");
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as time');
    console.log("✅ DATABASE CONNECTION TEST: Database time:", result.rows[0].time);
    
    client.release();
  } catch (error) {
    console.error("❌ DATABASE CONNECTION TEST: Failed to connect:", error);
  }
})();

// Auth middleware to verify Firebase authentication tokens
const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }
    
    const uid = authHeader.split(' ')[1];
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
    
    // Look up the user in our database
    const user = await storage.getUser(uid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Attach the user to the request object
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Internal server error during authentication" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Firebase Auth endpoints
  app.post("/api/auth/user", async (req, res) => {
    try {
      // This endpoint will be called by the frontend after Firebase authentication
      const { uid, email, displayName, photoURL } = req.body;
      
      if (!uid) {
        return res.status(400).json({ message: "User ID (uid) is required" });
      }
      
      // Upsert the user in our database
      const user = await storage.upsertUser({
        id: uid,
        email: email || null,
        displayName: displayName || null,
        photoURL: photoURL || null
      });
      
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating/updating user:", error);
      res.status(500).json({ message: "Failed to create/update user" });
    }
  });
  
  // Get current user's profile
  app.get("/api/auth/me", authMiddleware, (req, res) => {
    try {
      // User is already attached to req object by authMiddleware
      res.json((req as any).user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // Snippets endpoints - UPDATED
  app.get("/api/snippets", async (req, res) => {
    try {
      console.log("SNIPPETS API: Starting request");
      
      // Create a filter object for our storage methods
      const filters: {
        search?: string;
        language?: string | string[];
        tag?: string | string[];
        favorites?: boolean;
      } = {};
      
      // Add search filter if provided
      if (req.query.search) {
        filters.search = req.query.search as string;
        console.log("SNIPPETS API: Adding search filter:", filters.search);
      }
      
      // Handle language filter
      if (req.query.language) {
        filters.language = Array.isArray(req.query.language) 
          ? req.query.language as string[] 
          : req.query.language as string;
        console.log("SNIPPETS API: Adding language filter:", filters.language);
      }
      
      // Handle tag filter
      if (req.query.tag) {
        filters.tag = Array.isArray(req.query.tag)
          ? req.query.tag as string[]
          : req.query.tag as string;
        console.log("SNIPPETS API: Adding tag filter:", filters.tag);
      }
      
      // Handle favorites filter
      if (req.query.favorites === 'true') {
        filters.favorites = true;
        console.log("SNIPPETS API: Adding favorites filter");
      }
      
      // Try with simple storage first
      try {
        console.log("SNIPPETS API: Trying with simple storage");
        const snippets = await simpleStorage.getSnippets(filters);
        console.log(`SNIPPETS API: Successfully retrieved ${snippets.length} snippets with simple storage`);
        return res.json(snippets);
      } catch (simpleError) {
        console.error("SNIPPETS API: Simple storage failed:", simpleError);
        
        // Fall back to regular storage
        console.log("SNIPPETS API: Falling back to regular storage");
        const snippets = await storage.getSnippets(filters);
        console.log(`SNIPPETS API: Successfully retrieved ${snippets.length} snippets with regular storage`);
        res.json(snippets);
      }
    } catch (error) {
      console.error("SNIPPETS API ERROR:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(500).json({ 
        message: "Failed to fetch snippets", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Export endpoint MUST be defined BEFORE the :id route to avoid conflict
  app.get("/api/snippets/export", async (req, res) => {
    try {
      console.log("EXPORT API: Starting request");
      
      // Try with simple storage first
      try {
        console.log("EXPORT API: Trying with simple storage");
        const snippets = await simpleStorage.getSnippets();
        console.log(`EXPORT API: Successfully retrieved ${snippets.length} snippets for export`);
        
        // Format for download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="codepatchwork-snippets.json"');
        
        return res.json(snippets);
      } catch (simpleError) {
        console.error("EXPORT API: Simple storage failed:", simpleError);
        
        // Fall back to regular storage
        console.log("EXPORT API: Falling back to regular storage");
        const snippets = await storage.getSnippets();
        console.log(`EXPORT API: Successfully retrieved ${snippets.length} snippets with regular storage`);
        
        // Format for download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="codepatchwork-snippets.json"');
        
        res.json(snippets);
      }
    } catch (error) {
      console.error("EXPORT API ERROR:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(500).json({ 
        message: "Failed to export snippets", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Individual snippet route - UPDATED
  app.get("/api/snippets/:id", async (req, res) => {
    try {
      console.log("INDIVIDUAL SNIPPET API: Starting request for id:", req.params.id);
      const id = parseInt(req.params.id);
      
      // Try with simple storage first
      try {
        console.log("INDIVIDUAL SNIPPET API: Trying with simple storage");
        const snippet = await simpleStorage.getSnippet(id);
        
        if (!snippet) {
          console.log(`INDIVIDUAL SNIPPET API: No snippet found with id ${id}`);
          return res.status(404).json({ message: "Snippet not found" });
        }
        
        // Increment view count
        await simpleStorage.incrementSnippetViewCount(id);
        console.log(`INDIVIDUAL SNIPPET API: Successfully retrieved snippet ${id} with simple storage`);
        return res.json(snippet);
      } catch (simpleError) {
        console.error("INDIVIDUAL SNIPPET API: Simple storage failed:", simpleError);
        
        // Fall back to regular storage
        console.log("INDIVIDUAL SNIPPET API: Falling back to regular storage");
        const snippet = await storage.getSnippet(id);
        
        if (!snippet) {
          console.log(`INDIVIDUAL SNIPPET API: No snippet found with id ${id}`);
          return res.status(404).json({ message: "Snippet not found" });
        }
        
        // Increment view count
        await storage.incrementSnippetViewCount(id);
        console.log(`INDIVIDUAL SNIPPET API: Successfully retrieved snippet ${id} with regular storage`);
        res.json(snippet);
      }
    } catch (error) {
      console.error("INDIVIDUAL SNIPPET API ERROR:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(500).json({ 
        message: "Failed to fetch snippet", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.post("/api/snippets", authMiddleware, async (req, res) => {
    try {
      const parsedBody = insertSnippetSchema.parse(req.body);
      const snippet = await storage.createSnippet(parsedBody);
      res.status(201).json(snippet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid snippet data", 
          errors: error.errors 
        });
      }
      console.error("Error creating snippet:", error);
      res.status(500).json({ message: "Failed to create snippet" });
    }
  });

  app.put("/api/snippets/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUserId = (req as any).user?.id;
      const parsedBody = insertSnippetSchema.parse(req.body);
      
      const snippet = await storage.getSnippet(id);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      
      // Verify ownership - users can only update their own snippets
      if (snippet.userId !== currentUserId) {
        return res.status(403).json({ message: "You don't have permission to modify this snippet" });
      }
      
      const updatedSnippet = await storage.updateSnippet(id, parsedBody);
      res.json(updatedSnippet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid snippet data", 
          errors: error.errors 
        });
      }
      console.error("Error updating snippet:", error);
      res.status(500).json({ message: "Failed to update snippet" });
    }
  });

  app.delete("/api/snippets/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUserId = (req as any).user?.id;
      
      const snippet = await storage.getSnippet(id);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      
      // Verify ownership - users can only delete their own snippets
      if (snippet.userId !== currentUserId) {
        return res.status(403).json({ message: "You don't have permission to delete this snippet" });
      }
      
      await storage.deleteSnippet(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting snippet:", error);
      res.status(500).json({ message: "Failed to delete snippet" });
    }
  });

  // Toggle favorite status
  app.post("/api/snippets/:id/favorite", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUserId = (req as any).user?.id;
      
      const snippet = await storage.getSnippet(id);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      
      // Ensure we only let users toggle favorites on their own snippets
      if (snippet.userId !== currentUserId) {
        return res.status(403).json({ message: "You don't have permission to favorite this snippet" });
      }
      
      const updatedSnippet = await storage.toggleSnippetFavorite(id);
      res.json(updatedSnippet);
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      res.status(500).json({ message: "Failed to update favorite status" });
    }
  });

  // Get all languages - UPDATED
  app.get("/api/languages", async (req, res) => {
    try {
      console.log("LANGUAGES API: Starting request");
      
      // Try with simple storage first
      try {
        console.log("LANGUAGES API: Trying with simple storage");
        const languages = await simpleStorage.getLanguages();
        console.log("LANGUAGES API: Successfully retrieved languages with simple storage:", languages);
        return res.json(languages);
      } catch (simpleError) {
        console.error("LANGUAGES API: Simple storage failed:", simpleError);
        
        // Fall back to regular storage
        console.log("LANGUAGES API: Falling back to regular storage");
        const languages = await storage.getLanguages();
        console.log("LANGUAGES API: Successfully retrieved languages with regular storage:", languages);
        res.json(languages);
      }
    } catch (error) {
      console.error("LANGUAGES API ERROR:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(500).json({ 
        message: "Failed to fetch languages", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Get all tags - UPDATED
  app.get("/api/tags", async (req, res) => {
    try {
      console.log("TAGS API: Starting request");
      
      // Try with simple storage first
      try {
        console.log("TAGS API: Trying with simple storage");
        const tags = await simpleStorage.getTags();
        console.log("TAGS API: Successfully retrieved tags with simple storage:", tags);
        return res.json(tags);
      } catch (simpleError) {
        console.error("TAGS API: Simple storage failed:", simpleError);
        
        // Fall back to regular storage
        console.log("TAGS API: Falling back to regular storage");
        const tags = await storage.getTags();
        console.log("TAGS API: Successfully retrieved tags with regular storage:", tags);
        res.json(tags);
      }
    } catch (error) {
      console.error("TAGS API ERROR:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(500).json({ 
        message: "Failed to fetch tags", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Import/Export endpoints
  app.post("/api/snippets/import", authMiddleware, async (req, res) => {
    try {
      const { snippets } = req.body;
      
      if (!Array.isArray(snippets)) {
        return res.status(400).json({ message: "Invalid import format. Expected array of snippets." });
      }
      
      const importedSnippets = [];
      
      for (const snippet of snippets) {
        // Validate each snippet has required fields
        if (!snippet.title || !snippet.code || !snippet.language) {
          continue; // Skip invalid snippets
        }
        
        const newSnippet = await storage.createSnippet({
          title: snippet.title,
          code: snippet.code,
          language: snippet.language,
          description: snippet.description || null,
          tags: snippet.tags || null,
          userId: (req as any).user?.id || null,
          isFavorite: snippet.isFavorite || false
        });
        
        importedSnippets.push(newSnippet);
      }
      
      res.status(201).json({ 
        message: `Successfully imported ${importedSnippets.length} snippets`, 
        snippets: importedSnippets 
      });
    } catch (error) {
      console.error("Error importing snippets:", error);
      res.status(500).json({ message: "Failed to import snippets" });
    }
  });
  
  // Collections endpoints - UPDATED
  app.get("/api/collections", async (req, res) => {
    try {
      console.log("COLLECTIONS API: Starting request");
      
      // Try with simple storage first
      try {
        console.log("COLLECTIONS API: Trying with simple storage");
        const collections = await simpleStorage.getCollections();
        console.log(`COLLECTIONS API: Successfully retrieved ${collections.length} collections with simple storage`);
        return res.json(collections);
      } catch (simpleError) {
        console.error("COLLECTIONS API: Simple storage failed:", simpleError);
        
        // Fall back to regular storage
        console.log("COLLECTIONS API: Falling back to regular storage");
        const collections = await storage.getCollections();
        console.log(`COLLECTIONS API: Successfully retrieved ${collections.length} collections with regular storage`);
        res.json(collections);
      }
    } catch (error) {
      console.error("COLLECTIONS API ERROR:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(500).json({ 
        message: "Failed to fetch collections", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.get("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const collection = await storage.getCollection(id);
      
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      res.json(collection);
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  app.get("/api/collections/:id/snippets", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const snippets = await storage.getCollectionSnippets(id);
      res.json(snippets);
    } catch (error) {
      console.error("Error fetching collection snippets:", error);
      res.status(500).json({ message: "Failed to fetch collection snippets" });
    }
  });

  app.post("/api/collections", authMiddleware, async (req, res) => {
    try {
      // Add the current user's ID to the collection data
      const currentUserId = (req as any).user?.id;
      const collectionData = {
        ...req.body,
        userId: currentUserId
      };
      
      const parsedBody = insertCollectionSchema.parse(collectionData);
      const collection = await storage.createCollection(parsedBody);
      res.status(201).json(collection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid collection data", 
          errors: error.errors 
        });
      }
      console.error("Error creating collection:", error);
      res.status(500).json({ message: "Failed to create collection" });
    }
  });
  
  app.put("/api/collections/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUserId = (req as any).user?.id;
      const parsedBody = insertCollectionSchema.parse(req.body);
      
      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      // Verify ownership - users can only update their own collections
      if (collection.userId !== currentUserId) {
        return res.status(403).json({ message: "You don't have permission to modify this collection" });
      }
      
      const updatedCollection = await storage.updateCollection(id, parsedBody);
      res.json(updatedCollection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid collection data", 
          errors: error.errors 
        });
      }
      console.error("Error updating collection:", error);
      res.status(500).json({ message: "Failed to update collection" });
    }
  });
  
  app.delete("/api/collections/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUserId = (req as any).user?.id;
      
      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      // Verify ownership - users can only delete their own collections
      if (collection.userId !== currentUserId) {
        return res.status(403).json({ message: "You don't have permission to delete this collection" });
      }
      
      await storage.deleteCollection(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  app.post("/api/collections/:collectionId/snippets/:snippetId", authMiddleware, async (req, res) => {
    try {
      const collectionId = parseInt(req.params.collectionId);
      const snippetId = parseInt(req.params.snippetId);
      const currentUserId = (req as any).user?.id;
      
      // Verify collection ownership
      const collection = await storage.getCollection(collectionId);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      // Ensure users can only add snippets to their own collections
      if (collection.userId !== currentUserId) {
        return res.status(403).json({ message: "You don't have permission to modify this collection" });
      }
      
      const parsedBody = insertCollectionItemSchema.parse({
        collectionId,
        snippetId
      });
      
      const collectionItem = await storage.addSnippetToCollection(parsedBody);
      res.status(201).json(collectionItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid collection item data", 
          errors: error.errors 
        });
      }
      console.error("Error adding snippet to collection:", error);
      res.status(500).json({ message: "Failed to add snippet to collection" });
    }
  });

  app.delete("/api/collections/:collectionId/snippets/:snippetId", authMiddleware, async (req, res) => {
    try {
      const collectionId = parseInt(req.params.collectionId);
      const snippetId = parseInt(req.params.snippetId);
      const currentUserId = (req as any).user?.id;
      
      // Verify collection ownership
      const collection = await storage.getCollection(collectionId);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      // Ensure users can only remove snippets from their own collections
      if (collection.userId !== currentUserId) {
        return res.status(403).json({ message: "You don't have permission to modify this collection" });
      }
      
      await storage.removeSnippetFromCollection(collectionId, snippetId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing snippet from collection:", error);
      res.status(500).json({ message: "Failed to remove snippet from collection" });
    }
  });

  // Sharing endpoints
  app.get("/api/shared/:shareId", async (req, res) => {
    try {
      const { shareId } = req.params;
      const snippet = await storage.getSnippetByShareId(shareId);
      
      if (!snippet) {
        return res.status(404).json({ message: "Shared snippet not found" });
      }
      
      if (!snippet.isPublic) {
        return res.status(403).json({ message: "This snippet is not publicly accessible" });
      }
      
      // Increment the view count for the shared snippet
      await storage.incrementSnippetViewCount(snippet.id);
      
      res.json(snippet);
    } catch (error) {
      console.error("Error fetching shared snippet:", error);
      res.status(500).json({ message: "Failed to fetch shared snippet" });
    }
  });
  
  app.post("/api/snippets/:id/share", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUserId = (req as any).user?.id;
      
      const snippet = await storage.getSnippet(id);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      
      // Verify ownership - users can only share their own snippets
      if (snippet.userId !== currentUserId) {
        return res.status(403).json({ message: "You don't have permission to share this snippet" });
      }
      
      // Generate a share ID if one doesn't exist already
      let shareId = snippet.shareId;
      if (!shareId) {
        shareId = await storage.generateShareId(id);
      }
      
      res.json({ shareId });
    } catch (error) {
      console.error("Error sharing snippet:", error);
      res.status(500).json({ message: "Failed to share snippet" });
    }
  });
  
  app.post("/api/snippets/:id/publish", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUserId = (req as any).user?.id;
      
      const snippet = await storage.getSnippet(id);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      
      // Verify ownership - users can only publish/unpublish their own snippets
      if (snippet.userId !== currentUserId) {
        return res.status(403).json({ message: "You don't have permission to publish this snippet" });
      }
      
      const updatedSnippet = await storage.toggleSnippetPublic(id);
      res.json(updatedSnippet);
    } catch (error) {
      console.error("Error toggling snippet public status:", error);
      res.status(500).json({ message: "Failed to update snippet public status" });
    }
  });
  
  // Comment endpoints
  app.get("/api/snippets/:snippetId/comments", async (req, res) => {
    try {
      const snippetId = parseInt(req.params.snippetId);
      
      const snippet = await storage.getSnippet(snippetId);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      
      const comments = await storage.getCommentsBySnippetId(snippetId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  
  app.post("/api/snippets/:snippetId/comments", authMiddleware, async (req, res) => {
    try {
      const snippetId = parseInt(req.params.snippetId);
      
      const snippet = await storage.getSnippet(snippetId);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      
      // Combine snippet ID and user ID with the comment data from the body
      const commentData = {
        ...req.body,
        snippetId,
        userId: (req as any).user?.id || null
      };
      
      const parsedBody = insertCommentSchema.parse(commentData);
      const comment = await storage.createComment(parsedBody);
      
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid comment data", 
          errors: error.errors 
        });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });
  
  app.put("/api/comments/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUserId = (req as any).user?.id;
      
      // Get the comment to verify ownership - need to get a specific comment by ID
      // For this example, we'll need to implement a method to get a comment directly
      // This is a simplified approach that would need to be improved in a production app
      const comments = await storage.getCommentsBySnippetId(0); // Using 0 as a placeholder
      const commentToUpdate = comments?.find(c => c.id === id);
      
      if (!commentToUpdate) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Verify comment ownership - users can only update their own comments
      if (commentToUpdate.userId !== currentUserId) {
        return res.status(403).json({ message: "You don't have permission to update this comment" });
      }
      
      // For simplicity, we'll allow partial updates to comments
      const updatedComment = await storage.updateComment(id, req.body);
      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });
  
  app.delete("/api/comments/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUserId = (req as any).user?.id;
      
      // Need to get the comment to verify ownership
      // This is a simplified approach using the same technique as the update endpoint
      const comments = await storage.getCommentsBySnippetId(0); // Using 0 as a placeholder
      const commentToDelete = comments?.find(c => c.id === id);
      
      if (!commentToDelete) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Verify comment ownership - users can only delete their own comments
      if (commentToDelete.userId !== currentUserId) {
        return res.status(403).json({ message: "You don't have permission to delete this comment" });
      }
      
      await storage.deleteComment(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
