# ⚡ Railway Environment Variables - Quick Copy-Paste Reference

**Use this to quickly add variables to Railway**

Copy each row and paste into Railway Variables form:

---

## 🟢 REQUIRED (Add These First)

```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<db_username>:<AyurDB2026$ecure!>@ayursutra.kwbvej7.mongodb.net/?appName=Ayursutra
JWT_SECRET=ayursutra_jwt_secret_key_2024
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=ozahet32@gmail.com
EMAIL_PASSWORD=qqumniruvnnzvtin
SMTP_USER=ozahet32@gmail.com
SMTP_PASS=qqumniruvnnzvtin
FRONTEND_URL=https://ayursutra.vercel.app
ALLOWED_ORIGINS=https://ayursutra.vercel.app,http://localhost:5173
SOCKET_IO_CORS_ORIGIN=https://ayursutra.vercel.app
TZ=Asia/Kolkata
```

---

## 🟡 OPTIONAL (Add Later)

```
FIREBASE_PROJECT_ID=ayursutra-firebase-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@ayursutra-firebase-project.iam.gserviceaccount.com
FAST2SMS_API_KEY=your_fast2sms_api_key_here
WHAPI_API_KEY=your_whapi_cloud_api_key_here
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET=ayursutra-documents
AWS_REGION=ap-south-1
RAZORPAY_KEY_ID=rzp_live_your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
```

---

## 📋 How to Add in Railway

### In Railway Dashboard:

1. **Go to Variables tab**
2. **For each variable:**
   - Copy the line (e.g., `PORT=5000`)
   - Paste into Railway
   - Or manually enter KEY=VALUE
   - Press Enter/Add

### Example:
```
KEY: PORT
VALUE: 5000
[Add Button]
```

**Repeat for each variable**

---

## ✅ Quick Checklist

Count to verify you added them all:

**REQUIRED**: 15 variables
- [ ] PORT
- [ ] NODE_ENV
- [ ] MONGO_URI
- [ ] JWT_SECRET
- [ ] JWT_EXPIRE
- [ ] SMTP_HOST
- [ ] SMTP_PORT
- [ ] EMAIL_USER
- [ ] EMAIL_PASSWORD
- [ ] SMTP_USER
- [ ] SMTP_PASS
- [ ] FRONTEND_URL
- [ ] ALLOWED_ORIGINS
- [ ] SOCKET_IO_CORS_ORIGIN
- [ ] TZ

**OPTIONAL**: 10 variables (add later if needed)

---

## ⚠️ Important Notes

1. **Don't use quotes** in Railway UI
2. **Copy values exactly** as shown
3. **No extra spaces** before/after values
4. **MONGO_URI**: Update in Phase 3 with MongoDB Atlas URL
5. **EMAIL credentials**: Keep same as `.env` file
6. **JWT_SECRET**: Can be any strong random string

---

## 🔄 Update MONGO_URI in Phase 3

When you set up MongoDB Atlas (Phase 3), you'll replace:

```
MONGO_URI=mongodb+srv://<db_username>:<AyurDB2026$ecure!>@ayursutra.kwbvej7.mongodb.net/?appName=Ayursutra
```

With:

```
MONGO_URI=mongodb+srv://ayursutra_user:PASSWORD@cluster.mongodb.net/ayursutra?retryWrites=true&w=majority
```

For now, use the current value.

---

## 📞 After Adding Variables

1. **Railway auto-saves** - no manual save needed
2. **Auto-redeploy** - backend restarts with new variables
3. **Check logs** - Watch deployment progress
4. **Verify** - Test `https://ayursutra-backend.railway.app/health`

---

**Total Variables**: 15 required + 10 optional = 25 max  
**Time to Add**: 5-10 minutes  
**Next Step**: Click "Deploy" and wait for completion  

