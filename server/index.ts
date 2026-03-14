import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import logger from "./logger";
import "./logger.ts"; // force esbuild to preserve it

if (process.env.NODE_ENV === "production") {
  console.log = () => {};
}

logger.info("Winston logger loaded");

/* ── 1. Firebase Admin setup ──────────────────────────────────── */
const svcPath = path.resolve(
  process.cwd(),
  process.env.GOOGLE_APPLICATION_CREDENTIALS!
);
if (!fs.existsSync(svcPath)) {
  logger.error(`Service account JSON not found at ${svcPath}. Aborting.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(svcPath, { encoding: "utf-8" })
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/* ── 2. Express setup ─────────────────────────────────────────── */
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

/* ── 3. Helmet security headers ───────────────────────────────── */
app.use(
  helmet.crossOriginOpenerPolicy({ policy: "unsafe-none" }),
  helmet.crossOriginEmbedderPolicy({ policy: "unsafe-none" }),
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://www.gstatic.com",
        "https://apis.google.com",
        "https://*.firebaseio.com",
        "https://*.firebaseapp.com",
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: [
        "'self'",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://www.googleapis.com",
        "https://*.firebaseio.com",
        "https://*.firebaseapp.com",
      ],
      frameSrc: [
        "https://accounts.google.com",
        `https://${process.env.VITE_FIREBASE_AUTH_DOMAIN}`,
        "https://*.firebaseapp.com",
      ],
      imgSrc: ["'self'", "data:", "https://*.googleusercontent.com"],
    },
  })
);

/* ── 4. Ensure API responses are always JSON ──────────────────── */
app.use("/api", (_req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

/* ── 5. Request logging ───────────────────────────────────────── */
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const ms = Date.now() - t0;
      logger.info(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
});

/* ── 6. Route registration + boot ─────────────────────────────── */
(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    logger.error(`${req.method} ${req.path}:`, err.stack || err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        message: process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message || "Internal server error",
      });
    }
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 3001;
  server.listen({ host: "0.0.0.0", port, reusePort: true }, () => {
    logger.info(`Serving on port ${port}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
})().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
