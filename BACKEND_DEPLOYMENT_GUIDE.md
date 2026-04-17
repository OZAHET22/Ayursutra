# Backend Deployment Guide - AyurSutra

## Deploy Backend to Render.com (Easiest Option)

### Step 1: Prepare Backend for Production

First, update your backend server configuration to handle production environment:

**Edit `ayursutra-backend/server.js`** and ensure PORT is dynamic:

```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Ayursutra backend running on http://localhost:${PORT}`);
});
```

### Step 2: Create Environment File for Backend

Create `.env.example` in `ayursutra-backend/` (DO NOT commit `.env` with secrets):

```env
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ayursutra?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Application
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### Step 3: Push Updated Code to GitHub

```powershell
cd "c:\Users\het22\Downloads\React Final version"
git add .
git commit -m "Prepare backend for production deployment"
git push -u origin main
```

---

## Option A: Deploy Backend to Render.com ✅ (Recommended)

### Step 1: Create Render Account
- Go to https://render.com
- Click "Sign up"
- Choose "Sign up with GitHub"
- Authorize Render to access your repository

### Step 2: Create New Web Service
- Click **"New +"** → **"Web Service"**
- Select your GitHub repository: `Ayursutra`
- Click **"Connect"**

### Step 3: Configure Service Settings

| Setting | Value |
|---------|-------|
| **Name** | `ayursutra-backend` |
| **Environment** | `Node` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Build Command** | `cd ayursutra-backend && npm install` |
| **Start Command** | `cd ayursutra-backend && npm start` |
| **Instance Type** | `Free` (or Starter $7/month) |

### Step 4: Add Environment Variables
Click **"Environment"** tab and add all these:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ayursutra?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
PORT=5000
```

### Step 5: Deploy
- Click **"Create Web Service"**
- Render will deploy automatically
- Wait for "Your service is live!" message
- **Your backend URL will be**: `https://ayursutra-backend.onrender.com`

### Step 6: Test Backend
Go to: `https://ayursutra-backend.onrender.com/health`

Should see:
```json
{
  "status": "Backend is running",
  "timestamp": "2026-04-16T..."
}
```

---

## Option B: Deploy Backend to Railway.app

### Step 1: Create Railway Account
- Go to https://railway.app
- Click "Start Project"
- Choose "Deploy from GitHub repo"
- Authorize Railway

### Step 2: Select Repository
- Search for `Ayursutra`
- Click to select

### Step 3: Configure Variables
- Click **"Variables"** tab
- Add all environment variables (same as Render above)

### Step 4: Add Custom Start Script
- Go to **"Settings"** tab
- Under "Deploy", update:
- **Build Command**: `cd ayursutra-backend && npm install`
- **Start Command**: `cd ayursutra-backend && node server.js`

### Step 5: Deploy
- Railway auto-deploys on Git push
- Your backend URL: `https://ayursutra-production-xxxx.railway.app`

---

## Option C: Deploy Backend to Heroku (Paid)

### Step 1: Install Heroku CLI
```powershell
# Download from https://devcenter.heroku.com/articles/heroku-cli
choco install heroku-cli
```

### Step 2: Login to Heroku
```powershell
heroku login
```

### Step 3: Create Heroku App
```powershell
cd "c:\Users\het22\Downloads\React Final version\ayursutra-backend"
heroku create ayursutra-backend
```

### Step 4: Add Environment Variables
```powershell
heroku config:set MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ayursutra
heroku config:set JWT_SECRET=your_secret_key
heroku config:set EMAIL_USER=your_email@gmail.com
heroku config:set EMAIL_PASSWORD=your_password
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://your-vercel-url.vercel.app
```

### Step 5: Create Procfile
Create `ayursutra-backend/Procfile`:
```
web: node server.js
```

### Step 6: Deploy
```powershell
git push heroku main
```

Your backend URL: `https://ayursutra-backend.herokuapp.com`

---

## Setup MongoDB Atlas (Required for all options)

### Step 1: Create Account
- Go to https://www.mongodb.com/cloud/atlas
- Sign up (free tier available)

### Step 2: Create Cluster
- Click **"Create"**
- Choose **M0 Free Tier**
- Select region closest to your users
- Click **"Create Cluster"**

