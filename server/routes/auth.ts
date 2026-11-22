import type { Express } from "express";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { storage } from "../storage";
import logger from "../logger";
import { authMiddleware } from "../middleware/auth";

export function registerAuthRoutes(app: Express): void {
  app.post("/api/auth/user", async (req, res) => {
    // The user row is built only from a verified Firebase ID token. Fields
    // sent alongside it (uid, email, ...) are ignored.
    const idToken = req.body?.idToken;
    if (typeof idToken !== "string" || idToken === "") {
      return res.status(400).json({ message: "Missing idToken in request body" });
    }

    let decoded: DecodedIdToken;
    try {
      decoded = await getAuth().verifyIdToken(idToken);
    } catch (err: unknown) {
      logger.error("/api/auth/user token error:", err instanceof Error ? err.message : String(err));
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    try {
      const user = await storage.upsertUser({
        id: decoded.uid,
        email: decoded.email ?? null,
        displayName: decoded.name ?? null,
        photoURL: decoded.picture ?? null,
      });
      return res.status(201).json(user);
    } catch (err: unknown) {
      logger.error("/api/auth/user error:", err instanceof Error ? err.message : String(err));
      return res.status(500).json({ message: "Auth + upsert failed" });
    }
  });

  app.get("/api/auth/me", authMiddleware, (req, res) => {
    res.json(req.user);
  });
}
