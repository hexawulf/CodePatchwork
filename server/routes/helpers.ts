import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";
import type { Collection, Comment, Snippet, User } from "@shared/schema";
import { storage, type SnippetFilters } from "../storage";
import logger from "../logger";

const MAX_ID = 2147483647; // Postgres 32-bit serial

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function isValidId(raw: string): boolean {
  if (!/^[0-9]{1,10}$/.test(raw)) return false;
  const id = Number(raw);
  return id >= 1 && id <= MAX_ID;
}

export function parseId(raw: string): number {
  if (!isValidId(raw)) {
    throw new HttpError(400, "Invalid ID");
  }
  return Number(raw);
}

/** A query value is used only when it is a non-empty string or a list of strings. */
export function queryStrings(value: unknown): string | string[] | undefined {
  if (typeof value === "string") return value || undefined;
  if (Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === "string")) {
    return value as string[];
  }
  return undefined;
}

/** Build validated snippet filters from Express query params. */
export function buildSnippetFilters(
  query: Request["query"],
  base: SnippetFilters = {},
): SnippetFilters {
  const filters: SnippetFilters = { ...base };
  if (typeof query.search === "string" && query.search) {
    filters.search = query.search;
  }
  const language = queryStrings(query.language);
  if (language) filters.language = language;
  const tag = queryStrings(query.tag);
  if (tag) filters.tag = tag;
  if (query.favorites === "true") filters.favorites = true;
  return filters;
}

/** Owner always; anyone else only when the snippet is public. */
export function canViewSnippet(snippet: Snippet, user: User | undefined): boolean {
  return snippet.isPublic === true || (!!user && snippet.userId === user.id);
}

/** Wrap an async route handler with consistent Zod / HttpError / 500 handling. */
export function asyncHandler(
  label: string,
  fallbackMessage: string,
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        return res.status(err.status).json({ message: err.message });
      }
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: err.errors });
      }
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`${label} error:`, message);
      if (!res.headersSent) {
        res.status(500).json({ message: fallbackMessage });
      }
    }
  };
}

export async function requireOwnedSnippet(
  id: number,
  userId: string,
  notFoundMessage = "Snippet not found",
): Promise<Snippet> {
  const existing = await storage.getSnippet(id);
  if (!existing) throw new HttpError(404, notFoundMessage);
  if (existing.userId !== userId) throw new HttpError(403, "Forbidden");
  return existing;
}

export async function requireOwnedCollection(id: number, userId: string): Promise<Collection> {
  const existing = await storage.getCollection(id);
  if (!existing) throw new HttpError(404, "Not found");
  if (existing.userId !== userId) throw new HttpError(403, "Forbidden");
  return existing;
}

export async function requireOwnedComment(id: number, userId: string): Promise<Comment> {
  const existing = await storage.getComment(id);
  if (!existing) throw new HttpError(404, "Not found");
  if (existing.userId !== userId) throw new HttpError(403, "Forbidden");
  return existing;
}