### Step 3: Create Database User
- Go to **"Database Access"** tab
- Click **"Add New Database User"**
- Username: `ayursutra_user`
- Password: (generate strong password)
- Click **"Create User"**

### Step 4: Get Connection String
- Go to **"Clusters"** tab
- Click **"Connect"**
- Choose **"Connect your application"**
- Select **"Node.js"** driver
- Copy connection string:

```
mongodb+srv://ayursutra_user:PASSWORD@cluster.mongodb.net/ayursutra?retryWrites=true&w=majority
```

- Replace `PASSWORD` with your actual password
- Replace `ayursutra` at end if you used different database name

### Step 5: Add to Environment Variables
In Render/Railway/Heroku settings, set:
```
MONGO_URI=mongodb+srv://ayursutra_user:PASSWORD@cluster.mongodb.net/ayursutra
```

---

## Update Frontend with Backend URL

### Step 1: Get Backend URL
After deployment, you'll have a URL like:
- Render: `https://ayursutra-backend.onrender.com`
- Railway: `https://ayursutra-production-xxxx.railway.app`
- Heroku: `https://ayursutra-backend.herokuapp.com`

### Step 2: Update Frontend Environment Variable in Vercel

**Method A: Via Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Click your `Ayursutra` project
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_URL`
5. Update value to your backend URL:
   ```
   https://ayursutra-backend.onrender.com
   ```
6. Click **Save**
7. Vercel will auto-redeploy your frontend

**Method B: Update Locally and Push to GitHub**
1. Update local file: `ayursutra-react/.env.production`
   ```env
   VITE_API_URL=https://ayursutra-backend.onrender.com
   ```

2. Update Vercel dashboard as shown in Method A

3. Push to GitHub:
   ```powershell
   git add .
   git commit -m "Update backend API URL for production"
   git push -u origin main
   ```

### Step 3: Verify Connection
1. Go to your Vercel frontend URL: `https://ayursutra.vercel.app`
2. Open browser DevTools (F12)
3. Go to Network tab
4. Try logging in
5. Check requests go to your backend URL
6. Should see successful API responses

---

## Troubleshooting

### Backend not responding
- Check Render/Railway/Heroku logs
- Verify all environment variables are set
- Ensure MongoDB connection string is correct
- Test: `curl https://your-backend-url/health`

### CORS Errors
- Backend needs correct `FRONTEND_URL` environment variable
- Check server.js CORS configuration:
  ```javascript
  app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  }));
  ```

### Frontend can't reach backend
- Verify `VITE_API_URL` in Vercel environment variables
- Check Network tab in browser DevTools
- Ensure backend service is running (check provider logs)

### Database not connecting
- Verify MongoDB Atlas IP whitelist allows all IPs (0.0.0.0/0)
- Check username/password in connection string
- Test connection string locally first

---

## Final Checklist

- [ ] Backend deployed to Render/Railway/Heroku
- [ ] Backend URL accessible: `https://your-backend-url/health`
- [ ] MongoDB Atlas cluster created and running
- [ ] Database user created with correct credentials
- [ ] All environment variables set on backend provider
- [ ] Frontend deployed to Vercel
- [ ] `VITE_API_URL` updated in Vercel dashboard
- [ ] Frontend can reach backend (check Network tab)
- [ ] Login works with backend API
- [ ] Database queries work (appointments, users, etc.)
- [ ] WebSocket/Socket.io connections established

---

## Cost Summary

| Service | Free Tier | Paid Starting At |
|---------|-----------|------------------|
| Render Backend | Yes ($0) | $7/month |
| Vercel Frontend | Yes ($0) | $20/month |
| MongoDB Atlas | Yes ($0) | $15+/month |
| Domain Name | - | $10-15/year |
| **Total** | **$0-2/month** | **$20-40+/month** |

---

## Next Steps

1. ✅ Deploy backend to Render (takes 5-10 minutes)
2. ✅ Setup MongoDB Atlas (takes 5 minutes)
3. ✅ Add environment variables to backend
4. ✅ Update `VITE_API_URL` in Vercel
5. ✅ Test frontend-backend connection
6. ✅ Monitor logs for errors
7. ✅ Setup custom domain (optional)
