# Full Stack Deployment Guide - AyurSutra

## Project Overview
- **Frontend**: React + Vite (runs on port 5173 locally)
- **Backend**: Express.js + Node.js + MongoDB
- **Database**: MongoDB
- **Additional Services**: Firebase, Socket.io

---

## DEPLOYMENT OPTIONS & RECOMMENDED PLATFORMS

### OPTION 1: Budget-Friendly Solution (Recommended for startups)
- **Backend**: Railway,
- **Frontend**: Vercel, 
- **Database**: MongoDB Atlas (free tier)
- **Cost**: ~$5-10/month

### OPTION 2: Professional Enterprise
- **Backend**: AWS EC2, Google Cloud, Azure
- **Frontend**: AWS S3 + CloudFront, Google Cloud Storage
- **Database**: AWS RDS, Google Cloud SQL, Azure Database
- **Cost**: $20-200+/month

---

## STEP-BY-STEP DEPLOYMENT PROCESS

### PHASE 1: PREPARATION & CONFIGURATION

#### Step 1.1: Create Environment Files
Create `.env` file in backend directory:
```env
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ayursutra?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_key_here

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Application
PORT=3000
NODE_ENV=production
BACKEND_URL=https://api.yourdomain.com

# Frontend URL (for CORS)
FRONTEND_URL=https://yourdomain.com
```

Create `.env.production` in frontend directory:
```env
VITE_API_URL=https://api.yourdomain.com
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

#### Step 1.2: Update CORS Configuration
Edit `ayursutra-backend/server.js`:
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### Step 1.3: Update API URLs
Edit `ayursutra-react/src/services/api.js`:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

#### Step 1.4: Build Frontend
```bash
cd ayursutra-react
npm run build
```
This creates a `dist/` folder with optimized production files.

---

### PHASE 2: BACKEND DEPLOYMENT

#### Option A: Deploy to Render.com (Recommended - Free tier available)

**Step 2A.1: Prepare Backend**
```bash
cd ayursutra-backend
# Verify package.json has correct start script
# Should have: "start": "node server.js"
```

**Step 2A.2: Create Render Account**
- Go to https://render.com
- Sign up with GitHub
- Create new Web Service

**Step 2A.3: Configure Render Settings**
- Repository: Your GitHub repo
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment Variables: Add all from your `.env` file
- Instance Type: Free tier or Starter ($7/month)

**Step 2A.4: Deploy**
- Click Deploy
- Render will show your backend URL (e.g., `https://ayursutra-backend.onrender.com`)

#### Option B: Deploy to Railway.app

**Step 2B.1: Create Account**
- Go to https://railway.app
- Connect GitHub account

**Step 2B.2: Create New Project**
- Select "Deploy from GitHub"
- Choose your repository
- Railway auto-detects Node.js

**Step 2B.3: Add Variables**
- Go to Variables tab
- Add all environment variables from `.env`
- Add MongoDB connection string

**Step 2B.4: Deploy**
- Railway auto-deploys
- You'll get a URL like `https://ayursutra-production.up.railway.app`

#### Option C: Deploy to Heroku (Paid)

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create ayursutra-backend

# Set environment variables
heroku config:set MONGO_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your_secret

# Deploy
git push heroku main
```

---

### PHASE 3: DATABASE SETUP (MongoDB Atlas)

**Step 3.1: Create MongoDB Atlas Account**
- Go to https://www.mongodb.com/cloud/atlas
- Sign up (free tier available)

**Step 3.2: Create Cluster**
- Create new project
- Create cluster (M0 free tier)
- Select region closest to your deployment

**Step 3.3: Configure Access**
- Create database user
- Set password
- Whitelist IP: Allow access from anywhere (0.0.0.0/0)

**Step 3.4: Get Connection String**
- Click Connect
- Choose "Connect your application"
- Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/ayursutra?...`
- Add to backend environment variables

---

### PHASE 4: FRONTEND DEPLOYMENT

#### Option A: Deploy to Vercel (Recommended)

**Step 4A.1: Prepare Frontend**
```bash
cd ayursutra-react
npm run build  # Creates dist/ folder
```

**Step 4A.2: Create Vercel Account**
- Go to https://vercel.com
- Sign up with GitHub

**Step 4A.3: Import Project**
- Click "New Project"
- Select your repository
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable: `VITE_API_URL=https://your-backend-url.com`

**Step 4A.4: Deploy**
- Click Deploy
- Vercel gives you a URL (e.g., `https://ayursutra.vercel.app`)

#### Option B: Deploy to Netlify

