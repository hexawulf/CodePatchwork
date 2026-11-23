import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { apiLimiter, authLimiter, writeLimiter } from "./middleware/rateLimit";
import logger from "./logger";

if (process.env.NODE_ENV === "production") {
  console.log = () => {};
}

/* ── 1. Firebase Admin setup ──────────────────────────────────── */
const credentialsEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (credentialsEnv) {
  const svcPath = path.resolve(process.cwd(), credentialsEnv);
  if (!fs.existsSync(svcPath)) {
    logger.error(`Service account JSON not found at ${svcPath}. Aborting.`);
    process.exit(1);
  }
  const serviceAccount = JSON.parse(fs.readFileSync(svcPath, { encoding: "utf-8" }));
  initializeApp({
    credential: cert(serviceAccount),
  });
} else if (process.env.NODE_ENV === "test") {
  // Test/E2E harness without service account credentials: public routes work,
  // while authenticated routes still fail closed (401).
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "codepatchwork-test",
  });
} else {
  logger.error("GOOGLE_APPLICATION_CREDENTIALS is not set. Aborting.");
  process.exit(1);
}

/* ── 2. Express setup ─────────────────────────────────────────── */
const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

/* ── 3. Helmet security headers ───────────────────────────────── */
const frameSrc = [
  "https://accounts.google.com",
  "https://*.firebaseapp.com",
  ...(process.env.VITE_FIREBASE_AUTH_DOMAIN
    ? [`https://${process.env.VITE_FIREBASE_AUTH_DOMAIN}`]
    : []),
];

app.use(
  helmet({
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
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
        frameSrc,
        imgSrc: ["'self'", "data:", "https://*.googleusercontent.com"],
      },
    },
  }),
);

/* ── 4. Ensure API responses are always JSON + rate limiting ──── */
app.use("/api", (_req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);
app.use("/api", writeLimiter);

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

  app.use((err: Error & { status?: number }, req: Request, res: Response, _next: NextFunction) => {
    logger.error(`${req.method} ${req.path}:`, err.stack || err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        message:
          process.env.NODE_ENV === "production"
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
  // Loopback only: nginx on the same host is the only client. Set HOST to override.
  const host = process.env.HOST || "127.0.0.1";
  server.listen({ host, port, reusePort: true }, () => {
    logger.info(`Serving on ${host}:${port}`);
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
