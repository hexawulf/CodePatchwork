// server/routes.ts
import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { createServer, type Server }                from "http";
import admin                                        from "firebase-admin";
import type { DecodedIdToken }                      from "firebase-admin/auth";
import { pool }                                     from "./db";
import { storage }                                  from "./storage";
import { simpleStorage }                            from "./simple-storage";
import {
  insertSnippetSchema,
  insertCollectionSchema,
  insertCollectionItemSchema,
  insertCommentSchema,
  insertUserSchema
} from "@shared/schema";
import { z }                                       from "zod";

/** ─── 1) Debug DB connection on startup ───────────────────────────────── */
;(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ DATABASE CONNECTION TEST: OK —", (await client.query("SELECT NOW()")).rows[0].now);
    client.release();
  } catch (e) {
    console.error("❌ DATABASE CONNECTION TEST: FAILED", e);
  }
})();

/** ─── 2) Auth middleware (verifies Firebase ID Token in Authorization header) ── */
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
    ;(req as any).user = user;
    next();
  } catch (err: any) {
    console.error("Auth middleware error:", err);
    res.status(401).json({ message: "Unauthorized: Invalid token", error: err.message });
  }
};

/** ─── 3) Register all routes ─────────────────────────────────────────────── */
export async function registerRoutes(app: Express): Promise<Server> {
  // ─── 3.1) NEW: Firebase Auth endpoints ──────────────────────────────────

  app.post("/api/auth/user", async (req: Request, res: Response) => {
    const { idToken, uid, email, displayName, photoURL } = req.body as any;

    // if neither JWT nor uid is supplied → bad request
    if (!idToken && !uid) {
      return res
        .status(400)
        .json({ message: "Missing idToken or uid in request body" });
    }

    try {
      // build a normalized user record
      let userRecord: {
        id: string;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
      };

      if (idToken) {
        // verify the Firebase JWT
        const decoded = await admin.auth().verifyIdToken(idToken);
        userRecord = {
          id: decoded.uid,
          email: decoded.email   ?? null,
          displayName: decoded.name    ?? null,
          photoURL: decoded.picture    ?? null,
        };
      } else {
        // fallback: trust the client-provided fields
        userRecord = {
          id: uid,
          email: email        ?? null,
          displayName: displayName ?? null,
          photoURL: photoURL      ?? null,
        };
      }

      // upsert into your users table
      const user = await storage.upsertUser(userRecord);
      return res.status(201).json(user);
    } catch (err: any) {
      console.error("/api/auth/user error:", err);
      return res.status(500).json({
        message: "Auth + upsert failed",
        error: err.message,
      });
    }
  });

  app.get("/api/auth/me", authMiddleware, (_req, res) => {
    // req.user was attached by your authMiddleware
    res.json(( _req as any ).user);
  });
  // ──────────────────────────────────────────────────────────────────────────
  // ─── 3.2) Your existing snippet, collection, comment, etc. endpoints go here ─
  //      (Everything from app.get("/api/snippets") on down stays exactly as before.)
  //
  //      e.g.:
  //      app.get("/api/snippets", async (req, res) => { … });
  //      app.post("/api/snippets", authMiddleware, async (req, res) => { … });
  //      …and so on…
  //
  // ──────────────────────────────────────────────────────────────────────────

  // ────────────────────────────────────────────────────────────────
  //   2) Snippets endpoints
  // ────────────────────────────────────────────────────────────────
  app.get("/api/snippets", async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.search) filters.search = String(req.query.search);
      if (req.query.language) filters.language = req.query.language;
      if (req.query.tag) filters.tag = req.query.tag;
      if (req.query.favorites === "true") filters.favorites = true;

      try {
        const list = await simpleStorage.getSnippets(filters);
        return res.json(list);
      } catch {
        const list = await storage.getSnippets(filters);
        return res.json(list);
      }
    } catch (err) {
      console.error("[SNIPPETS] GET /api/snippets error:", err);
      res.status(500).json({ message: "Failed to fetch snippets", error: err.toString() });
    }
  });

  app.get("/api/snippets/export", async (req, res) => {
    try {
      let list;
      try {
        list = await simpleStorage.getSnippets({});
      } catch {
        list = await storage.getSnippets({});
      }
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="snippets.json"`);
      res.json(list);
    } catch (err) {
      console.error("[EXPORT] GET /api/snippets/export error:", err);
      res.status(500).json({ message: "Failed to export snippets", error: err.toString() });
    }
  });

  app.get("/api/snippets/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      let snippet;
      try {
        snippet = await simpleStorage.getSnippet(id);
      } catch {
        snippet = await storage.getSnippet(id);
      }
      if (!snippet) return res.status(404).json({ message: "Not found" });
      // increment view count
      await storage.incrementSnippetViewCount(id);
      res.json(snippet);
    } catch (err) {
      console.error("[SNIPPETS] GET /api/snippets/:id error:", err);
      res.status(500).json({ message: "Failed to fetch snippet", error: err.toString() });
    }
  });

  app.post("/api/snippets", authMiddleware, async (req, res) => {
    try {
      const dto = insertSnippetSchema.parse(req.body);
      const created = await storage.createSnippet(dto);
      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      console.error("[SNIPPETS] POST /api/snippets error:", err);
      res.status(500).json({ message: "Failed to create snippet" });
    }
  });

  app.put("/api/snippets/:id", authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
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
      console.error("[SNIPPETS] PUT /api/snippets/:id error:", err);
      res.status(500).json({ message: "Failed to update snippet" });
    }
  });

  app.delete("/api/snippets/:id", authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getSnippet(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      if (existing.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteSnippet(id);
      res.status(204).send();
    } catch (err) {
      console.error("[SNIPPETS] DELETE /api/snippets/:id error:", err);
      res.status(500).json({ message: "Failed to delete snippet" });
    }
  });

  app.post("/api/snippets/:id/favorite", authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getSnippet(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      if (existing.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const toggled = await storage.toggleSnippetFavorite(id);
      res.json(toggled);
    } catch (err) {
      console.error("[SNIPPETS] POST /api/snippets/:id/favorite error:", err);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  //
  // ────────────────────────────────────────────────────────────────
  //   3) Languages & Tags
  // ────────────────────────────────────────────────────────────────
  app.get("/api/languages", async (req, res) => {
    try {
      let langs;
      try {
        langs = await simpleStorage.getLanguages();
      } catch {
        langs = await storage.getLanguages();
      }
      res.json(langs);
    } catch (err) {
      console.error("[LANGUAGES] GET /api/languages error:", err);
      res.status(500).json({ message: "Failed to fetch languages" });
    }
  });

  app.get("/api/tags", async (req, res) => {
    try {
      let tags;
      try {
        tags = await simpleStorage.getTags();
      } catch {
        tags = await storage.getTags();
      }
      res.json(tags);
    } catch (err) {
      console.error("[TAGS] GET /api/tags error:", err);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  //
  // ────────────────────────────────────────────────────────────────
  //   4) Collections
  // ────────────────────────────────────────────────────────────────
  app.get("/api/collections", async (req, res) => {
    try {
      let cols;
      try {
        cols = await simpleStorage.getCollections();
      } catch {
        cols = await storage.getCollections();
      }
      res.json(cols);
    } catch (err) {
      console.error("[COLLECTIONS] GET /api/collections error:", err);
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const col = await storage.getCollection(id);
      if (!col) return res.status(404).json({ message: "Not found" });
      res.json(col);
    } catch (err) {
      console.error("[COLLECTIONS] GET /api/collections/:id error:", err);
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  app.get("/api/collections/:id/snippets", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const list = await storage.getCollectionSnippets(id);
      res.json(list);
    } catch (err) {
      console.error("[COLLECTIONS] GET /api/collections/:id/snippets error:", err);
      res.status(500).json({ message: "Failed to fetch collection snippets" });
    }
  });

  app.post("/api/collections", authMiddleware, async (req, res) => {
    try {
      const dto = insertCollectionSchema.parse({
        ...req.body,
        userId: (req as any).user.id
      });
      const created = await storage.createCollection(dto);
      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      console.error("[COLLECTIONS] POST /api/collections error:", err);
      res.status(500).json({ message: "Failed to create collection" });
    }
  });

  app.put("/api/collections/:id", authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
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
      console.error("[COLLECTIONS] PUT /api/collections/:id error:", err);
      res.status(500).json({ message: "Failed to update collection" });
    }
  });

  app.delete("/api/collections/:id", authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getCollection(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      if (existing.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteCollection(id);
      res.status(204).send();
    } catch (err) {
      console.error("[COLLECTIONS] DELETE /api/collections/:id error:", err);
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  app.post(
    "/api/collections/:collectionId/snippets/:snippetId",
    authMiddleware,
    async (req, res) => {
      try {
        const collectionId = Number(req.params.collectionId);
        const snippetId = Number(req.params.snippetId);
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
        console.error(
          "[COLLECTION ITEMS] POST /api/collections/:collectionId/snippets/:snippetId error:",
          err
        );
        res.status(500).json({ message: "Failed to add snippet to collection" });
      }
    }
  );

  app.delete(
    "/api/collections/:collectionId/snippets/:snippetId",
    authMiddleware,
    async (req, res) => {
      try {
        const collectionId = Number(req.params.collectionId);
        const snippetId = Number(req.params.snippetId);
        const existing = await storage.getCollection(collectionId);
        if (!existing) return res.status(404).json({ message: "Not found" });
        if (existing.userId !== (req as any).user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        await storage.removeSnippetFromCollection(collectionId, snippetId);
        res.status(204).send();
      } catch (err) {
        console.error(
          "[COLLECTION ITEMS] DELETE /api/collections/:collectionId/snippets/:snippetId error:",
          err
        );
        res.status(500).json({ message: "Failed to remove snippet from collection" });
      }
    }
  );

  //
  // ────────────────────────────────────────────────────────────────
  //   5) Sharing & Publishing
  // ────────────────────────────────────────────────────────────────
  app.get("/api/shared/:shareId", async (req, res) => {
    try {
      const shareId = req.params.shareId;
      const snippet = await storage.getSnippetByShareId(shareId);
      if (!snippet) return res.status(404).json({ message: "Not found" });
      if (!snippet.isPublic) return res.status(403).json({ message: "Forbidden" });
      await storage.incrementSnippetViewCount(snippet.id);
      res.json(snippet);
    } catch (err) {
      console.error("[SHARED] GET /api/shared/:shareId error:", err);
      res.status(500).json({ message: "Failed to fetch shared snippet" });
    }
  });

  app.post("/api/snippets/:id/share", authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getSnippet(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      if (existing.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      let shareId = existing.shareId;
      if (!shareId) shareId = await storage.generateShareId(id);
      res.json({ shareId });
    } catch (err) {
      console.error("[SHARE] POST /api/snippets/:id/share error:", err);
      res.status(500).json({ message: "Failed to share snippet" });
    }
  });

  app.post("/api/snippets/:id/publish", authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getSnippet(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      if (existing.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.toggleSnippetPublic(id);
      res.json(updated);
    } catch (err) {
      console.error("[PUBLISH] POST /api/snippets/:id/publish error:", err);
      res.status(500).json({ message: "Failed to publish snippet" });
    }
  });

  //
  // ────────────────────────────────────────────────────────────────
  //   6) Comments
  // ────────────────────────────────────────────────────────────────
  app.get("/api/snippets/:snippetId/comments", async (req, res) => {
    try {
      const snippetId = Number(req.params.snippetId);
      const comments = await storage.getCommentsBySnippetId(snippetId);
      res.json(comments);
    } catch (err) {
      console.error("[COMMENTS] GET /api/snippets/:snippetId/comments error:", err);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/snippets/:snippetId/comments", authMiddleware, async (req, res) => {
    try {
      const snippetId = Number(req.params.snippetId);
      const dto = insertCommentSchema.parse({
        ...req.body,
        snippetId,
        userId: (req as any).user.id
      });
      const created = await storage.createComment(dto);
      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      console.error("[COMMENTS] POST /api/snippets/:snippetId/comments error:", err);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.put("/api/comments/:id", authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const all = await storage.getCommentsBySnippetId(0);
      const comment = all.find(c => c.id === id);
      if (!comment) return res.status(404).json({ message: "Not found" });
      if (comment.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateComment(id, req.body);
      res.json(updated);
    } catch (err) {
      console.error("[COMMENTS] PUT /api/comments/:id error:", err);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete("/api/comments/:id", authMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const all = await storage.getCommentsBySnippetId(0);
      const comment = all.find(c => c.id === id);
      if (!comment) return res.status(404).json({ message: "Not found" });
      if (comment.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteComment(id);
      res.status(204).send();
    } catch (err) {
      console.error("[COMMENTS] DELETE /api/comments/:id error:", err);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  //
  // ────────────────────────────────────────────────────────────────
  //   Finally, create and return the HTTP server
  // ────────────────────────────────────────────────────────────────
  const httpServer = createServer(app);
  return httpServer;
}
