# 🚀 QUICK START - TEST THE SYSTEM NOW!

## ⚡ 5-MINUTE SETUP

### **Step 1: Start Backend Server**
```bash
cd ayursutra-backend
npm start
```
Expected output:
```
🚀 Ayursutra backend running on http://0.0.0.0:5000
✅ MongoDB Connected
✅ Gmail connection verified
✅ Notification cron scheduler started
```

### **Step 2: Seed Demo Data** (in new terminal)
```bash
cd ayursutra-backend
node seedData.js
```
Expected output:
```
Demo login credentials:
  Patient: patient@demo.com / demo123
  Doctor:  doctor@demo.com / demo123
  Admin:   admin@demo.com / demo123
```

### **Step 3: Start Frontend** (in new terminal)
```bash
cd ayursutra-react
npm run dev
```
Expected output:
```
VITE v... ready in XXX ms
➜  Local:   http://localhost:5173/
```

### **Step 4: Test in Browser**
- Open http://localhost:5173/
- Click **"Sign In"**
- Use demo credentials:
  - Email: `patient@demo.com`
  - Password: `demo123`
- Click **"Sign Up"** to test new user registration

---

## 🧪 AUTOMATED TESTS

### **Test 1: Quick Endpoint Check** (1 minute)
```bash
cd ayursutra-backend
node quick_test.js
```
Should show all ✅ PASS

### **Test 2: Complete Signup Flow** (2 minutes)
```bash
cd ayursutra-backend
node test_signup.js
```
Should show all 7 steps passing with ✅

### **Test 3: Email Delivery** (2 minutes)
```bash
cd ayursutra-backend
node testEmail.js
```
Should verify Gmail connection and send test email

---

## 📝 MANUAL TEST CHECKLIST

### **✅ Test 1: Signup Flow**
1. Go to http://localhost:5173/signup
2. Select **"Patient"** role
3. Fill in form with:
   - Name: Test User
   - Email: testuser_123@gmail.com (unique)
   - Password: Test@123456
   - Phone: 9876543210
4. Click "Sign Up"
5. Verify OTP code appears in console/terminal
6. Enter the 6-digit OTP
7. **Expected**: Account created, auto-logged in

### **✅ Test 2: Signin Flow**
1. Go to http://localhost:5173/signin
2. Enter:
   - Email: patient@demo.com
   - Password: demo123
3. Click "Sign In"
4. **Expected**: Immediate login (demo bypasses OTP)

### **✅ Test 3: Doctor Signup**
1. Signup as Doctor (same as Test 1 but select "Doctor" role)
2. Fill in doctor-specific fields
3. Complete signup and OTP verification
4. **Expected**: Account created but shows "Pending Admin Approval"
5. Cannot login until approved

### **✅ Test 4: Forgot Password**
1. Go to signin page
2. Click "Forgot Password"
3. Enter email (use a registered one or demo)
4. Check console for OTP code
5. Enter OTP and new password
6. **Expected**: Password reset successfully

### **✅ Test 5: Email Verification in Signup**
1. Try to signup
2. Do NOT verify OTP (skip it)
3. Try to manually call register endpoint with no OTP
4. **Expected**: Returns "Email verification required" error

---

## 🔍 VERIFICATION STEPS

### **Check Email Sending**
✅ SMTP is configured correctly  
✅ Gmail connection verified on startup  
✅ OTP emails can be sent (testEmail.js proves it)  

### **Check Database**
```bash
# Connect to MongoDB
mongo
use ayursutra
db.users.find({email: "patient@demo.com"})
db.otps.find().sort({createdAt: -1}).limit(5)
```

### **Check API Responses**
```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@demo.com","password":"demo123"}'

# Should return user data + JWT token
```

---

## 📱 TESTING FLOW DIAGRAM

```
START
  ↓
Frontend: http://localhost:5173
  ├─→ Sign In
  │    ├─→ Enter credentials
  │    └─→ Get user data (demo bypasses OTP)
  │
  ├─→ Sign Up
  │    ├─→ Fill form
  │    ├─→ Request OTP → Backend sends email
  │    ├─→ Enter 6-digit code
  │    ├─→ OTP verified
  │    └─→ Account created
  │
  └─→ Dashboard
       ├─→ View appointments
       ├─→ View therapies
       └─→ Profile management
```

---

## 🚨 TROUBLESHOOTING

### **"No account found" on login**
```
✅ Solution: Run `node seedData.js` to create demo accounts
```

### **"Email not found" on OTP send**
```
✅ Solution: Account must exist in database to send OTP
✅ For new accounts: Complete signup with email verification first
```

### **"OTP invalid/expired"**
```
✅ Solution: OTP expires in 5 minutes
✅ Try resend: Wait 30 seconds cooldown, then request new OTP
```

### **"Email verification required" on signup**
```
✅ Solution: Verify the OTP first before registering
✅ OTP must be verified within 15 minutes of sending
```

### **"Mobile number already registered"**
```
✅ Solution: Use a unique phone number for each test account
✅ Or: Seed database fresh with `node seedData.js`
```

### **"Doctor account pending approval"**
```
✅ Solution: Expected behavior - doctors await admin approval
✅ Login as admin (admin@demo.com) and approve doctor
```

### **Gmail not sending emails**
```
✅ Check: EMAIL_USER and EMAIL_PASSWORD in .env are correct
✅ Check: Gmail 2FA is enabled
✅ Check: App Password is used (not regular password)
✅ Run: node testEmail.js to verify connection
```

---

## 📊 API RESPONSE EXAMPLES

### **Successful Login**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Priya Sharma",
    "email": "patient@demo.com",
    "role": "patient",
    "avatar": "🏥",
    "approved": true
  }
}
```

### **OTP Verified**
```json
{
  "success": true,
  "verified": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "jwt",
  "message": "OTP verified successfully."
}
```

### **User Registered**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "name": "New User",
    "email": "newuser@gmail.com",
    "role": "patient",
    "avatar": "🏥",
    "approved": true
  }
}
```

---

## ✅ FINAL CHECKLIST

- [ ] Backend server running
- [ ] MongoDB connected
- [ ] Demo data seeded
- [ ] Frontend server running
- [ ] Can login with demo account
- [ ] Can signup with new email
- [ ] OTP verification working
- [ ] Email sending verified
- [ ] All tests passing

**Ready to use!** 🎉

---

For detailed technical documentation, see: **AUTHENTICATION_SYSTEM_FIXED.md**
