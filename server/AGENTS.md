# Server (Backend) - AGENTS.md

## Package Identity

**What**: Express backend API for CodePatchwork  
**Tech**: TypeScript + Express + PostgreSQL + Drizzle ORM + Firebase Admin SDK

---

## Setup & Run

```bash
# Install dependencies (from project root)
npm install

# Start dev server (runs both client and server)
npm run dev
# Server runs via tsx (TypeScript executor)

# Build server only
npm run build
# Uses esbuild, output: dist/index.js

# Start production server
npm start
# Runs: node -r dotenv/config dist/index.js

# Push database schema changes
npm run db:push

# Test Winston logger (after build)
npm run test:logger
```

---

## Patterns & Conventions

### File Organization

```
server/
├── index.ts         # Server entry point (Express app, WebSocket, Vite dev)
├── routes.ts        # ALL API routes (~1100 lines)
├── storage.ts       # Database operations (~1200 lines, implements IStorage)
├── simple-storage.ts # Legacy/simple storage (not used in production)
├── db.ts            # PostgreSQL connection pool
├── logger.ts        # Winston logger configuration
├── vite.ts          # Vite dev server integration (development only)
└── __tests__/       # Test files
    ├── routes.test.ts
    └── storage.test.ts
```

### Naming Conventions

- **Files**: camelCase (e.g., `storage.ts`, `routes.ts`)
- **Functions**: camelCase (e.g., `getSnippets`, `createUser`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `IStorage`)
- **Database operations**: Follow CRUD pattern (get, create, update, delete)

### Preferred Patterns

#### ✅ DO: Use Storage Layer for All Database Operations

```typescript
// ✅ Good: server/routes.ts
import { storage } from "./storage";

app.get("/api/snippets", authMiddleware, async (req, res) => {
  const snippets = await storage.getSnippets({ userId: req.user.id });
  res.json(snippets);
});

// ❌ Bad: Direct database queries in routes
import { pool } from "./db";
const result = await pool.query("SELECT * FROM snippets");
```

#### ✅ DO: Use Auth Middleware for Protected Routes

```typescript
// ✅ Good: Protect routes with authMiddleware
import { authMiddleware } from "./routes";

app.post("/api/snippets", authMiddleware, async (req, res) => {
  // req.user is now available (populated by authMiddleware)
  const snippet = await storage.createSnippet({
    ...req.body,
    userId: req.user.id
  });
  res.json(snippet);
});

// ❌ Bad: No auth on protected routes
app.post("/api/snippets", async (req, res) => {
  // Anyone can create snippets!
});
```

#### ✅ DO: Validate Request Bodies with Zod

```typescript
// ✅ Good: Use schemas from @shared/schema
import { insertSnippetSchema } from "@shared/schema";

app.post("/api/snippets", authMiddleware, async (req, res) => {
  try {
    const validated = insertSnippetSchema.parse(req.body);
    const snippet = await storage.createSnippet(validated);
    res.json(snippet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    throw error;
  }
});

// ❌ Bad: No validation
app.post("/api/snippets", async (req, res) => {
  const snippet = await storage.createSnippet(req.body); // Trust user input
});
```

#### ✅ DO: Use Drizzle ORM for Database Queries

```typescript
// ✅ Good: server/storage.ts pattern
import { db } from "./db";
import { snippets, type Snippet } from "@shared/schema";
import { eq, and, ilike } from "drizzle-orm";

async getSnippets(filters?: { search?: string; userId?: string }): Promise<Snippet[]> {
  let query = db.select().from(snippets);
  
  const conditions = [];
  if (filters?.userId) conditions.push(eq(snippets.userId, filters.userId));
  if (filters?.search) conditions.push(ilike(snippets.title, `%${filters.search}%`));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  return await query;
}

// ❌ Bad: Raw SQL strings
await pool.query(`SELECT * FROM snippets WHERE user_id = $1`, [userId]);
```

#### ✅ DO: Use Winston Logger (Not console.log)

```typescript
// ✅ Good: Use Winston logger
import logger from "./logger";

logger.info("Server started", { port: 3000 });
logger.error("Database error", { error: err.message });
logger.debug("Request received", { path: req.path });

// ❌ Bad: console.log (not persistent, no log levels)
console.log("Server started");
console.error("Error:", err);
```

#### ✅ DO: Handle Errors Consistently

