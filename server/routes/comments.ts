import type { Express } from "express";
import { z } from "zod";
import { insertCommentSchema } from "@shared/schema";
import { storage } from "../storage";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import {
  HttpError,
  asyncHandler,
  canViewSnippet,
  parseId,
  requireOwnedComment,
} from "./helpers";

const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(10000),
});

export function registerCommentRoutes(app: Express): void {
  app.get(
    "/api/snippets/:snippetId/comments",
    optionalAuthMiddleware,
    asyncHandler("GET /api/snippets/:id/comments", "Failed to fetch comments", async (req, res) => {
      const snippetId = parseId(req.params.snippetId);
      const snippet = await storage.getSnippet(snippetId);
      if (!snippet || !canViewSnippet(snippet, req.user)) {
        throw new HttpError(404, "Snippet not found");
      }
      const comments = await storage.getCommentsBySnippetId(snippetId);
      res.json(comments);
    }),
  );

  app.post(
    "/api/snippets/:snippetId/comments",
    authMiddleware,
    asyncHandler("POST /api/snippets/:id/comments", "Failed to create comment", async (req, res) => {
      const snippetId = parseId(req.params.snippetId);
      const snippet = await storage.getSnippet(snippetId);
      if (!snippet || !canViewSnippet(snippet, req.user)) {
        throw new HttpError(404, "Snippet not found");
      }
      const dto = insertCommentSchema.parse({
        ...req.body,
        snippetId,
        userId: req.user!.id,
      });
      const created = await storage.createComment(dto);
      res.status(201).json(created);
    }),
  );

  app.put(
    "/api/comments/:id",
    authMiddleware,
    asyncHandler("PUT /api/comments/:id", "Failed to update comment", async (req, res) => {
      const id = parseId(req.params.id);
      await requireOwnedComment(id, req.user!.id);
      // Only the text may change; snippetId and userId are fixed at creation.
      const { content } = updateCommentSchema.parse(req.body);
      const updated = await storage.updateComment(id, { content });
      res.json(updated);
    }),
  );

  app.delete(
    "/api/comments/:id",
    authMiddleware,
    asyncHandler("DELETE /api/comments/:id", "Failed to delete comment", async (req, res) => {
      const id = parseId(req.params.id);
      await requireOwnedComment(id, req.user!.id);
      await storage.deleteComment(id);
      res.status(204).send();
    }),
  );
}
