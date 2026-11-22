import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";

const skipInTest = () => process.env.NODE_ENV === "test";

/** General API read/browse limiter (skips /api/health and test env). */
export const apiLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => skipInTest() || req.path === "/health" || req.path === "/api/health",
  message: { message: "Too many requests, please try again later." },
});

/** Tighter limiter for auth token exchange endpoints. */
export const authLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: skipInTest,
  message: { message: "Too many authentication requests, please try again later." },
});

/** Limiter for state-changing API requests (POST / PUT / DELETE). */
export const writeLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => skipInTest() || !["POST", "PUT", "PATCH", "DELETE"].includes(req.method),
  message: { message: "Too many write requests, please try again later." },
});
