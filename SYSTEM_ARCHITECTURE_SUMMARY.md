# 🏥 Ayursutra - Visual System Architecture Summary

*Professional Senior Developer | Complete Frontend System Architecture*

---

## 📊 Quick Reference: System Overview

```
ENTRY POINT (Landing Page)
        │
   ┌────┴────┬─────────┬──────────┐
   ▼         ▼         ▼          ▼
PATIENT   DOCTOR    ADMIN    EXISTING
SIGNUP    SIGNUP    LOGIN     LOGIN
   │         │         │         │
   └────┬────┴─────────┴─────────┘
        │
   OTP EMAIL VERIFICATION
        │
   JWT TOKEN GENERATED
        │
   ┌────┴──────┬──────────┬───────────┐
   ▼           ▼          ▼           ▼
PATIENT     DOCTOR      ADMIN        API
DASHBOARD   DASHBOARD   PANEL        READY
   │           │          │
   └───────────┴──────────┘
        │
   REAL-TIME SOCKET.IO
        │
   DATABASE (MongoDB)
```

---

## 🎯 Doctor Functions Connected to Patient Flow

```
DOCTOR SIGNUP/LOGIN
   ↓
DOCTOR DASHBOARD
   ├─ Manage Schedule
   │  └─ Patient Can View & Book
   │
   ├─ View Patient Appointments
   │  └─ Real-time Notifications
   │
   ├─ Create Prescriptions
   │  └─ Patient Receives Email + In-app
   │
   ├─ Send Medical Documents
   │  └─ Patient Downloads in Documents Tab
   │
   ├─ View Patient History
   │  └─ Context from Patient Profile
   │
   └─ Track Patient Progress
      └─ Shows in Patient's Therapies Tab


PATIENT SEES DOCTOR THROUGH:
   1. Search/Browse Doctors → Click Doctor → View Profile
   2. Book Appointment → Select Doctor from list
   3. View Appointments → Doctor details displayed
   4. Receive Prescriptions → Doctor name shown
   5. View Schedule → Doctor's availability blocks
```

---

## 📧 Email Verification Flow (Complete)

```
SIGNUP FORM SUBMITTED
   ↓
BACKEND VALIDATES
   ├─ Check duplicate email ✓
   ├─ Validate email format ✓
   ├─ Check disposable domains ✓
   └─ Hash password ✓
   ↓
GENERATE OTP (6-digit)
   ↓
SEND VIA NODEMAILER
   ├─ Gmail SMTP ✓
   ├─ Custom email template ✓
   ├─ 10-minute expiry ✓
   └─ Store in DB ✓
   ↓
FRONTEND SHOWS OTP SCREEN
   ├─ Display email (masked)
   ├─ 6-digit input field
   ├─ Resend button (after timeout)
   └─ Verify button
   ↓
USER ENTERS OTP
   ↓
BACKEND VERIFIES
   ├─ Check OTP matches ✓
   ├─ Check not expired ✓
   └─ Mark email verified ✓
   ↓
CREATE JWT TOKEN
   ↓
STORE IN LOCALSTORAGE
   ├─ token ✓
   ├─ refreshToken ✓
   └─ expiresIn ✓
   ↓
UPDATE AUTHCONTEXT
   ├─ user = userData ✓
   ├─ isAuthenticated = true ✓
   └─ role = patient/doctor ✓
   ↓
AUTO-LOGIN & REDIRECT
   ├─ Patient → PatientDashboard
   ├─ Doctor → DoctorDashboard
   └─ Admin → AdminPanel
```

---

## 🏠 Home Page (Routing Logic)

