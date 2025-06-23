// server/index.ts  –  Express bootstrap for CodePatchwork
/* ------------------------------------------------------------------ */

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import express, { Request, Response, NextFunction } from "express";
import camelCase from "camelcase";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import logger from "../src/logger.js";

/* ────────────────────────────────────────────────────────────────── */
/* 0. Verify & load your service-account JSON                        */
/* ────────────────────────────────────────────────────────────────── */
const svcPath = path.resolve(
  process.cwd(),
  process.env.GOOGLE_APPLICATION_CREDENTIALS!
);
logger.info(`→ SERVICE ACCOUNT path: ${svcPath}`);
logger.info(`→ Exists on disk?      ${fs.existsSync(svcPath)}`);
if (!fs.existsSync(svcPath)) {
  logger.error("❌ service account JSON not found. Aborting.");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(svcPath, { encoding: "utf-8" })
);

/* ────────────────────────────────────────────────────────────────── */
/* 1. Initialize Firebase Admin with explicit cert                   */
/* ────────────────────────────────────────────────────────────────── */
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/* ────────────────────────────────────────────────────────────────── */
/* 2. Express + Body parsers                                         */
/* ────────────────────────────────────────────────────────────────── */
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* ────────────────────────────────────────────────────────────────── */
/* 3. Security headers - Modified to fix Firebase auth                */
/* ────────────────────────────────────────────────────────────────── */
// Disable all helmet protections and apply only what we need
app.use(
  // Completely disable COOP and COEP policies for auth popups
  helmet.crossOriginOpenerPolicy({ policy: "unsafe-none" }),
  helmet.crossOriginEmbedderPolicy({ policy: "unsafe-none" }),
  
  // Apply minimum security headers to allow Firebase auth
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'",
        "'unsafe-eval'", // Needed for some Firebase operations
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

/* ────────────────────────────────────────────────────────────────── */
/* 4. CRITICAL FIX: JSON-only middleware for ALL API routes          */
/* ────────────────────────────────────────────────────────────────── */
app.use('/api', (req, res, next) => {
  logger.info(`[API] ${req.method} ${req.path} - Request received`);
  
  // Force Content-Type to application/json for all API responses
  res.setHeader('Content-Type', 'application/json');
  
  // Override Express's default error handling to ensure JSON responses
  const originalSend = res.send;
  const originalStatus = res.status;
  
  // Ensure res.send always returns JSON for API routes
  res.send = function(data: any) {
    // If Express tries to send HTML (like error pages), convert to JSON
    if (typeof data === 'string' && (data.includes('<!DOCTYPE') || data.includes('<html>'))) {
      logger.info(`[API] 🚨 Converting HTML response to JSON for ${req.method} ${req.path}`);
      this.setHeader('Content-Type', 'application/json');
      return originalSend.call(this, JSON.stringify({
        message: "API endpoint error",
        error: "An error occurred while processing your request",
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      }));
    }
    return originalSend.call(this, data);
  };
  
  // Override res.status to ensure chaining works with JSON
  res.status = function(statusCode: number) {
    const result = originalStatus.call(this, statusCode);
    
    // If someone calls res.status().send() with HTML, intercept it
    const newSend = result.send;
    result.send = function(data: any) {
      if (typeof data === 'string' && (data.includes('<!DOCTYPE') || data.includes('<html>'))) {
        logger.info(`[API] 🚨 Converting status ${statusCode} HTML to JSON for ${req.method} ${req.path}`);
        this.setHeader('Content-Type', 'application/json');
        return originalSend.call(this, JSON.stringify({
          message: "API Error",
          error: `HTTP ${statusCode} Error`,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        }));
      }
      return newSend.call(this, data);
    };
    
    return result;
  };
  
  next();
});

/* ────────────────────────────────────────────────────────────────── */
/* 5. Normalize /api/snippets payload (snake → camel, ISO dates)     */
/* ────────────────────────────────────────────────────────────────── */
app.use("/api/snippets", (_req, res, next) => {
  type Row = Record<string, unknown>;
  const rename = { createdat: "createdAt", updatedat: "updatedAt" } as const;
  const origJson = res.json.bind(res);

  res.json = (body) => {
    if (Array.isArray(body)) {
      const fixed = body.map((row: Row) => {
        const out: Row = {};
        for (const [k, v] of Object.entries(row)) {
          const key = rename[k as keyof typeof rename] ?? camelCase(k);
          out[key] =
            (key === "createdAt" || key === "updatedAt") && v != null
              ? new Date(v as string).toISOString()
              : v;
        }
        return out;
      });
      return origJson(fixed);
    }
    return origJson(body as any);
  };

  next();
});

/* ────────────────────────────────────────────────────────────────── */
/* 6. Simple API request logger                                      */
/* ────────────────────────────────────────────────────────────────── */
app.use((req, res, next) => {
  const t0 = Date.now();
  let payload: any;
  const orig = res.json.bind(res);

  res.json = (body, ...args) => {
    payload = body;
    return orig(body, ...args);
  };

  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const ms = Date.now() - t0;
      let msg = `${req.method} ${req.path} ${res.statusCode} in ${ms}ms`;
      if (payload) msg += ` :: ${JSON.stringify(payload)}`;
      if (msg.length > 80) msg = msg.slice(0, 79) + "…";
      log(msg);
    }
  });

  next();
});

