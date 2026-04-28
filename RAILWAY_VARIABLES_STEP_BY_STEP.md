# 🎯 Railway Variables - Step-by-Step UI Guide

**Visual guide for adding environment variables in Railway dashboard**

---

## 📍 Where to Find Variables in Railway

### In Your Railway Dashboard:

```
Your Ayursutra Project
├── Deployments (shows status)
├── Logs (shows errors)
├── Variables ← YOU ARE HERE
├── Settings
└── Integrations
```

---

## 🖥️ What You'll See

The Variables tab shows:

```
┌─────────────────────────────────────┐
│   Variables                         │
├─────────────────────────────────────┤
│ [Add Variable] [Import]             │
├─────────────────────────────────────┤
│                                     │
│ Key              Value              │
│ ─────────────────────────────────── │
│ PORT             5000               │
│ NODE_ENV         production         │
│ ...              ...                │
│                                     │
└─────────────────────────────────────┘
```

---

## 🚀 How to Add Each Variable

### Method 1: Manual Entry (Recommended)

**Step 1**: Click "Add Variable" button
```
╔═══════════════════════════════════════╗
║ Add Variable                          ║
╠═══════════════════════════════════════╣
║ Key: [____________]                  ║
║ Value: [________________]             ║
║                                       ║
║ [Cancel]  [Add]                       ║
╚═══════════════════════════════════════╝
```

**Step 2**: Enter first variable
```
Key: PORT
Value: 5000
[Add Button]
```

**Step 3**: Variable appears in list
```
✓ PORT = 5000
```

**Step 4**: Repeat for next variable

---

### Method 2: Bulk Import (If Available)

Some Railway versions allow bulk import:

1. Click "Import" button
2. Paste all variables:
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=ayursutra_jwt_secret_key_2024
...
```
3. Click "Import"
4. All created at once

---

## 📝 Variable Entry Examples

### Example 1: Simple Number
```
KEY:   PORT
VALUE: 5000
```
Enter literally: `5000`

### Example 2: Text Value
```
KEY:   NODE_ENV
VALUE: production
```
Enter literally: `production`

### Example 3: Email Address
```
KEY:   EMAIL_USER
VALUE: ozahet32@gmail.com
```
Enter literally: `ozahet32@gmail.com`

### Example 4: Connection String
```
KEY:   MONGO_URI
VALUE: mongodb+srv://<db_username>:<AyurDB2026$ecure!>@ayursutra.kwbvej7.mongodb.net/?appName=Ayursutra
```
Enter literally (replace placeholders):
```
mongodb+srv://USERNAME:PASSWORD@ayursutra.kwbvej7.mongodb.net/?appName=Ayursutra
```

### Example 5: Multiple Values (CSV)
```
KEY:   ALLOWED_ORIGINS
VALUE: https://ayursutra.vercel.app,http://localhost:5173
```
Enter literally (comma-separated, NO SPACES):
```
https://ayursutra.vercel.app,http://localhost:5173
```

---

## ✅ All 15 Required Variables

Add these in order:

### Group 1: Server Configuration (3 variables)
```
┌─────────────────────────────────────┐
│ 1. PORT = 5000                      │
│ 2. NODE_ENV = production            │
│ 3. TZ = Asia/Kolkata                │
└─────────────────────────────────────┘
```

### Group 2: Database (1 variable)
```
┌─────────────────────────────────────┐
│ 4. MONGO_URI = mongodb+srv://...    │
│    (Your MongoDB connection string)  │
└─────────────────────────────────────┘
```

### Group 3: JWT Authentication (2 variables)
```
┌─────────────────────────────────────┐
│ 5. JWT_SECRET = ayursutra_jwt...    │
│ 6. JWT_EXPIRE = 7d                  │
└─────────────────────────────────────┘
```

### Group 4: Email Configuration (6 variables)
```
┌─────────────────────────────────────┐
│ 7.  SMTP_HOST = smtp.gmail.com      │
│ 8.  SMTP_PORT = 587                 │
│ 9.  EMAIL_USER = ozahet32@gmail.com │
│ 10. EMAIL_PASSWORD = qqumniruvnnzvtin
│ 11. SMTP_USER = ozahet32@gmail.com  │
│ 12. SMTP_PASS = qqumniruvnnzvtin    │
└─────────────────────────────────────┘
```

### Group 5: CORS & Frontend (3 variables)
```
┌─────────────────────────────────────────────┐
│ 13. FRONTEND_URL =                          │
│     https://ayursutra.vercel.app            │
│                                             │
│ 14. ALLOWED_ORIGINS =                       │
│     https://ayursutra.vercel.app,           │
│     http://localhost:5173                   │
│                                             │
│ 15. SOCKET_IO_CORS_ORIGIN =                 │
│     https://ayursutra.vercel.app            │
└─────────────────────────────────────────────┘
```

---

## 🎬 Complete Workflow

```
START: Railway Variables Tab
  ↓
