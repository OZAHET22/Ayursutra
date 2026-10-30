# Render Environment Variables - Complete Setup Guide

## What are Environment Variables?

Environment variables are **secret values** that your backend needs but shouldn't be in code:
- Database passwords
- API keys
- JWT secrets
- Email credentials

Render keeps these **secure** and **hidden** from GitHub.

---

## METHOD 1: Add Variables One by One (Recommended)

### Step 1: Go to Environment Variables Section
1. In Render dashboard
2. Scroll down to **"Environment"** section
3. Click **"+ Add Environment Variable"** button

### Step 2: Fill in Each Variable

For each variable, enter:
- **NAME_OF_VARIABLE**: The key name (left column)
- **value**: The actual value (right column)

**Add these 7 variables:**

#### Variable 1: MongoDB Connection
```
NAME_OF_VARIABLE: MONGO_URI
value: mongodb+srv://ayursutra_user:your_password@cluster0.xxxxx.mongodb.net/ayursutra?retryWrites=true&w=majority
```

#### Variable 2: JWT Secret
```
NAME_OF_VARIABLE: JWT_SECRET
value: your_super_secret_random_key_at_least_32_characters_long_abc123xyz789
```

#### Variable 3: Email User
```
NAME_OF_VARIABLE: EMAIL_USER
value: ozahet32@gmail.com
```

#### Variable 4: Email Password
```
NAME_OF_VARIABLE: EMAIL_PASSWORD
value: xxxx xxxx xxxx xxxx
```

#### Variable 5: Node Environment
```
NAME_OF_VARIABLE: NODE_ENV
value: production
```

#### Variable 6: Frontend URL
```
NAME_OF_VARIABLE: FRONTEND_URL
value: https://ayursutra.vercel.app
```

#### Variable 7: Port
```
NAME_OF_VARIABLE: PORT
value: 3000
```

### Step 3: Visual Guide

Your environment section should look like:

```
┌──────────────────────────────────────────────────────────────────┐
│ Environment Variables                                            │
├──────────────────────┬──────────────────────────────────────────┤
│ NAME_OF_VARIABLE     │ value                                    │
├──────────────────────┼──────────────────────────────────────────┤
│ MONGO_URI            │ mongodb+srv://...                        │
├──────────────────────┼──────────────────────────────────────────┤
│ JWT_SECRET           │ abc123xyz789...                          │
├──────────────────────┼──────────────────────────────────────────┤
│ EMAIL_USER           │ ozahet32@gmail.com                       │
├──────────────────────┼──────────────────────────────────────────┤
│ EMAIL_PASSWORD       │ ●●●●●●●●●●                              │
├──────────────────────┼──────────────────────────────────────────┤
│ NODE_ENV             │ production                               │
├──────────────────────┼──────────────────────────────────────────┤
│ FRONTEND_URL         │ https://ayursutra.vercel.app             │
├──────────────────────┼──────────────────────────────────────────┤
│ PORT                 │ 3000                                     │
└──────────────────────┴──────────────────────────────────────────┘
```

---

## METHOD 2: Add from .env File (Faster)

### Step 1: Create Local .env File

Create file: `ayursutra-backend/.env`

```env
MONGO_URI=mongodb+srv://ayursutra_user:your_password@cluster0.xxxxx.mongodb.net/ayursutra?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_random_key_at_least_32_characters_long
EMAIL_USER=ozahet32@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
NODE_ENV=production
FRONTEND_URL=https://ayursutra.vercel.app
PORT=3000
```

### Step 2: In Render Dashboard

1. Scroll to **"Environment"** section
2. Click **"Add from .env"** button
3. Copy-paste entire .env file contents
4. Click **"Parse"** or **"Add"**
5. Render automatically parses all variables!

### Step 3: Verify Variables

All 7 variables should now appear in the list:
- ✅ MONGO_URI
- ✅ JWT_SECRET
- ✅ EMAIL_USER
- ✅ EMAIL_PASSWORD
- ✅ NODE_ENV
- ✅ FRONTEND_URL
- ✅ PORT

---

## IMPORTANT VALUES TO ENTER

### 1. MONGO_URI (MongoDB Connection String)

**Format:**
```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE
```

**Your actual example:**
```
mongodb+srv://ayursutra_user:MyActual123Password@cluster0.abc123xyz.mongodb.net/ayursutra?retryWrites=true&w=majority
```

**Where to get it:**
- MongoDB Atlas → Clusters → Connect → Connection String

### 2. JWT_SECRET (Random Secret Key)

Generate a random string (at least 32 characters):

**Examples:**
```
sk_test_51234567890abcdefghijklmnopqrstuvwxyz123456
```

**Or use this approach:**
- Open terminal
- Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Copy output

### 3. EMAIL_USER

```
ozahet32@gmail.com
```

### 4. EMAIL_PASSWORD

⚠️ **NOT your Gmail password!**

**Use Gmail App Password:**
1. Go to: https://myaccount.google.com/security
2. Click **"App passwords"**
3. Select Device: **Windows Computer**
4. Select App: **Mail**
5. Generate password (16 characters with spaces)
6. Copy and paste: `xxxx xxxx xxxx xxxx`

### 5. NODE_ENV

```
production
```

(Tells your app to run in production mode)

### 6. FRONTEND_URL

```
https://ayursutra.vercel.app
```

(Your Vercel frontend URL)

### 7. PORT

```
3000
```

(Port Render will run on)

---

## STEP-BY-STEP VISUAL WALKTHROUGH

### Step 1: See Environment Section
```
┌─────────────────────────────────────────────┐
│ Configure Service                           │
│                                             │
│ Build and Output Settings                   │
│ ┌─────────────────────────────────────────┐ │
│ │ Build Command: npm install              │ │
│ │ Start Command: npm start                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Environment                          ▼      │ ← Click here
└─────────────────────────────────────────────┘
```