/* ────────────────────────────────────────────────────────────────── */
/* 7. Route registration                                              */
/* ────────────────────────────────────────────────────────────────── */
(async () => {
  logger.info("🔧 Starting route registration...");
  const server = await registerRoutes(app);
  logger.info("✅ Route registration complete");

  /* ──────────────────────────────────────────────────────────────── */
  /* 8. 404 Handler for unmatched API routes - MUST BE BEFORE GLOBAL  */
  /* ──────────────────────────────────────────────────────────────── */
  app.use('/api/*', (req, res) => {
    logger.info(`[404] API route not found: ${req.method} ${req.path}`);
    res.status(404).json({ 
      message: "API endpoint not found",
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      availableEndpoints: [
        "GET /api/test",
        "GET /api/snippets",
        "GET /api/snippets/:id",
        "POST /api/snippets",
        "PUT /api/snippets/:id", 
        "DELETE /api/snippets/:id",
        "POST /api/snippets/:id/favorite",
        "GET /api/languages",
        "GET /api/tags",
        "POST /api/auth/user",
        "GET /api/auth/me"
      ]
    });
  });

  /* ──────────────────────────────────────────────────────────────── */
  /* 9. Enhanced global error handler - MUST BE AFTER 404 HANDLER     */
  /* ──────────────────────────────────────────────────────────────── */
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(`[💥 GLOBAL ERROR] ${req.method} ${req.path}:`, err.stack || err);
    
    // Ensure we don't send if headers already sent
    if (!res.headersSent) {
      // Always return JSON for API routes
      if (req.path.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json');
        res.status(err.status || 500).json({
          message: err.message || "Internal server error",
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
          error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.stack
        });
      } else {
        // For non-API routes, use your original behavior
        res.status(err.status || 500).json({ message: err.message || "Error" });
      }
    }
  });

  /* ──────────────────────────────────────────────────────────────── */
  /* 10. Vite in dev or static in prod                               */
  /* ──────────────────────────────────────────────────────────────── */
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  /* ──────────────────────────────────────────────────────────────── */
  /* 11. Start HTTP server                                           */
  /* ──────────────────────────────────────────────────────────────── */
  const port = Number(process.env.PORT) || 3001;
  server.listen(
    { host: "0.0.0.0", port, reusePort: true },
    () => {
      log(`🚀 Serving on port ${port}`);
      log(`📡 API available at http://localhost:${port}/api/`);
      log(`🧪 Test API at http://localhost:${port}/api/test`);
      logger.info("---");
      logger.info("🔧 API Endpoints registered:");
      logger.info("  GET    /api/test");
      logger.info("  GET    /api/snippets");
      logger.info("  GET    /api/snippets/:id");
      logger.info("  POST   /api/snippets");
      logger.info("  PUT    /api/snippets/:id");
      logger.info("  DELETE /api/snippets/:id");
      logger.info("  POST   /api/snippets/:id/favorite");
      logger.info("  GET    /api/languages");
      logger.info("  GET    /api/tags");
      logger.info("  POST   /api/auth/user");
      logger.info("  GET    /api/auth/me");
      logger.info("---");
    }
  );

  // Handle process termination gracefully
  process.on('SIGTERM', () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
      logger.info('✅ Server closed');
      process.exit(0);
    });
  });

})().catch((error) => {
  logger.error("❌ Failed to start server:", error);
  process.exit(1);
});
