# Backend Codebase Comprehensive Audit Report

**Date**: April 17, 2026  
**Scope**: Complete backend codebase analysis  
**Focus Areas**: Routes, Models, Middleware, Error Handling, Database, Email Services, Socket.io, CRON jobs

---

## CRITICAL ISSUES (Must Fix)

### 1. Missing CRON Scheduler Initialization
**File**: [server.js](server.js#L160-L240)  
**Severity**: CRITICAL  
**Issue**: The `startCronScheduler()` function is defined but never called. Pre/post-care reminders will not be sent.

**Current Code** (Lines 160-165):
```javascript
const startCronScheduler = () => {
    const Appointment = require('./models/Appointment');
    // ... rest of implementation
    cron.schedule('* * * * *', async () => { ... });
};
```

**Problem**: Function is defined but never invoked before server startup.

**Fix**: Add this line after the function definition:
```javascript
startCronScheduler();
```

---

### 2. Unhandled Promise Rejections in CRON Job
**File**: [server.js](server.js#L185-L240)  
**Severity**: CRITICAL  
**Issue**: CRON job contains multiple async operations without proper error handling for individual operations.

**Current Code** (Lines 191-200):
```javascript
for (const appt of upcoming) {
    const patient = await User.findById(appt.patientId).select('email phone notificationPrefs name');
    if (!patient) continue;
    // ... more code ...
    await notifyPatient({...});
    await Appointment.findByIdAndUpdate(appt._id, { notificationsScheduled: true });
}
```

**Problem**: 
- If `notifyPatient()` fails, the loop continues without logging the error
- If `findByIdAndUpdate()` fails, no error is caught
- A single appointment failure could prevent other notifications from being sent

**Fix**: Wrap individual operations:
```javascript
for (const appt of upcoming) {
    try {
        const patient = await User.findById(appt.patientId).select('email phone notificationPrefs name');
        if (!patient) continue;
        // ... rest of code ...
        await Appointment.findByIdAndUpdate(appt._id, { notificationsScheduled: true });
    } catch (err) {
        console.error(`[Cron] Error processing appointment ${appt._id}:`, err.message);
        continue; // Skip this appointment and continue with next
    }
}
```

---

### 3. Weak Password Validation
**File**: [models/User.js](models/User.js#L3)  
**Severity**: CRITICAL  
**Issue**: Password minimum length is only 6 characters, which is below security best practices.

**Current Code**:
```javascript
password: { type: String, required: true, minlength: 6 },
```

**Problem**: 6-character passwords are insufficient. OWASP recommends minimum 8 characters.

**Fix**:
```javascript
password: { type: String, required: true, minlength: 8 },
```

Also add validation in [auth.js register route](routes/auth.js#L44):
```javascript
if (!name || !password || password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
}
```

---

## HIGH-SEVERITY ISSUES

### 4. Missing Error Handling in Appointments Route
**File**: [routes/appointments.js](routes/appointments.js#L130-L180)  
**Severity**: HIGH  
**Issue**: PUT /api/appointments/:id route is missing handlers for reschedule logic and doesn't handle all error cases.

**Current Code** (Lines 130-135):
```javascript
router.put('/:id', protect, async (req, res) => {
    try {
        const existing = await Appointment.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: 'Appointment not found' });

        if (req.user.role === 'patient' && existing.patientId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to modify this appointment' });
        }
```

**Problem**: File appears to be cut off. The complete PUT/reschedule logic is missing.

**Fix**: Ensure the full route handler includes:
- Ownership verification for both patient and doctor
- Conflict checking for new time slot
- Notification sending for reschedules
- Complete error handling

---

### 5. Inconsistent Error Response in Notifications Route
**File**: [routes/notifications.js](routes/notifications.js#L16-L20)  
**Severity**: HIGH  
**Issue**: Router method mismatch in PUT /api/notifications/read-all endpoint.

**Current Code** (Lines 16-22):
```javascript
router.put('/read-all/mark', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, status: { $ne: 'read' } },
            { status: 'read' }
        );
        res.json({ success: true, message: 'All marked as read' });
```

**Problems**:
1. Endpoint is `PUT /read-all/mark` which is awkward - should be PATCH or POST
2. Update should check for actual changes
3. No feedback on how many were updated

**Fix**:
```javascript
router.patch('/read-all', protect, async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { userId: req.user.id, status: { $ne: 'read' } },
            { status: 'read' }
        );
        res.json({ 
            success: true, 
            message: `${result.modifiedCount} notification(s) marked as read`,
            updatedCount: result.modifiedCount
        });
```

---

### 6. Missing Role Validation in Diets Route
**File**: [routes/diets.js](routes/diets.js#L10-L15)  
**Severity**: HIGH  
**Issue**: POST /api/diets allows admin to create diet plans for ANY patient, but PATCH only works if doctor owns it.

**Current Code**:
```javascript
router.post('/', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const { patientId, patientName, items, notes } = req.body;

        if (req.user.role === 'doctor') {
            const hasAppt = await Appointment.findOne({ doctorId: req.user.id, patientId });
            if (!hasAppt) {
                return res.status(403).json({ success: false, message: 'Patient not assigned to you' });
            }
        }
        // No check for admin!
```

**Problem**: Admin can create diet plans but can't patch them (line 26 has `doctorId: req.user.id` check).

**Fix**: Add admin bypass in PATCH:
```javascript
router.patch('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role === 'doctor') {
            query.doctorId = req.user.id;
        }
        const plan = await DietPlan.findOneAndUpdate(
            query,
            { $set: { items: req.body.items, notes: req.body.notes } },
            { new: true }
        );
```

---

### 7. Missing Route Handler for Feedback Edit Completion
**File**: [routes/feedback.js](routes/feedback.js#L95)  
**Severity**: HIGH  
**Issue**: Route file appears incomplete - PUT /api/feedback/:id handler cuts off at line 95.

**Current Code** (Lines 85-95):
```javascript
// Update feedback with edit history
const updateData = {
    isEdited: true,
```

**Problem**: The handler is incomplete - missing the actual update logic.

**Fix**: Complete the handler:
```javascript
const updateData = {
    isEdited: true,
    editHistory: [
        ...(feedback.editHistory || []),
        { content: feedback.content, editedAt: new Date() }
    ]
};
if (content) updateData.content = content.trim();
if (rating !== undefined) updateData.rating = rating;

const updated = await Feedback.findByIdAndUpdate(req.params.id, updateData, { new: true });
res.json({ success: true, data: updated });
```

---

### 8. SQL Injection Risk in Analytics Route
**File**: [routes/analytics.js](routes/analytics.js#L7-L15)  
**Severity**: HIGH  
**Issue**: doctorId is constructed from query parameter without validation before using in ObjectId.

**Current Code**:
```javascript
const rawDoctorId = req.user.role === 'doctor' ? req.user.id : req.query.doctorId;
let matchDoctor = {};
if (rawDoctorId) {
    try {
        matchDoctor = { doctorId: new mongoose.Types.ObjectId(rawDoctorId) };
    } catch {
        return res.status(400).json({ success: false, message: 'Invalid doctorId' });
    }
}
```

**Problem**: While it has try-catch for ObjectId validation, there's no authorization check. An admin could access any doctor's analytics.

**Fix**: Add authorization:
```javascript
if (req.user.role === 'doctor') {
    matchDoctor = { doctorId: new mongoose.Types.ObjectId(req.user.id) };
} else if (req.user.role === 'admin' && req.query.doctorId) {
    try {
        matchDoctor = { doctorId: new mongoose.Types.ObjectId(req.query.doctorId) };
    } catch {
        return res.status(400).json({ success: false, message: 'Invalid doctorId' });
    }
}
```

---

## MEDIUM-SEVERITY ISSUES

### 9. Email Validation Service Missing Error Handling
**File**: [utils/emailValidator.js](utils/emailValidator.js#L35-L75)  
**Severity**: MEDIUM  
**Issue**: DNS MX record validation can fail silently and allow invalid domains in certain network conditions.

**Current Code** (Lines 58-72):
```javascript
try {
    const addresses = await resolveMx(domain);
    if (!addresses || addresses.length === 0) {
        return { 
            success: false, 
            code: 'INVALID_DOMAIN', 
            message: `The domain provider "${domain}" cannot receive mail (no MX records).` 
        };
    }
} catch (err) {
    console.warn(`[EmailValidator] DNS resolution failed for ${domain} (${err.code}). Allowing by default.`);
    if (err.code === 'ENODATA' || err.code === 'ENOTFOUND') {
        // Even then, it's safer to fail-open in constrained local environments...
    }
}
```

**Problem**:
- Silently allowing domains when DNS fails could enable typos in email domains
- No distinction between network errors and actual MX lookup failures
- Comment suggests allowing errors but doesn't return failure

**Fix**:
```javascript
try {
    const addresses = await resolveMx(domain);
    if (!addresses || addresses.length === 0) {
        return { 
            success: false, 
            code: 'INVALID_DOMAIN', 
            message: `The domain "${domain}" cannot receive mail (no MX records).` 
        };
    }
} catch (err) {
    // Only fail-open for actual network connectivity issues
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEOUT') {
        console.warn(`[EmailValidator] DNS service unavailable for ${domain}. Allowing by default.`);
        return { success: true }; // Allow in degraded mode
    }
    // For any other DNS error (ENODATA, ENOTFOUND), reject
    return { 
        success: false, 
        code: 'INVALID_DOMAIN', 
        message: `Could not verify domain "${domain}". Please check the email address.` 
    };
}
```

---

### 10. Missing Phone Number Validation in Model
**File**: [models/User.js](models/User.js#L5)  
**Severity**: MEDIUM  
**Issue**: Phone field has no validation - could accept any string.

**Current Code**:
```javascript
phone: { type: String, default: '' },
```

**Problem**: Phone field should have format validation and be indexed for lookups.

**Fix**:
```javascript
phone: { 
    type: String, 
    default: '',
    match: [/^\+?\d{10,15}$/, 'Phone must be a valid international format (10-15 digits)'],
    index: true
},
```

---

### 11. Missing Ownership Check in Therapy Tracking Route
**File**: [routes/therapyTracking.js](routes/therapyTracking.js#L130-L145)  
**Severity**: MEDIUM  
**Issue**: PATCH /api/tracking/:therapyId/symptom-action doesn't verify doctor ownership.

**Current Code** (Lines 130-145):
```javascript
router.patch('/:therapyId/symptom-action', protect, async (req, res) => {
    try {
        const { therapyId } = req.params;
        const { symptomId, action, doctorNote, appointmentId } = req.body;

        if (!symptomId || !action) {
            return res.status(400).json({ success: false, message: 'symptomId and action are required' });
        }

        const therapy = await Therapy.findById(therapyId);
        if (!therapy) return res.status(404).json({ success: false, message: 'Therapy not found' });
```

**Problem**: No check to ensure the requesting user is the therapy's doctor.

**Fix**:
```javascript
router.patch('/:therapyId/symptom-action', protect, async (req, res) => {
    try {
        const { therapyId } = req.params;
        const { symptomId, action, doctorNote, appointmentId } = req.body;

        if (!symptomId || !action) {
            return res.status(400).json({ success: false, message: 'symptomId and action are required' });
        }

        const therapy = await Therapy.findById(therapyId);
        if (!therapy) return res.status(404).json({ success: false, message: 'Therapy not found' });
        
        // Add ownership check
        if (req.user.role === 'doctor' && therapy.doctorId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to modify this therapy' });
        }
```

---

### 12. Missing Validation in Invoice Model
**File**: [models/Invoice.js](models/Invoice.js#L18-L25)  
**Severity**: MEDIUM  
**Issue**: Grand total can be 0, which doesn't make business sense. Items array can be empty despite validation.

**Current Code**:
```javascript
items: { 
    type: [InvoiceItemSchema], 
    required: [true, 'Invoice must have at least one item'],
    validate: [arr => arr.length > 0, 'Invoice must have at least one item']
},
grandTotal: { type: Number, default: 0, min: 0, required: [true, 'Grand total is required'] },
```

**Problem**: 
- `default: 0` conflicts with `required: true`
- `min: 0` allows zero invoices
- Items validation might not trigger on Mongoose v9

**Fix**:
```javascript
items: { 
    type: [InvoiceItemSchema], 
    validate: {
        validator: function(arr) { return arr && arr.length > 0; },
        message: 'Invoice must have at least one item'
    }
},
grandTotal: { 
    type: Number, 
    required: [true, 'Grand total is required'],
    min: [1, 'Grand total must be greater than 0']
},
```

---

### 13. Missing Appointment Deletion/Cancellation Cascade
**File**: Routes for Appointments  
**Severity**: MEDIUM  
**Issue**: No cleanup when appointments are deleted - orphaned data in related collections.

**Problem**: If an appointment is deleted:
- Therapy records still reference it via `sessionRef`
- Notifications still point to dead appointment ID
- No cascading delete

**Fix**: Add cleanup in appointment deletion:
```javascript
router.delete('/:id', protect, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
        
        // Ownership check
        if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        // Cleanup: remove notifications and therapy references
        await Notification.deleteMany({ appointmentId: appointment._id });
        await Therapy.updateMany(
            { 'symptomLog.sessionRef': appointment._id },
            { $unset: { 'symptomLog.$.sessionRef': '' } }
        );
        
        await Appointment.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Appointment deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
```

---

## LOW-SEVERITY ISSUES

### 14. Missing Input Sanitization
**File**: Multiple routes  
**Severity**: LOW  
**Issue**: String inputs not sanitized for XSS attacks.

**Examples**:
- [invoices.js line 26](routes/invoices.js#L26): `const { invoiceNo, items, grandTotal, patient } = req.body;`
- [feedback.js line 50](routes/feedback.js#L50): `const { content, rating, doctorId } = req.body;`

**Fix**: Add sanitization middleware or validate in each route:
```javascript
const mongoSanitize = require('mongo-sanitize');

// In middleware
app.use(mongoSanitize());
```

Or manually:
```javascript
invoiceNo = invoiceNo.trim().replace(/<[^>]*>/g, '');
```

---

### 15. Missing Rate Limiting on Auth Routes
**File**: [routes/auth.js](routes/auth.js#L35)  
**Severity**: LOW  
**Issue**: No rate limiting on login/register endpoints - vulnerable to brute force.

**Fix**: Add rate limiting middleware:
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.'
});

router.post('/login', authLimiter, async (req, res) => { ... });
router.post('/register', authLimiter, async (req, res) => { ... });
```

---

### 16. Inconsistent Pagination Limits
**File**: Multiple routes  
**Severity**: LOW  
**Issue**: Different pagination limits across routes.

**Examples**:
- [invoices.js line 16](routes/invoices.js#L16): `limit = Math.min(100, ...)`
- [feedback.js line 13](routes/feedback.js#L13): `limit = Math.min(50, ...)`
- [notifications.js line 8](routes/notifications.js#L8): `.limit(50)` (hardcoded)

**Fix**: Standardize in a config file or centralize:
```javascript
const PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
```

---

### 17. Missing Audit Logging
**File**: All mutation routes  
**Severity**: LOW  
**Issue**: No audit trail for critical operations (invoice finalization, doctor approval, etc.).

**Problem**: Can't track:
- Who approved which doctor
- When invoice status changed
- What feedback was modified

**Fix**: Add audit logging model and log critical operations:
```javascript
const AuditLog = require('../models/AuditLog');

// After approval
await AuditLog.create({
    userId: req.user.id,
    action: 'doctor_approved',
    resourceId: doctorId,
    resourceType: 'User',
    timestamp: new Date()
});
```

---

### 18. Socket.io Connection Not Logging Errors
**File**: [server.js](server.js#L58-L65)  
**Severity**: LOW  
**Issue**: No error handling or logging for socket.io connection issues.

**Current Code**:
```javascript
io.on('connection', (socket) => {
    socket.on('join_user_room', (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
            console.log(`[Socket] User ${userId} joined their room`);
        }
    });

    socket.on('disconnect', () => {
        // cleanup handled by socket.io automatically
    });
});
```

**Fix**:
```javascript
io.on('connection', (socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);
    
    socket.on('join_user_room', (userId) => {
        if (!userId) {
            console.warn(`[Socket] join_user_room called without userId from ${socket.id}`);
            return;
        }
        socket.join(`user_${userId}`);
        console.log(`[Socket] User ${userId} joined their room`);
    });

    socket.on('error', (error) => {
        console.error(`[Socket] Error on ${socket.id}:`, error);
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Disconnected: ${socket.id}`);
    });
});
```

---

### 19. Missing Request ID for Logging
**File**: [server.js](server.js#L99)  
**Severity**: LOW  
**Issue**: No request ID tracking - hard to trace requests through logs.

**Fix**: Add request ID middleware:
```javascript
app.use((req, res, next) => {
    req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${req.id}] ${req.method} ${req.path}`);
    next();
});
```

---

### 20. Missing Validation for Doctor Availability Flag
**File**: [models/User.js](models/User.js#L19)  
**Severity**: LOW  
**Issue**: `available` field exists but is never used or checked in slot generation.

**Current Code**:
```javascript
available: { type: Boolean, default: true },
```

**Problem**: Appointments can be booked even if doctor marked as unavailable.

**Fix**: Add check in appointment slot generation:
```javascript
// In /api/appointments/slots route
const doctor = await User.findById(doctorId);
if (!doctor.available) {
    return res.status(400).json({ 
        success: false, 
        message: 'Doctor is currently unavailable for bookings' 
    });
}
```

---

## CONFIGURATION & DEPLOYMENT ISSUES

### 21. CORS Configuration Too Permissive
**File**: [server.js](server.js#L40-L50)  
**Severity**: MEDIUM  
**Issue**: Whitelisting specific origins is good, but Vercel preview URLs will break.

**Current Code**:
```javascript
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'https://ayursutra-khaki.vercel.app',
];
```

**Problem**: Every Vercel deployment creates new preview URL - they won't be whitelisted.

**Fix**:
```javascript
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'https://ayursutra-khaki.vercel.app',
    /\.vercel\.app$/, // Allow all Vercel preview URLs
];
```

---

### 22. Missing Environment Variable Validation
**File**: All services  
**Severity**: MEDIUM  
**Issue**: Missing validation at startup for required env vars. Could fail at runtime.

**Fix**: Add validation at startup:
```javascript
// In server.js after requiring modules
const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'SMTP_USER',
    'SMTP_PASS',
];

const missingVars = requiredEnvVars.filter(v => !process.env[v] || process.env[v].startsWith('your'));
if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}
console.log('✅ All required environment variables configured');
```

---

## PROMISE REJECTION WARNINGS

### 23. Unhandled Promise Rejections
**File**: Multiple routes  
**Severity**: HIGH  
**Issue**: Some async database operations not awaited or wrapped in try-catch.

**Examples**:
- [notifications.js line 61](routes/notifications.js#L61): `sendEmail()` called but not awaited in one branch
- [therapyTracking.js line 170](routes/therapyTracking.js#L170): Multiple async calls without proper error handling

**Fix**: Ensure all promises are either:
1. Awaited and wrapped in try-catch, OR
2. Have .catch() handler

```javascript
// BAD - Fire and forget
sendEmail(patient.email, subject, html);

// GOOD - Await with error handling
try {
    await sendEmail(patient.email, subject, html);
} catch (err) {
    console.error('Email failed:', err.message);
}

// ALSO GOOD - Explicit catch
sendEmail(patient.email, subject, html)
    .catch(err => console.error('Email failed:', err.message));
```

---

## SUMMARY STATISTICS

| Category | Count | Severity |
|----------|-------|----------|
| Critical Issues | 3 | 🔴 |
| High Issues | 6 | 🟠 |
| Medium Issues | 5 | 🟡 |
| Low Issues | 9 | 🟢 |
| **TOTAL** | **23** | |

---

## RECOMMENDED FIX PRIORITY

### Phase 1 (Immediate - Week 1)
1. ✅ Fix CRON scheduler initialization (#1)
2. ✅ Add error handling to CRON jobs (#2)
3. ✅ Increase password minimum length (#3)
4. ✅ Fix missing appointments route handlers (#4)

### Phase 2 (High Priority - Week 2)
5. ✅ Complete unfinished route files (#7)
6. ✅ Fix authorization checks in analytics (#8)
7. ✅ Add missing therapy ownership checks (#11)
8. ✅ Add env var validation at startup (#22)

### Phase 3 (Medium Priority - Week 3)
9. ✅ Fix email validation DNS handling (#9)
10. ✅ Improve invoice validation (#12)
11. ✅ Add audit logging for critical operations (#17)
12. ✅ Add rate limiting to auth routes (#15)

### Phase 4 (Polish - Week 4)
13. ✅ Add input sanitization (#14)
14. ✅ Standardize pagination (#16)
15. ✅ Improve socket.io error handling (#18)
16. ✅ Add request ID logging (#19)

---

## TESTING RECOMMENDATIONS

1. **Add Jest unit tests** for all route handlers
2. **Integration tests** for authentication flows
3. **Load tests** for CRON job concurrency
4. **Security tests** for SQL injection, XSS, CSRF
5. **Error scenarios** (DB connection failure, email service down, etc.)

---

## SECURITY CHECKLIST

- [ ] Implement HTTPS enforcement in production
- [ ] Add rate limiting on all public endpoints
- [ ] Validate and sanitize ALL user inputs
- [ ] Use parameterized queries (already using Mongoose ODM ✓)
- [ ] Implement CSRF protection
- [ ] Add security headers (Helmet.js)
- [ ] Rotate JWT secrets regularly
- [ ] Implement account lockout after failed login attempts
- [ ] Add 2FA for doctor/admin accounts
- [ ] Audit and log all sensitive operations

---

## NEXT STEPS

1. Create tickets for each critical issue
2. Assign fixes to development team
3. Add tests for each fix
4. Set up code review checklist
5. Deploy to staging for integration testing
6. Schedule security audit before production release

