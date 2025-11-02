# CodePatchwork - AGENTS.md

## Project Snapshot

**Type**: Full-stack TypeScript web application (single project, not a monorepo)  
**Stack**: React 18 + Vite (frontend) | Express + PostgreSQL (backend) | Firebase Auth  
**Architecture**: Client/server with shared types via `shared/` directory  
**Note**: Sub-directories have their own detailed AGENTS.md files — always check the closest one to your working file.

---

## Root Setup Commands

```bash
# Install dependencies
npm install

# Start development (both client + server)
npm run dev

# Build for production (client + server)
npm run build

# Typecheck
npm run check

# Database: Push schema changes
npm run db:push
```

---

## Universal Conventions

### Code Style
- **TypeScript strict mode** enabled
- **ESM modules** (`"type": "module"`)
- **Path aliases**: `@/` (client/src), `@shared/` (shared types), `@assets/` (assets)
- **Functional React components** with hooks (no class components)
- **TailwindCSS** for all styling (no inline styles)

### Commit & Branch
- **No strict format enforced**, but prefer descriptive messages
- Branch from `main`, PRs welcome
- See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines

---

## Security & Secrets

- **NEVER commit** Firebase credentials, API keys, or tokens
- **Environment variables**: Use `.env` file (not committed)
  - `DATABASE_URL` - PostgreSQL connection string
  - `VITE_FIREBASE_*` - Firebase client config (safe for client)
  - Keep Firebase Admin SDK JSON in `.gitignore`
- **No PII in logs** - Winston logs to `~/logs/codepatchwork.log`

---

## JIT Index (what to open, not what to paste)

### Directory Structure

```
client/          → Frontend React app [see client/AGENTS.md](client/AGENTS.md)
  src/
    components/  → UI components (Shadcn + custom)
    pages/       → Route pages
    hooks/       → Custom React hooks
    contexts/    → Global state providers
    lib/         → Utilities, Firebase config, query client

server/          → Backend Express API [see server/AGENTS.md](server/AGENTS.md)
  routes.ts      → All API endpoints (1100+ lines)
  storage.ts     → Database operations (Drizzle)
  db.ts          → PostgreSQL pool
  logger.ts      → Winston logger

shared/          → Shared types & schemas [see shared/AGENTS.md](shared/AGENTS.md)
  schema.ts      → Drizzle tables + Zod validation

scripts/         → Database and migration utilities
public/          → Static assets
```

### Quick Find Commands

```bash
# Find a React component
rg -n "export (default function|function)" client/src/components

# Find a page
rg -n "export default" client/src/pages

# Find a hook
rg -n "export (const use|function use)" client/src/hooks

# Find API endpoints
rg -n "app\.(get|post|put|patch|delete)" server/routes.ts

# Find database operations
rg -n "export (async function|const)" server/storage.ts

# Find Drizzle schemas
rg -n "export const.*=.*pgTable" shared/schema.ts

# Find all TypeScript errors
npm run check
```

---

## Definition of Done

Before creating a PR, ensure:

1. ✅ Code typechecks: `npm run check`
2. ✅ Client builds: `npm run build` succeeds
3. ✅ No hardcoded credentials (run `scripts/check-no-hardcode.sh`)
4. ✅ Firebase env vars use `VITE_` prefix for client-side
5. ✅ Database migrations tested if `shared/schema.ts` changed

**Note**: Tests exist in `__tests__` directories but no test runner is configured in package.json yet.

---

## Architecture Overview

```
┌─────────────────┐
│  Client (Vite)  │  React + TailwindCSS
│  Port: Vite Dev │  TanStack Query for data fetching
└────────┬────────┘
         │ HTTP (fetch via apiRequest)
         │
┌────────▼────────┐
│ Server (Express)│  TypeScript + esbuild
│  Auth Middleware│  Firebase Admin SDK
└────────┬────────┘
         │
┌────────▼────────┐
│ Storage Layer   │  Drizzle ORM
│  (storage.ts)   │  Interface abstraction
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  Tables: users, snippets, collections, comments
└─────────────────┘
```

---

## Technologies at a Glance

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Shadcn UI, Prism.js, Wouter, TanStack Query |
| **Backend** | Express, TypeScript, esbuild, Firebase Admin, Winston, express-session |
| **Database** | PostgreSQL, Drizzle ORM, Drizzle Kit |
| **Auth** | Firebase Authentication (Google OAuth + Email/Password) |
| **Validation** | Zod (schemas in `shared/schema.ts`) |

---

## Common Pitfalls

1. **Database column naming**: DB uses lowercase (e.g., `userid`), TS uses camelCase (e.g., `userId`). Drizzle handles mapping.
2. **Environment variables**: Client-side vars must use `VITE_` prefix or they won't be exposed.
3. **Path imports**: Always use `@/` and `@shared/` aliases, never relative paths across major boundaries.
4. **Auth tokens**: API expects `Authorization: Bearer <token>` header. Use `apiRequest()` from `queryClient.ts` for automatic token handling.

---

## Next Steps

For detailed guidance:
- Working on **frontend code**? → [client/AGENTS.md](client/AGENTS.md)
- Working on **backend API**? → [server/AGENTS.md](server/AGENTS.md)
- Modifying **database schema**? → [shared/AGENTS.md](shared/AGENTS.md)
