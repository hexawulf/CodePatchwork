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

const CANONICAL_TAG = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/;

/** Replace or remove the document canonical. `null` drops the tag. */
export function setCanonical(html: string, href: string | null): string {
  if (href == null) {
    return html.replace(/^[ \t]*<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>[ \t]*\r?\n?/m, "");
  }
  const tag = `<link rel="canonical" href="${escapeHtmlAttr(href)}">`;
  if (CANONICAL_TAG.test(html)) {
    return html.replace(CANONICAL_TAG, () => tag);
  }
  return html.replace(/<head[^>]*>/, (head) => `${head}\n    ${tag}`);
}

/** Pathname for HTML selection. `app.use("*")` rewrites `req.path` to `/`, so callers pass `originalUrl`. */
export function pathnameFromOriginalUrl(originalUrl: string): string {
  const pathOnly = originalUrl.split("?")[0] || "/";
  return pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Keep the homepage canonical on `/`. Point a public share page at itself. Drop it elsewhere. */
export function htmlForPath(html: string, pathname: string, shareCanonical: boolean): string {
  if (pathname === "/") return html;
  const share = pathname.match(/^\/shared\/([^/]+)\/?$/);
  if (share && shareCanonical) {
    const shareId = encodeURIComponent(decodePathSegment(share[1]));
    return setCanonical(html, `https://codepatchwork.com/shared/${shareId}`);
  }
  return setCanonical(html, null);
}

export function injectShareMeta(html: string, title: string, description: string): string {
  const safeTitle = escapeHtmlAttr(`${title} — CodePatchwork`);
  const safeDesc = escapeHtmlAttr(description);
  return html
    .replace(/<title>[^<]*<\/title>/, () => `<title>${safeTitle}</title>`)
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/?>/,
      () => `<meta property="og:title" content="${safeTitle}">`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\s*\/?>/,
      () => `<meta property="og:description" content="${safeDesc}">`,
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
      const transformed = await vite.transformIndexHtml(url, template);
      const pathname = pathnameFromOriginalUrl(req.originalUrl);
      const page = htmlForPath(transformed, pathname, pathname.startsWith("/shared/"));
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
        const pathname = pathnameFromOriginalUrl(req.originalUrl);
        res
          .setHeader("Content-Type", "text/html; charset=UTF-8")
          .setHeader("Cache-Control", "no-cache")
          .send(htmlForPath(injectShareMeta(indexHtml, snippet.title, desc), pathname, true));
        return;
      }
    } catch {
      // Fall through to standard index.html
    }
    res
      .setHeader("Content-Type", "text/html; charset=UTF-8")
      .setHeader("Cache-Control", "no-cache")
      .send(htmlForPath(indexHtml, pathnameFromOriginalUrl(req.originalUrl), false));
  });

  // `/` is served by express.static as dist/public/index.html, which keeps the homepage canonical.
  app.use("*", (req, res) => {
    res
      .setHeader("Content-Type", "text/html; charset=UTF-8")
      .setHeader("Cache-Control", "no-cache")
      .send(htmlForPath(indexHtml, pathnameFromOriginalUrl(req.originalUrl), false));
  });
}
