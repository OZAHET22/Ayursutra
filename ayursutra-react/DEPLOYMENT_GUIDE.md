# 🚀 Full Stack Deployment Guide
### Stack: Vercel (Frontend) · Railway (Backend) · MongoDB Atlas (Database)

---

## 📋 Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Pre-Deployment Checklist](#2-pre-deployment-checklist)
3. [Step 1 — Set Up MongoDB Atlas](#3-step-1--set-up-mongodb-atlas)
4. [Step 2 — Prepare Your Backend Code](#4-step-2--prepare-your-backend-code)
5. [Step 3 — Deploy Backend on Railway](#5-step-3--deploy-backend-on-railway)
6. [Step 4 — Prepare Your Frontend Code](#6-step-4--prepare-your-frontend-code)
7. [Step 5 — Deploy Frontend on Vercel](#7-step-5--deploy-frontend-on-vercel)
8. [Step 6 — Connect Everything Together](#8-step-6--connect-everything-together)
9. [Step 7 — Verify Full Stack is Working](#9-step-7--verify-full-stack-is-working)
10. [Environment Variables Reference](#10-environment-variables-reference)
11. [Common Errors & Fixes](#11-common-errors--fixes)
12. [CI/CD Auto-Deploy Flow](#12-cicd-auto-deploy-flow)

---

## 1. Overview & Architecture

```
User Browser
     │
     ▼
┌─────────────┐        HTTPS API Calls        ┌──────────────┐
│   VERCEL    │ ────────────────────────────► │   RAILWAY    │
│  (Frontend) │                               │  (Backend)   │
│  React/Vite │ ◄──────────────────────────── │  Node/Express│
└─────────────┘        JSON Responses         └──────┬───────┘
                                                     │
                                              MongoDB Connection
                                              (Connection String)
                                                     │
                                                     ▼
                                          ┌─────────────────────┐
                                          │   MONGODB ATLAS     │
                                          │   (Database Cloud)  │
                                          └─────────────────────┘
```

**Flow Summary:**
- **MongoDB Atlas** stores all your data in the cloud.
- **Railway** runs your Node.js/Express backend and connects to Atlas.
- **Vercel** serves your React/Vite frontend and calls Railway's API.

---

## 2. Pre-Deployment Checklist

Before you start, make sure you have:

- [ ] GitHub account (repo with your code pushed)
- [ ] MongoDB Atlas account → [mongodb.com/atlas](https://www.mongodb.com/atlas)
- [ ] Railway account → [railway.app](https://railway.app)
- [ ] Vercel account → [vercel.com](https://vercel.com)
- [ ] Your project split into `/frontend` and `/backend` folders (or separate repos)
- [ ] Node.js 18+ installed locally
- [ ] `.env` files created locally (never commit these to Git)

---

## 3. Step 1 — Set Up MongoDB Atlas

### 3.1 Create a Free Cluster

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and log in.
2. Click **"Build a Database"** → Choose **Free (M0 Shared)** tier.
3. Select your **Cloud Provider** (AWS recommended) and **Region** (closest to Railway server).
4. Name your cluster (e.g., `MyAppCluster`) and click **Create**.

### 3.2 Create a Database User

1. In the left sidebar go to **Security → Database Access**.
2. Click **"Add New Database User"**.
3. Choose **Password** authentication.
4. Set a strong username and password — **save these, you will need them**.
5. Under "Database User Privileges" select **Atlas admin** (or limit as needed).
6. Click **Add User**.

### 3.3 Whitelist All IPs (for Railway)

1. Go to **Security → Network Access**.
2. Click **"Add IP Address"**.
3. Click **"Allow Access from Anywhere"** → This adds `0.0.0.0/0`.

> ⚠️ **Why?** Railway uses dynamic IPs, so you must allow all IPs. This is safe as long as your DB user password is strong.

4. Click **Confirm**.

### 3.4 Get Your Connection String

1. Go to **Database → Connect** on your cluster.
2. Click **"Drivers"** → Choose **Node.js**, version **5.5 or later**.
3. Copy the connection string. It looks like:

```
mongodb+srv://<username>:<password>@mycluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

4. Replace `<username>` and `<password>` with your DB user credentials.
5. Add your **database name** before the `?`:

```
mongodb+srv://myuser:mypassword@mycluster.xxxxx.mongodb.net/myappdb?retryWrites=true&w=majority
```

> 💾 **Save this full string** — this is your `MONGODB_URI`.

---

## 4. Step 2 — Prepare Your Backend Code

### 4.1 Folder Structure (recommended)

```
backend/
├── src/
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   └── middleware/
├── index.js         ← entry point
├── package.json
├── .env             ← LOCAL only, never commit
└── .gitignore
```

### 4.2 Required Changes to `index.js`

Make sure your backend does the following:

```js
// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ CORS — allow your Vercel frontend URL
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// ✅ Routes
app.use('/api', require('./src/routes'));

// ✅ Health check route (important for Railway)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// ✅ Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Use Railway's dynamic PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### 4.3 `package.json` — Add Start Script

```json
{
  "name": "my-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "mongoose": "^8.0.0"
  }
}
```

> ⚠️ The `"start"` script is **required** by Railway. Without it, deployment will fail.

### 4.4 `.env` File (local only)

```env
# backend/.env  — DO NOT COMMIT THIS FILE
MONGODB_URI=mongodb+srv://myuser:mypassword@mycluster.xxxxx.mongodb.net/myappdb?retryWrites=true&w=majority
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_super_secret_key_here
```

### 4.5 `.gitignore` for Backend

```gitignore
node_modules/
.env
.env.local
dist/
*.log
```

---

## 5. Step 3 — Deploy Backend on Railway

### 5.1 Push Backend to GitHub

```bash
cd backend
git init
git add .
git commit -m "Initial backend commit"
git branch -M main
git remote add origin https://github.com/yourusername/your-backend-repo.git
git push -u origin main
```

### 5.2 Create Railway Project

1. Go to [railway.app](https://railway.app) and log in.
2. Click **"New Project"**.
3. Select **"Deploy from GitHub repo"**.
4. Authorize Railway to access your GitHub and select your **backend repo**.
5. Railway will auto-detect Node.js and start deploying.

### 5.3 Set Environment Variables in Railway

1. In your Railway project, click on the **service** (your backend).
2. Go to the **"Variables"** tab.
3. Add the following variables one by one:

| Variable Name  | Value                                              |
|----------------|----------------------------------------------------|
| `MONGODB_URI`  | `mongodb+srv://user:pass@cluster.mongodb.net/db`  |
| `PORT`         | `5000` (Railway may override this automatically)   |
| `FRONTEND_URL` | `https://your-app.vercel.app` (add after Vercel deploy) |
| `JWT_SECRET`   | `your_super_secret_key`                            |
| `NODE_ENV`     | `production`                                       |

> 💡 You can also click **"RAW Editor"** and paste all variables at once.

### 5.4 Get Your Railway Backend URL

1. Go to the **"Settings"** tab of your Railway service.
2. Under **"Networking"**, click **"Generate Domain"**.
3. Railway gives you a URL like:

```
https://your-backend-production.up.railway.app
```

> 💾 **Save this URL** — this is your `VITE_API_URL` for the frontend.

### 5.5 Verify Deployment

Open your browser and visit:

```
https://your-backend-production.up.railway.app/health
```

You should see:
```json
{ "status": "OK", "message": "Server is running" }
```

---

## 6. Step 4 — Prepare Your Frontend Code

### 6.1 Update API Base URL

Never hardcode `localhost` in production. Use environment variables:

```js
// src/api/config.js  or  src/utils/axios.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_BASE_URL;
```

And use it everywhere:

```js
// Example usage in a component or service
import API_BASE_URL from '../api/config';

const response = await fetch(`${API_BASE_URL}/api/users`);
```

### 6.2 `.env` File (local only)

```env
# frontend/.env  — DO NOT COMMIT
VITE_API_URL=http://localhost:5000
```

### 6.3 `.env.production` (optional, for local production builds)

```env
# frontend/.env.production
VITE_API_URL=https://your-backend-production.up.railway.app
```

### 6.4 `vite.config.js` — Ensure Build is Correct

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173
  }
})
```

### 6.5 Add `vercel.json` for React Router (SPA Fix)

If you use React Router, create this file in the **root of your frontend**:

```json
// frontend/vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> ⚠️ Without this, refreshing on any page other than `/` will give a **404 error**.

### 6.6 `.gitignore` for Frontend

```gitignore
node_modules/
dist/
.env
.env.local
.env.production
*.log
```

---

## 7. Step 5 — Deploy Frontend on Vercel

### 7.1 Push Frontend to GitHub

```bash
cd frontend
git init
git add .
git commit -m "Initial frontend commit"
git branch -M main
git remote add origin https://github.com/yourusername/your-frontend-repo.git
git push -u origin main
```

### 7.2 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **"Add New… → Project"**.
3. Click **"Import Git Repository"** and select your frontend repo.
4. Vercel auto-detects **Vite/React** — leave most settings as default.

### 7.3 Configure Build Settings in Vercel

| Setting            | Value          |
|--------------------|----------------|
| **Framework**      | Vite           |
| **Root Directory** | `./` (or `frontend/` if monorepo) |
| **Build Command**  | `npm run build` |
| **Output Directory** | `dist`       |

### 7.4 Set Environment Variables in Vercel

1. Before clicking Deploy, expand **"Environment Variables"**.
2. Add:

| Variable Name   | Value                                               |
|-----------------|-----------------------------------------------------|
| `VITE_API_URL`  | `https://your-backend-production.up.railway.app`   |

> ⚠️ Variables starting with `VITE_` are exposed to the browser by Vite. Never put secrets here.

3. Click **"Deploy"**.

### 7.5 Get Your Vercel Frontend URL

After deployment succeeds, Vercel gives you:

```
https://your-app.vercel.app
```

> 💾 **Save this URL** — you need to add it back to Railway and MongoDB Atlas.

---

## 8. Step 6 — Connect Everything Together

This is the most important step — update all services to point to each other.

### 8.1 Update Railway → Add Frontend URL

1. Go to Railway → your backend service → **Variables**.
2. Update `FRONTEND_URL`:

```
FRONTEND_URL=https://your-app.vercel.app
```

3. Railway will **auto-redeploy** your backend.

### 8.2 Verify CORS is Working

Your backend's CORS should now allow requests from Vercel:

```js
app.use(cors({
  origin: process.env.FRONTEND_URL,  // 'https://your-app.vercel.app'
  credentials: true
}));
```

### 8.3 (Optional) Add Vercel Domain to MongoDB Atlas

MongoDB Atlas M0 (free) doesn't restrict by IP, but if you have a paid cluster with IP whitelisting:

1. Go to Atlas → **Network Access**.
2. Add `0.0.0.0/0` to allow Railway's dynamic IPs.

---

## 9. Step 7 — Verify Full Stack is Working

### 9.1 Test Checklist

Run through this checklist after full deployment:

- [ ] Visit `https://your-app.vercel.app` — frontend loads correctly
- [ ] Visit `https://your-backend.up.railway.app/health` — returns `{ status: "OK" }`
- [ ] Login / Register flow works (JWT auth)
- [ ] Data is being created/read from MongoDB Atlas
- [ ] Check Atlas → **Browse Collections** — new records appear
- [ ] Refresh a React Router page (e.g., `/dashboard`) — no 404
- [ ] Open browser DevTools → Network tab — no CORS errors

### 9.2 Check Logs

**Railway logs:**
- Railway Dashboard → your service → **"Logs"** tab
- Look for: `✅ MongoDB Atlas connected` and `🚀 Server running`

**Vercel logs:**
- Vercel Dashboard → your project → **"Functions"** tab or **"Deployments"**

**Atlas logs:**
- Atlas → your cluster → **"Monitoring"** tab

---

## 10. Environment Variables Reference

### Backend (Railway)

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
JWT_SECRET=a_very_long_random_secret_string_here
```

### Frontend (Vercel)

```env
VITE_API_URL=https://your-backend-production.up.railway.app
```

> ✅ **Rule of Thumb:**
> - Secrets (JWT, DB passwords) → **Railway only**
> - Public API URL → **Vercel** (prefix with `VITE_`)
> - Never commit `.env` files to GitHub

---

## 11. Common Errors & Fixes

### ❌ CORS Error: "Access-Control-Allow-Origin"

**Cause:** Backend CORS doesn't include your Vercel URL.  
**Fix:** Update `FRONTEND_URL` in Railway variables and redeploy.

```js
// Make sure this matches EXACTLY (no trailing slash)
origin: 'https://your-app.vercel.app'
```

---

### ❌ MongoDB Connection Error: "bad auth"

**Cause:** Wrong username/password in `MONGODB_URI`.  
**Fix:** Regenerate the password in Atlas → Database Access → Edit User.

---

### ❌ Railway Deploy Fails: "No start command found"

**Cause:** `package.json` missing the `"start"` script.  
**Fix:**

```json
"scripts": {
  "start": "node index.js"
}
```

---

### ❌ Vercel: 404 on Page Refresh

**Cause:** Missing `vercel.json` rewrite rules for SPA.  
**Fix:** Add `vercel.json` to frontend root:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

### ❌ `import.meta.env.VITE_API_URL` is `undefined`

**Cause:** Environment variable not set in Vercel dashboard, or missing `VITE_` prefix.  
**Fix:** In Vercel → Settings → Environment Variables, add `VITE_API_URL` and **redeploy**.

---

### ❌ Railway App Crashes After Deploy

**Cause:** `PORT` hardcoded as `5000` while Railway assigns a dynamic port.  
**Fix:**

```js
const PORT = process.env.PORT || 5000;
app.listen(PORT, ...);
```

---

### ❌ Atlas IP Blocked Error

**Cause:** Atlas Network Access doesn't include Railway's IP.  
**Fix:** Add `0.0.0.0/0` in Atlas → Security → Network Access.

---

## 12. CI/CD Auto-Deploy Flow

Once set up, every future push triggers automatic redeployment:

```
You push code to GitHub
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
 Railway     Vercel
(backend)  (frontend)
auto-deploy auto-deploy
    │          │
    ▼          ▼
Live in ~2-3 minutes
```

### Tips for Smooth CI/CD

- **Never push `.env` files** — use dashboard variables only.
- Use **separate branches**: `main` for production, `dev` for development.
- In Railway and Vercel, you can set **which branch** triggers production deploys.
- Use **preview deployments** in Vercel for pull requests.

---

## ✅ Final Deployment Summary

| Service        | Role       | URL Example                                        |
|----------------|------------|----------------------------------------------------|
| MongoDB Atlas  | Database   | Internal (used via connection string only)         |
| Railway        | Backend    | `https://your-backend.up.railway.app`             |
| Vercel         | Frontend   | `https://your-app.vercel.app`                     |

**Deployment Order:**
1. 🟢 MongoDB Atlas → Create cluster, user, whitelist IPs, get URI
2. 🟡 Railway → Deploy backend, set env vars including `MONGODB_URI`
3. 🔵 Vercel → Deploy frontend, set `VITE_API_URL` to Railway URL
4. 🔄 Update Railway → Set `FRONTEND_URL` to Vercel URL
5. ✅ Test all endpoints end-to-end

---

*Generated for Stack: Vite/React · Node.js/Express · MongoDB Atlas · Railway · Vercel*
