# 🔐 Railway Environment Variables Configuration Guide

**Phase**: 2 - Deploy Backend to Railway  
**Time**: ~5-10 minutes  
**Status**: Step-by-step configuration guide  

---

## 📋 Prerequisites

✅ Railway account created at [railway.app](https://railway.app)  
✅ GitHub account connected to Railway  
✅ Ayursutra repository connected to Railway  
✅ Backend project created in Railway  

---

## 🎯 What You'll Do

You'll add 15+ environment variables to Railway so your backend can:
- Connect to MongoDB database
- Authenticate users with JWT
- Send emails via Gmail
- Handle Firebase authentication
- Configure CORS for frontend
- Set other production settings

---

## 🚀 Step-by-Step Environment Configuration

### Step 1: Open Railway Dashboard

1. Go to **[railway.app](https://railway.app)**
2. Log in to your account
3. Go to **Projects**
4. Click on **Ayursutra** project
5. You should see:
   - Your project name
   - Deployment status
   - Variables tab
   - Settings tab

### Step 2: Go to Variables Tab

1. Click **"Variables"** tab at the top
2. You'll see a form to add new variables
3. Each variable is: `KEY = VALUE`

---

## 📝 Environment Variables to Add

### Copy-Paste Format

Add these variables in Railway. For each row:
1. Enter **KEY** in the left field
2. Enter **VALUE** in the right field
3. Click "Add" or press Enter
4. Repeat for next variable

---

### ✅ REQUIRED Variables (Must Add)

#### 1. Port Configuration
```
Key: PORT
Value: 5000
```

#### 2. Node Environment
```
Key: NODE_ENV
Value: production
```

#### 3. MongoDB Connection
```
Key: MONGO_URI
Value: mongodb+srv://<db_username>:<AyurDB2026$ecure!>@ayursutra.kwbvej7.mongodb.net/?appName=Ayursutra
```

**Note**: Wait until Phase 3 to get MongoDB Atlas connection string. For now, use your current local one.

#### 4. JWT Secret Key
```
Key: JWT_SECRET
Value: ayursutra_jwt_secret_key_2024
```

#### 5. JWT Expiry
```
Key: JWT_EXPIRE
Value: 7d
```

#### 6. SMTP Host (Email)
```
Key: SMTP_HOST
Value: smtp.gmail.com
```

#### 7. SMTP Port (Email)
```
Key: SMTP_PORT
Value: 587
```

#### 8. Email User
```
Key: EMAIL_USER
Value: ozahet32@gmail.com
```

#### 9. Email Password
```
Key: EMAIL_PASSWORD
Value: qqumniruvnnzvtin
```

#### 10. SMTP User
```
Key: SMTP_USER
Value: ozahet32@gmail.com
```

#### 11. SMTP Password
```
Key: SMTP_PASS
Value: qqumniruvnnzvtin
```

#### 12. Frontend URL (for CORS)
```
Key: FRONTEND_URL
Value: https://ayursutra-awalh28ov-ozahet22s-projects.vercel.app
```

#### 13. Allowed Origins (CORS)
```
Key: ALLOWED_ORIGINS
Value: https://ayursutra-awalh28ov-ozahet22s-projects.vercel.app,http://localhost:5173
```

#### 14. Socket.IO CORS Origin
```
Key: SOCKET_IO_CORS_ORIGIN
Value: https://ayursutra-awalh28ov-ozahet22s-projects.vercel.app
```

#### 15. Timezone
```
Key: TZ
Value: Asia/Kolkata
```

---

### 🔧 OPTIONAL Variables (Nice to Have)

#### Firebase Configuration
```
Key: FIREBASE_PROJECT_ID
Value: your_firebase_project_id

Key: FIREBASE_CLIENT_EMAIL
Value: firebase-adminsdk@project.iam.gserviceaccount.com

Key: FIREBASE_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

#### SMS/WhatsApp
```
Key: FAST2SMS_API_KEY
Value: your_fast2sms_key_here

Key: WHAPI_API_KEY
Value: your_whapi_api_key_here
```

#### AWS S3
```
Key: AWS_ACCESS_KEY_ID
Value: your_aws_key_id

Key: AWS_SECRET_ACCESS_KEY
Value: your_aws_secret_key

Key: AWS_S3_BUCKET
Value: ayursutra-documents

Key: AWS_REGION
Value: ap-south-1
```

#### Payment Gateway
```
Key: RAZORPAY_KEY_ID
Value: rzp_live_your_key_id

Key: RAZORPAY_KEY_SECRET
Value: your_razorpay_secret
```

---

## 📊 Complete Variable Table

### All Variables at a Glance

| Category | Key | Value | Required |
|----------|-----|-------|----------|
| **Server** | PORT | 5000 | ✅ |
| | NODE_ENV | production | ✅ |
| **Database** | MONGO_URI | mongodb+srv://... | ✅ |
| **JWT** | JWT_SECRET | ayursutra_jwt_secret_key_2024 | ✅ |
| | JWT_EXPIRE | 7d | ✅ |
| **SMTP Email** | SMTP_HOST | smtp.gmail.com | ✅ |
| | SMTP_PORT | 587 | ✅ |
| | EMAIL_USER | ozahet32@gmail.com | ✅ |
| | EMAIL_PASSWORD | qqumniruvnnzvtin | ✅ |
| | SMTP_USER | ozahet32@gmail.com | ✅ |
| | SMTP_PASS | qqumniruvnnzvtin | ✅ |
| **CORS** | FRONTEND_URL | https://ayursutra.vercel.app | ✅ |
| | ALLOWED_ORIGINS | https://ayursutra.vercel.app,... | ✅ |
| | SOCKET_IO_CORS_ORIGIN | https://ayursutra.vercel.app | ✅ |
| **System** | TZ | Asia/Kolkata | ✅ |
| **Firebase** | FIREBASE_PROJECT_ID | your_id | ❌ |
| | FIREBASE_CLIENT_EMAIL | firebase-adminsdk@... | ❌ |
| | FIREBASE_PRIVATE_KEY | -----BEGIN... | ❌ |
| **SMS** | FAST2SMS_API_KEY | your_key | ❌ |
| | WHAPI_API_KEY | your_key | ❌ |
| **AWS** | AWS_ACCESS_KEY_ID | your_key | ❌ |
| | AWS_SECRET_ACCESS_KEY | your_secret | ❌ |
| | AWS_S3_BUCKET | ayursutra-documents | ❌ |
| | AWS_REGION | ap-south-1 | ❌ |
| **Payment** | RAZORPAY_KEY_ID | rzp_live_... | ❌ |
| | RAZORPAY_KEY_SECRET | your_secret | ❌ |

---

## 🎬 Visual Guide - How to Add Variables in Railway

### Method 1: One by One (Recommended)

```
1. Click Variables tab
   ↓
2. See input fields: [KEY] = [VALUE]
   ↓
3. Enter: PORT = 5000
   ↓
4. Press Enter or click Add
   ↓
5. Variable appears in list
   ↓
6. Repeat for next variable
   ↓
7. All saved automatically
```

### Method 2: Bulk Paste (If Supported)

```
1. Click Variables tab
2. Look for "Add multiple" or similar option
3. Paste format:
   KEY1=VALUE1
   KEY2=VALUE2
   KEY3=VALUE3
4. Railway parses and creates
```

---

## ✅ Variable Configuration Checklist

As you add each variable, check it off:

### Core Configuration
- [ ] PORT = 5000
- [ ] NODE_ENV = production
- [ ] TZ = Asia/Kolkata

### Database
- [ ] MONGO_URI = mongodb+srv://...

### Authentication
- [ ] JWT_SECRET = ayursutra_jwt_secret_key_2024
- [ ] JWT_EXPIRE = 7d

### Email (Gmail SMTP)
- [ ] SMTP_HOST = smtp.gmail.com
- [ ] SMTP_PORT = 587
- [ ] EMAIL_USER = ozahet32@gmail.com
- [ ] EMAIL_PASSWORD = qqumniruvnnzvtin
- [ ] SMTP_USER = ozahet32@gmail.com
- [ ] SMTP_PASS = qqumniruvnnzvtin

### Frontend Integration (CORS)
- [ ] FRONTEND_URL = https://ayursutra.vercel.app
- [ ] ALLOWED_ORIGINS = https://ayursutra.vercel.app,http://localhost:5173
- [ ] SOCKET_IO_CORS_ORIGIN = https://ayursutra.vercel.app

---

## 🔐 Security Tips

### DO:
✅ Use strong, unique values for secrets  
✅ Never share your keys publicly  
✅ Use app-specific passwords for Gmail  
✅ Rotate secrets periodically  
✅ Store backups of critical values locally  

### DON'T:
❌ Commit `.env` files to GitHub  
❌ Share secrets in chat/email  
❌ Use weak passwords  
❌ Use same secret for different apps  
❌ Log sensitive values  

---

## 🆘 Troubleshooting

### Variables Not Saving
**Problem**: Variables disappear after refresh  
**Solution**: 
1. Make sure you pressed Enter after each entry
2. Try clicking "Save" button if visible
3. Check Network tab for errors

### Variables Not Being Used
**Problem**: Backend still uses old values  
**Solution**:
1. Railway needs to redeploy
2. Wait for "Redeploying" message
3. Check deployment logs for errors

### Value Contains Special Characters
**Problem**: Values with `$`, `=`, `&` not working  
**Solution**:
1. Don't use quotes in Railway UI
2. Just paste the value as-is
3. Railway handles special chars automatically

### MongoDB Connection Failed
**Problem**: Can't connect to MongoDB  
**Solution**:
1. Verify connection string format
2. Check MongoDB IP whitelist (Phase 3)
3. Verify username/password correct
4. Wait until Phase 3 to update with Atlas URL

---

## 📋 Final Verification

After adding all variables:

1. Check Railway shows all variables
2. No red error indicators
3. Ready for deployment

Then proceed to **Phase 2 Deployment**:
1. Click "Deploy" in Railway
2. Watch build logs
3. Wait for "Deployment Successful"
4. Get backend URL

---

## 🔗 Next Steps After Configuration

1. **Click Deploy** in Railway
2. **Watch Logs** - Should see:
   ```
   npm install
   node server.js
   [success] Backend is running
   MongoDB connected
   Socket.io initialized
   ```
3. **Get Backend URL** - Rails shows: `https://ayursutra-backend.railway.app`
4. **Verify Health** - Test: `curl https://ayursutra-backend.railway.app/health`
5. **Continue to Phase 3** - Setup MongoDB Atlas

---

## 📞 Need Help?

If a variable fails:
1. Check spelling exactly matches
2. Verify no extra spaces
3. Check Railway logs for error message
4. Use correct format for special values

For MongoDB issues: Wait for Phase 3 - will provide correct connection string

---

**Status**: Ready to Configure  
**Time**: ~5-10 minutes  
**Next**: Phase 2 - Deploy Backend  
**Then**: Phase 3 - MongoDB Atlas Setup  

