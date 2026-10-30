# 🚀 Ayursutra Railway Deployment Guide

*Complete step-by-step setup using Railway.app for backend deployment*

---

## 📋 Table of Contents
1. [Phase 1: Prepare Environment Files](#phase-1-prepare-environment-files)
2. [Phase 2: Deploy Backend to Railway](#phase-2-deploy-backend-to-railway)
3. [Phase 3: Setup MongoDB Atlas](#phase-3-setup-mongodb-atlas)
4. [Phase 4: Deploy Frontend to Vercel](#phase-4-deploy-frontend-to-vercel)
5. [Phase 5: Configure Custom Domain](#phase-5-configure-custom-domain)
6. [Phase 6: Database Seeding](#phase-6-database-seeding)
7. [Phase 7: Verification Checklist](#phase-7-verification-checklist)
8. [Phase 8: Monitoring & Maintenance](#phase-8-monitoring--maintenance)

---

## Phase 1: Prepare Environment Files

### Step 1.1: Backend Environment Setup

**File**: `ayursutra-backend/.env.production`

```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://ayursutra_user:password@cluster.mongodb.net/ayursutra?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here_at_least_32_chars
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_app_specific_password_16_chars
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_app_specific_password_16_chars
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FRONTEND_URL=https://ayursutra.vercel.app
ALLOWED_ORIGINS=https://ayursutra.vercel.app,http://localhost:5173
SOCKET_IO_CORS_ORIGIN=https://ayursutra.vercel.app
FAST2SMS_API_KEY=your_fast2sms_key
WHAPI_API_KEY=your_whapi_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=ayursutra-documents
AWS_REGION=ap-south-1
BCRYPT_ROUNDS=10
ENABLE_CRON_JOBS=true
TZ=Asia/Kolkata
```

### Step 1.2: Frontend Environment Setup

**File**: `ayursutra-react/.env.production`

```env
VITE_API_URL=https://ayursutra-backend.railway.app/api
VITE_SOCKET_URL=https://ayursutra-backend.railway.app
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_APP_NAME=Ayursutra
VITE_ENVIRONMENT=production
VITE_RAZORPAY_KEY_ID=rzp_live_key_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
VITE_TIMEZONE=Asia/Kolkata
```

---

## Phase 2: Deploy Backend to Railway

### Step 2.1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Start Free"
3. Sign up with GitHub account
4. Authorize Railway to access your GitHub repositories

### Step 2.2: Create New Railway Project

1. Click "New Project" button
2. Select "Deploy from GitHub repo"
3. Choose your Ayursutra repository
4. Railway auto-detects Node.js and shows configuration

### Step 2.3: Configure Environment Variables

In Railway Dashboard:

1. Go to your project
2. Click "Variables" tab
3. Add all variables from `.env.production`:

| Variable | Value |
|----------|-------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Your JWT secret key |
| `EMAIL_USER` | Gmail SMTP address |
| `EMAIL_PASSWORD` | Gmail app password |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Your Firebase private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email |
| `FRONTEND_URL` | `https://ayursutra.vercel.app` |
| `ALLOWED_ORIGINS` | `https://ayursutra.vercel.app` |

### Step 2.4: Configure Build Settings

1. Go to "Settings" tab
2. Set **Builder**: `Nixpacks` (default)
3. Set **Start Command**: `node server.js`
4. Set **Node version**: `18` or `20`

### Step 2.5: Deploy

1. Railway auto-deploys on push to main branch
2. Watch deployment logs in "Deployments" tab
3. Once deployed, you'll get URL: `https://ayursutra-backend.railway.app`

### Step 2.6: Verify Deployment

```bash
curl https://ayursutra-backend.railway.app/health
```

Expected response:
```json
{
  "status": "Backend is running",
  "timestamp": "2026-04-28T10:30:00.000Z"
}
```

---

## Phase 3: Setup MongoDB Atlas

### Step 3.1: Create MongoDB Atlas Account

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Start Free"
3. Create account with email
4. Create an organization

### Step 3.2: Create a Cluster

1. Click "Create" to build a database
2. Select **M0 Free Cluster**
3. Choose cloud provider: **AWS**
4. Select region: **Asia Pacific (Mumbai)** - ap-south-1
5. Click "Create Cluster" (takes 2-5 minutes)

### Step 3.3: Configure Security

1. Go to **Network Access**
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
   - This allows Railway to connect
4. Click "Confirm"

### Step 3.4: Create Database User

1. Go to **Database Access**
2. Click "Add New Database User"
3. Set:
   - **Username**: `ayursutra_user`
   - **Password**: Generate secure password (copy it!)
   - **Role**: `Atlas admin`
4. Click "Add User"

### Step 3.5: Get Connection String

1. Go to **Clusters** and click "Connect"
2. Select "Connect your application"
3. Choose **Node.js** driver version **4.0+**
4. Copy connection string:
   ```
   mongodb+srv://ayursutra_user:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with actual password

### Step 3.6: Add to Railway

1. Go to Railway Dashboard
2. Go to Variables
3. Add `MONGO_URI` with your connection string
4. Wait for auto-redeploy

### Step 3.7: Verify Database Connection

Run in backend:
```bash
node checkDb.js
```

---

## Phase 4: Deploy Frontend to Vercel

### Step 4.1: Prepare Frontend

```bash
cd ayursutra-react
npm run build
```

Creates `dist/` folder with optimized production files.

### Step 4.2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign up with GitHub
4. Authorize Vercel

### Step 4.3: Import Project

1. Click "Import Project"
2. Select your GitHub repository
3. Vercel auto-detects Vite framework
4. Click "Import"

### Step 4.4: Configure Build Settings

1. Set **Framework Preset**: `Vite`
2. Set **Build Command**: `npm run build`
3. Set **Output Directory**: `dist`
4. Set **Install Command**: `npm ci`

### Step 4.5: Add Environment Variables

1. Go to "Settings" → "Environment Variables"
2. Add variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://ayursutra-backend.railway.app/api` |
| `VITE_SOCKET_URL` | `https://ayursutra-backend.railway.app` |
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |

### Step 4.6: Deploy

1. Click "Deploy"
2. Watch build progress
3. Once deployed: `https://ayursutra.vercel.app`

### Step 4.7: Verify Frontend

1. Open `https://ayursutra.vercel.app`
2. Should load without errors
3. Check Network tab for API calls (should use Railway URL)

---

## Phase 5: Configure Custom Domain

### Step 5.1: Register Domain

Register at:
- [namecheap.com](https://namecheap.com)
- [godaddy.com](https://godaddy.com)
- [google.com/domains](https://domains.google.com)

Cost: $10-15/year

### Step 5.2: Add Domain to Vercel (Frontend)

1. Go to Vercel project settings
2. Click "Domains"
3. Enter your domain: `ayursutra.com`
4. Vercel shows DNS instructions
5. Go to domain provider's DNS settings
6. Add CNAME record pointing to Vercel

### Step 5.3: Add API Subdomain to Railway (Backend)

1. Go to Railway project settings
2. Click "Custom Domain"
3. Enter: `api.ayursutra.com`
4. Get DNS instructions
5. Add CNAME record in domain provider: `api.ayursutra.com` → Railway URL

### Step 5.4: Update Frontend Env Variables

Update `VITE_API_URL` in Vercel:
```
VITE_API_URL=https://api.ayursutra.com/api
VITE_SOCKET_URL=https://api.ayursutra.com
```

Vercel auto-redeploys with new URLs.

### Step 5.5: SSL Certificate

Both Vercel and Railway provide **free automatic SSL/HTTPS certificates** (Let's Encrypt).

Verify:
- `https://ayursutra.com` ✓ (shows green lock)
- `https://api.ayursutra.com` ✓ (shows green lock)

---

## Phase 6: Database Seeding

### Step 6.1: Seed Initial Data

```bash
cd ayursutra-backend

# Set production MongoDB URI temporarily
$env:MONGO_URI = "your_mongodb_atlas_uri"

# Run seed script
node seedData.js
```

This creates:
- Sample therapies
- Sample centres
- Sample doctors
- Sample users

### Step 6.2: Verify Seed

Check MongoDB Atlas:
1. Go to Collections
2. View `therapies`, `centres`, `users`
3. Should see sample data

---

## Phase 7: Verification Checklist

Run through all checks:

### Backend Checks
- [ ] API health endpoint: `curl https://api.ayursutra.com/health`
- [ ] Database connects: Check logs in Railway dashboard
- [ ] Email sends: Test OTP via signup form
- [ ] Socket.io works: Check console for connection message
- [ ] CORS configured: No CORS errors in browser console

### Frontend Checks
- [ ] Page loads: `https://ayursutra.com` loads without errors
- [ ] Login works: Can login with test user
- [ ] API calls work: Network tab shows successful API requests
- [ ] Real-time updates: Book appointment, see instant notification
- [ ] Email received: Get signup/appointment emails
- [ ] Documents download: Can download PDFs

### Integration Checks
- [ ] Patient signup → Email verification → Auto-login ✓
- [ ] Doctor signup → Admin approval → Can login ✓
- [ ] Patient books → Doctor gets notification (real-time) ✓
- [ ] Doctor confirms → Patient sees update instantly ✓
- [ ] Appointment complete → Invoice auto-generated ✓
- [ ] All notifications sent (Email + In-app + SMS) ✓

---

## Phase 8: Monitoring & Maintenance

### Step 8.1: View Logs

**Railway Backend Logs**:
1. Go to Railway project
2. Click "Deployments" tab
3. Select latest deployment
4. View logs in real-time

**Vercel Frontend Logs**:
1. Go to Vercel project
2. Click "Deployments" tab
3. Click on latest deployment
4. View build and runtime logs

### Step 8.2: Set Up Health Checks

**Railway**:
1. Go to project settings
2. Enable "Health Check"
3. Set path: `/health`
4. Set timeout: 10s
5. Interval: 30s

**Vercel**: Built-in, no configuration needed

### Step 8.3: Database Backups

**MongoDB Atlas**:
1. Go to "Backup" tab
2. Enable "Continuous Backup" (on free tier: 7-day backup)
3. Snapshots auto-created daily

### Step 8.4: Monitor Performance

**Railway Analytics**:
1. Go to "Metrics" tab
2. View CPU, Memory, Network usage
3. Monitor response times

**Vercel Analytics** (Pro plan):
1. View Web Vitals
2. Page performance metrics
3. API response times

### Step 8.5: Alerts & Notifications

Set up alerts for:
- Deployment failures
- High error rates (500+ errors)
- Database connection issues
- Performance degradation

Configure in platform settings.

---

## 🎯 Expected Results After Deployment

### URLs
- **Frontend**: `https://ayursutra.com`
- **Backend API**: `https://api.ayursutra.com`
- **WebSocket**: `wss://api.ayursutra.com`

### Services
- **Database**: MongoDB Atlas (Cloud, no setup on laptop)
- **Backend**: Railway (Auto-scales, free tier)
- **Frontend**: Vercel (CDN-distributed, free tier)
- **SSL/HTTPS**: Automatic on all services

### Monthly Cost
- Railway: Free tier or ~$5/month
- Vercel: Free tier
- MongoDB Atlas: Free tier
- Domain: ~$1-2/month
- **Total**: ~$6-7/month

---

## 🆘 Troubleshooting

### Backend Won't Deploy
- Check build logs in Railway dashboard
- Verify `package.json` has correct dependencies
- Ensure `server.js` exists and starts on `PORT` env variable

### API Connection Failed
- Verify `FRONTEND_URL` env variable in Railway
- Check CORS headers in backend
- Ensure API URL in frontend `.env` matches Railway URL

### Database Connection Failed
- Verify MongoDB connection string
- Check IP whitelist (should allow 0.0.0.0/0)
- Test connection locally: `mongo "mongodb+srv://..."`

### Socket.io Not Connecting
- Check WebSocket enabled in Railway (enabled by default)
- Verify `SOCKET_IO_CORS_ORIGIN` matches frontend domain
- Check browser console for connection errors

### Emails Not Sending
- Verify Gmail app password is correct
- Check "Less secure app access" is enabled
- Test email via: `node testEmail.js`

---

## 📚 Reference Links

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com)
- [Express.js Guide](https://expressjs.com)
- [React Documentation](https://react.dev)

---

**Deployment Status**: ✅ Production Ready  
**Last Updated**: April 28, 2026  
**Version**: 1.0  