[Click Add Variable]
  ↓
Enter: PORT = 5000
  ↓
[Click Add]
  ↓
✓ PORT appears in list
  ↓
[Click Add Variable again]
  ↓
Enter: NODE_ENV = production
  ↓
[Click Add]
  ↓
✓ NODE_ENV appears
  ↓
...continue for all 15 variables...
  ↓
ALL VARIABLES ADDED ✓
  ↓
[Click Deploy]
  ↓
Railway redeploys with new variables
  ↓
CHECK LOGS
  ↓
MongoDB connected? ✓
Socket.io initialized? ✓
  ↓
BACKEND READY
```

---

## 📊 Real Example: Adding PORT Variable

**What you see in Railway:**

```
┌──────────────────────────────────────┐
│ Variables                            │
│                                      │
│ [Add Variable]  [Import]             │
│                                      │
│ No variables yet. Add one!           │
│                                      │
│ [+ Add Variable]                     │
└──────────────────────────────────────┘
```

**Click "Add Variable":**

```
┌──────────────────────────────────────┐
│ Add New Variable                     │
│                                      │
│ Key: [PORT         ]                 │
│                                      │
│ Value: [5000       ]                 │
│                                      │
│ [Cancel] [Add]                       │
└──────────────────────────────────────┘
```

**Click "Add":**

```
┌──────────────────────────────────────┐
│ Variables                            │
│                                      │
│ [Add Variable]  [Import]             │
│                                      │
│ PORT = 5000                  [Edit] │
│                              [Delete]│
│                                      │
│ [+ Add Variable]                     │
└──────────────────────────────────────┘
```

**Done!** Now repeat for next variable.

---

## ⏱️ Time Estimate

```
Variable 1-5:   ~2 minutes
Variable 6-10:  ~2 minutes
Variable 11-15: ~2 minutes
─────────────────────────
TOTAL: ~6 minutes
```

---

## ✨ Special Cases

### Port Number
- Don't use quotes
- Enter: `5000` (not `"5000"`)

### Passwords/Secrets
- Copy exactly as-is
- Include special characters
- Don't add quotes

### URLs
- Include full `https://`
- No trailing slashes
- Separate multiple with comma (no spaces)

### Multiline Values (like Firebase Key)
- Replace newlines with `\n`
- Or paste as single line
- Railway handles formatting

---

## 🆘 If Something Goes Wrong

### Variable Not Saving
1. Make sure to click [Add] button
2. Don't use quotes
3. Check for typos

### Variable Shows Error
1. Check special characters
2. Verify format is correct
3. Look at Logs tab for error

### Need to Edit Variable
1. Click [Edit] next to variable
2. Change value
3. Click [Save]

### Need to Delete Variable
1. Click [Delete] next to variable
2. Confirm deletion
3. It's immediately removed

---

## 📋 Final Checklist Before Deploy

Before you click Deploy, verify you have:

- [x] 15 required variables added
- [x] No red error indicators
- [x] PORT = 5000
- [x] NODE_ENV = production
- [x] MONGO_URI set (update in Phase 3)
- [x] EMAIL credentials correct
- [x] FRONTEND_URL set
- [x] All saved (no pending changes)

---

## ✅ Ready for Deployment

Once all variables are added:

1. Railway auto-saves ✓
2. No manual save needed ✓
3. Ready to deploy ✓

Next: **Click Deploy button** and proceed to Phase 2 Deployment

---

**Status**: Ready to Configure  
**Variables**: 15 required + 10 optional  
**Time**: 5-10 minutes  
**Next**: Deploy Backend to Railway  

