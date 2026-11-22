import express, { type Express } from "express";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { storage } from "./storage";

const viteLogger = createLogger();

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function injectShareMeta(html: string, title: string, description: string): string {
  const safeTitle = escapeHtmlAttr(`${title} — CodePatchwork`);
  const safeDesc = escapeHtmlAttr(description);
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`)
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${safeTitle}">`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${safeDesc}">`,
    );
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as const,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${randomUUID()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  const indexPath = path.resolve(distPath, "index.html");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const indexHtml = fs.readFileSync(indexPath, "utf-8");

  app.use(
    "/assets",
    express.static(path.resolve(distPath, "assets"), {
      maxAge: "1y",
      immutable: true,
    }),
  );

  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );

  // Inject dynamic OpenGraph tags for public shared snippets so links unfurl cleanly.
  app.get("/shared/:shareId", async (req, res) => {
    try {
      const snippet = await storage.getSnippetByShareId(req.params.shareId);
      if (snippet?.isPublic) {
        const desc =
          snippet.description?.trim() ||
          `${snippet.language || "Code"} snippet shared on CodePatchwork`;
        res
          .setHeader("Content-Type", "text/html; charset=UTF-8")
          .setHeader("Cache-Control", "no-cache")
          .send(injectShareMeta(indexHtml, snippet.title, desc));
        return;
      }
    } catch {
      // Fall through to standard index.html
    }
    res
      .setHeader("Content-Type", "text/html; charset=UTF-8")
      .setHeader("Cache-Control", "no-cache")
      .send(indexHtml);
  });

  app.use("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache").sendFile(indexPath);
  });
}
