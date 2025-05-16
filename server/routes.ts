import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSnippetSchema, insertCollectionSchema, insertCollectionItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Snippets endpoints
  app.get("/api/snippets", async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const language = req.query.language as string | undefined;
      const tag = req.query.tag as string | undefined;
      
      const snippets = await storage.getSnippets({ search, language, tag });
      res.json(snippets);
    } catch (error) {
      console.error("Error fetching snippets:", error);
      res.status(500).json({ message: "Failed to fetch snippets" });
    }
  });

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

  app.post("/api/snippets", async (req, res) => {
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

  app.put("/api/snippets/:id", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
