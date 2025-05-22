// server/routes.ts - FIXED VERSION
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
  // ─── 3.1) Firebase Auth endpoints ──────────────────────────────────

  app.post("/api/auth/user", async (req: Request, res: Response) => {
    const { idToken, uid, email, displayName, photoURL } = req.body as any;

    if (!idToken && !uid) {
      return res
        .status(400)
        .json({ message: "Missing idToken or uid in request body" });
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
          email: decoded.email   ?? null,
          displayName: decoded.name    ?? null,
          photoURL: decoded.picture    ?? null,
        };
      } else {
        userRecord = {
          id: uid,
          email: email        ?? null,
          displayName: displayName ?? null,
          photoURL: photoURL      ?? null,
        };
      }

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
    res.json(( _req as any ).user);
  });

  // ────────────────────────────────────────────────────────────────
  // ─── 3.2) Snippets endpoints ─────────────────────────────────────
  // ────────────────────────────────────────────────────────────────
  
  // GET all snippets (public access)
  app.get("/api/snippets", async (req, res) => {
    try {
      console.log("[GET_ALL] Get all snippets request received");
      
      const filters: any = {};
      if (req.query.search) filters.search = String(req.query.search);
      if (req.query.language) filters.language = req.query.language;
      if (req.query.tag) filters.tag = req.query.tag;
      if (req.query.favorites === "true") filters.favorites = true;
      
      try {
        const list = await simpleStorage.getSnippets(filters);
        console.log(`[GET_ALL] Found ${list.length} snippets using simpleStorage`);
        return res.json(list);
      } catch (simpleError) {
        console.log("[GET_ALL] SimpleStorage failed, falling back to storage", simpleError);
        
        try {
          const list = await storage.getSnippets(filters);
          console.log(`[GET_ALL] Found ${list.length} snippets using storage`);
          return res.json(list);
        } catch (storageError) {
          console.error("[GET_ALL] Storage also failed:", storageError);
          
          const client = await pool.connect();
          try {
            let query = `
              SELECT id, title, code, language, description, tags, userid, createdat, updatedat, 
                    isfavorite, ispublic, shareid, viewcount 
              FROM snippets 
              WHERE 1=1
            `;
            const params: any[] = [];
            
            if (filters.search) {
              query += ` AND (title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
              params.push(`%${filters.search}%`);
            }
            
            if (filters.language) {
              query += ` AND language = $${params.length + 1}`;
              params.push(filters.language);
            }
            
            if (filters.tag) {
              query += ` AND $${params.length + 1} = ANY(tags)`;
              params.push(filters.tag);
            }
            
            if (filters.favorites) {
              query += ` AND isfavorite = true`;
            }
            
            query += ` ORDER BY updatedat DESC`;
            
            const result = await client.query(query, params);
            
            console.log(`[GET_ALL] Found ${result.rows.length} snippets directly from DB`);
            
            const snippets = result.rows.map(row => ({
              id: row.id,
              title: row.title,
              code: row.code,
              language: row.language,
              description: row.description,
              tags: row.tags || [],
              userId: row.userid,
              createdAt: row.createdat,
              updatedAt: row.updatedat,
              isFavorite: row.isfavorite,
              isPublic: row.ispublic,
              shareId: row.shareid,
              viewCount: row.viewcount
            }));
            
            return res.json(snippets);
          } catch (dbError) {
            console.error("[GET_ALL] Database error:", dbError);
            throw dbError;
          } finally {
            client.release();
          }
        }
      }
    } catch (err: any) {
      console.error("[GET_ALL] GET /api/snippets error:", err);
      res.status(500).json({ 
        message: "Failed to get snippets", 
        error: err.message 
      });
    }
  });

  // GET single snippet by ID (public access)
  app.get("/api/snippets/:id", async (req, res) => {
    try {
      console.log(`[GET_ONE] Get snippet request received for ID: ${req.params.id}`);
      
      const id = Number(req.params.id);
      
      try {
        const snippet = await simpleStorage.getSnippet(id);
        console.log(`[GET_ONE] Found snippet with ID: ${id} using simpleStorage`);
        
        await storage.incrementSnippetViewCount(id);
        
        return res.json(snippet);
      } catch (simpleError) {
        console.log("[GET_ONE] SimpleStorage failed, trying storage", simpleError);
        
        try {
          const snippet = await storage.getSnippet(id);
          if (!snippet) {
            console.log(`[GET_ONE] Snippet not found with ID: ${id}`);
            return res.status(404).json({ message: "Snippet not found" });
          }
          
          console.log(`[GET_ONE] Found snippet with ID: ${id} using storage`);
          
          await storage.incrementSnippetViewCount(id);
          
          return res.json(snippet);
        } catch (storageError) {
          console.error("[GET_ONE] Storage also failed:", storageError);
          
          const client = await pool.connect();
          try {
            const result = await client.query(
              `SELECT id, title, code, language, description, tags, userid, createdat, updatedat, 
                      isfavorite, ispublic, shareid, viewcount 
               FROM snippets 
               WHERE id = $1`,
              [id]
            );
            
            if (result.rows.length === 0) {
              console.log(`[GET_ONE] Snippet not found with ID: ${id}`);
              return res.status(404).json({ message: "Snippet not found" });
            }
            
            const row = result.rows[0];
            console.log(`[GET_ONE] Found snippet with ID: ${row.id} directly from DB`);
            
            const snippet = {
              id: row.id,
              title: row.title,
              code: row.code,
              language: row.language,
              description: row.description,
              tags: row.tags || [],
              userId: row.userid,
              createdAt: row.createdat,
              updatedAt: row.updatedat,
              isFavorite: row.isfavorite,
              isPublic: row.ispublic,
              shareId: row.shareid,
              viewCount: row.viewcount
            };
            
            await client.query(
              `UPDATE snippets SET viewcount = viewcount + 1 WHERE id = $1`,
              [id]
            );
            
            return res.json(snippet);
          } catch (dbError) {
            console.error(`[GET_ONE] Database error for ID ${id}:`, dbError);
            throw dbError;
          } finally {
            client.release();
          }
        }
      }
    } catch (err: any) {
      console.error(`[GET_ONE] GET /api/snippets/${req.params.id} error:`, err);
      res.status(500).json({ 
        message: "Failed to get snippet", 
        error: err.message 
      });
    }
  });

  // CREATE new snippet (requires authentication)
  app.post("/api/snippets", authMiddleware, async (req, res) => {
    try {
      console.log("[CREATE] Create snippet request received");
      
      const userId = (req as any).user?.id;
      console.log("[CREATE] Auth user ID:", userId);
      
      if (!userId) {
        console.error("[CREATE] No user ID found in request");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      console.log("[CREATE] Request body:", JSON.stringify({
        title: req.body.title,
        language: req.body.language,
        codeLength: req.body.code ? req.body.code.length : 0,
        hasDescription: !!req.body.description,
        tagsCount: Array.isArray(req.body.tags) ? req.body.tags.length : 0
      }));
      
      if (!req.body.title || !req.body.code) {
        console.error("[CREATE] Missing required fields:", 
          JSON.stringify({ 
            hasTitle: !!req.body.title, 
            hasCode: !!req.body.code 
          })
        );
        return res.status(400).json({ 
          message: "Title and code are required" 
        });
      }
      
      const client = await pool.connect();
      
      try {
        const result = await client.query(
          `INSERT INTO snippets (
            title, code, language, description, userid, 
            createdat, updatedat, tags, isfavorite, ispublic
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $7, $8) 
          RETURNING id, title, code, language, description, tags, isfavorite, ispublic, createdat, updatedat`,
          [
            req.body.title, 
            req.body.code, 
            req.body.language || null,
            req.body.description || null,
            userId,
            Array.isArray(req.body.tags) ? req.body.tags : (req.body.tags ? [req.body.tags] : null),
            req.body.isFavorite === true,
            req.body.isPublic === true
          ]
        );
        
        if (result.rows.length === 0) {
          throw new Error("Failed to create snippet");
        }
        
        const createdSnippet = result.rows[0];
        console.log("[CREATE] Snippet created successfully with ID:", createdSnippet.id);
        
        const responseSnippet = {
          id: createdSnippet.id,
          title: createdSnippet.title,
          code: createdSnippet.code,
          language: createdSnippet.language,
          description: createdSnippet.description,
          tags: createdSnippet.tags,
          userId: userId,
          isFavorite: createdSnippet.isfavorite,
          isPublic: createdSnippet.ispublic,
          createdAt: createdSnippet.createdat,
          updatedAt: createdSnippet.updatedat
        };
        
        res.status(201).json(responseSnippet);
      } catch (dbError: any) {
        console.error("[CREATE] Database error:", dbError);
        res.status(500).json({ message: "Database error", error: dbError.message });
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("[CREATE] POST /api/snippets error:", err);
      res.status(500).json({ 
        message: "Failed to create snippet", 
        error: err.message 
      });
    }
  });

  // UPDATE snippet (requires authentication)
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

  // DELETE snippet (requires authentication)
  app.delete("/api/snippets/:id", authMiddleware, async (req, res) => {
    try {
      console.log(`[DELETE] Delete snippet request received for ID: ${req.params.id}`);
      
      const userId = (req as any).user?.id;
      console.log("[DELETE] Auth user ID:", userId);
      
      if (!userId) {
        console.error("[DELETE] No user ID found in request");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = Number(req.params.id);
      
      const client = await pool.connect();
      
      try {
        const checkResult = await client.query(
          `SELECT id, userid FROM snippets WHERE id = $1`,
          [id]
        );
        
        if (checkResult.rows.length === 0) {
          console.log(`[DELETE] Snippet not found with ID: ${id}`);
          return res.status(404).json({ message: "Snippet not found" });
        }
        
        const snippet = checkResult.rows[0];
        
        if (snippet.userid !== userId) {
          console.log(`[DELETE] Forbidden - snippet ${id} belongs to ${snippet.userid}, not ${userId}`);
          return res.status(403).json({ message: "Forbidden: you don't own this snippet" });
        }
        
        await client.query(
          `DELETE FROM snippets WHERE id = $1`,
          [id]
        );
        
        console.log(`[DELETE] Snippet ${id} successfully deleted`);
        res.status(204).send();
      } catch (dbError: any) {
        console.error(`[DELETE] Database error for ID ${id}:`, dbError);
        res.status(500).json({ message: "Database error", error: dbError.message });
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error(`[DELETE] DELETE /api/snippets/${req.params.id} error:`, err);
      res.status(500).json({ 
        message: "Failed to delete snippet", 
        error: err.message 
      });
    }
  });

  // TOGGLE FAVORITE (requires authentication)
  app.post("/api/snippets/:id/favorite", authMiddleware, async (req, res) => {
    try {
      console.log(`[FAVORITE] Toggle favorite request received for ID: ${req.params.id}`);
      
      const userId = (req as any).user?.id;
      console.log("[FAVORITE] Auth user ID:", userId);
      
      if (!userId) {
        console.error("[FAVORITE] No user ID found in request");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = Number(req.params.id);
      
      const client = await pool.connect();
      
      try {
        const checkResult = await client.query(
          `SELECT id, userid, isfavorite FROM snippets WHERE id = $1`,
          [id]
        );
        
        if (checkResult.rows.length === 0) {
          console.log(`[FAVORITE] Snippet not found with ID: ${id}`);
          return res.status(404).json({ message: "Snippet not found" });
        }
        
        const snippet = checkResult.rows[0];
        
        if (snippet.userid !== userId) {
          console.log(`[FAVORITE] Forbidden - snippet ${id} belongs to ${snippet.userid}, not ${userId}`);
          return res.status(403).json({ message: "Forbidden: you don't own this snippet" });
        }
        
        const newFavoriteStatus = !snippet.isfavorite;
        
        const updateResult = await client.query(
          `UPDATE snippets 
           SET isfavorite = $1, updatedat = NOW()
           WHERE id = $2
           RETURNING id, title, code, language, description, tags, userid, createdat, updatedat, isfavorite, ispublic, shareid, viewcount`,
          [newFavoriteStatus, id]
        );
        
        const updatedSnippet = updateResult.rows[0];
        console.log(`[FAVORITE] Snippet ${id} favorite status toggled to ${newFavoriteStatus}`);
        
        const responseSnippet = {
          id: updatedSnippet.id,
          title: updatedSnippet.title,
          code: updatedSnippet.code,
          language: updatedSnippet.language,
          description: updatedSnippet.description,
          tags: updatedSnippet.tags || [],
          userId: updatedSnippet.userid,
          createdAt: updatedSnippet.createdat,
          updatedAt: updatedSnippet.updatedat,
          isFavorite: updatedSnippet.isfavorite,
          isPublic: updatedSnippet.ispublic,
          shareId: updatedSnippet.shareid,
          viewCount: updatedSnippet.viewcount
        };
        
        res.json(responseSnippet);
      } catch (dbError: any) {
        console.error(`[FAVORITE] Database error for ID ${id}:`, dbError);
        res.status(500).json({ message: "Database error", error: dbError.message });
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error(`[FAVORITE] POST /api/snippets/${req.params.id}/favorite error:`, err);
      res.status(500).json({ 
        message: "Failed to toggle favorite status", 
        error: err.message 
      });
    }
  });

  // IMPORT SNIPPETS (requires authentication)
  app.post("/api/snippets/import", authMiddleware, async (req, res) => {
    try {
      console.log("[IMPORT] Import request received");
      
      const userId = (req as any).user?.id;
      console.log("[IMPORT] Auth user ID:", userId);
      
      if (!userId) {
        console.error("[IMPORT] No user ID found in request");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      console.log("[IMPORT] Request body structure:", JSON.stringify({
        snippetsArrayLength: Array.isArray(req.body.snippets) ? req.body.snippets.length : 'not an array',
        firstSnippetSample: Array.isArray(req.body.snippets) && req.body.snippets.length > 0 
          ? { title: req.body.snippets[0].title, language: req.body.snippets[0].language } 
          : 'no snippets'
      }));
      
      const { snippets } = req.body;
      
      if (!Array.isArray(snippets)) {
        console.error("[IMPORT] Invalid input: snippets is not an array");
        return res.status(400).json({ 
          message: "Invalid input: snippets must be an array" 
        });
      }
      
      console.log(`[IMPORT] Processing ${snippets.length} snippets for import`);
      
      const importResults = {
        success: [],
        failed: []
      };
      
      const client = await pool.connect();
      
      for (let i = 0; i < snippets.length; i++) {
        try {
          const snippetData = snippets[i];
          console.log(`[IMPORT] Processing snippet ${i+1}/${snippets.length}:`, 
            JSON.stringify({
              title: snippetData.title || 'untitled',
              language: snippetData.language || 'unknown',
              codeLength: snippetData.code ? snippetData.code.length : 0,
              hasDescription: !!snippetData.description,
              tagsCount: Array.isArray(snippetData.tags) ? snippetData.tags.length : 0
            })
          );
          
          if (!snippetData.title || !snippetData.code) {
            console.error(`[IMPORT] Snippet ${i+1} missing required fields:`, 
              JSON.stringify({ 
                hasTitle: !!snippetData.title, 
                hasCode: !!snippetData.code 
              })
            );
            importResults.failed.push({ 
              index: i, 
              title: snippetData.title || 'untitled',
              reason: "Missing required fields" 
            });
            continue;
          }
          
          try {
            const result = await client.query(
              `INSERT INTO snippets (
                title, code, language, description, userid, 
                createdat, updatedat, tags, isfavorite, ispublic
              ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $7, $8) 
              RETURNING id, title`,
              [
                snippetData.title, 
                snippetData.code, 
                snippetData.language || null,
                snippetData.description || null,
                userId,
                Array.isArray(snippetData.tags) ? snippetData.tags : null,
                typeof snippetData.isFavorite === 'boolean' ? snippetData.isFavorite : false,
                typeof snippetData.isPublic === 'boolean' ? snippetData.isPublic : false
              ]
            );
            
            console.log(`[IMPORT] Snippet ${i+1} created successfully with ID:`, result.rows[0].id);
            importResults.success.push(result.rows[0]);
          } catch (dbError: any) {
            console.error(`[IMPORT] Database error for snippet ${i+1}:`, dbError);
            importResults.failed.push({ 
              index: i, 
              title: snippetData.title,
              reason: dbError.message 
            });
            continue;
          }
        } catch (snippetError: any) {
          console.error(`[IMPORT] Error processing snippet ${i+1}:`, snippetError);
          importResults.failed.push({ 
            index: i, 
            title: snippets[i]?.title || 'unknown',
            reason: snippetError.message 
          });
        }
      }
      
      client.release();
      
      console.log("[IMPORT] Import completed. Results:", JSON.stringify({
        successCount: importResults.success.length,
        failedCount: importResults.failed.length
      }));
      
      res.status(201).json({ 
        message: `Successfully imported ${importResults.success.length} snippets. ${importResults.failed.length > 0 ? `Failed to import ${importResults.failed.length} snippets.` : ''}`, 
        success: importResults.success.map(s => ({ id: s.id, title: s.title })),
        failed: importResults.failed
      });
    } catch (err: any) {
      console.error("[IMPORT] POST /api/snippets/import error:", err);
      res.status(500).json({ 
        message: "Failed to import snippets", 
        error: err.message 
      });
    }
  }); 

  // TEST IMPORT ENDPOINT (no auth required - for testing only)
  app.post("/api/test-import", async (req, res) => {
    console.log("TEST IMPORT ENDPOINT HIT");
    try {
      console.log("Request body:", JSON.stringify(req.body));
      
      const { snippets } = req.body;
      
      if (!Array.isArray(snippets)) {
        console.error("Invalid input: snippets is not an array");
        return res.status(400).json({ 
          message: "Invalid input: snippets must be an array" 
        });
      }
      
      console.log(`Processing ${snippets.length} snippets for import`);
      
      const testSnippet = snippets[0];
      
      if (!testSnippet) {
        return res.status(400).json({ message: "No snippets provided" });
      }
      
      const client = await pool.connect();
      try {
        const result = await client.query(
          `INSERT INTO snippets (title, code, language, userid, createdat, updatedat, tags, isfavorite, ispublic) 
           VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7) RETURNING id, title`,
          [
            testSnippet.title, 
            testSnippet.code, 
            testSnippet.language || null,
            'test-user-id',
            Array.isArray(testSnippet.tags) ? testSnippet.tags : null,
            false,
            false
          ]
        );
        
        console.log("Direct DB insert result:", result.rows[0]);
        
        res.status(201).json({ 
          message: "Test import successful", 
          snippet: result.rows[0]
        });
      } catch (dbError: any) {
        console.error("Database error:", dbError);
        res.status(500).json({ message: "Database error", error: dbError.message });
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("TEST IMPORT error:", err);
      res.status(500).json({ 
        message: "Test import failed", 
        error: err.message 
      });
    }
  });

  // ────────────────────────────────────────────────────────────────
  // ─── 3.3) Languages & Tags ─────────────────────────────────────────
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
    } catch (err: any) {
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
    } catch (err: any) {
      console.error("[TAGS] GET /api/tags error:", err);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // ────────────────────────────────────────────────────────────────
  // ─── 3.4) Collections ────────────────────────────────────────────
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
    } catch (err: any) {
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
    } catch (err: any) {
      console.error("[COLLECTIONS] GET /api/collections/:id error:", err);
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  app.get("/api/collections/:id/snippets", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const list = await storage.getCollectionSnippets(id);
      res.json(list);
    } catch (err: any) {
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
    } catch (err: any) {
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
      } catch (err: any) {
        console.error(
          "[COLLECTION ITEMS] DELETE /api/collections/:collectionId/snippets/:snippetId error:",
          err
        );
        res.status(500).json({ message: "Failed to remove snippet from collection" });
      }
    }
  );

  // ────────────────────────────────────────────────────────────────
  // ─── 3.5) Sharing & Publishing ─────────────────────────────────────
  // ────────────────────────────────────────────────────────────────
  app.get("/api/shared/:shareId", async (req, res) => {
    try {
      const shareId = req.params.shareId;
      const snippet = await storage.getSnippetByShareId(shareId);
      if (!snippet) return res.status(404).json({ message: "Not found" });
      if (!snippet.isPublic) return res.status(403).json({ message: "Forbidden" });
      await storage.incrementSnippetViewCount(snippet.id);
      res.json(snippet);
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      console.error("[PUBLISH] POST /api/snippets/:id/publish error:", err);
      res.status(500).json({ message: "Failed to publish snippet" });
    }
  });

  // ────────────────────────────────────────────────────────────────
  // ─── 3.6) Comments ───────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────
  app.get("/api/snippets/:snippetId/comments", async (req, res) => {
    try {
      const snippetId = Number(req.params.snippetId);
      const comments = await storage.getCommentsBySnippetId(snippetId);
      res.json(comments);
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      console.error("[COMMENTS] DELETE /api/comments/:id error:", err);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

// Catch-All 404 only for /api/* routes
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

  // ────────────────────────────────────────────────────────────────
  // ─── Finally, create and return the HTTP server ───────────────────
  // ────────────────────────────────────────────────────────────────
  const httpServer = createServer(app);
  return httpServer;
}