```
AFTER LOGIN SUCCESSFUL
   ↓
CHECK AUTHCONTEXT
   ├─ user exists? ✓
   ├─ token valid? ✓
   └─ role set? ✓
   ↓
┌─────────┴──────────┬──────────────┐
│                    │              │
▼                    ▼              ▼
ROLE=PATIENT    ROLE=DOCTOR    ROLE=ADMIN
   │                 │              │
   ▼                 ▼              ▼
PATIENT         DOCTOR           ADMIN
DASHBOARD       DASHBOARD        PANEL
   │                 │              │
   ├─ Book Appts    ├─ View Appts  ├─ User Mgmt
   ├─ View Therapy  ├─ Manage Docs ├─ Doctor Approval
   ├─ Docs          ├─ Schedule    ├─ Invoice Mgmt
   └─ Profile       ├─ Analytics   ├─ Appt Monitor
                    └─ Feedback    └─ System Config
```

---

## 🛡️ Admin Panel Architecture

```
ADMIN LOGIN
   ↓
VERIFY CREDENTIALS
   ├─ Check email exists ✓
   ├─ Check password matches ✓
   ├─ Verify role=admin ✓
   └─ Generate JWT ✓
   ↓
ADMIN DASHBOARD
   │
   ├─ USER MANAGEMENT
   │  ├─ View all users
   │  ├─ Search/Filter
   │  ├─ Edit user roles
   │  ├─ Deactivate accounts
   │  └─ View activity logs
   │
   ├─ DOCTOR MANAGEMENT
   │  ├─ View pending approvals
   │  ├─ Verify credentials
   │  ├─ Approve/Reject
   │  └─ Deactivate doctors
   │
   ├─ APPOINTMENT OVERSIGHT
   │  ├─ View all appointments
   │  ├─ Filter by status
   │  ├─ Cancel if needed
   │  └─ Monitor statistics
   │
   ├─ INVOICE MANAGEMENT
   │  ├─ View all invoices
   │  ├─ Track payments
   │  ├─ Send reminders
   │  └─ Monitor overdue
   │
   └─ SYSTEM CONFIGURATION
      ├─ Manage therapies & pricing
      ├─ Configure notifications
      ├─ Email templates
      └─ System parameters


ADMIN CAN ACCESS:
   ✓ All patient data
   ✓ All doctor data
   ✓ All appointments
   ✓ All invoices
   ✓ All documents
   ✓ System settings
   ✓ User activity logs
```

---

## 🔄 Complete Integration Map

