# Full-Stack Deployment on Railway — Senior Dev Guide

> Author: Senior Developer Reference | Platform: Railway | Stack: React + Vite (Frontend) · Node.js + Express (Backend)

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Critical Config Files & Code](#2-critical-config-files--code)
3. [Railway Dashboard Setup](#3-railway-dashboard-setup)
4. [Environment Variables](#4-environment-variables)
5. [Database Setup (PostgreSQL)](#5-database-setup-postgresql)
6. [Deployment Order](#6-deployment-order)
7. [Domains & Custom URLs](#7-domains--custom-urls)
8. [Logs & Debugging](#8-logs--debugging)
9. [Common Mistakes to Avoid](#9-common-mistakes-to-avoid)
10. [Quick Checklist](#10-quick-checklist)

---

## 1. Project Structure

### Option A — Monorepo (Recommended)

```
my-app/
├── frontend/                        # React + Vite
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js             # Centralized API wrapper
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env                         # Local dev vars
│   ├── .env.production              # Production vars (VITE_ prefix required)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                         # Node.js + Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── index.js                 # Entry point
│   ├── .env                         # Local dev vars (never commit)
│   ├── railway.toml                 # Railway deploy config
│   └── package.json
│
├── .gitignore
└── README.md
```

### Option B — Separate Repos (For Larger Teams)

```
my-frontend/   →  Service 1 on Railway
my-backend/    →  Service 2 on Railway
```

Each repo gets its own Railway service, env vars, and domain.

---

## 2. Critical Config Files & Code

### `backend/railway.toml`

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node src/index.js"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

---

### `backend/package.json`

```json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "src/index.js",
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

---

### `backend/src/index.js`

```js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Railway injects PORT automatically — always use process.env.PORT
const PORT = process.env.PORT || 5000;

// ✅ CORS — whitelist your Railway frontend URL
app.use(cors({
  origin: [
    'http://localhost:5173',           // local dev
    process.env.FRONTEND_URL,         // production frontend Railway URL
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Health check — Railway uses this to confirm service is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Your API routes
// app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/patients', patientRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ⚠️ CRITICAL: Use '0.0.0.0' NOT 'localhost'
// Railway requires binding to all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
```

> **Why `0.0.0.0`?** Railway containers require the server to bind to all network interfaces. Using `localhost` causes Railway to mark your service as crashed even though it starts successfully.

---

### `frontend/vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy only works in local dev — not in production
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
  }
});
```

---

### `frontend/.env` (Local Dev)

```env
VITE_API_URL=http://localhost:5000
```

### `frontend/.env.production` (Production)

```env
VITE_API_URL=https://your-backend-name.railway.app
```

> All frontend env vars **must start with `VITE_`** to be exposed to the browser by Vite.

---

### `frontend/src/api/index.js`

```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const request = async (method, path, body = null) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
};

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),
};
```

**Usage in components:**

```js
import { api } from '../api';

// GET
const patients = await api.get('/api/v1/patients');

// POST
const newPatient = await api.post('/api/v1/patients', { name: 'John', age: 30 });
```

---

### `frontend/package.json` (key parts)

```json
{
  "name": "frontend",
  "scripts": {
    "dev":     "vite",
    "build":   "vite build",
    "preview": "vite preview",
    "start":   "npx serve dist -p $PORT"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "serve": "^14.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0"
  }
}
```

> `serve` is used to serve the built `dist/` folder in production on Railway.

---

### `.gitignore` (Root)

```
# Dependencies
node_modules/
**/node_modules/

# Environment variables — NEVER commit
.env
.env.local
.env.production

# Build output
dist/
build/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

---

## 3. Railway Dashboard Setup

### Step-by-Step

```
Railway Dashboard → New Project → Deploy from GitHub repo
│
├── Service 1: Backend
│   ├── Root Directory   →  /backend
│   ├── Build Command    →  npm install
│   ├── Start Command    →  node src/index.js
│   └── Variables Tab    →  (see Section 4)
│
└── Service 2: Frontend
    ├── Root Directory   →  /frontend
    ├── Build Command    →  npm install && npm run build
    ├── Start Command    →  npx serve dist -p $PORT
    └── Variables Tab    →  (see Section 4)
```

### Service Settings Location

```
Service → Settings → Build & Deploy
  ├── Builder:        Nixpacks (auto-detected)
  ├── Build Command:  npm install (or npm ci for faster builds)
  ├── Start Command:  node src/index.js
  └── Watch Paths:    /backend/src/**  (redeploy only on src changes)
```

---

## 4. Environment Variables

### Backend Variables (set in Railway Dashboard)

| Variable         | Value                                    | Notes                             |
|------------------|------------------------------------------|-----------------------------------|
| `PORT`           | `5000`                                   | Railway overrides this anyway     |
| `NODE_ENV`       | `production`                             | Required                          |
| `FRONTEND_URL`   | `https://your-frontend.railway.app`      | For CORS whitelist                |
| `DATABASE_URL`   | Auto-set by Railway PostgreSQL plugin    | Copy from DB service if needed    |
| `JWT_SECRET`     | `your-secret-key-min-32-chars`           | Use Railway's secret generator    |

### Frontend Variables (set in Railway Dashboard)

| Variable        | Value                                     | Notes                        |
|-----------------|-------------------------------------------|------------------------------|
| `VITE_API_URL`  | `https://your-backend.railway.app`        | No trailing slash            |

> Set these in: **Service → Variables → Add Variable**

---

## 5. Database Setup (PostgreSQL)

### Add PostgreSQL to Your Project

```
Railway Dashboard → Your Project → + New Service → Database → PostgreSQL
```

Railway automatically injects `DATABASE_URL` into all services in the same project.

### Backend Usage with `pg`

```bash
npm install pg
```

```js
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,   // Required for Railway PostgreSQL
  }
});

export const query = (text, params) => pool.query(text, params);
```

### Using Prisma ORM (Recommended)

```bash
npm install prisma @prisma/client
npx prisma init
```

```js
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

Add to `railway.toml` to run migrations on deploy:

```toml
[deploy]
startCommand = "npx prisma migrate deploy && node src/index.js"
```

---

## 6. Deployment Order

Follow this exact order to avoid environment variable issues:

```
Step 1: Deploy Backend first
         → Wait for it to go live
         → Copy its Railway URL (e.g. https://backend-prod.railway.app)

Step 2: Set VITE_API_URL in Frontend service Variables
         → Paste the backend URL

Step 3: Deploy Frontend
         → It now has the correct backend URL baked into the build

Step 4: Copy Frontend Railway URL
         → Set it as FRONTEND_URL in Backend service Variables
         → Redeploy backend (for CORS to work with the real frontend URL)
```

---

## 7. Domains & Custom URLs

### Default Railway Domains

Each service gets: `https://service-name-randomid.railway.app`

### Custom Domain Setup

```
Service → Settings → Networking → Add Custom Domain
  → Enter: api.yourdomain.com  (for backend)
  → Enter: app.yourdomain.com  (for frontend)
  → Railway gives you a CNAME record
  → Add it in your domain registrar (GoDaddy / Namecheap / Cloudflare)
```

### DNS Record Example

| Type  | Name  | Value                          |
|-------|-------|--------------------------------|
| CNAME | api   | backend-xxx.railway.app        |
| CNAME | app   | frontend-xxx.railway.app       |

> SSL/TLS certificate is provisioned automatically by Railway (Let's Encrypt).

---

## 8. Logs & Debugging

### Viewing Logs

```
Service → Deployments → Click latest deployment → View Logs
```

### Build Failed?
- Check **Build Logs** — usually missing dependency or wrong root directory
- Verify `package.json` is in the root of the service directory

### Service Crashes at Start?
- Check **Deploy Logs** — usually:
  - Binding to `localhost` instead of `0.0.0.0`
  - Missing environment variable
  - Wrong `startCommand`

### Frontend Blank Page / API Not Working?
- Check browser DevTools → Network tab
- Verify `VITE_API_URL` is set correctly in Railway variables
- Confirm CORS is allowing the frontend origin on backend

### Health Check Failing?
- Make sure `/health` route exists and returns `200`
- Increase `healthcheckTimeout` in `railway.toml` if your app takes time to start

---

## 9. Common Mistakes to Avoid

| ❌ Mistake                              | ✅ Fix                                              |
|-----------------------------------------|-----------------------------------------------------|
| `app.listen(PORT, 'localhost')`         | Use `app.listen(PORT, '0.0.0.0')`                  |
| Hardcoded API URL in frontend           | Use `import.meta.env.VITE_API_URL`                 |
| Committing `.env` to Git               | Add `.env` to `.gitignore`                          |
| Missing `engines.node` in package.json | Add `"engines": { "node": ">=18.0.0" }`            |
| CORS blocking frontend requests        | Set `FRONTEND_URL` env var and use it in CORS config|
| Frontend deployed before backend URL   | Always deploy backend first, get URL, then frontend |
| Not running DB migrations on deploy    | Add `prisma migrate deploy` to `startCommand`       |
| Using `localhost` in production API    | Always use environment variables for URLs           |
| Missing `/health` endpoint             | Railway needs it to confirm service is running      |
| `VITE_` prefix missing on frontend var | All frontend env vars must start with `VITE_`       |

---

## 10. Quick Checklist

### Backend
- [ ] `app.listen(PORT, '0.0.0.0')` — not localhost
- [ ] `/health` endpoint returning 200
- [ ] `railway.toml` present with correct `startCommand`
- [ ] `engines.node` set in `package.json`
- [ ] CORS configured with `FRONTEND_URL` env var
- [ ] All secrets in Railway Variables, not in code

### Frontend
- [ ] `VITE_API_URL` set in Railway Variables
- [ ] `serve` package installed for production serving
- [ ] Start command: `npx serve dist -p $PORT`
- [ ] Build command: `npm install && npm run build`
- [ ] `.env.production` uses `VITE_API_URL` (not hardcoded URL)

### Railway Project
- [ ] Backend deployed first
- [ ] Frontend `VITE_API_URL` → Backend Railway URL
- [ ] Backend `FRONTEND_URL` → Frontend Railway URL
- [ ] PostgreSQL plugin added (if using DB)
- [ ] Custom domains configured (if needed)
- [ ] Health check passing on both services

---

*Generated for Railway Platform Deployment | Node.js + Express + React + Vite | May 2026*
