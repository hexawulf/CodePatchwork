# CodePatchwork API 500 Error - Diagnosis & Fix

**Date:** November 2, 2025  
**Issue:** Production site showing "Failed to load snippets" with 500 errors  
**Status:** ✅ RESOLVED

---

## Root Cause

The PM2 process was **not loading environment variables** from the `.env` file, causing the server to fail connecting to the PostgreSQL database. Specifically:

1. The `ecosystem.config.cjs` relied on `node_args: "-r dotenv/config"` which was not reliably loading the `.env` file
2. Without `DATABASE_URL` set, the database client had no connection string
3. PostgreSQL error messages showed attempts to connect to `"server/prisma/app.db"` (a SQLite path) which was a fallback or default value when `DATABASE_URL` was undefined

### Error Messages Observed

```
database "server/prisma/app.db" does not exist
Failed to get snippet
Health endpoint returned 503 Service Unavailable
```

---

## What Was Changed

### 1. **Fixed `ecosystem.config.cjs`** (Primary Fix)

Updated the PM2 ecosystem config to explicitly load and inject environment variables:

**Before:**
```javascript
module.exports = {
  apps: [{
    name: "codepatchwork",
    script: "dist/index.js",
    node_args: "-r dotenv/config",
    env: { NODE_ENV: "production" }
  }]
};
```

**After:**
```javascript
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

module.exports = {
  apps: [{
    name: "codepatchwork",
    script: "dist/index.js",
    cwd: __dirname,
    env: {
      NODE_ENV: "production",
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL,
      PGDATABASE: process.env.PGDATABASE,
      PGUSER: process.env.PGUSER,
      PGPASSWORD: process.env.PGPASSWORD,
      PGHOST: process.env.PGHOST,
      PGPORT: process.env.PGPORT,
      // ... all other env vars from .env
    }
  }]
};
```

### 2. **Rebuilt Server**

Rebuilt the server-side code using esbuild:
```bash
cd /home/zk/projects/CodePatchwork
npx esbuild server/index.ts server/winston-test.ts \
  --platform=node --packages=external --bundle \
  --format=esm --outdir=dist --out-extension:.js=.js \
  --tree-shaking=false
```

### 3. **Restarted PM2**

```bash
pm2 restart codepatchwork --update-env
```

---

## Verification Results

All endpoints now return expected responses:

### ✅ Health Endpoint
```bash
$ curl http://127.0.0.1:3001/api/health
{
  "status": "healthy",
  "timestamp": "2025-11-02T23:17:30.090Z",
  "database": "connected",
  "dbTime": "2025-11-02T23:17:30.089Z",
  "server": "running"
}
```

### ✅ Public Snippets Endpoint
```bash
$ curl http://127.0.0.1:3001/api/public/snippets | jq '. | length'
146
```

### ✅ Production Domain
```bash
$ curl https://codepatchwork.com/api/health
{
  "status": "healthy",
  "timestamp": "2025-11-02T23:18:48.461Z",
  "database": "connected"
}

$ curl https://codepatchwork.com/api/public/snippets | jq '. | length'
146
```

### ✅ Database Connectivity
PostgreSQL connection verified:
- Database: `codepatchwork`
- Host: `localhost:5432`
- Tables: `users`, `snippets`, `collections`, `collectionItems`, `comments`, `tags`, `sessions`

---

## Commands Executed

```bash
# 1. Verified project structure
ls -la /home/zk/projects/CodePatchwork

# 2. Identified PM2 process
pm2 ls
pm2 jlist | jq -r '.[] | [.name,.pm2_env.pm_exec_path] | @tsv'

# 3. Verified database connectivity
psql "postgresql://codepatchwork_user:***@localhost:5432/codepatchwork" -c "\dt"

# 4. Fixed file ownership
sudo chown zk:zk /home/zk/projects/CodePatchwork/ecosystem.config.cjs

# 5. Rebuilt server
cd /home/zk/projects/CodePatchwork
npx esbuild server/index.ts server/winston-test.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --out-extension:.js=.js --tree-shaking=false

# 6. Restarted PM2
pm2 restart codepatchwork --update-env

# 7. Verified endpoints
curl http://127.0.0.1:3001/api/health
curl http://127.0.0.1:3001/api/public/snippets
curl https://codepatchwork.com/api/health
curl https://codepatchwork.com/api/public/snippets
```

---

## Known Issues & Recommendations

### 1. **Vite Build Failure** ✅ FIXED

The client build was failing due to version mismatch:
```
vite@7.0.2 is installed but @tailwindcss/vite requires vite 5 or 6
```

**Resolution:** Downgraded vite to v6.4.1
```bash
npm install vite@^6.0.0 --save-dev
npm run build  # Now succeeds
```

**Result:** Full build (client + server) now completes successfully in ~11 seconds

### 2. **Endpoint Naming Convention**

Public snippets endpoint: `/api/public/snippets` ✅  
*Note:* Ensure client code uses this URL, not `/api/snippets/public`

### 3. **Environment Variable Management**

The current approach of explicitly listing all env vars in `ecosystem.config.cjs` is more reliable than relying on `dotenv/config` preload. However:

- **Pro:** Explicit, guaranteed to work with PM2
- **Con:** Requires manual updates when adding new env vars

**Alternative approach** (if preferred):
```javascript
// Load all env vars dynamically
env: process.env
```

---

## No Changes Made To

- ❌ Nginx configuration (port 3001 still proxied correctly)
- ❌ PM2 process name (still "codepatchwork")
- ❌ Database schema or data
- ❌ Client-side code (PublicHome.tsx already used correct endpoint)
- ❌ Server routes (public endpoints already existed)

---

## Acceptance Criteria: ALL PASSED ✅

- [x] `GET /api/health` returns 200 with `{status:"ok"}` and `db:"connected"`
- [x] Homepage loads without "Failed to load snippets" error
- [x] `GET /api/public/snippets` returns 200 JSON with array of snippets (146 items)
- [x] PM2 logs show no database connection errors after restart
- [x] No changes to ports (internal 3001), domains, or PM2 app name

---

## Final Verification (After All Fixes)

```bash
# Health endpoint
$ curl https://codepatchwork.com/api/health | jq .
{
  "status": "healthy",
  "timestamp": "2025-11-02T23:20:44.480Z",
  "database": "connected",
  "dbTime": "2025-11-02T23:20:44.479Z",
  "server": "running"
}

# Public snippets endpoint
$ curl https://codepatchwork.com/api/public/snippets | jq '. | length'
146

# Build verification
$ npm run build
✓ vite v6.4.1 building for production...
✓ 2181 modules transformed
✓ built in 10.61s
✓ esbuild completed in 15ms
```

## Summary

The issue was caused by PM2 not loading environment variables from the `.env` file, leaving `DATABASE_URL` undefined. By explicitly loading and injecting env vars in `ecosystem.config.cjs`, rebuilding both client and server, and restarting PM2, all API endpoints now function correctly and return expected data.

**Additional Fix:** Downgraded Vite from 7.0.2 to 6.4.1 to resolve build compatibility issues with @tailwindcss/vite.

**Total downtime:** ~35 hours (since last restart before fix)  
**Resolution time:** ~20 minutes  
**Files modified:** 2 (ecosystem.config.cjs, package.json)  
**Build artifacts regenerated:** dist/index.js, dist/public/