```
┌─────────────────────────────────────────────────────────┐
│         HOW EVERYTHING CONNECTS IN FRONTEND            │
└─────────────────────────────────────────────────────────┘

PATIENT SIGNUP
   ↓
1. Fill Form (userService.signup)
   ├─ POST /api/auth/signup
   ├─ Email sent with OTP
   └─ User data stored
   ↓
2. Verify Email (OTP Screen)
   ├─ POST /api/otp/verify
   ├─ JWT token generated
   └─ User marked verified
   ↓
3. Auto-Login to Dashboard
   ├─ AuthContext updated
   ├─ Token stored in localStorage
   └─ Redirect to PatientDashboard
   ↓
4. Patient Can:
   a) Book Appointment
      ├─ Browse doctors (GET /api/users?role=doctor)
      ├─ View their schedules (GET /api/doctor-schedule)
      ├─ Pick available slot (SlotPicker component)
      ├─ POST /api/appointments/book
      ├─ Doctor gets real-time notification (Socket.io)
      ├─ Patient receives confirmation email
      └─ Appointment appears in both dashboards
   
   b) View Doctor Profile
      ├─ See specialization
      ├─ See average rating
      ├─ See patient reviews (GET /api/feedback)
      ├─ View available time slots
      └─ Click to book
   
   c) Track Appointment
      ├─ Real-time status updates (Socket.io)
      ├─ Doctor starts session → Status = "in-progress"
      ├─ Doctor completes → Status = "completed"
      ├─ Patient sees prescription (GET /api/documents)
      ├─ Invoice generated automatically (GET /api/invoices)
      └─ Notification sent via Email + WhatsApp
   
   d) Download Documents
      ├─ View prescriptions
      ├─ View reports
      ├─ Export as PDF (html2pdf.js)
      └─ Share with others


DOCTOR SIGNUP
   ↓
1. Fill Form + Medical ID
   ├─ userService.signup with role=doctor
   ├─ POST /api/auth/signup
   ├─ Email verification (OTP)
   ├─ Account created (pending admin approval)
   └─ Email notification to admin
   ↓
2. Admin Approves Doctor
   ├─ Admin views pending doctors (AdminPanel)
   ├─ Admin clicks approve
   ├─ Doctor status = "active"
   ├─ Email sent to doctor
   └─ Doctor can now login
   ↓
3. Doctor Setup
   ├─ First login → DoctorDashboard
   ├─ Edit profile with specialization
   ├─ Set weekly schedule (ScheduleTab)
   │  └─ PATCH /api/doctor-schedule
   │
   ├─ Block time for holidays (BlockTimeForm)
   │  └─ PATCH /api/blocks
   │
   └─ Now visible to patients
   ↓
4. Patient Books with Doctor
   ├─ Patient finds doctor
   ├─ Views available slots (from doctor-schedule)
   ├─ Books appointment
   ├─ Doctor gets notified (Socket.io event)
   ├─ Doctor can accept/confirm
   └─ Both see real-time status
   ↓
5. Appointment Day
   ├─ Both receive reminders:
   │  ├─ Email notification
   │  ├─ In-app notification
   │  └─ SMS (optional)
   ├─ Doctor logs in
   ├─ Clicks "Start Session"
   ├─ AppointmentsTab shows timer running
   ├─ Takes notes on diagnosis
   ├─ Creates prescription (POST /api/prescriptions)
   ├─ Uploads documents (POST /api/documents)
   ├─ Clicks "Complete"
   ├─ Invoice auto-generated (POST /api/invoices)
   ├─ Patient notified immediately
   └─ Email sent to patient
   ↓
6. Post-Appointment
   ├─ Patient:
   │  ├─ Sees prescription in Documents tab
   │  ├─ Receives care instructions
   │  ├─ Can pay invoice
   │  ├─ Can leave feedback/review
   │  └─ Invoice appears in history
   │
   └─ Doctor:
      ├─ Sees completed appointment
      ├─ Invoice shows in analytics
      ├─ Gets feedback notification
      ├─ Revenue tracked
      └─ Patient count increased


ADMIN OVERSIGHT (Continuous)
   ├─ All appointments monitored
   ├─ All payments tracked
   ├─ All doctors verified
   ├─ System health checked
   ├─ Can intervene if needed
   └─ Reports generated automatically
```

---

## ⚡ Real-Time Event Flow (Socket.io)

```
WHEN DOCTOR ACCEPTS APPOINTMENT:
   1. Doctor clicks "Confirm" in AppointmentsTab
   2. PATCH /api/appointments/:id (status: "confirmed")
   3. Backend processes & sends Socket.io event:
      io.to(`user_${patientId}`).emit('appointment_status_changed', {...})
   4. Patient Dashboard updates INSTANTLY
   5. Patient gets in-app notification
   ✓ No page refresh needed


WHEN APPOINTMENT COMPLETES:
   1. Doctor clicks "Complete Session"
   2. PATCH /api/appointments/:id (status: "completed")
   3. Backend: Creates invoice, sends email
   4. Socket.io emits to patient:
      - appointment_status_changed
      - invoice_created
      - document_uploaded (prescription)
   5. Patient sees all updates in real-time
   6. Notification center updates
   ✓ Multiple events synchronized


DOCTOR ONLINE STATUS:
   1. Doctor logs in → Socket.io join_user_room
   2. Frontend broadcasts doctor is online
   3. Patient sees "Doctor Online" indicator
   4. Patient can message doctor
   5. Doctor logs out → Status changes to offline
   ✓ Real-time presence tracking


NEW NOTIFICATION ARRIVES:
   1. Admin sends announcement
   2. Backend: io.emit('system_notification', {...})
   3. ALL connected clients receive instantly
   4. Toast notification shows
   5. Bell icon updates
   ✓ Everyone sees update simultaneously
```

