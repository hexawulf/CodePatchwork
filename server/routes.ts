import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { createServer, type Server } from "http";
import admin from "firebase-admin";
import { storage } from "./storage";
import logger from "./logger";
import {
  insertSnippetSchema,
  insertCollectionSchema,
  insertCollectionItemSchema,
  insertCommentSchema,
} from "@shared/schema";
import { z } from "zod";

/** Auth middleware — verifies Firebase ID Token from Authorization header */
export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token" });
    }
    const idToken = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const user = await storage.getUser(decoded.uid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    (req as any).user = user;
    next();
  } catch (err: any) {
    logger.error("Auth middleware error:", err.message);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

/** Optional auth — attaches user if token is present, continues regardless */
const optionalAuthMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const idToken = authHeader.split(" ")[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      const user = await storage.getUser(decoded.uid);
      if (user) {
        (req as any).user = user;
      }
    }
  } catch {
    // Silently continue without auth
  }
  next();
};

/** Helper: parse and validate numeric ID from params */
function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isFinite(id) || id < 1) {
    throw new Error("Invalid ID");
  }
  return id;
}

/** Register all routes */
export async function registerRoutes(app: Express): Promise<Server> {

  // ─── Health / Test ────────────────────────────────────────────
  app.get("/api/test", (_req, res) => {
    res.json({ message: "API test successful" });
  });

  app.get("/api/health", async (_req: Request, res: Response) => {
    try {
      const { pool } = await import("./db");
      const client = await pool.connect();
      const dbResult = await client.query("SELECT NOW() as current_time");
      client.release();
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        dbTime: dbResult.rows[0].current_time,
      });
    } catch (error: any) {
      logger.error("Health check failed:", error.message);
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error.message,
      });
    }
  });

  // ─── Auth endpoints ───────────────────────────────────────────

  app.post("/api/auth/user", async (req: Request, res: Response) => {
    const { idToken, uid, email, displayName, photoURL } = req.body;

    if (!idToken && !uid) {
      return res.status(400).json({ message: "Missing idToken or uid in request body" });
    }

    try {
      let userRecord: {
        id: string;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
      };

      if (idToken) {
        const decoded = await admin.auth().verifyIdToken(idToken);
        userRecord = {
          id: decoded.uid,
          email: decoded.email ?? null,
          displayName: decoded.name ?? null,
          photoURL: decoded.picture ?? null,
        };
      } else {
        userRecord = {
          id: uid,
          email: email ?? null,
          displayName: displayName ?? null,
          photoURL: photoURL ?? null,
        };
      }

      const user = await storage.upsertUser(userRecord);
      return res.status(201).json(user);
    } catch (err: any) {
      logger.error("/api/auth/user error:", err.message);
      return res.status(500).json({ message: "Auth + upsert failed" });
    }
  });

  app.get("/api/auth/me", authMiddleware, (req, res) => {
    res.json((req as any).user);
  });

  // ─── Snippets (authenticated) ────────────────────────────────

  app.get("/api/snippets", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const filters: any = { userId };
      if (req.query.search) filters.search = String(req.query.search);
      if (req.query.language) filters.language = req.query.language;
      if (req.query.tag) filters.tag = req.query.tag;
      if (req.query.favorites === "true") filters.favorites = true;

      const list = await storage.getSnippets(filters);
      return res.json(list);
    } catch (err: any) {
      logger.error("GET /api/snippets error:", err.message);
      res.status(500).json({ message: "Failed to get snippets" });
    }
  });

  app.get("/api/snippets/:id", optionalAuthMiddleware, async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const snippet = await storage.getSnippet(id);
      if (!snippet) {
        return res.status(404).json({ message: "Snippet not found" });
      }

      const requestingUser = (req as any).user;
      if (!snippet.isPublic && snippet.userId !== requestingUser?.id) {
        return res.status(404).json({ message: "Snippet not found" });
      }

      await storage.incrementSnippetViewCount(id);
      return res.json(snippet);
    } catch (err: any) {
      logger.error(`GET /api/snippets/${req.params.id} error:`, err.message);
      res.status(500).json({ message: "Failed to get snippet" });
    }
  });

  app.post("/api/snippets", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;

      if (!req.body.title || !req.body.code) {
        return res.status(400).json({ message: "Title and code are required" });
      }

      const snippet = await storage.createSnippet({
        title: req.body.title,
        code: req.body.code,
        language: req.body.language || "text",
        description: req.body.description || null,
        tags: Array.isArray(req.body.tags) ? req.body.tags : req.body.tags ? [req.body.tags] : null,
        userId,
        isFavorite: req.body.isFavorite === true,
        isPublic: req.body.isPublic === true,
      });

      res.status(201).json(snippet);
    } catch (err: any) {
      logger.error("POST /api/snippets error:", err.message);
      res.status(500).json({ message: "Failed to create snippet" });
    }
  });

  app.put("/api/snippets/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const dto = insertSnippetSchema.parse(req.body);
      const existing = await storage.getSnippet(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      if (existing.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateSnippet(id, dto);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      logger.error("PUT /api/snippets/:id error:", err.message);
      res.status(500).json({ message: "Failed to update snippet" });
    }
  });

  app.delete("/api/snippets/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const existing = await storage.getSnippet(id);
      if (!existing) return res.status(404).json({ message: "Snippet not found" });
      if (existing.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteSnippet(id);
      res.status(204).send();
    } catch (err: any) {
      logger.error("DELETE /api/snippets/:id error:", err.message);
      res.status(500).json({ message: "Failed to delete snippet" });
    }
  });

  // ─── Public Snippets ─────────────────────────────────────────

  app.get("/api/public/snippets", async (req, res) => {
    try {
      const filters: any = { isPublic: true };
      if (req.query.search) filters.search = String(req.query.search);
      if (req.query.language) filters.language = req.query.language;
      if (req.query.tag) filters.tag = req.query.tag;
      const snippets = await storage.getSnippets(filters);
      res.json(snippets);
    } catch (err: any) {
      logger.error("GET /api/public/snippets error:", err.message);
      res.status(500).json({ message: "Failed to get public snippets" });
    }
  });

  app.get("/api/public/snippets/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const snippet = await storage.getSnippet(id);
      if (!snippet || !snippet.isPublic) {
        return res.status(404).json({ message: "Snippet not found or not public" });
      }
      res.json(snippet);
    } catch (err: any) {
      logger.error(`GET /api/public/snippets/${req.params.id} error:`, err.message);
      res.status(500).json({ message: "Failed to get public snippet" });
    }
  });

  // ─── Favorites ────────────────────────────────────────────────

  app.post("/api/snippets/:id/favorite", authMiddleware, async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const existing = await storage.getSnippet(id);
      if (!existing) return res.status(404).json({ message: "Snippet not found" });
      if (existing.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.toggleSnippetFavorite(id);
      res.json(updated);
    } catch (err: any) {
      logger.error("POST /api/snippets/:id/favorite error:", err.message);
      res.status(500).json({ message: "Failed to toggle favorite status" });
    }
  });

  // ─── Import ───────────────────────────────────────────────────

  app.post("/api/snippets/import", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { snippets } = req.body;

      if (!Array.isArray(snippets)) {
        return res.status(400).json({ message: "Invalid input: snippets must be an array" });
      }

      const success: { id: number; title: string }[] = [];
      const failed: { index: number; title: string; reason: string }[] = [];

      for (let i = 0; i < snippets.length; i++) {
        const s = snippets[i];
        if (!s.title || !s.code) {
          failed.push({ index: i, title: s.title || "untitled", reason: "Missing required fields" });
          continue;
        }
        try {
          const created = await storage.createSnippet({
            title: s.title,
            code: s.code,
            language: s.language || "text",
            description: s.description || null,
            tags: Array.isArray(s.tags) ? s.tags : null,
            userId,
            isFavorite: s.isFavorite === true,
            isPublic: s.isPublic === true,
          });
          success.push({ id: created.id, title: created.title });
        } catch (err: any) {
          failed.push({ index: i, title: s.title, reason: err.message });
        }
      }

      const msg = `Successfully imported ${success.length} snippets.` +
        (failed.length > 0 ? ` Failed to import ${failed.length} snippets.` : "");
      res.status(201).json({ message: msg, success, failed });
    } catch (err: any) {
      logger.error("POST /api/snippets/import error:", err.message);
      res.status(500).json({ message: "Failed to import snippets" });
    }
  });

  // ─── Languages & Tags ────────────────────────────────────────

  app.get("/api/languages", async (_req, res) => {
    try {
      const langs = await storage.getLanguages();
      res.json(langs);
    } catch (err: any) {
      logger.error("GET /api/languages error:", err.message);
      res.status(500).json({ message: "Failed to fetch languages" });
    }
  });

  app.get("/api/tags", async (_req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (err: any) {
      logger.error("GET /api/tags error:", err.message);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // ─── Collections ──────────────────────────────────────────────

  app.get("/api/collections", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const cols = await storage.getCollections(userId);
      res.json(cols);
    } catch (err: any) {
      logger.error("GET /api/collections error:", err.message);
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const col = await storage.getCollection(id);
      if (!col) return res.status(404).json({ message: "Not found" });
      if (col.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      res.json(col);
    } catch (err: any) {
      logger.error("GET /api/collections/:id error:", err.message);
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  app.get("/api/collections/:id/snippets", authMiddleware, async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const col = await storage.getCollection(id);
      if (!col) return res.status(404).json({ message: "Not found" });
      if (col.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const list = await storage.getCollectionSnippets(id);
      res.json(list);
    } catch (err: any) {
      logger.error("GET /api/collections/:id/snippets error:", err.message);
      res.status(500).json({ message: "Failed to fetch collection snippets" });
    }
  });

  app.post("/api/collections", authMiddleware, async (req, res) => {
    try {
      const dto = insertCollectionSchema.parse({
        ...req.body,
        userId: (req as any).user.id,
      });
      const created = await storage.createCollection(dto);
      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      logger.error("POST /api/collections error:", err.message);
      res.status(500).json({ message: "Failed to create collection" });
    }
  });

  app.put("/api/collections/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const dto = insertCollectionSchema.parse(req.body);
      const existing = await storage.getCollection(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      if (existing.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateCollection(id, dto);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      logger.error("PUT /api/collections/:id error:", err.message);
      res.status(500).json({ message: "Failed to update collection" });
    }
  });

  app.delete("/api/collections/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const existing = await storage.getCollection(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      if (existing.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteCollection(id);
      res.status(204).send();
    } catch (err: any) {
      logger.error("DELETE /api/collections/:id error:", err.message);
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  app.post(
    "/api/collections/:collectionId/snippets/:snippetId",
    authMiddleware,
    async (req, res) => {
      try {
        const collectionId = parseId(req.params.collectionId);
        const snippetId = parseId(req.params.snippetId);
        const existing = await storage.getCollection(collectionId);
        if (!existing) return res.status(404).json({ message: "Not found" });
        if (existing.userId !== (req as any).user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        const dto = insertCollectionItemSchema.parse({ collectionId, snippetId });
        const created = await storage.addSnippetToCollection(dto);
        res.status(201).json(created);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid data", errors: err.errors });
        }
        logger.error("POST /api/collections/:id/snippets/:id error:", err.message);
        res.status(500).json({ message: "Failed to add snippet to collection" });
      }
    }
  );

  app.delete(
    "/api/collections/:collectionId/snippets/:snippetId",
    authMiddleware,
    async (req, res) => {
      try {
        const collectionId = parseId(req.params.collectionId);
        const snippetId = parseId(req.params.snippetId);
        const existing = await storage.getCollection(collectionId);
        if (!existing) return res.status(404).json({ message: "Not found" });
        if (existing.userId !== (req as any).user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        await storage.removeSnippetFromCollection(collectionId, snippetId);
        res.status(204).send();
      } catch (err: any) {
        logger.error("DELETE /api/collections/:id/snippets/:id error:", err.message);
        res.status(500).json({ message: "Failed to remove snippet from collection" });
      }
    }
  );

  // ─── Sharing & Publishing ────────────────────────────────────

  app.get("/api/shared/:shareId", async (req, res) => {
    try {
      const shareId = req.params.shareId;
      const snippet = await storage.getSnippetByShareId(shareId);
      if (!snippet) return res.status(404).json({ message: "Not found" });
      if (!snippet.isPublic) return res.status(403).json({ message: "Forbidden" });
      await storage.incrementSnippetViewCount(snippet.id);
      res.json(snippet);
    } catch (err: any) {
      logger.error("GET /api/shared/:shareId error:", err.message);
      res.status(500).json({ message: "Failed to fetch shared snippet" });
    }
  });

  app.post("/api/snippets/:id/share", authMiddleware, async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const existing = await storage.getSnippet(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      if (existing.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      let shareId = existing.shareId;
      if (!shareId) shareId = await storage.generateShareId(id);
      res.json({ shareId });
    } catch (err: any) {
      logger.error("POST /api/snippets/:id/share error:", err.message);
      res.status(500).json({ message: "Failed to share snippet" });
    }
  });

  app.post("/api/snippets/:id/publish", authMiddleware, async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const existing = await storage.getSnippet(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      if (existing.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.toggleSnippetPublic(id);
      res.json(updated);
    } catch (err: any) {
      logger.error("POST /api/snippets/:id/publish error:", err.message);
      res.status(500).json({ message: "Failed to publish snippet" });
    }
  });

  // ─── Comments ─────────────────────────────────────────────────

  app.get("/api/snippets/:snippetId/comments", async (req, res) => {
    try {
      const snippetId = parseId(req.params.snippetId);
      const comments = await storage.getCommentsBySnippetId(snippetId);
      res.json(comments);
    } catch (err: any) {
      logger.error("GET /api/snippets/:id/comments error:", err.message);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/snippets/:snippetId/comments", authMiddleware, async (req, res) => {
    try {
      const snippetId = parseId(req.params.snippetId);
      const dto = insertCommentSchema.parse({
        ...req.body,
        snippetId,
        userId: (req as any).user.id,
      });
      const created = await storage.createComment(dto);
      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      logger.error("POST /api/snippets/:id/comments error:", err.message);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.put("/api/comments/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const comment = await storage.getComment(id);
      if (!comment) return res.status(404).json({ message: "Not found" });
      if (comment.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateComment(id, req.body);
      res.json(updated);
    } catch (err: any) {
      logger.error("PUT /api/comments/:id error:", err.message);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete("/api/comments/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const comment = await storage.getComment(id);
      if (!comment) return res.status(404).json({ message: "Not found" });
      if (comment.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteComment(id);
      res.status(204).send();
    } catch (err: any) {
      logger.error("DELETE /api/comments/:id error:", err.message);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // ─── API 404 catch-all ────────────────────────────────────────
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
