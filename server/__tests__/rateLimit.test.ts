import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import rateLimit from "express-rate-limit";

describe("API rate limiting", () => {
  it("returns 429 JSON once the configured request budget is exceeded while exempting /api/health", async () => {
    const app = express();
    const limiter = rateLimit({
      windowMs: 60_000,
      limit: 2,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      skip: (req) => req.path === "/health",
      message: { message: "Too many requests, please try again later." },
    });

    app.use("/api", limiter);
    app.get("/api/health", (_req, res) => res.json({ status: "healthy" }));
    app.get("/api/public/snippets", (_req, res) => res.json([]));

    expect((await request(app).get("/api/public/snippets")).status).toBe(200);
    expect((await request(app).get("/api/public/snippets")).status).toBe(200);

    const limited = await request(app).get("/api/public/snippets");
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({ message: "Too many requests, please try again later." });

    // /api/health remains accessible even when rate-limited
    const health = await request(app).get("/api/health");
    expect(health.status).toBe(200);
  });
});
