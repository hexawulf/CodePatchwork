# Changelog

All notable changes to CodePatchwork are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-11-22

### Added
- CodePatchwork 2.0 screenshots in `README.md` (`docs/screenshots/`).
- Tier-S CI & supply-chain hardening: SHA-pinned Node 24 GitHub Actions, least-privilege permissions, concurrency control, `.github/dependabot.yml`, `SECURITY.md`, `CHANGELOG.md`, and ESLint 9 flat config (`npm run lint`).
- Real PostgreSQL integration test suite (`npm run test:int`) against live schema + v2 indexes, and Playwright Chromium E2E smoke suite (`npm run test:e2e`, `npm run test:e2e:live`) running in CI.
- App-level IP rate limiting (`server/middleware/rateLimit.ts`) via `express-rate-limit` for API reads, writes, and auth token exchange.

### Changed
- Replaced monolithic `firebase` client package with modular `@firebase/app` + `@firebase/auth`, upgraded `firebase-admin` to v14 modular API, `zod` to v4, `drizzle-zod` to `^0.8.3`, and `express` to `^4.22.3` — eliminating all 17 `npm audit` findings (`0` prod / `0` total).
- Migrated legacy database utility scripts under `scripts/` off `@neondatabase/serverless` and `ws` to `pg`, and removed both unused dependencies.

### Fixed
- Command Palette now reliably closes on `Escape` immediately from the search input.

## [2.0.1] - 2026-11-22

### Fixed
- Aligned `collectionItems` Drizzle schema (`shared/schema.ts`) and `scripts/add-v2-indexes.sql` with the live PostgreSQL table `"collectionItems"` and lowercase column names (`collectionid`, `snippetid`, `createdat`).

## [2.0.0] - 2026-11-22

### Added
- HexaWulf Teal design system with Light / Dark / System theme support.
- Unified Library workspace at `/` with live language & tag facet counts (`GET /api/meta`), visibility filtering, sorting, and Grid / List view toggle.
- Snippet Inspector Drawer with full syntax-highlighted code, line numbers/wrap toggles, Copy Code, Copy Markdown, Download File, Raw link, Duplicate, inline collection membership pills, and inline comments.
- Keyboard-first Command Palette (`⌘K` / `Ctrl+K`) and single-key shortcuts (`/`, `N`, `G`, `L`, `Esc`).
- Upgraded Snippet Editor with Tab indentation, Write / Preview tabs, interactive tag chip input with autocomplete, and Public/Private toggle.
- Persisted `PreferencesContext` (5 Prism syntax themes, monospace font family, tab size, line numbers, word wrap, default layout).
- Drag-and-drop JSON import with validation preview, per-collection JSON export, and remove-from-collection actions.
- Plain-text raw sharing endpoint (`GET /api/shared/:shareId/raw`), `GET /api/snippets/:id/collections`, and server-side OpenGraph `<meta>` injection on `/shared/:shareId`.
- Seven PostgreSQL B-tree and GIN indexes (`scripts/add-v2-indexes.sql`) and Vite vendor chunk splitting (`manualChunks`) with immutable 1-year caching for `/assets/*`.
- Expanded test suite to 62 Vitest tests covering routes, OG meta injection, storage, preferences, and snippet helpers.

### Removed
- Superseded v1 components (`SimpleAdvancedSearch`, `AdvancedSearchBar`, `QuickViewModal`, `SnippetDetail`, `Explore`).

## [1.1.0] - 2026-11-22

### Changed
- Modularized `server/routes.ts` into `server/middleware/auth.ts` and `server/routes/{auth,snippets,collections,comments,helpers}.ts`.
- Standardized About modal developer attribution (`Erling Wulf Weinreich (0xWulf) · dev@0xwulf.dev`).
- Rewrote `README.md` to match current architecture, routes, and deployment workflow.

### Fixed
- Ownership and mass-assignment protections on `PUT /api/snippets/:id` and `PUT /api/collections/:id`.
- Transactional deletes for snippets and collections.
- Multi-tag PostgreSQL query filtering and `/api/health` connection pool leak.
- Severed client-side `drizzle-orm` / `zod` bundle leak (`Collections.js` reduced by 95%).

### Removed
- 41 unused client components/pages and 27 unused direct npm dependencies.

## [1.0.1] - 2025-05-18

### Fixed
- Stability and bug fixes following initial production release.

## [1.0.0] - 2025-05-18

### Added
- Initial release of CodePatchwork with Firebase authentication, PostgreSQL/Drizzle backend, syntax-highlighted snippets, collections, tags, comments, and public sharing.