### Step 2: Click Environment to Expand
```
┌──────────────────────────────────────────────────┐
│ Environment                                  ▲   │
│ ┌────────────────────────────────────────────┐   │
│ │ NAME_OF_VARIABLE  │ value      │           │   │
│ ├───────────────────┼────────────┼───────────┤   │
│ │ [empty field]     │ [empty]    │ [minus]   │   │
│ └────────────────────────────────────────────┘   │
│           ┌──────────────────┐                   │
│           │ + Add More       │                   │
│           └──────────────────┘                   │
│                                                  │
│           ┌──────────────────┐                   │
│           │ Import .env      │                   │
│           └──────────────────┘                   │
└──────────────────────────────────────────────────┘
```

### Step 3: Fill First Variable
```
┌──────────────────────────────────────────────────┐
│ Environment                                      │
│ ┌────────────────────────────────────────────┐   │
│ │ NAME_OF_VARIABLE  │ value      │           │   │
│ ├───────────────────┼────────────┼───────────┤   │
│ │ MONGO_URI         │ mongodb+srv://... │ [−] │   │
│ └────────────────────────────────────────────┘   │
│           ┌──────────────────┐                   │
│           │ + Add More       │                   │
│           └──────────────────┘                   │
│                                                  │
│           ┌──────────────────┐                   │
│           │ Import .env      │                   │
│           └──────────────────┘                   │
└──────────────────────────────────────────────────┘
```

### Step 4: Click "Add More" for Next Variable
```
MONGO_URI          │ mongodb+srv://...
                   │ + Add More ← Click here
JWT_SECRET         │ [empty]
```

### Step 5: Continue Until All 7 Added
```
✓ MONGO_URI           mongodb+srv://...
✓ JWT_SECRET          abc123...
✓ EMAIL_USER          ozahet32@gmail.com
✓ EMAIL_PASSWORD      ●●●●●●●●
✓ NODE_ENV            production
✓ FRONTEND_URL        https://ayursutra.vercel.app
✓ PORT                3000
```

---

## COMMON MISTAKES TO AVOID

### ❌ Mistake 1: Wrong MongoDB Connection String
**Wrong:**
```
mongodb://localhost:27017/ayursutra
```
**Right:**
```
mongodb+srv://ayursutra_user:PASSWORD@cluster0.xxxxx.mongodb.net/ayursutra
```

### ❌ Mistake 2: Using Gmail Password Instead of App Password
**Wrong:**
```
EMAIL_PASSWORD=MyGmailPassword123
```
**Right:**
```
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```
(16-char app password from Google Account)

### ❌ Mistake 3: Forgetting FRONTEND_URL
**Result:** CORS errors when frontend tries to reach backend

**Right:**
```
FRONTEND_URL=https://ayursutra.vercel.app
```

### ❌ Mistake 4: PORT Set to 5000
**Wrong:**
```
PORT=5000
```
**Right:**
```
PORT=3000
```
(Render dictates the port)

### ❌ Mistake 5: Using Local Localhost URL
**Wrong:**
```
FRONTEND_URL=http://localhost:5173
```
**Right:**
```
FRONTEND_URL=https://ayursutra.vercel.app
```

---

## AFTER ADDING VARIABLES

### Step 1: Create Web Service
- Review all settings
- Click **"Create Web Service"** button
- Render starts deploying

### Step 2: Watch Deployment
- Render builds your app
- Installs dependencies
- Starts the server
- Shows logs of what's happening

### Step 3: Check Deployment Status
```
🔨 Building...
📦 Installing dependencies...
🚀 Starting application...
✅ MongoDB Connected
✅ Backend running on port 3000
```

### Step 4: Get Your Backend URL
Once deployed, you'll see:
```
https://ayursutra-backend.onrender.com
```

### Step 5: Test It Works
1. Open browser
2. Go to: `https://ayursutra-backend.onrender.com/health`
3. Should see: `{"status": "Backend is running", "timestamp": "..."}`

---

## TROUBLESHOOTING ENVIRONMENT VARIABLES

### Problem: "Cannot connect to MongoDB"

**Check these:**
1. Is `MONGO_URI` correct? (Copy from MongoDB Atlas)
2. Does password have special characters? (URL encode if needed)
3. Is user created in MongoDB Atlas?
4. Is IP access allowed? (0.0.0.0/0)

### Problem: "Email not sending"

**Check these:**
1. `EMAIL_USER` = your Gmail
2. `EMAIL_PASSWORD` = Gmail App Password (NOT regular password)
3. Go to https://myaccount.google.com/security to generate it

### Problem: "CORS error from frontend"

**Check this:**
```
FRONTEND_URL=https://ayursutra.vercel.app
```
Must match your actual Vercel URL!

### Problem: Variables not updating after change

**Solution:**
1. Update variable in Render
2. Scroll down and click **"Deploy"** button
3. Wait for redeployment
4. Variables take effect after restart

---

## SUMMARY CHECKLIST

Before clicking "Create Web Service":

- [ ] **MONGO_URI** = Complete MongoDB connection string with password
- [ ] **JWT_SECRET** = Random 32+ character string
- [ ] **EMAIL_USER** = Your Gmail address
- [ ] **EMAIL_PASSWORD** = Gmail App Password (from myaccount.google.com)
- [ ] **NODE_ENV** = `production`
- [ ] **FRONTEND_URL** = Your Vercel URL (https://ayursutra.vercel.app)
- [ ] **PORT** = `3000`

All 7 variables visible in Environment section? ✓

Then click **"Create Web Service"** and wait for deployment!

