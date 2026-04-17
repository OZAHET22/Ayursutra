# Render.com & MongoDB Atlas Complete Setup Guide

---

## PART 1: MONGODB ATLAS SETUP (Database)

### Step 1.1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click **"Try Free"** or **"Sign Up"**
3. Use Google, GitHub, or Email to register
4. Confirm your email

### Step 1.2: Create Project
1. You'll see a popup "Let's start with your first project"
2. Enter **Project Name**: `Ayursutra`
3. Click **"Create Project"**
4. Click **"Continue"** for next step

### Step 1.3: Create Cluster
1. Click **"Create"** button
2. Choose deployment option: **"M0 Free"** (Free tier)
3. Click **"Create"**
4. Choose your **Region**:
   - If users are in India → Select `Asia: Mumbai (ap-south-1)`
   - If users are in USA → Select `US East (N. Virginia)`
   - If global → Select closest region to majority users
5. Click **"Create Cluster"**
6. Wait 2-5 minutes for cluster to be ready (green checkmark)

### Step 1.4: Create Database User

**This is your database login credentials:**

1. Cluster is ready → Click **"Database"** in left sidebar
2. Under your cluster, click **"Connect"**
3. Click **"Database Access"** tab on left
4. Click **"+ Add New Database User"** button
5. Fill in:
   - **Username**: `ayursutra_user`
   - **Password**: Click **"Autogenerate Secure Password"** (copy this!)
   - **User Privileges**: Select **"Atlas admin"**
   - Click **"Add User"**

**Save this information:**
```
Username: ayursutra_user
Password: [Your auto-generated password - copy it NOW!]
```

### Step 1.5: Configure Network Access

1. Click **"Network Access"** tab in left sidebar
2. Click **"+ Add IP Address"** button
3. Choose one option:
   - **For Development**: Click **"Allow Access from Anywhere"** → Add `0.0.0.0/0`
   - **For Production**: Only add specific IP addresses
4. Click **"Confirm"**

### Step 1.6: Get Connection String

**This is the URL your backend will use to connect:**

1. Go to **"Clusters"** tab
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Select:
   - **Driver**: Node.js
   - **Version**: 5.9 or later
5. Copy the connection string:

```
mongodb+srv://ayursutra_user:<password>@cluster0.xxxxx.mongodb.net/ayursutra?retryWrites=true&w=majority
```

**Replace `<password>` with your actual password** (not the placeholder)

**Final Connection String should look like:**
```
mongodb+srv://ayursutra_user:MyActualPassword123@cluster0.abc123.mongodb.net/ayursutra?retryWrites=true&w=majority
```

---

## PART 2: RENDER.COM BACKEND DEPLOYMENT

### Step 2.1: Create Render Account

1. Go to https://render.com
2. Click **"Get Started"** or **"Sign Up"**
3. Click **"Sign up with GitHub"** (easier - uses your GitHub account)
4. Authorize Render to access your GitHub
5. Confirm email

### Step 2.2: Create New Web Service

1. From Render dashboard, click **"New +"** button
2. Select **"Web Service"**
3. Under "GitHub", paste your repo URL or search:
   - Search: `Ayursutra`
   - Click on your repository
4. Click **"Connect"** button

### Step 2.3: Configure Service Settings

Fill in these fields:

| Field | Value |
|-------|-------|
| **Name** | `ayursutra-backend` |
| **Runtime** | Select **`Node`** |
| **Region** | Choose same as MongoDB (e.g., `Singapore` or `Frankfurt`) |
| **Branch** | `main` |
| **Root Directory** | `ayursutra-backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Select **`Free`** tier |

**Your screen should look like:**
```
Name: ayursutra-backend
Environment: Node
Region: Singapore
Branch: main
Root Directory: ayursutra-backend
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

### Step 2.4: Add Environment Variables

1. **Scroll down** to **"Environment"** section
2. Click **"Add Environment Variable"** or **"+ Add"**
3. Add each variable by filling **Key** and **Value**:

