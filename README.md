# CodePatchwork

[![Live](https://img.shields.io/badge/Live-codepatchwork.com-0d9488?style=flat-square)](https://codepatchwork.com)
[![Version](https://img.shields.io/badge/version-2.1.1-0d9488?style=flat-square)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](package.json)
[![CI](https://github.com/hexawulf/CodePatchwork/actions/workflows/ci.yml/badge.svg)](https://github.com/hexawulf/CodePatchwork/actions/workflows/ci.yml)

A fast, keyboard-first visual code snippet library with syntax highlighting, multi-facet filtering, an inline Snippet Inspector Drawer, collections, drag-and-drop JSON import/export, and public sharing links.

**Live instance:** [https://codepatchwork.com](https://codepatchwork.com)

![CodePatchwork 2.0 Library (Dark Mode)](docs/screenshots/library-dark.png)

## Screenshots

<table>
  <tr>
    <td width="50%">
      <strong>Snippet Inspector Drawer</strong><br/>
      <img src="docs/screenshots/snippet-drawer.png" alt="Snippet Inspector Drawer with line numbers and actions" />
    </td>
    <td width="50%">
      <strong>Command Palette (<code>⌘K</code> / <code>Ctrl+K</code>)</strong><br/>
      <img src="docs/screenshots/command-palette.png" alt="Keyboard Command Palette" />
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Light Mode</strong><br/>
      <img src="docs/screenshots/library-light.png" alt="CodePatchwork 2.0 Library in Light Mode" />
    </td>
    <td width="50%">
      <strong>Dark Mode</strong><br/>
      <img src="docs/screenshots/library-dark.png" alt="CodePatchwork 2.0 Library in Dark Mode" />
    </td>
  </tr>
</table>

## Features (v2.0)

- **Unified Library Workspace** — Single-screen library at `/` with live language & tag facet counts (`GET /api/meta`), visibility filters (All / Public / Private), Favorites view, sorting, and instant Grid / List layout switching.
- **Snippet Inspector Drawer** — Click any snippet card to read full syntax-highlighted code with line-number and word-wrap toggles, Copy Code, Copy as Markdown fence, Download as File (auto-extension by language), Duplicate, inline Collection membership toggles, and inline Comments.
- **Keyboard-First Command Palette (`⌘K` / `Ctrl+K`)** — Jump directly to any snippet, collection, action, or syntax theme from the keyboard. Single-key shortcuts: `/` (search), `N` (new snippet), `G` / `L` (grid / list view), `Esc` (close drawer/modals).
- **Upgraded Snippet Editor** — Tab-key indentation respecting your configured tab width, live Write / Preview toggle, interactive tag chip input with autocomplete suggestions, and inline Public/Private visibility toggle.
- **Persisted Code & UI Preferences** — Light / Dark / System theme, 5 Prism syntax themes (Night Owl, Dracula, GitHub, VS Dark, VS Light), monospace font selector, tab width (2/4/8), line numbers, word wrap, and default layout — all saved automatically and applied live.
- **Collections & Drag-and-Drop Import/Export** — Collections with live snippet counts, one-click add/remove from collections, per-collection JSON export, and drag-and-drop JSON file import with pre-import validation preview.
- **Public Sharing & Raw Endpoint** — Public share pages (`/shared/:shareId`) with server-side OpenGraph `<meta>` injection for clean link unfurling plus plain-text raw endpoints (`GET /api/shared/:shareId/raw`) for `curl` / scripting.
- **Fast & Hardened** — Optimistic mutations (instant favorite, publish, and delete feedback), PostgreSQL secondary + GIN indexes, split immutable vendor chunks, strict Firebase Admin ID token verification, ownership checks, and Helmet CSP headers.

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 18, TypeScript, Vite 6 (vendor chunk splitting), Tailwind CSS 3, Radix UI, Wouter, TanStack Query 5, `prism-react-renderer` |
| Backend | Node.js (ESM), Express 4, Helmet, Winston, Zod |
| Database | PostgreSQL (B-tree + GIN indexes), Drizzle ORM, `drizzle-zod`, `pg` |
| Auth | Firebase Authentication (client) + Firebase Admin SDK (server token verification) |
| Testing | Vitest 4, Supertest |

## Architecture

```text
├── client/
│   ├── index.html
│   └── src/
│       ├── components/        # Layout, Header, Sidebar, SnippetCard, SnippetDrawer, CommandPalette, AddSnippetDialog, ImportExportDialog, Radix UI primitives
│       ├── contexts/          # Auth, Theme, Preferences, Snippet (optimistic cache), Collection
│       ├── hooks/             # useSnippets, use-copy-to-clipboard, use-toast
│       ├── lib/               # queryClient, firebase, constants, snippets, utils + __tests__/
│       └── pages/             # Home (Library), PublicHome, Collections, CollectionDetail, Tags, Settings, SharedSnippet
├── public/                    # Favicons and static web assets
├── scripts/
│   └── add-v2-indexes.sql     # Idempotent PostgreSQL index migration
├── server/
│   ├── index.ts               # Express bootstrap, Firebase Admin init, Helmet CSP, graceful shutdown
│   ├── db.ts                  # PostgreSQL Pool + Drizzle instance
│   ├── logger.ts              # Winston console + file logger (LOG_DIR configurable)
│   ├── storage.ts             # DatabaseStorage (transactional deletes, /api/meta aggregation, array/search filters)
│   ├── vite.ts                # Dev Vite middleware, immutable asset caching, OG meta injection on /shared/:shareId
│   ├── middleware/auth.ts     # Firebase bearer token verification (required + optional)
│   ├── routes.ts              # Param validation, health/test endpoints, route registration
│   ├── routes/                # auth.ts, snippets.ts, collections.ts, comments.ts, helpers.ts
│   └── __tests__/             # Route, OG meta, and storage test suites
└── shared/
    └── schema.ts              # Drizzle PostgreSQL schema, index definitions, and shared types
```

## API Overview

| Group | Endpoints |
|---|---|
| Health | `GET /api/health`, `GET /api/test` |
| Auth | `POST /api/auth/user`, `GET /api/auth/me` |
| Library & Meta | `GET /api/meta`, `GET /api/languages`, `GET /api/tags` |
| Snippets | `GET/POST /api/snippets` (`search`, `language`, `tag`, `favorites`, `visibility`, `limit`, `offset`), `GET/PUT/DELETE /api/snippets/:id`, `GET /api/snippets/:id/collections`, `POST /api/snippets/:id/favorite`, `POST /api/snippets/:id/share`, `POST /api/snippets/:id/publish`, `GET /api/snippets/export`, `POST /api/snippets/import` |
| Public & Raw | `GET /api/public/snippets`, `GET /api/public/snippets/:id`, `GET /api/shared/:shareId`, `GET /api/shared/:shareId/raw` |
| Collections | `GET/POST /api/collections`, `GET/PUT/DELETE /api/collections/:id`, `GET /api/collections/:id/snippets`, `POST/DELETE /api/collections/:collectionId/snippets/:snippetId` |
| Comments | `GET/POST /api/snippets/:snippetId/comments`, `PUT/DELETE /api/comments/:id` |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- A Firebase project with Google Sign-In enabled and a Firebase Admin service account JSON file

### Local Setup

1. Clone and install dependencies:
   ```bash
   git clone https://github.com/hexawulf/CodePatchwork.git
   cd CodePatchwork
   npm ci
   ```

2. Create a `.env` file (see `.env.example`):
   ```env
   PORT=3001
   DATABASE_URL=postgresql://username:password@localhost:5432/codepatchwork
   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
   LOG_DIR=./logs

   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. Push schema and apply performance indexes:
   ```bash
   npm run db:push
   psql "$DATABASE_URL" -f scripts/add-v2-indexes.sql
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run Express + Vite dev middleware on `PORT` (default `3001`) |
| `npm run check` | TypeScript strict type-check (`tsc`) |
| `npm run lint` | Run ESLint 9 flat config across client, server, shared, and E2E |
| `npm test` | Run Vitest unit and route test suites (`server/` + `client/src/`) |
| `npm run test:int` | Run real PostgreSQL `DatabaseStorage` integration tests (`TEST_DATABASE_URL`) |
| `npm run test:e2e` | Run Playwright Chromium E2E smoke suite (`CODEPATCHWORK_BASE_URL`) |
| `npm run test:e2e:live` | Run read-only Playwright E2E smoke suite against `https://codepatchwork.com` |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run build` | Build client (`dist/public/`) with split vendor chunks and bundle server (`dist/index.js`) |
| `npm start` | Run the production bundle (`dist/index.js`) |
| `npm run db:push` | Push `shared/schema.ts` to PostgreSQL via `drizzle-kit` |

## Production Deployment

```bash
npm ci
npm run check
npm test
npm run build
psql "$DATABASE_URL" -f scripts/add-v2-indexes.sql
pm2 reload codepatchwork --update-env
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Developer

Erling Wulf Weinreich (0xWulf) · [dev@0xwulf.dev](mailto:dev@0xwulf.dev)

## License

MIT
