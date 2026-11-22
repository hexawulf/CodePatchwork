import type { Express } from "express";
import { z } from "zod";
import { insertSnippetSchema } from "@shared/schema";
import { storage } from "../storage";
import logger from "../logger";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import {
  HttpError,
  asyncHandler,
  buildSnippetFilters,
  canViewSnippet,
  parseId,
  requireOwnedSnippet,
  snippetFilename,
} from "./helpers";

const tagsInputSchema = z
  .union([z.array(z.string()), z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string" && val.length > 0) return [val];
    return null;
  });

const createSnippetSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  code: z.string().min(1, "Code is required"),
  language: z.string().trim().min(1).optional().default("text"),
  description: z.string().nullable().optional(),
  tags: tagsInputSchema.optional().default(null),
  isFavorite: z.boolean().optional().default(false),
  isPublic: z.boolean().optional().default(false),
});

const updateSnippetSchema = insertSnippetSchema.omit({ userId: true });

function bumpViewCount(id: number): void {
  storage.incrementSnippetViewCount(id).catch((err: unknown) => {
    logger.warn(`Failed to increment view count for snippet ${id}:`, err instanceof Error ? err.message : String(err));
  });
}

export function registerSnippetRoutes(app: Express): void {
  // ─── Authenticated Snippets ───────────────────────────────────

  app.get(
    "/api/snippets",
    authMiddleware,
    asyncHandler("GET /api/snippets", "Failed to get snippets", async (req, res) => {
      const filters = buildSnippetFilters(req.query, { userId: req.user!.id });
      const list = await storage.getSnippets(filters);
      res.json(list);
    }),
  );

  // Registered before /api/snippets/:id so "export" is not read as an id.
  app.get(
    "/api/snippets/export",
    authMiddleware,
    asyncHandler("GET /api/snippets/export", "Failed to export snippets", async (req, res) => {
      const list = await storage.getSnippets({ userId: req.user!.id });
      res.json(
        list.map((s) => ({
          title: s.title,
          description: s.description,
          code: s.code,
          language: s.language,
          tags: s.tags ?? [],
          isFavorite: s.isFavorite === true,
          isPublic: s.isPublic === true,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        })),
      );
    }),
  );

  app.post(
    "/api/snippets/import",
    authMiddleware,
    asyncHandler("POST /api/snippets/import", "Failed to import snippets", async (req, res) => {
      const userId = req.user!.id;
      const { snippets } = req.body ?? {};

      if (!Array.isArray(snippets)) {
        throw new HttpError(400, "Invalid input: snippets must be an array");
      }

      const success: { id: number; title: string }[] = [];
      const failed: { index: number; title: string; reason: string }[] = [];

      for (let i = 0; i < snippets.length; i++) {
        const s = snippets[i];
        if (!s || typeof s.title !== "string" || !s.title.trim() || typeof s.code !== "string" || !s.code) {
          failed.push({
            index: i,
            title: typeof s?.title === "string" && s.title ? s.title : "untitled",
            reason: "Missing required fields",
          });
          continue;
        }
        try {
          const created = await storage.createSnippet({
            title: s.title,
            code: s.code,
            language: typeof s.language === "string" && s.language ? s.language : "text",
            description: typeof s.description === "string" && s.description ? s.description : null,
            tags: Array.isArray(s.tags)
              ? s.tags.filter((t: unknown): t is string => typeof t === "string")
              : null,
            userId,
            isFavorite: s.isFavorite === true,
            isPublic: s.isPublic === true,
          });
          success.push({ id: created.id, title: created.title });
        } catch (err: unknown) {
          failed.push({
            index: i,
            title: s.title,
            reason: err instanceof Error ? err.message : String(err),
          });
        }
      }

      const msg =
        `Successfully imported ${success.length} snippets.` +
        (failed.length > 0 ? ` Failed to import ${failed.length} snippets.` : "");
      res.status(201).json({ message: msg, success, failed });
    }),
  );

  app.get(
    "/api/snippets/:id",
    optionalAuthMiddleware,
    asyncHandler("GET /api/snippets/:id", "Failed to get snippet", async (req, res) => {
      const id = parseId(req.params.id);
      const snippet = await storage.getSnippet(id);
      if (!snippet || !canViewSnippet(snippet, req.user)) {
        throw new HttpError(404, "Snippet not found");
      }
      bumpViewCount(id);
      res.json(snippet);
    }),
  );

  app.get(
    "/api/snippets/:id/collections",
    authMiddleware,
    asyncHandler("GET /api/snippets/:id/collections", "Failed to fetch snippet collections", async (req, res) => {
      const id = parseId(req.params.id);
      const snippet = await storage.getSnippet(id);
      if (!snippet || !canViewSnippet(snippet, req.user)) {
        throw new HttpError(404, "Snippet not found");
      }
      const collectionIds = await storage.getSnippetCollectionIds(id, req.user!.id);
      res.json({ collectionIds });
    }),
  );

  app.post(
    "/api/snippets",
    authMiddleware,
    asyncHandler("POST /api/snippets", "Failed to create snippet", async (req, res) => {
      const parsed = createSnippetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Title and code are required", errors: parsed.error.issues });
      }
      const snippet = await storage.createSnippet({
        title: parsed.data.title,
        code: parsed.data.code,
        language: parsed.data.language,
        description: parsed.data.description || null,
        tags: parsed.data.tags,
        userId: req.user!.id,
        isFavorite: parsed.data.isFavorite,
        isPublic: parsed.data.isPublic,
      });
      res.status(201).json(snippet);
    }),
  );

  app.put(
    "/api/snippets/:id",
    authMiddleware,
    asyncHandler("PUT /api/snippets/:id", "Failed to update snippet", async (req, res) => {
      const id = parseId(req.params.id);
      await requireOwnedSnippet(id, req.user!.id, "Not found");
      const dto = updateSnippetSchema.parse(req.body);
      const updated = await storage.updateSnippet(id, dto);
      res.json(updated);
    }),
  );

  app.delete(
    "/api/snippets/:id",
    authMiddleware,
    asyncHandler("DELETE /api/snippets/:id", "Failed to delete snippet", async (req, res) => {
      const id = parseId(req.params.id);
      await requireOwnedSnippet(id, req.user!.id);
      await storage.deleteSnippet(id);
      res.status(204).send();
    }),
  );

  // ─── Favorites, Sharing & Publishing ──────────────────────────

  app.post(
    "/api/snippets/:id/favorite",
    authMiddleware,
    asyncHandler("POST /api/snippets/:id/favorite", "Failed to toggle favorite status", async (req, res) => {
      const id = parseId(req.params.id);
      await requireOwnedSnippet(id, req.user!.id);
      const updated = await storage.toggleSnippetFavorite(id);
      res.json(updated);
    }),
  );

  app.post(
    "/api/snippets/:id/share",
    authMiddleware,
    asyncHandler("POST /api/snippets/:id/share", "Failed to share snippet", async (req, res) => {
      const id = parseId(req.params.id);
      const existing = await requireOwnedSnippet(id, req.user!.id, "Not found");
      const shareId = existing.shareId || (await storage.generateShareId(id));
      res.json({ shareId });
    }),
  );

  app.post(
    "/api/snippets/:id/publish",
    authMiddleware,
    asyncHandler("POST /api/snippets/:id/publish", "Failed to publish snippet", async (req, res) => {
      const id = parseId(req.params.id);
      await requireOwnedSnippet(id, req.user!.id, "Not found");
      const updated = await storage.toggleSnippetPublic(id);
      res.json(updated);
    }),
  );

  app.get(
    "/api/shared/:shareId/raw",
    asyncHandler("GET /api/shared/:shareId/raw", "Failed to fetch raw shared snippet", async (req, res) => {
      const snippet = await storage.getSnippetByShareId(req.params.shareId);
      if (!snippet) throw new HttpError(404, "Not found");
      if (!snippet.isPublic) throw new HttpError(403, "Forbidden");
      bumpViewCount(snippet.id);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `inline; filename="${snippetFilename(snippet.title, snippet.language)}"`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.send(snippet.code);
    }),
  );

  app.get(
    "/api/shared/:shareId",
    asyncHandler("GET /api/shared/:shareId", "Failed to fetch shared snippet", async (req, res) => {
      const snippet = await storage.getSnippetByShareId(req.params.shareId);
      if (!snippet) throw new HttpError(404, "Not found");
      if (!snippet.isPublic) throw new HttpError(403, "Forbidden");
      bumpViewCount(snippet.id);
      res.json(snippet);
    }),
  );

  // ─── Public Snippets ──────────────────────────────────────────

  app.get(
    "/api/public/snippets",
    asyncHandler("GET /api/public/snippets", "Failed to get public snippets", async (req, res) => {
      const filters = buildSnippetFilters(req.query, { isPublic: true });
      delete filters.favorites;
      const snippets = await storage.getSnippets(filters);
      res.json(snippets);
    }),
  );

  app.get(
    "/api/public/snippets/:id",
    asyncHandler("GET /api/public/snippets/:id", "Failed to get public snippet", async (req, res) => {
      const id = parseId(req.params.id);
      const snippet = await storage.getSnippet(id);
      if (!snippet || !snippet.isPublic) {
        throw new HttpError(404, "Snippet not found or not public");
      }
      res.json(snippet);
    }),
  );

  // ─── Languages, Tags & Library Meta ───────────────────────────

  app.get(
    "/api/meta",
    optionalAuthMiddleware,
    asyncHandler("GET /api/meta", "Failed to fetch library metadata", async (req, res) => {
      const meta = await storage.getMeta(req.user?.id);
      res.json(meta);
    }),
  );

  app.get(
    "/api/languages",
    optionalAuthMiddleware,
    asyncHandler("GET /api/languages", "Failed to fetch languages", async (req, res) => {
      const langs = await storage.getLanguages(req.user?.id);
      res.json(langs);
    }),
  );

  app.get(
    "/api/tags",
    optionalAuthMiddleware,
    asyncHandler("GET /api/tags", "Failed to fetch tags", async (req, res) => {
      const tags = await storage.getTags(req.user?.id);
      res.json(tags);
    }),
  );
}
