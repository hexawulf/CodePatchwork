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

/* ────────────────────────────────────────────────────────────────── */
/* 0. Verify & load your service-account JSON                        */
/* ────────────────────────────────────────────────────────────────── */
const svcPath = path.resolve(
  process.cwd(),
  process.env.GOOGLE_APPLICATION_CREDENTIALS!
);
console.log("→ SERVICE ACCOUNT path:", svcPath);
console.log("→ Exists on disk?      ", fs.existsSync(svcPath));
if (!fs.existsSync(svcPath)) {
  console.error("❌ service account JSON not found. Aborting.");
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
/* 4. Normalize /api/snippets payload (snake → camel, ISO dates)     */
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
/* 5. Simple API request logger                                      */
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
/* 6. Route registration & global error handler                      */
/* ────────────────────────────────────────────────────────────────── */
(async () => {
  const server = await registerRoutes(app);

  // global error handler
  app.use(
    (err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("[💥 ERROR]", err.stack || err);
      res.status(err.status || 500).json({ message: err.message || "Error" });
    }
  );

  /* ──────────────────────────────────────────────────────────────── */
  /* 7. Vite in dev or static in prod                                */
  /* ──────────────────────────────────────────────────────────────── */
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  /* ──────────────────────────────────────────────────────────────── */
  /* 8. Start HTTP server                                            */
  /* ──────────────────────────────────────────────────────────────── */
  const port = Number(process.env.PORT) || 3001;
  server.listen(
    { host: "0.0.0.0", port, reusePort: true },
    () => log(`🚀 Serving on port ${port}`)
  );
})();
