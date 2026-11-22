# CodePatchwork

[![Live](https://img.shields.io/badge/Live-codepatchwork.com-2563eb?style=flat-square)](https://codepatchwork.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](package.json)
[![CI](https://github.com/hexawulf/CodePatchwork/actions/workflows/ci.yml/badge.svg)](https://github.com/hexawulf/CodePatchwork/actions/workflows/ci.yml)

A full-stack visual code snippet manager with syntax highlighting, multi-filter search, collections, JSON import/export, and public sharing links.

**Live instance:** [https://codepatchwork.com](https://codepatchwork.com)

![CodePatchwork Banner](codepatchwork-banner.png)

## Features

- **Snippet Library & Views** — Organize snippets in grid or list layouts with sorting (recent, oldest, most used, A–Z / Z–A) and favorite toggling.
- **Syntax Highlighting** — Powered by `prism-react-renderer` with 25 editor languages and 5 switchable syntax themes (Night Owl, Dracula, GitHub, VS Dark, VS Light).
- **Search & Filtering** — Full-text search across titles and code plus multi-select language, tag, and favorites filtering backed by PostgreSQL queries.
- **Collections** — Group owned and public snippets into named collections.
- **Public Sharing & Comments** — Toggle snippet visibility between private and public, generate random URL-safe share links (`/shared/:shareId`), and post comments on accessible snippets.
- **JSON Import & Export** — Bulk-import snippets from JSON and export your library as a portable JSON file.
- **Authentication & Isolation** — Google Sign-In via Firebase Authentication with server-side Firebase Admin ID token verification, strict per-user ownership checks, Helmet CSP headers, and PostgreSQL persistence via Drizzle ORM.
- **Light / Dark / System Theme** — Persistent UI appearance preference alongside global code theme selection.

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS 3, Radix UI, Wouter, TanStack Query 5, `prism-react-renderer` |
| Backend | Node.js (ESM), Express 4, Helmet, Winston, Zod |
| Database | PostgreSQL, Drizzle ORM, `drizzle-zod`, `pg` |
| Auth | Firebase Authentication (client) + Firebase Admin SDK (server token verification) |
| Testing | Vitest 4, Supertest |

## Architecture

```text
├── client/
│   ├── index.html
│   └── src/
│       ├── components/        # Header, Sidebar, SnippetCard, dialogs, Radix UI primitives
│       ├── contexts/          # Auth, Theme, CodeTheme, Snippet, Collection providers
│       ├── hooks/             # useSnippets, use-copy-to-clipboard, use-toast
│       ├── lib/               # queryClient, firebase, constants, snippets, utils + __tests__/
│       └── pages/             # Home, PublicHome, Snippets, Collections, CollectionDetail, Tags, Settings, SharedSnippet
├── public/                    # Favicons and static web assets
├── server/
│   ├── index.ts               # Express bootstrap, Firebase Admin init, Helmet CSP, graceful shutdown
│   ├── db.ts                  # PostgreSQL Pool + Drizzle instance
│   ├── logger.ts              # Winston console + file logger (LOG_DIR configurable)
│   ├── storage.ts             # DatabaseStorage (transactional deletes, escaped ILIKE, array filters)
│   ├── vite.ts                # Dev Vite middleware & prod static serving
│   ├── middleware/auth.ts     # Firebase bearer token verification (required + optional)
│   ├── routes.ts              # Param validation, health/test endpoints, route registration
│   ├── routes/                # auth.ts, snippets.ts, collections.ts, comments.ts, helpers.ts
│   └── __tests__/             # Route and storage test suites
└── shared/
    └── schema.ts              # Drizzle PostgreSQL schema + shared TypeScript types
```

## API Overview

| Group | Endpoints |
|---|---|
| Health | `GET /api/health`, `GET /api/test` |
| Auth | `POST /api/auth/user`, `GET /api/auth/me` |
| Snippets | `GET/POST /api/snippets`, `GET/PUT/DELETE /api/snippets/:id`, `POST /api/snippets/:id/favorite`, `POST /api/snippets/:id/share`, `POST /api/snippets/:id/publish`, `GET /api/snippets/export`, `POST /api/snippets/import` |
| Public & Metadata | `GET /api/public/snippets`, `GET /api/public/snippets/:id`, `GET /api/shared/:shareId`, `GET /api/languages`, `GET /api/tags` |
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

3. Push the Drizzle schema to PostgreSQL:
   ```bash
   npm run db:push
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
| `npm test` | Run Vitest unit and route test suites (`server/` + `client/src/`) |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run build` | Build client (`dist/public/`) with Vite and bundle server (`dist/index.js`) with esbuild |
| `npm start` | Run the production bundle (`dist/index.js`) |
| `npm run db:push` | Push `shared/schema.ts` to PostgreSQL via `drizzle-kit` |

## Production Deployment

Production builds output a single bundled Express entrypoint (`dist/index.js`) serving the compiled static SPA from `dist/public/`. PM2 configuration is provided in `ecosystem.config.cjs`:

```bash
npm ci
npm run check
npm test
npm run build
pm2 reload codepatchwork --update-env
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Developer

Erling Wulf Weinreich (0xWulf) · [dev@0xwulf.dev](mailto:dev@0xwulf.dev)

## License

MIT