**Step 4B.1: Build Project**
```bash
cd ayursutra-react
npm run build
```

**Step 4B.2: Create Netlify Account**
- Go to https://netlify.com
- Sign up with GitHub

**Step 4B.3: Connect Repository**
- Drag & drop `dist/` folder, or
- Connect GitHub and auto-deploy

**Step 4B.4: Set Environment Variables**
- Site Settings > Build & Deploy > Environment
- Add `VITE_API_URL=https://your-backend-url.com`

#### Option C: Deploy to Cloudflare Pages

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Deploy
cd ayursutra-react
npm run build
wrangler pages deploy dist/
```

---

### PHASE 5: CUSTOM DOMAIN & SSL

**Step 5.1: Register Domain**
- Register at GoDaddy, Namecheap, or Google Domains
- Cost: $10-15/year

**Step 5.2: Point Domain to Frontend**
For Vercel:
- Go to Project Settings > Domains
- Add custom domain
- Update DNS records with Vercel instructions

For Netlify:
- Site Settings > Domain Management
- Add custom domain
- Update DNS with Netlify instructions

**Step 5.3: Point API Subdomain to Backend**
Example: `api.yourdomain.com` → Backend URL
- Add DNS record (CNAME) in your domain provider
- Point to your backend service

**SSL Certificate**: Most platforms (Vercel, Netlify, Render) provide automatic SSL/HTTPS

---

### PHASE 6: DATABASE SEEDING (Production)

```bash
# Before deploying backend, seed initial data
cd ayursutra-backend

# Run seed script with production database
MONGO_URI=mongodb+srv://... node seedData.js
```

---

### PHASE 7: VERIFICATION CHECKLIST

- [ ] Backend running and accessible: `https://api.yourdomain.com/health`
- [ ] Frontend loading without 500 errors
- [ ] API calls successful (check Network tab in DevTools)
- [ ] Authentication working (Login/Signup)
- [ ] Database connections working (fetching appointments, etc.)
- [ ] Socket.io connections established
- [ ] Firebase integration working
- [ ] Email notifications sending
- [ ] CORS errors resolved
- [ ] All environment variables set correctly

---

### PHASE 8: MONITORING & MAINTENANCE

**Health Check Endpoint**
Add to `ayursutra-backend/server.js`:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running', timestamp: new Date() });
});
```

**Monitor Logs**
- Render: Dashboard > Logs
- Railway: Logs tab
- Vercel: Deployments > Logs

**Auto-Restart Services**
- Enable auto-restart in your platform settings
- Set up health checks

**Backup Database**
- Enable automatic backups in MongoDB Atlas
- Keep daily backups for 7 days

---

## ESTIMATED COSTS (Monthly)

| Component | Free Option | Paid Option |
|-----------|-------------|------------|
| Backend | Render Free ($0) | Railway Starter ($5) |
| Frontend | Vercel Free ($0) | Vercel Pro ($20) |
| Database | MongoDB Atlas Free ($0) | Atlas Paid ($15+) |
| Domain | - | $10-15/year (~$1-2/month) |
| **Total** | **$0-2/month** | **$20-40+/month** |

---

## QUICK DEPLOYMENT SUMMARY

1. **Add `.env` files** with secrets (MongoDB, JWT, Firebase, etc.)
2. **Build frontend**: `npm run build` → creates `dist/`
3. **Push code to GitHub**
4. **Deploy backend** to Render/Railway (connect GitHub repo)
5. **Deploy frontend** to Vercel/Netlify (connect GitHub repo)
6. **Setup MongoDB Atlas** database
7. **Configure environment variables** on each platform
8. **Add custom domain** and SSL
9. **Test everything** (login, appointments, notifications)
10. **Monitor and maintain**

---

## TROUBLESHOOTING

### CORS Errors
- Check `FRONTEND_URL` in backend environment
- Verify CORS middleware configuration

### API Connection Fails
- Verify `VITE_API_URL` in frontend `.env`
- Check backend is running
- Test with `curl https://api.yourdomain.com/health`

### Database Connection Fails
- Verify MongoDB connection string
- Check IP whitelist in MongoDB Atlas
- Ensure network connectivity

### Deployment Fails
- Check build logs on deployment platform
- Verify Node.js version compatibility
- Check environment variables are set
- Ensure `package.json` scripts are correct

---

## NEXT STEPS

1. **Choose your platforms** (Render + Vercel recommended for beginners)
2. **Create accounts** and set up repositories
3. **Configure environment variables**
4. **Deploy backend first**, then frontend
5. **Test thoroughly** before going live
6. **Set up monitoring** and backups
7. **Create support documentation**

