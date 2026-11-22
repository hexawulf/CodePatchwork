# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| `2.x` | Yes |
| `< 2.0` | No |

## Reporting a Vulnerability

If you discover a security issue in CodePatchwork, please report it privately via GitHub Security Advisories or email **dev@0xwulf.dev** with reproduction steps and impact details instead of opening a public issue. Reports are acknowledged promptly and coordinated before disclosure.

## Security Model & Controls

- **Authentication:** Client sign-in uses Firebase Authentication; every authenticated API request carries a Firebase ID token verified server-side with the Firebase Admin SDK (`server/middleware/auth.ts`).
- **Authorization & Ownership:** Private snippets, collections, and comments enforce owner checks (`userId`) on read, update, and delete endpoints. Update payloads are field-whitelisted to prevent mass assignment (`userId`, `shareId`, `viewCount` cannot be overwritten by callers).
- **Database Integrity:** Parameterized queries via Drizzle ORM and PostgreSQL transactions for cascading deletes (`deleteSnippet`, `deleteCollection`).
- **HTTP Hardening:** Helmet security headers with Content Security Policy (`server/index.ts`), `X-Powered-By` disabled, 1 MB JSON body limit, HTML-escaped server-side OpenGraph `<meta>` injection for `/shared/:shareId`, and plain-text `X-Content-Type-Options: nosniff` on `/api/shared/:shareId/raw`.
- **Secrets:** Database credentials and Firebase service account JSON paths are supplied solely via environment variables and excluded from version control.