---

## 📱 Component Communication Map

```
GLOBAL CONTEXT (AuthContext)
        │
        ├─ Provides: user, token, isAuthenticated
        ├─ Functions: login(), logout(), signup(), verifyOTP()
        │
        └─ Used by ALL pages/components
           │
           ├─ PatientDashboard (reads user)
           ├─ DoctorDashboard (reads user + role)
           ├─ AdminPanel (checks isAdmin)
           ├─ ProtectedRoute (guards navigation)
           └─ Header/Navbar (shows user info)


SERVICE LAYER (API Calls)
        │
        ├─ userService.signup() → API call
        ├─ appointmentService.book() → API call
        ├─ feedbackService.submit() → API call
        ├─ invoiceService.getAll() → API call
        └─ Used by component state updates


COMPONENT STATE (useState)
        │
        ├─ PatientDashboard
        │  ├─ appointments (array)
        │  ├─ therapies (array)
        │  ├─ selectedAppt (object)
        │  └─ loading (boolean)
        │
        ├─ DoctorDashboard
        │  ├─ todayAppointments (array)
        │  ├─ patients (array)
        │  ├─ analytics (object)
        │  └─ schedule (object)
        │
        └─ Forms
           ├─ formData (object)
           ├─ errors (array)
           └─ loading (boolean)


PROPS DRILLING
        │
        ├─ Parent → Child (data passing)
        ├─ Child → Parent (callbacks)
        └─ Siblings (via parent state)


SOCKET.IO EVENTS
        │
        ├─ Listened by ALL relevant components
        ├─ Updates state when event arrives
        ├─ Triggers re-renders automatically
        └─ Real-time syncing across clients
```

---

## 🎬 Complete User Action Timeline

```
╔════════════════════════════════════════════════════════════╗
║         PATIENT BOOKS APPOINTMENT (Complete Flow)         ║
╚════════════════════════════════════════════════════════════╝

TIME    ACTION              FRONTEND                BACKEND
────────────────────────────────────────────────────────────
T0      Patient logs in     AuthContext updated     JWT verified
        ↓
T1      Clicks "Book"       → AppointmentsTab      
        ↓                  Shows form               
T2      Selects therapy     Form updated with      GET /api/
                            doctor list            therapies
        ↓
T3      Selects doctor      SlotPicker loads       GET /api/
                            available slots        doctor-
                                                   schedule
        ↓
T4      Picks time slot     Form shows selection   
        ↓
T5      Enters symptoms     Form data filled       
        ↓
T6      Clicks "Confirm"    Loading state shows    POST /api/
                            ✓ Validation pass      appts/book
        ↓                   ↓                      ↓
        │                   │                      Create in DB
        │                   │                      Send Email
        │                   │                      Socket.io:
        │                   │                      emit to doctor
        ↓                   ↓                      ↓
T7      Doctor notified     (another device)       Doctor sees
        (real-time)         Toast appears          notification
        ↓                   ↓
T8      Doctor accepts      (Doctor's device)      PATCH /api/
                            Status updates         appts/:id
                            ↓                      ↓
                            Socket.io event        Update DB
                            arrives                Send Email
        ↓                   ↓                      ↓
T9      Patient sees        Notification           Patient
        confirmation        appears                Dashboard
                            Appt marked            updates
                            "Confirmed"            instantly
                            Email received

════════════════════════════════════════════════════════════
Result: APPOINTMENT CONFIRMED ✓
Both parties see real-time updates with no page refresh
```

---

## 📊 Feature Dependency Diagram

