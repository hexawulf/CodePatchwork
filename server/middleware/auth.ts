import type { Request, RequestHandler } from "express";
import admin from "firebase-admin";
import type { User } from "@shared/schema";
import { storage } from "../storage";
import logger from "../logger";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export type AuthenticatedRequest = Request & { user: User };

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
}

/** Auth middleware — verifies Firebase ID Token from Authorization header. */
export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const idToken = extractBearerToken(req);
    if (!idToken) {
      return res.status(401).json({ message: "Unauthorized: No token" });
    }
    const decoded = await admin.auth().verifyIdToken(idToken);
    const user = await storage.getUser(decoded.uid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Auth middleware error:", message);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

/** Optional auth — attaches user if a valid bearer token is present, continues regardless. */
export const optionalAuthMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const idToken = extractBearerToken(req);
    if (idToken) {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const user = await storage.getUser(decoded.uid);
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Silently continue without auth
  }
  next();
};