```
Key: MONGO_URI
Value: mongodb+srv://ayursutra_user:PASSWORD@cluster0.abc123.mongodb.net/ayursutra?retryWrites=true&w=majority
```

Replace `PASSWORD` with your actual MongoDB password!

4. **Add more variables** - Click **"+ Add"** for each:

```
MONGO_URI=mongodb+srv://ayursutra_user:YourPassword@cluster0.xxxxx.mongodb.net/ayursutra?retryWrites=true&w=majority

JWT_SECRET=your_super_secret_jwt_key_make_it_random_and_long_at_least_32_characters

EMAIL_USER=ozahet32@gmail.com

EMAIL_PASSWORD=your_gmail_app_password

NODE_ENV=production

FRONTEND_URL=https://ayursutra.vercel.app

PORT=3000
```

**Environment Variables Form:**
```
┌─────────────────────────────────────────────────────────────┐
│ Environment Variables                                       │
├─────────────────────┬───────────────────────────────────────┤
│ Key: MONGO_URI      │ Value: mongodb+srv://...              │
├─────────────────────┼───────────────────────────────────────┤
│ Key: JWT_SECRET     │ Value: your_secret_key_123            │
├─────────────────────┼───────────────────────────────────────┤
│ Key: EMAIL_USER     │ Value: ozahet32@gmail.com             │
├─────────────────────┼───────────────────────────────────────┤
│ Key: EMAIL_PASSWORD │ Value: xxxx xxxx xxxx xxxx            │
├─────────────────────┼───────────────────────────────────────┤
│ Key: NODE_ENV       │ Value: production                     │
├─────────────────────┼───────────────────────────────────────┤
│ Key: FRONTEND_URL   │ Value: https://ayursutra.vercel.app   │
├─────────────────────┼───────────────────────────────────────┤
│ Key: PORT           │ Value: 3000                           │
└─────────────────────┴───────────────────────────────────────┘
```

### Step 2.5: Deploy

1. **Review all settings** - Make sure everything is correct
2. Click **"Create Web Service"** button (bottom right)
3. **Wait for deployment** (this takes 3-5 minutes)
4. You'll see a log window showing:
   ```
   Building...
   Installing dependencies...
   Building application...
   🚀 Ayursutra backend running on http://localhost:5000
   ✅ MongoDB Connected
   ```

### Step 2.6: Get Your Backend URL

Once deployed successfully:

1. You'll see a dashboard with your service details
2. At the top, you'll see your URL like:
   ```
   https://ayursutra-backend.onrender.com
   ```
3. **Copy this URL** - you'll need it for Vercel!

### Step 2.7: Test Backend

1. Open your browser
2. Go to: `https://ayursutra-backend.onrender.com/health`
3. You should see:
   ```json
   {
     "status": "Backend is running",
     "timestamp": "2026-04-16T..."
   }
   ```

**If it works, your backend is live!** ✅

---

## PART 3: TROUBLESHOOTING

### Problem: Render shows "Build failed"

**Solution 1: Check Root Directory**
- Make sure **"Root Directory"** is set to `ayursutra-backend`
- Not just `backend` or `Ayursutra`

**Solution 2: Check Build Command**
- Should be: `npm install`
- Not: `npm install && npm build`

**Solution 3: Check logs**
- Click on your service
- Click **"Logs"** tab
- Look for error messages
- Share error message for help

### Problem: Backend runs but can't connect to MongoDB

**Issue: MongoDB connection fails**

**Solution 1: Check MONGO_URI is correct**
- Verify password has no special characters (or is URL-encoded)
- Check username is `ayursutra_user`
- Verify database name is `ayursutra`

**Solution 2: Allow IP access**
- Go to MongoDB Atlas → Network Access
- Make sure `0.0.0.0/0` is whitelisted
- Or add Render's IP (but complex)

