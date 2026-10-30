# 🚀 Ayursutra — Complete Vercel Deployment Guide
### MERN Stack | React + Node/Express + MongoDB Atlas
### Senior Engineer Guide — Local to Production

---

## 📋 Table of Contents

1. [Project Structure](#1-project-structure)
2. [Remove Old Unused Code](#2-remove-old-unused-code)
3. [Backend Changes](#3-backend-changes)
4. [Fix Socket.io → Pusher](#4-fix-socketio--pusher)
5. [Fix node-cron → Vercel Cron](#5-fix-node-cron--vercel-cron)
6. [Fix File Uploads → Cloudinary](#6-fix-file-uploads--cloudinary)
7. [Backend vercel.json](#7-backend-verceljson)
8. [Frontend Changes](#8-frontend-changes)
9. [Frontend vercel.json](#9-frontend-verceljson)
10. [Environment Variables](#10-environment-variables)
11. [Deploy Backend on Vercel](#11-deploy-backend-on-vercel)
12. [Deploy Frontend on Vercel](#12-deploy-frontend-on-vercel)
13. [Final Testing Checklist](#13-final-testing-checklist)
14. [Common Errors and Fixes](#14-common-errors-and-fixes)

---

## 1. Project Structure

Your project should look like this:

```
ayursutra/
├── backend/               ← Node/Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── config/
│   ├── index.js           ← Entry point
│   ├── package.json
│   ├── vercel.json        ← ADD THIS (Step 7)
│   └── .gitignore
│
└── frontend/              ← React/Vite App
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── utils/
    │   └── App.jsx
    ├── package.json
    ├── vite.config.js
    ├── vercel.json        ← ADD THIS (Step 9)
    └── .gitignore
```

---

## 2. Remove Old Unused Code

> ⚠️ REMOVE ALL of these before deploying. They will BREAK on Vercel.

### 2.1 Remove Socket.io

```bash
# Run in backend folder
cd backend
npm uninstall socket.io
npm uninstall socket.io-client
```

**Find and DELETE this code in `index.js`:**

```js
// ❌ DELETE THIS ENTIRE BLOCK
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
io.on('connection', (socket) => {
  console.log('Socket.io enabled');
  socket.on('disconnect', () => {});
});
server.listen(PORT);
// ❌ DELETE ABOVE
```

**Find and DELETE all `io.emit()` calls in routes/controllers:**

```js
// ❌ DELETE EVERY LINE LIKE THESE
io.emit('newPatient', data);
io.emit('newAppointment', data);
io.emit('updateStatus', data);
socket.emit('message', data);
```

---

### 2.2 Remove node-cron

```bash
npm uninstall node-cron
```

**Find and DELETE this code:**

```js
// ❌ DELETE THIS
const cron = require('node-cron');
cron.schedule('0 * * * *', () => {
  // any cron job code
});
```

---

### 2.3 Remove Local File System Writes

**Find and DELETE these patterns:**

```js
// ❌ DELETE ALL fs.writeFile / fs.readFile for uploads
const fs = require('fs');
fs.writeFile('./uploads/file.pdf', data);
fs.readFileSync('./uploads/image.jpg');

// ❌ DELETE local multer disk storage
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => { cb(null, file.originalname); }
});
```

---

### 2.4 Remove Railway MongoDB URL

In Railway Variables or `.env`:

```bash
# ❌ DELETE THIS — Railway internal MongoDB
MONGODB_URI=mongodb://mongo:password@mongodb.railway.internal:27017/dbname
```

---

## 3. Backend Changes

### 3.1 Install New Packages

```bash
cd backend
npm install pusher cloudinary multer multer-storage-cloudinary dotenv
```

---

### 3.2 Complete `index.js` — Clean Version

Replace your entire `index.js` with this:

```js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Pusher = require('pusher');
require('dotenv').config();

const app = express();

// ============================================
// ✅ PUSHER SETUP (Replaces Socket.io)
// ============================================
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});
app.set('pusher', pusher);

// ============================================
// ✅ MIDDLEWARE
// ============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// ✅ ROUTES — Add all your routes here
// ============================================
app.use('/api/auth',        require('./src/routes/auth'));
app.use('/api/users',       require('./src/routes/users'));
app.use('/api/patients',    require('./src/routes/patients'));
app.use('/api/doctors',     require('./src/routes/doctors'));
app.use('/api/appointments',require('./src/routes/appointments'));
app.use('/api/centres',     require('./src/routes/centres'));
app.use('/api/stats',       require('./src/routes/stats'));
app.use('/api/cron',        require('./src/routes/cron'));
app.use('/api/upload',      require('./src/routes/upload'));

// ============================================
// ✅ HEALTH CHECK — Required for Vercel
// ============================================
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: '🚀 Ayursutra API Running',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ✅ MONGODB ATLAS CONNECTION
// ============================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// ============================================
// ✅ CRITICAL — Export for Vercel
// ============================================
module.exports = app;

// ✅ Local development only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
```

---

### 3.3 Update `package.json`

```json
{
  "name": "ayursutra-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "build": "echo No build needed"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cloudinary": "^1.41.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0",
    "mongoose": "^8.0.0",
    "multer": "^1.4.5",
    "multer-storage-cloudinary": "^4.0.0",
    "pusher": "^5.2.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

---

### 3.4 Backend `.gitignore`

```gitignore
node_modules/
.env
.env.local
*.log
uploads/
dist/
```

---

## 4. Fix Socket.io → Pusher

### 4.1 Create Pusher Account

1. Go to → **https://pusher.com**
2. Sign up free
3. Click **"Create App"**
4. Fill in:
   ```
   App name  → ayursutra
   Cluster   → ap2 (Mumbai — closest to India)
   ```
5. Go to **"App Keys"** tab
6. Copy these 4 values:
   ```
   app_id  → save this
   key     → save this
   secret  → save this
   cluster → ap2
   ```

---

### 4.2 Replace io.emit() with Pusher in Routes

**Find every `io.emit()` in your routes/controllers and replace:**

```js
// ❌ OLD Socket.io code — DELETE
io.emit('newPatient', patientData);
io.emit('appointmentBooked', appointmentData);

// ✅ NEW Pusher code — ADD
const pusher = req.app.get('pusher');
pusher.trigger('ayursutra', 'newPatient', patientData);
pusher.trigger('ayursutra', 'appointmentBooked', appointmentData);
```

---

### 4.3 Update Frontend — Install Pusher JS

```bash
cd frontend
npm install pusher-js
```

---

### 4.4 Create `src/utils/pusher.js` in Frontend

```js
import Pusher from 'pusher-js';

const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
});

export const channel = pusher.subscribe('ayursutra');
export default pusher;
```

---

### 4.5 Replace Socket.io in Frontend Components

```js
// ❌ OLD Socket.io code — DELETE
import io from 'socket.io-client';
const socket = io(import.meta.env.VITE_API_URL);
socket.on('newPatient', (data) => {
  setPatients(prev => [...prev, data]);
});

// ✅ NEW Pusher code — ADD
import { channel } from '../utils/pusher';
channel.bind('newPatient', (data) => {
  setPatients(prev => [...prev, data]);
});
```

---

## 5. Fix node-cron → Vercel Cron

### 5.1 Create `src/routes/cron.js` in Backend

```js
const router = require('express').Router();

// ✅ Vercel calls this route automatically on schedule
// Add all your old cron job logic here

router.get('/reminders', async (req, res) => {
  try {
    // ✅ Your old reminder email logic here
    console.log('✅ Cron job ran:', new Date().toISOString());
    res.json({ success: true, message: 'Cron executed', time: new Date() });
  } catch (err) {
    console.error('❌ Cron error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/cleanup', async (req, res) => {
  try {
    // ✅ Your old cleanup logic here
    res.json({ success: true, message: 'Cleanup done' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

## 6. Fix File Uploads → Cloudinary

### 6.1 Create Cloudinary Account

1. Go to → **https://cloudinary.com**
2. Sign up free
3. Go to **Dashboard**
4. Copy:
   ```
   Cloud Name → save this
   API Key    → save this
   API Secret → save this
   ```

---

### 6.2 Create `src/config/cloudinary.js`

```js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ayursutra',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
    resource_type: 'auto'
  }
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };
```

---

### 6.3 Create `src/routes/upload.js`

```js
const router = require('express').Router();
const { upload, cloudinary } = require('../config/cloudinary');

// ✅ Upload single file
router.post('/single', upload.single('file'), async (req, res) => {
  try {
    res.json({
      success: true,
      url: req.file.path,
      publicId: req.file.filename
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Upload multiple files
router.post('/multiple', upload.array('files', 5), async (req, res) => {
  try {
    const urls = req.files.map(f => ({
      url: f.path,
      publicId: f.filename
    }));
    res.json({ success: true, files: urls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete file
router.delete('/:publicId', async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

## 7. Backend `vercel.json`

Create this file in **backend root** (same level as `index.js`):

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ],
  "functions": {
    "index.js": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

---

## 8. Frontend Changes

### 8.1 Update `src/utils/api.js` or axios config

```js
// ✅ Base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL;

export default API_BASE_URL;
```

---

### 8.2 Add Server Warmup in `src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ✅ Wake up Vercel backend on app start
const warmup = async () => {
  try {
    await fetch(`${import.meta.env.VITE_API_URL}/`);
  } catch (e) {}
};
warmup();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### 8.3 Uninstall socket.io-client from Frontend

```bash
cd frontend
npm uninstall socket.io-client
```

---

### 8.4 Frontend `.env` (local only)

```env
VITE_API_URL        = http://localhost:5000
VITE_PUSHER_KEY     = your_pusher_key
VITE_PUSHER_CLUSTER = ap2
```

---

### 8.5 Frontend `.gitignore`

```gitignore
node_modules/
dist/
.env
.env.local
*.log
```

---

## 9. Frontend `vercel.json`

Create this in **frontend root** (same level as `package.json`):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 10. Environment Variables

### Backend — Vercel Dashboard

```env
MONGODB_URI           = mongodb+srv://user:pass@ayursutra.stvezlx.mongodb.net/ayursutradb?retryWrites=true&w=majority
FRONTEND_URL          = https://ayursutra-frontend.vercel.app
JWT_SECRET            = your_super_secret_jwt_key_minimum_32_chars
NODE_ENV              = production

PUSHER_APP_ID         = your_pusher_app_id
PUSHER_KEY            = your_pusher_key
PUSHER_SECRET         = your_pusher_secret
PUSHER_CLUSTER        = ap2

CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY    = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
```

---

### Frontend — Vercel Dashboard

```env
VITE_API_URL          = https://ayursutra-backend.vercel.app
VITE_PUSHER_KEY       = your_pusher_key
VITE_PUSHER_CLUSTER   = ap2
```

---

## 11. Deploy Backend on Vercel

### Step 1 — Push Backend to GitHub

```bash
cd backend
git init                          # if not already
git add .
git commit -m "feat: configure for Vercel deployment"
git branch -M main
git remote add origin https://github.com/yourusername/ayursutra-backend.git
git push -u origin main
```

---

### Step 2 — Import to Vercel

1. Go to **https://vercel.com**
2. Click **"Add New Project"**
3. Select your **backend GitHub repo**
4. Configure:

```
Framework Preset  → Other
Root Directory    → ./
Build Command     → (leave empty)
Output Directory  → (leave empty)
Install Command   → npm install
```

---

### Step 3 — Add All Environment Variables

Before clicking Deploy → add every variable from Section 10 (Backend).

---

### Step 4 — Click Deploy

Wait 2 minutes → You get:

```
https://ayursutra-backend.vercel.app
```

---

### Step 5 — Verify Backend is Live

Open in browser:

```
https://ayursutra-backend.vercel.app/
```

You should see:

```json
{
  "status": "OK",
  "message": "🚀 Ayursutra API Running",
  "timestamp": "2026-04-30T00:00:00.000Z"
}
```

---

## 12. Deploy Frontend on Vercel

### Step 1 — Push Frontend to GitHub

```bash
cd frontend
git init                          # if not already
git add .
git commit -m "feat: configure for Vercel deployment"
git branch -M main
git remote add origin https://github.com/yourusername/ayursutra-frontend.git
git push -u origin main
```

---

### Step 2 — Import to Vercel

1. Vercel → **"Add New Project"**
2. Select your **frontend GitHub repo**
3. Configure:

```
Framework Preset  → Vite
Root Directory    → ./
Build Command     → npm run build
Output Directory  → dist
Install Command   → npm install
```

---

### Step 3 — Add Environment Variables

Add every variable from Section 10 (Frontend).

---

### Step 4 — Click Deploy

Wait 2 minutes → You get:

```
https://ayursutra-frontend.vercel.app
```

---

### Step 5 — Update Backend FRONTEND_URL

Go to **Vercel → Backend Project → Settings → Environment Variables**

Update:

```
FRONTEND_URL = https://ayursutra-frontend.vercel.app
```

Then **Redeploy backend** so CORS updates.

---

## 13. Final Testing Checklist

Run through every item after deployment:

```
Backend Tests:
─────────────────────────────────────────────
[ ] Visit /  → shows { status: "OK" }
[ ] Visit /api/stats/public → returns data
[ ] Visit /api/users/doctors → returns list
[ ] Vercel Functions tab → no errors

Frontend Tests:
─────────────────────────────────────────────
[ ] Homepage loads with data
[ ] Stats/counters show numbers
[ ] Doctors list loads
[ ] Centres list loads
[ ] Login works
[ ] Register works
[ ] File upload works (Cloudinary)
[ ] Real-time updates work (Pusher)
[ ] Page refresh on /dashboard → no 404
[ ] Page refresh on /profile → no 404

Browser DevTools (F12 → Network):
─────────────────────────────────────────────
[ ] No red errors in Console tab
[ ] API calls go to ayursutra-backend.vercel.app
[ ] All API calls return 200 OK
[ ] No CORS errors
```

---

## 14. Common Errors and Fixes

### ❌ Error: Cannot find module 'socket.io'
```
Fix: npm uninstall socket.io
     Remove all socket.io code from index.js
```

---

### ❌ Error: CORS blocked
```
Fix: Update FRONTEND_URL in Vercel backend variables
     to exact frontend URL (no trailing slash)
     Then redeploy backend
```

---

### ❌ Error: MongoDB bad auth
```
Fix: Reset Atlas DB password (use only letters + numbers)
     Update MONGODB_URI in Vercel backend variables
     No special characters like @ # $ % in password
```

---

### ❌ Error: 404 on page refresh
```
Fix: Make sure vercel.json exists in frontend root
     with rewrites rule pointing to /index.html
```

---

### ❌ Error: module.exports not found
```
Fix: Make sure index.js has:
     module.exports = app;
     at the bottom
```

---

### ❌ Error: Function timeout
```
Fix: vercel.json → functions → maxDuration: 30
     Check for slow MongoDB queries
```

---

### ❌ Error: VITE_API_URL is undefined
```
Fix: All Vercel frontend variables MUST start with VITE_
     Add VITE_API_URL in Vercel → Frontend → Settings → Env Vars
     Then REDEPLOY frontend
```

---

### ❌ Error: Pusher not connecting
```
Fix: Check VITE_PUSHER_KEY and VITE_PUSHER_CLUSTER in frontend
     Check PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET in backend
     Cluster must match: ap2
```

---

## ✅ Final Architecture

```
┌──────────────────────────────────────────────────┐
│                    VERCEL                        │
│                                                  │
│   Frontend                    Backend            │
│   (React/Vite)    ─────────►  (Node/Express)     │
│   ayursutra-      API calls   ayursutra-         │
│   frontend.                   backend.           │
│   vercel.app      ◄─────────  vercel.app         │
│                   JSON data                      │
└──────────────┬────────────────────┬─────────────┘
               │                    │
               ▼                    ▼
        MongoDB Atlas            Pusher
        (Database)            (Realtime)
               │
               ▼
          Cloudinary
         (File Storage)
```

---

## 📦 All Services Used — Free Tier

| Service | Purpose | Free Limit |
|---------|---------|------------|
| Vercel | Frontend + Backend | 100GB bandwidth |
| MongoDB Atlas | Database | 512MB storage |
| Pusher | Realtime (Socket.io) | 200k msg/day |
| Cloudinary | File uploads | 25GB storage |

---

*Ayursutra Deployment Guide — Senior MERN Engineer*
*Stack: React · Vite · Node · Express · MongoDB Atlas · Vercel*
