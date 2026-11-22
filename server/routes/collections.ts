import type { Express } from "express";
import { insertCollectionItemSchema, insertCollectionSchema } from "@shared/schema";
import { storage } from "../storage";
import { authMiddleware } from "../middleware/auth";
import {
  HttpError,
  asyncHandler,
  canViewSnippet,
  parseId,
  requireOwnedCollection,
} from "./helpers";

const updateCollectionSchema = insertCollectionSchema.omit({ userId: true });

export function registerCollectionRoutes(app: Express): void {
  app.get(
    "/api/collections",
    authMiddleware,
    asyncHandler("GET /api/collections", "Failed to fetch collections", async (req, res) => {
      const cols = await storage.getCollections(req.user!.id);
      res.json(cols);
    }),
  );

  app.get(
    "/api/collections/:id",
    authMiddleware,
    asyncHandler("GET /api/collections/:id", "Failed to fetch collection", async (req, res) => {
      const id = parseId(req.params.id);
      const col = await requireOwnedCollection(id, req.user!.id);
      res.json(col);
    }),
  );

  app.get(
    "/api/collections/:id/snippets",
    authMiddleware,
    asyncHandler("GET /api/collections/:id/snippets", "Failed to fetch collection snippets", async (req, res) => {
      const id = parseId(req.params.id);
      await requireOwnedCollection(id, req.user!.id);
      const list = await storage.getCollectionSnippets(id);
      // A snippet that is not the caller's and not public is never returned,
      // even if an item row points at it.
      res.json(list.filter((s) => canViewSnippet(s, req.user)));
    }),
  );

  app.post(
    "/api/collections",
    authMiddleware,
    asyncHandler("POST /api/collections", "Failed to create collection", async (req, res) => {
      const dto = insertCollectionSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      const created = await storage.createCollection(dto);
      res.status(201).json(created);
    }),
  );

  app.put(
    "/api/collections/:id",
    authMiddleware,
    asyncHandler("PUT /api/collections/:id", "Failed to update collection", async (req, res) => {
      const id = parseId(req.params.id);
      await requireOwnedCollection(id, req.user!.id);
      const dto = updateCollectionSchema.parse(req.body);
      const updated = await storage.updateCollection(id, dto);
      res.json(updated);
    }),
  );

  app.delete(
    "/api/collections/:id",
    authMiddleware,
    asyncHandler("DELETE /api/collections/:id", "Failed to delete collection", async (req, res) => {
      const id = parseId(req.params.id);
      await requireOwnedCollection(id, req.user!.id);
      await storage.deleteCollection(id);
      res.status(204).send();
    }),
  );

  app.post(
    "/api/collections/:collectionId/snippets/:snippetId",
    authMiddleware,
    asyncHandler("POST /api/collections/:id/snippets/:id", "Failed to add snippet to collection", async (req, res) => {
      const collectionId = parseId(req.params.collectionId);
      const snippetId = parseId(req.params.snippetId);
      await requireOwnedCollection(collectionId, req.user!.id);
      const snippet = await storage.getSnippet(snippetId);
      if (!snippet || !canViewSnippet(snippet, req.user)) {
        throw new HttpError(404, "Snippet not found");
      }
      const dto = insertCollectionItemSchema.parse({ collectionId, snippetId });
      const created = await storage.addSnippetToCollection(dto);
      res.status(201).json(created);
    }),
  );

  app.delete(
    "/api/collections/:collectionId/snippets/:snippetId",
    authMiddleware,
    asyncHandler("DELETE /api/collections/:id/snippets/:id", "Failed to remove snippet from collection", async (req, res) => {
      const collectionId = parseId(req.params.collectionId);
      const snippetId = parseId(req.params.snippetId);
      await requireOwnedCollection(collectionId, req.user!.id);
      await storage.removeSnippetFromCollection(collectionId, snippetId);
      res.status(204).send();
    }),
  );
}