**Solution 3: Test connection locally first**
```powershell
cd ayursutra-backend
$env:MONGO_URI="mongodb+srv://ayursutra_user:password@cluster.mongodb.net/ayursutra"
npm start
```

### Problem: Environment variables showing as undefined

**Check these:**
1. Variables are added in Render dashboard? ✓
2. Start Command is `npm start`? ✓
3. Service was redeployed after adding variables? ✓
4. Reload Render page to see latest status

### Problem: Backend URL returns 502 Bad Gateway

**Try this:**
1. Wait 2-3 minutes (Render might still be starting)
2. Check Render logs for errors
3. Verify `PORT=3000` environment variable is set
4. Check if MongoDB connection is working

### Problem: CORS errors from frontend

**When frontend tries to reach backend:**

1. **Update FRONTEND_URL** in Render environment variables
   - Set to: `https://ayursutra.vercel.app`
   - Or your actual Vercel frontend URL

2. **Redeploy** the backend
   - Go to Render dashboard
   - Click "Deploy" button
   - Wait for redeployment

---

## PART 4: NEXT STEPS

### After MongoDB Atlas & Render are ready:

1. ✅ You have: **Backend URL** (e.g., `https://ayursutra-backend.onrender.com`)
2. ✅ You have: **MongoDB Connected**
3. ✅ Backend working at: `/health` endpoint

### Next: Update Vercel Frontend

In Vercel dashboard:
1. Go to your project settings
2. Environment Variables
3. Update `VITE_API_URL` to your Render backend URL:
   ```
   https://ayursutra-backend.onrender.com
   ```
4. Save and redeploy

---

## PART 5: MONITORING & LOGS

### View Render Logs

1. Go to Render dashboard
2. Click on your `ayursutra-backend` service
3. Click **"Logs"** tab
4. Scroll to see what's happening:
   - `npm install` progress
   - Compilation output
   - Runtime errors
   - Startup messages

### View MongoDB Activity

1. Go to MongoDB Atlas dashboard
2. Click **"Clusters"**
3. Under your cluster, click **"Metrics"**
4. See:
   - Number of connections
   - Read/write operations
   - Storage usage

---

## FINAL CHECKLIST

### MongoDB Atlas
- [ ] Account created
- [ ] Project created
- [ ] Cluster created (M0 Free)
- [ ] Database user created (ayursutra_user)
- [ ] Network access allows 0.0.0.0/0
- [ ] Connection string copied and saved
- [ ] Password has no URL-unsafe characters

### Render Backend
- [ ] GitHub connected to Render
- [ ] Web Service created
- [ ] Root Directory = `ayursutra-backend`
- [ ] Build Command = `npm install`
- [ ] Start Command = `npm start`
- [ ] All environment variables added
- [ ] Deployment successful
- [ ] Health check works: `/health` endpoint

### Ready for Frontend
- [ ] Backend URL obtained (https://ayursutra-backend.onrender.com)
- [ ] Backend responds to requests
- [ ] MongoDB connected and working
- [ ] Ready to update Vercel frontend URL

---

## IMPORTANT NOTES

### For Production Use:
1. Use **strong JWT_SECRET** (at least 32 random characters)
2. Use **App-specific Gmail password**, not your main password
3. Set **FRONTEND_URL** to your actual Vercel URL
4. Enable **automatic backups** in MongoDB Atlas
5. Monitor **logs regularly** for errors

### Free Tier Limits:
- **Render**: Service sleeps after 15 minutes of inactivity (free tier)
  - First request after sleep takes 30 seconds
  - Use starter plan ($7/month) to avoid this
- **MongoDB**: 512MB storage (plenty for testing)
  - Upgrade if you hit limit

### Cost Tracking:
- MongoDB Atlas Free: $0/month
- Render Free: $0/month (but slow wake-up)
- Render Starter: $7/month (recommended)
- **Total**: $0-7/month for backend

