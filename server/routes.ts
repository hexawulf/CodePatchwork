import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertSnippetSchema, 
  insertCollectionSchema, 
  insertCollectionItemSchema,
  insertCommentSchema,
  insertUserSchema
} from "@shared/schema";
import { z } from "zod";

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
  // Snippets endpoints
  app.get("/api/snippets", async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      
      // Create a filter object for our storage methods
      const filters: {
        search?: string;
        language?: string | string[];
        tag?: string | string[];
        favorites?: boolean;
      } = {};
      
      // Add search filter if provided
      if (search) {
        filters.search = search;
      }
      
      // Handle language filter
      if (req.query.language) {
        filters.language = Array.isArray(req.query.language) 
          ? req.query.language as string[] 
          : req.query.language as string;
      }
      
      // Handle tag filter
      if (req.query.tag) {
        filters.tag = Array.isArray(req.query.tag)
          ? req.query.tag as string[]
          : req.query.tag as string;
      }
      
      // Handle favorites filter
      if (req.query.favorites === 'true') {
        filters.favorites = true;
      }
      
      const snippets = await storage.getSnippets(filters);
      res.json(snippets);
    } catch (error) {
      console.error("Error fetching snippets:", error);
      res.status(500).json({ message: "Failed to fetch snippets" });
    }
  });

  // Export endpoint MUST be defined BEFORE the :id route to avoid conflict
  app.get("/api/snippets/export", async (req, res) => {
    try {
      // For export, we'll get all snippets without filters for simplicity
      const snippets = await storage.getSnippets();
      
      // Format for download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="codepatchwork-snippets.json"');
      
      res.json(snippets);
    } catch (error) {
      console.error("Error exporting snippets:", error);
      res.status(500).json({ message: "Failed to export snippets" });
    }
  });

  // Individual snippet route
  app.get("/api/snippets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const snippet = await storage.getSnippet(id);
      
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      
      // Increment view count
      await storage.incrementSnippetViewCount(id);
      res.json(snippet);
    } catch (error) {
      console.error("Error fetching snippet:", error);
      res.status(500).json({ message: "Failed to fetch snippet" });
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
      const parsedBody = insertSnippetSchema.parse(req.body);
      
      const snippet = await storage.getSnippet(id);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
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

  app.delete("/api/snippets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const snippet = await storage.getSnippet(id);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      
      await storage.deleteSnippet(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting snippet:", error);
      res.status(500).json({ message: "Failed to delete snippet" });
    }
  });

  // Toggle favorite status
  app.post("/api/snippets/:id/favorite", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const snippet = await storage.getSnippet(id);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      
      const updatedSnippet = await storage.toggleSnippetFavorite(id);
      res.json(updatedSnippet);
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      res.status(500).json({ message: "Failed to update favorite status" });
    }
  });

  // Get all languages
  app.get("/api/languages", async (req, res) => {
    try {
      const languages = await storage.getLanguages();
      res.json(languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ message: "Failed to fetch languages" });
    }
  });

  // Get all tags
  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // Import/Export endpoints
  app.post("/api/snippets/import", async (req, res) => {
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
          userId: null, // Set proper user ID when auth is implemented
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
  
  // Move export endpoint BEFORE the /:id parameter route to avoid route conflicts
  app.get("/api/snippets/export", async (req, res) => {
    try {
      // For export, we'll get all snippets without filters for simplicity
      const snippets = await storage.getSnippets();
      
      // Format for download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="codepatchwork-snippets.json"');
      
      res.json(snippets);
    } catch (error) {
      console.error("Error exporting snippets:", error);
      res.status(500).json({ message: "Failed to export snippets" });
    }
  });
  
  // Collections endpoints
  app.get("/api/collections", async (req, res) => {
    try {
      const collections = await storage.getCollections();
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ message: "Failed to fetch collections" });
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

  app.post("/api/collections", async (req, res) => {
    try {
      const parsedBody = insertCollectionSchema.parse(req.body);
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
  
  app.put("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsedBody = insertCollectionSchema.parse(req.body);
      
      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
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
  
  app.delete("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      await storage.deleteCollection(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  app.post("/api/collections/:collectionId/snippets/:snippetId", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.collectionId);
      const snippetId = parseInt(req.params.snippetId);
      
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

  app.delete("/api/collections/:collectionId/snippets/:snippetId", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.collectionId);
      const snippetId = parseInt(req.params.snippetId);
      
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
  
  app.post("/api/snippets/:id/share", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const snippet = await storage.getSnippet(id);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
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
  
  app.post("/api/snippets/:id/publish", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const snippet = await storage.getSnippet(id);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
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
  
  app.post("/api/snippets/:snippetId/comments", async (req, res) => {
    try {
      const snippetId = parseInt(req.params.snippetId);
      
      const snippet = await storage.getSnippet(snippetId);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }
      
      // Combine snippet ID with the comment data from the body
      const commentData = {
        ...req.body,
        snippetId
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
  
  app.put("/api/comments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // For simplicity, we'll allow partial updates to comments
      const updatedComment = await storage.updateComment(id, req.body);
      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });
  
  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
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