```typescript
// ✅ Good: Structured error responses
app.get("/api/snippets/:id", authMiddleware, async (req, res) => {
  try {
    const snippet = await storage.getSnippet(Number(req.params.id));
    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }
    res.json(snippet);
  } catch (error: any) {
    logger.error("Error fetching snippet", { error: error.message });
    res.status(500).json({ message: "Internal server error" });
  }
});

// ❌ Bad: Unhandled errors, no status codes
app.get("/api/snippets/:id", async (req, res) => {
  const snippet = await storage.getSnippet(Number(req.params.id));
  res.json(snippet); // Crashes if snippet is undefined
});
```

#### ✅ DO: Use Firebase Admin SDK for Token Verification

```typescript
// ✅ Good: server/routes.ts authMiddleware pattern
import admin from "firebase-admin";

export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token" });
    }
    const idToken = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const user = await storage.getUser(decoded.uid);
    (req as any).user = user;
    next();
  } catch (err: any) {
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// ❌ Bad: No token verification
app.use((req, res, next) => {
  req.user = { id: "fake-user" }; // Trust client-provided data
  next();
});
```

#### ❌ DON'T: Mix Database Column Names with TypeScript Property Names

```typescript
// ✅ Good: Use TypeScript property names (camelCase)
const snippet = await storage.getSnippet(1);
console.log(snippet.userId, snippet.createdAt); // Drizzle handles mapping

// ❌ Bad: Using database column names directly
console.log(snippet.userid, snippet.createdat); // TypeScript error!
```

---

## Touch Points / Key Files

### Critical Files to Understand

- **Entry Point**: `server/index.ts` - Express app initialization, WebSocket setup, Vite integration
- **API Routes**: `server/routes.ts` - ALL API endpoints (auth, snippets, collections, comments)
- **Storage Layer**: `server/storage.ts` - Database operations (implements IStorage interface)
- **Database Connection**: `server/db.ts` - PostgreSQL pool using `@neondatabase/serverless`
- **Logger**: `server/logger.ts` - Winston configuration (logs to `~/logs/codepatchwork.log`)
- **Auth Middleware**: `server/routes.ts:authMiddleware` - Firebase token verification

### Storage Layer Interface (IStorage)

The `storage.ts` file implements this interface:

```typescript
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Snippets
  getSnippets(filters?: { search?: string; language?: string; userId?: string }): Promise<Snippet[]>;
  getSnippet(id: number): Promise<Snippet | undefined>;
  createSnippet(snippet: InsertSnippet): Promise<Snippet>;
  updateSnippet(id: number, snippet: InsertSnippet): Promise<Snippet>;
  deleteSnippet(id: number): Promise<void>;
  toggleSnippetFavorite(id: number): Promise<Snippet>;
  
  // Collections
  getCollections(): Promise<Collection[]>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  deleteCollection(id: number): Promise<void>;
  
  // Collection Items
  addSnippetToCollection(item: InsertCollectionItem): Promise<CollectionItem>;
  removeSnippetFromCollection(collectionId: number, snippetId: number): Promise<void>;
  
  // Comments
  getComments(snippetId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Sharing
  generateShareId(snippetId: number): Promise<string>;
  getSnippetByShareId(shareId: string): Promise<Snippet | undefined>;
}
```

**Pattern**: Routes call storage methods, storage methods use Drizzle ORM.

---

## JIT Index Hints

```bash
# Find all API routes
rg -n "app\.(get|post|put|patch|delete)" server/routes.ts

# Find storage methods
rg -n "async (get|create|update|delete)" server/storage.ts

# Find auth middleware usage
rg -n "authMiddleware" server/routes.ts

# Find database queries
rg -n "db\.(select|insert|update|delete)" server/storage.ts

# Find all logger calls
rg -n "logger\.(info|error|warn|debug)" server/

# Check TypeScript errors (server only)
npm run check 2>&1 | grep "server/"

# Test database connection
npm run db:push
```

---

## Common Gotchas

### 1. Database Column Naming (lowercase vs camelCase)

**Issue**: PostgreSQL columns are lowercase (e.g., `userid`), but TypeScript uses camelCase (e.g., `userId`).

```typescript
// ✅ Good: Drizzle schema maps column names
export const snippets = pgTable("snippets", {
  userId: text("userid"),      // TS: userId, DB: userid
  createdAt: timestamp("createdat"), // TS: createdAt, DB: createdat
});

// In code, always use TypeScript property names:
snippet.userId  // ✅ Correct
snippet.userid  // ❌ TypeScript error

// Drizzle handles the mapping automatically in queries
```

### 2. Auth Middleware Populates req.user

```typescript
// After authMiddleware, req.user is available:
app.post("/api/snippets", authMiddleware, async (req, res) => {
  const user = (req as any).user; // User from storage
  // Use user.id for userId fields
});
```

