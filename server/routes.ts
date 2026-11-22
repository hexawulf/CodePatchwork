import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import logger from "./logger";
import { isValidId } from "./routes/helpers";
import { registerAuthRoutes } from "./routes/auth";
import { registerSnippetRoutes } from "./routes/snippets";
import { registerCollectionRoutes } from "./routes/collections";
import { registerCommentRoutes } from "./routes/comments";

export { authMiddleware } from "./middleware/auth";
export { isValidId } from "./routes/helpers";

export async function registerRoutes(app: Express): Promise<Server> {
  // Malformed numeric ids are a client error, not a server error.
  for (const name of ["id", "snippetId", "collectionId"]) {
    app.param(name, (_req, res, next, value) => {
      if (!isValidId(String(value))) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      next();
    });
  }

  // ─── Health / Test ────────────────────────────────────────────
  app.get("/api/test", (_req, res) => {
    res.json({ message: "API test successful" });
  });

  app.get("/api/health", async (_req: Request, res: Response) => {
    try {
      const { pool } = await import("./db");
      const dbResult = await pool.query("SELECT NOW() as current_time");
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        dbTime: dbResult.rows[0].current_time,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Health check failed:", message);
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: message,
      });
    }
  });

  registerAuthRoutes(app);
  registerSnippetRoutes(app);
  registerCollectionRoutes(app);
  registerCommentRoutes(app);

  // ─── API 404 catch-all ────────────────────────────────────────
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  return createServer(app);
}
