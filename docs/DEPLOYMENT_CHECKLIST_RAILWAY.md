# ✅ Railway Deployment Checklist

**Project**: Ayursutra  
**Deployment Platform**: Railway  
**Frontend**: Vercel  
**Database**: MongoDB Atlas  
**Date**: April 28, 2026  

---

## 📋 Pre-Deployment Checklist

### Code Preparation
- [ ] All code committed to GitHub
- [ ] No secrets in code (use `.env` files)
- [ ] `package.json` has correct dependencies
- [ ] `server.js` starts on `PORT` environment variable
- [ ] Frontend builds successfully: `npm run build` → `dist/` folder created
- [ ] No console errors in build
- [ ] Git remote points to correct repository

### Environment Files
- [ ] `.env.production` created in `ayursutra-backend/`
- [ ] `.env.production` created in `ayursutra-react/`
- [ ] `railway.json` configured in backend
- [ ] All required variables documented
- [ ] No placeholder values left

### Dependencies
- [ ] Backend: `npm install` succeeds locally
- [ ] Frontend: `npm install` succeeds locally
- [ ] All dependencies in `package.json`
- [ ] No version conflicts
- [ ] Node.js version: 18.x or 20.x

---

## 🚀 Phase 1: ✅ COMPLETE - Environment Files

**Status**: ✅ DONE

**Files Created**:
- ✅ `ayursutra-backend/.env.production`
- ✅ `ayursutra-react/.env.production`
- ✅ `ayursutra-backend/railway.json`
- ✅ `ayursutra-backend/Dockerfile`
- ✅ `docker-compose.yml`
- ✅ `.github/workflows/deploy.yml`
- ✅ `RAILWAY_DEPLOYMENT_GUIDE.md`
- ✅ `RAILWAY_QUICK_SETUP.md`
- ✅ Health check endpoint at `/health`

**What's Ready**: All configuration files prepared and documented.

---

## 🚀 Phase 2: Deploy Backend to Railway

**Estimated Time**: 5-10 minutes

### Step 1: Create Railway Account
- [ ] Go to https://railway.app
- [ ] Click "Start Free"
- [ ] Sign up with GitHub
- [ ] Authorize Railway to access repositories
- [ ] Create organization (optional)

### Step 2: Create Railway Project
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose Ayursutra repository
- [ ] Railway auto-detects Node.js
- [ ] Confirm framework detection

### Step 3: Add Environment Variables
In Railway dashboard, go to "Variables" tab:

**Required Variables**:
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://ayursutra_user:PASSWORD@cluster.mongodb.net/ayursutra?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FRONTEND_URL=https://ayursutra.vercel.app
ALLOWED_ORIGINS=https://ayursutra.vercel.app,http://localhost:5173
SOCKET_IO_CORS_ORIGIN=https://ayursutra.vercel.app
```

**Optional Variables**:
```
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

### Step 4: Configure Build Settings
- [ ] Go to "Settings" tab
- [ ] Builder: `NIXPACKS` (default)
- [ ] Start Command: `node server.js`
- [ ] Node version: `18` or `20`
- [ ] Root directory: `ayursutra-backend/` (if not auto-detected)

### Step 5: Deploy
- [ ] Click "Deploy" button
- [ ] Watch deployment logs
- [ ] Wait for "Build successful" message
- [ ] Check "Deployment successful" notification

### Step 6: Get Backend URL
- [ ] Go to "Settings" → "Domain"
- [ ] Copy Railway-provided URL: `https://ayursutra-backend.railway.app`
- [ ] Save for next steps

### Step 7: Verify Deployment
```bash
# Test health endpoint
curl https://ayursutra-backend.railway.app/health

# Expected response:
# {"status":"healthy","timestamp":"2026-04-28T..."}
```

- [ ] Health check returns 200
- [ ] Logs show no errors
- [ ] Ready for database connection

**Completion Checklist**:
- [ ] Railway project created
- [ ] All variables added
- [ ] Deployment successful
- [ ] Health endpoint responds
- [ ] Backend URL copied

---

## 🚀 Phase 3: Setup MongoDB Atlas

**Estimated Time**: 10-15 minutes

### Step 1: Create MongoDB Account
- [ ] Go to https://mongodb.com/cloud/atlas
- [ ] Click "Start Free"
- [ ] Create account with email
- [ ] Verify email