```
LANDING PAGE
    │
    ├─ Login Page
    │  └─ AuthContext.login()
    │     └─ POST /api/auth/login
    │        └─ JWT Token
    │           └─ Dashboard (role-based)
    │
    └─ Signup Page
       ├─ Patient/Doctor Signup Form
       ├─ AuthContext.signup()
       ├─ POST /api/auth/signup
       ├─ OTP Email Sent
       ├─ OtpVerificationScreen
       ├─ AuthContext.verifyOTP()
       ├─ POST /api/otp/verify
       ├─ JWT Token Generated
       └─ Auto-redirect to Dashboard


PATIENT DASHBOARD
    │
    ├─ Appointments Tab
    │  ├─ appointmentService.getAll() → GET /api/appts
    │  ├─ SlotPicker Component
    │  ├─ appointmentService.book() → POST /api/appts/book
    │  ├─ Socket.io: listen 'appointment_status_changed'
    │  └─ Real-time appointment updates
    │
    ├─ Therapies Tab
    │  ├─ therapyService.getAll() → GET /api/therapies
    │  ├─ trackingService.getProgress() → GET /api/tracking
    │  └─ Recharts: display progress
    │
    ├─ Documents Tab
    │  ├─ userService.getDocuments() → GET /api/documents
    │  ├─ html2pdf: generate PDF
    │  └─ Download/Share functionality
    │
    └─ Notification Center
       ├─ Socket.io: listen 'new_notification'
       ├─ GET /api/notifications
       └─ Real-time message updates


DOCTOR DASHBOARD
    │
    ├─ Appointments Tab
    │  ├─ appointmentService.getMyAppointments() → GET /api/appts?doctorId=X
    │  ├─ Timer component (during session)
    │  ├─ appointmentService.complete() → PATCH /api/appts/:id
    │  ├─ prescriptionService.create() → POST /api/prescriptions
    │  └─ invoiceService.generate() → auto POST /api/invoices
    │
    ├─ Schedule Tab
    │  ├─ doctorScheduleService.get() → GET /api/doctor-schedule
    │  ├─ doctorScheduleService.update() → PATCH /api/doctor-schedule
    │  ├─ blockService.add() → PATCH /api/blocks
    │  └─ Calendar component renders availability
    │
    ├─ Analytics Tab
    │  ├─ analyticsService.getMetrics() → GET /api/analytics/doctor
    │  └─ Recharts: patient growth, revenue, feedback
    │
    └─ Real-time
       ├─ Socket.io: listen 'new_appointment_booking'
       ├─ Socket.io: listen 'patient_message'
       └─ In-app notifications


ADMIN PANEL
    │
    ├─ User Management
    │  ├─ userService.getAllUsers() → GET /api/users
    │  └─ Can modify user roles/status
    │
    ├─ Doctor Verification
    │  ├─ userService.getPendingDoctors() → GET /api/users?pending=true
    │  └─ userService.approveDoctor() → PATCH /api/users/:id
    │
    ├─ Appointment Oversight
    │  ├─ appointmentService.getAll() → GET /api/appointments
    │  └─ Can view all appointments across system
    │
    └─ Invoice Tracking
       ├─ invoiceService.getAll() → GET /api/invoices
       └─ Can manage payments/reminders
```

---

## ✅ Complete Integration Verified

✓ **Patient Signup** → Email Verification → Auto-Login → Patient Dashboard  
✓ **Doctor Signup** → Email Verification → Admin Approval → Doctor Dashboard  
✓ **Patient Books** → Real-time notification to Doctor → Doctor Confirms → Both updated  
✓ **Doctor Creates Prescription** → Socket.io event → Patient receives email + in-app  
✓ **Invoice Generated** → Both dashboards show real-time → Payment tracking  
✓ **Admin Oversees** → All users, all appointments, all invoices visible  
✓ **Real-time Updates** → Socket.io synchronizes all clients instantly  
✓ **Authentication** → JWT tokens secure all API calls  
✓ **Email Notifications** → Every major action triggers email  
✓ **Multi-channel** → Email, SMS, WhatsApp, In-app notifications  

---

**Document Created:** April 28, 2026  
**Version:** 1.0  
**Status:** ✅ Complete Professional Flowchart  

See also: `COMPLETE_FRONTEND_FLOWCHART.md` for detailed ASCII diagrams