### 3. Firebase Admin SDK Must Be Initialized

```typescript
// server/index.ts initializes Firebase Admin
import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    // ... other credentials
  })
});

// Don't re-initialize elsewhere!
```

### 4. Environment Variables (No VITE_ Prefix)

```bash
# ✅ Good: Server-side env vars (no VITE_ prefix)
DATABASE_URL=postgres://...
FIREBASE_PROJECT_ID=...
NODE_ENV=production

# ❌ Bad: Using VITE_ prefix on server
VITE_DATABASE_URL=...  # Won't be loaded by Node.js
```

### 5. Logger Writes to File (~logs/codepatchwork.log)

```typescript
// Winston is configured to write to:
// ~/logs/codepatchwork.log

// Check logs:
tail -f ~/logs/codepatchwork.log

// Test logger after build:
npm run build
npm run test:logger
```

### 6. Use `storage`, Not `simpleStorage`

```typescript
// ✅ Good: Use the full storage implementation
import { storage } from "./storage";

// ❌ Bad: simpleStorage is legacy/incomplete
import { simpleStorage } from "./simple-storage";
```

---

## Pre-PR Checks

Before creating a pull request:

```bash
# 1. Typecheck passes
npm run check

# 2. Build succeeds
npm run build

# 3. Test database connection
npm run db:push

# 4. Check for hardcoded secrets
grep -r "AIza" server/  # Should only find in comments/examples
grep -r "firebase" server/*.ts | grep -v "import" | grep -v "//"

# 5. Verify logger works (after build)
npm run test:logger
cat ~/logs/codepatchwork.log
```

---

## API Route Structure

### Example: CRUD for Snippets

```typescript
// GET /api/snippets - List snippets
app.get("/api/snippets", authMiddleware, async (req, res) => {
  const filters = {
    search: req.query.search as string | undefined,
    language: req.query.language as string | undefined,
    userId: (req as any).user.id
  };
  const snippets = await storage.getSnippets(filters);
  res.json(snippets);
});

// POST /api/snippets - Create snippet
app.post("/api/snippets", authMiddleware, async (req, res) => {
  const validated = insertSnippetSchema.parse(req.body);
  const snippet = await storage.createSnippet({
    ...validated,
    userId: (req as any).user.id
  });
  res.status(201).json(snippet);
});

// PATCH /api/snippets/:id - Update snippet
app.patch("/api/snippets/:id", authMiddleware, async (req, res) => {
  const validated = insertSnippetSchema.partial().parse(req.body);
  const snippet = await storage.updateSnippet(Number(req.params.id), validated);
  res.json(snippet);
});

// DELETE /api/snippets/:id - Delete snippet
app.delete("/api/snippets/:id", authMiddleware, async (req, res) => {
  await storage.deleteSnippet(Number(req.params.id));
  res.status(204).send();
});
```

---

## Database Migration Workflow

```bash
# 1. Edit shared/schema.ts (add/modify tables)

# 2. Push changes to database
npm run db:push

# 3. Drizzle Kit will generate and apply migrations
# Output: migrations/ directory

# 4. Commit schema changes and migrations
git add shared/schema.ts migrations/
git commit -m "Add new table: xyz"
```

---

## Testing

**Note**: Tests exist in `server/__tests__/` but no test runner is configured in package.json yet.

Example test structure:
```
server/
├── routes.ts
├── storage.ts
└── __tests__/
    ├── routes.test.ts
    └── storage.test.ts
```

When test runner is added, run:
```bash
# (Future) Run server tests
npm run test:server  # Not yet implemented
```

---

## Example Storage Method Walkthrough

For a complete example of a storage method, see:

**`server/storage.ts:getSnippets`**
- Drizzle query builder
- Dynamic filtering with `and()` and `or()`
- Array handling for tags
- ILIKE for case-insensitive search
- Ordering and limiting
- Type safety with TypeScript

This is the gold standard for storage layer implementation.

---

## Express App Structure (server/index.ts)

```typescript
// 1. Initialize Firebase Admin
admin.initializeApp({ /* ... */ });

// 2. Create Express app
const app = express();

// 3. Middleware
app.use(helmet());
app.use(express.json());
app.use(session({ /* ... */ }));

// 4. Register routes
await registerRoutes(app);

// 5. Vite dev server (development only)
if (NODE_ENV === "development") {
  await setupVite(app, server);
}

// 6. Static files (production)
if (NODE_ENV === "production") {
  app.use(express.static("dist/public"));
}

// 7. Start server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
```

This structure is critical — don't rearrange middleware order!