### Step 2: Create Organization
- [ ] Create new organization: `Ayursutra`
- [ ] Create new project: `Production`
- [ ] Select free tier

### Step 3: Create Cluster
- [ ] Click "Create" to build database
- [ ] Select **M0 Free Cluster**
- [ ] Cloud Provider: **AWS**
- [ ] Region: **Asia Pacific (Mumbai)** (ap-south-1)
- [ ] Cluster name: `ayursutra-cluster`
- [ ] Click "Create Cluster"
- [ ] Wait 2-5 minutes for creation

### Step 4: Configure Network Access
- [ ] Go to **Network Access**
- [ ] Click "Add IP Address"
- [ ] Select "Allow Access from Anywhere"
- [ ] Enter: `0.0.0.0/0` (allows Railway)
- [ ] Click "Confirm"

### Step 5: Create Database User
- [ ] Go to **Database Access**
- [ ] Click "Add New Database User"
- [ ] Username: `ayursutra_user`
- [ ] Password: Click "Autogenerate Secure Password"
- [ ] **COPY PASSWORD** (you'll need it)
- [ ] Role: `Atlas admin`
- [ ] Click "Add User"

### Step 6: Get Connection String
- [ ] Go to **Clusters**
- [ ] Click your cluster
- [ ] Click "Connect"
- [ ] Select "Connect your application"
- [ ] Choose **Node.js** driver version **4.0+**
- [ ] Copy connection string:
  ```
  mongodb+srv://ayursutra_user:<PASSWORD>@cluster.mongodb.net/?retryWrites=true&w=majority
  ```
- [ ] Replace `<PASSWORD>` with your generated password
- [ ] Full string should look like:
  ```
  mongodb+srv://ayursutra_user:abc123def456ghi@cluster.mongodb.net/?retryWrites=true&w=majority
  ```

### Step 7: Add to Railway
- [ ] Go back to Railway dashboard
- [ ] Go to "Variables" tab
- [ ] Find `MONGO_URI`
- [ ] Update with your MongoDB connection string
- [ ] Railway auto-redeploys

### Step 8: Verify Database Connection
- [ ] Check Railway logs
- [ ] Should see "MongoDB connected" message
- [ ] No connection errors

**Completion Checklist**:
- [ ] MongoDB cluster created
- [ ] Network access configured
- [ ] Database user created
- [ ] Connection string obtained
- [ ] MONGO_URI added to Railway
- [ ] Connection successful in logs

---

## 🚀 Phase 4: Deploy Frontend to Vercel

**Estimated Time**: 5-10 minutes

### Step 1: Build Frontend Locally
```bash
cd ayursutra-react
npm run build
```
- [ ] Build succeeds
- [ ] `dist/` folder created
- [ ] No build errors

### Step 2: Create Vercel Account
- [ ] Go to https://vercel.com
- [ ] Click "Sign Up"
- [ ] Sign up with GitHub
- [ ] Authorize Vercel to access repositories

### Step 3: Import Project
- [ ] Click "Add New..." → "Project"
- [ ] Select Ayursutra repository
- [ ] Click "Import"
- [ ] Vercel auto-detects Vite framework

### Step 4: Configure Build Settings
- [ ] Framework Preset: `Vite`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm ci`
- [ ] Root Directory: `ayursutra-react/` (if not auto-detected)

### Step 5: Add Environment Variables
Go to "Environment Variables" tab:

```
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
VITE_TIMEZONE=Asia/Kolkata
```

### Step 6: Deploy
- [ ] Click "Deploy"
- [ ] Watch build progress
- [ ] Wait for "Deployment Complete"
- [ ] Copy frontend URL: `https://ayursutra.vercel.app`

### Step 7: Verify Frontend
- [ ] Open URL in browser: `https://ayursutra.vercel.app`
- [ ] Page loads without errors
- [ ] Check Network tab (API calls to backend)
- [ ] No CORS errors in console
- [ ] Login page displays correctly

**Completion Checklist**:
- [ ] Vercel project created
- [ ] Build settings configured
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Frontend loads without errors
- [ ] API calls reach backend

---

## 🚀 Phase 5: Configure Custom Domain (Optional)

**Estimated Time**: 10 minutes

### Step 1: Register Domain
- [ ] Go to Namecheap/GoDaddy/Google Domains
- [ ] Register domain: `ayursutra.com` (~$10-15/year)
- [ ] Note domain registrar
- [ ] Copy nameservers

### Step 2: Add Domain to Vercel
- [ ] Go to Vercel project → Settings
- [ ] Click "Domains"
- [ ] Enter domain: `ayursutra.com`
- [ ] Vercel shows DNS instructions
- [ ] Copy CNAME records

### Step 3: Update Domain DNS (Vercel)
- [ ] Go to domain registrar (Namecheap/GoDaddy)
- [ ] Find DNS/Nameserver settings
- [ ] Add CNAME record for Vercel
- [ ] Wait 5-10 minutes for propagation
- [ ] Verify in Vercel: Status should be "Active"

### Step 4: Add API Subdomain to Railway
- [ ] Go to Railway project → Settings
- [ ] Click "Custom Domain"
- [ ] Enter: `api.ayursutra.com`
- [ ] Copy CNAME record

### Step 5: Update Domain DNS (Railway)
- [ ] Go to domain registrar
- [ ] Add CNAME record for Railway
- [ ] Point `api.ayursutra.com` to Railway URL
- [ ] Wait for propagation

### Step 6: Update Frontend Environment Variables
In Vercel:
- [ ] Go to project → Settings → Environment Variables
- [ ] Update `VITE_API_URL=https://api.ayursutra.com/api`
- [ ] Update `VITE_SOCKET_URL=https://api.ayursutra.com`
- [ ] Vercel auto-redeploys

### Step 7: Verify SSL
- [ ] Open `https://ayursutra.com` - should show green lock
- [ ] Open `https://api.ayursutra.com/health` - should show green lock
- [ ] Both use automatic SSL certificates (Let's Encrypt)

**Completion Checklist**:
- [ ] Domain registered
- [ ] DNS records added for frontend
- [ ] DNS records added for API
- [ ] SSL certificates active (green lock)
- [ ] URLs accessible

**Final URLs**:
- Frontend: `https://ayursutra.com`
- Backend API: `https://api.ayursutra.com`

---

## 🚀 Phase 6: Seed Database

**Estimated Time**: 2 minutes

### Step 1: Run Seed Script
```bash
cd ayursutra-backend

# Set MongoDB URI temporarily
$env:MONGO_URI = "mongodb+srv://ayursutra_user:PASSWORD@cluster.mongodb.net/ayursutra?retryWrites=true&w=majority"

# Run seed
node seedData.js
```

- [ ] Script runs without errors
- [ ] See "Seed complete" message
- [ ] Sample data created

### Step 2: Verify in MongoDB Atlas
- [ ] Go to MongoDB Atlas
- [ ] Click your cluster
- [ ] Click "Collections"
- [ ] Verify data in:
  - [ ] `therapies` - Should have sample therapies
  - [ ] `centres` - Should have sample centres
  - [ ] `users` - Should have sample users

**Completion Checklist**:
- [ ] Seed script executed
- [ ] No errors
- [ ] Data visible in Atlas

---

## 🚀 Phase 7: Verification Checklist

**Estimated Time**: 10-15 minutes

### Backend Tests
- [ ] Health endpoint: `curl https://ayursutra-backend.railway.app/health` → 200 OK
- [ ] API endpoint: `curl https://ayursutra-backend.railway.app/api/health` → Success
- [ ] Database connected (check logs)
- [ ] Socket.io active (check logs)
- [ ] CORS configured (no errors)
- [ ] Environment variables loaded (check logs)

### Frontend Tests
- [ ] Homepage loads: `https://ayursutra.vercel.app` → No errors
- [ ] Network tab shows API calls to backend
- [ ] Console has no errors
- [ ] Can navigate pages
- [ ] Responsive design works

### Integration Tests
- [ ] **Signup Flow**:
  - [ ] Click signup
  - [ ] Enter valid email
  - [ ] Receive OTP email
  - [ ] Enter OTP
  - [ ] Auto-login to dashboard
  
- [ ] **Login Flow**:
  - [ ] Click login
  - [ ] Enter credentials
  - [ ] Redirect to dashboard
  - [ ] AuthContext shows user
  
- [ ] **Appointment Booking**:
  - [ ] Login as patient
  - [ ] Go to Appointments tab
  - [ ] Select therapy
  - [ ] Select doctor
  - [ ] Book appointment
  - [ ] Confirmation email received
  
- [ ] **Real-time Updates**:
  - [ ] Book appointment as patient
  - [ ] Doctor receives notification (check logs/email)
  - [ ] Doctor confirms appointment
  - [ ] Patient sees update instantly (no page refresh)
  
- [ ] **Email Delivery**:
  - [ ] Signup → OTP email received
  - [ ] Appointment booked → Confirmation email received
  - [ ] Appointment complete → Invoice email received

- [ ] **Database Functionality**:
  - [ ] Users created and stored
  - [ ] Appointments saved
  - [ ] Invoices generated
  - [ ] Notifications recorded

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] No console errors
- [ ] No 404 errors
- [ ] No 500 errors

**Completion Checklist**:
- [ ] All backend endpoints working
- [ ] Frontend loads without errors
- [ ] API calls successful
- [ ] Database connected
- [ ] Socket.io operational
- [ ] Signup/Login working
- [ ] Appointments can be booked
- [ ] Real-time updates working
- [ ] Emails sending
- [ ] No security warnings

---

## 🚀 Phase 8: Setup Monitoring & Maintenance

### Railway Monitoring
- [ ] Go to Railway project
- [ ] Go to "Metrics" tab
- [ ] Enable CPU monitoring
- [ ] Enable Memory monitoring
- [ ] Enable Network monitoring
- [ ] Review deployments history

### Railway Health Checks
- [ ] Go to project settings
- [ ] Enable "Health Check"
- [ ] Set path: `/health`
- [ ] Set timeout: `10s`
- [ ] Set interval: `30s`
- [ ] Check max retries: `3`

### Railway Alerts (Pro feature)
- [ ] Create alert for deployment failures
- [ ] Create alert for high memory usage
- [ ] Create alert for high CPU usage
- [ ] Create alert for errors in logs

### Vercel Analytics
- [ ] Go to Vercel project → Analytics
- [ ] Monitor Web Vitals
- [ ] Check Core Web Vitals scores
- [ ] Monitor page performance
- [ ] Set up performance alerts

### Database Backups
- [ ] Go to MongoDB Atlas
- [ ] Go to "Backup" tab
- [ ] Enable "Continuous Backup"
- [ ] Set backup retention: `7 days`
- [ ] Verify automatic backups are running

### Logs Management
- [ ] Railway: Check logs daily for errors
- [ ] Vercel: Monitor build logs
- [ ] MongoDB: Check connection logs
- [ ] Check for any warnings or errors

### Maintenance Tasks (Weekly)
- [ ] Review error logs
- [ ] Check database size
- [ ] Verify backups completed
- [ ] Test critical features
- [ ] Monitor uptime

**Completion Checklist**:
- [ ] Railway metrics enabled
- [ ] Health checks configured
- [ ] Vercel analytics active
- [ ] Database backups verified
- [ ] Logs being monitored
- [ ] Maintenance schedule created

---

## 🎯 Summary

### Deployment Architecture
```
Frontend: Vercel (CDN Global)
  ↓
API: Railway.app (Backend)
  ↓
Database: MongoDB Atlas (Cloud)
```

### Expected Results
| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ✅ Live | https://ayursutra.vercel.app |
| Backend | ✅ Running | https://ayursutra-backend.railway.app |
| Database | ✅ Connected | MongoDB Atlas |
| Domain | ✅ Optional | https://ayursutra.com |
| API Domain | ✅ Optional | https://api.ayursutra.com |
| SSL/HTTPS | ✅ Automatic | Green lock on all services |

### Monthly Costs
- Railway: Free tier (~$0-5/month)
- Vercel: Free tier (~$0)
- MongoDB: Free tier M0 (~$0)
- Domain: ~$1-2/month (optional)
- **TOTAL**: ~$1-7/month

### Support & Documentation
- 📖 [Railway Docs](https://docs.railway.app)
- 📖 [Vercel Docs](https://vercel.com/docs)
- 📖 [MongoDB Docs](https://docs.atlas.mongodb.com)
- 📖 `RAILWAY_DEPLOYMENT_GUIDE.md` - Detailed instructions
- 📖 `RAILWAY_QUICK_SETUP.md` - Quick reference

---

**Status**: Ready for deployment  
**Last Updated**: April 28, 2026  
**Version**: 1.0  

✅ All preparation complete - Ready to deploy!
