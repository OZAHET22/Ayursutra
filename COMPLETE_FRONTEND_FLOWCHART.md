# 🏥 Ayursutra - Complete Frontend Flow Chart & System Architecture

**Professional Senior Developer Documentation**

*Date: April 28, 2026 | Version: 1.0*

---

## 📊 Complete System Flow Chart

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          AYURSUTRA PLATFORM ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │   ENTRY POINT    │
                              │   Landing Page   │
                              └────────┬─────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
            ┌─────────────┐    ┌─────────────┐   ┌──────────────┐
            │   PATIENT   │    │   DOCTOR    │   │    ADMIN     │
            │   SIGNUP    │    │   SIGNUP    │   │    LOGIN     │
            └──────┬──────┘    └──────┬──────┘   └──────┬───────┘
                   │                  │                 │
                   ▼                  ▼                 ▼
        ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐
        │ Email Verified   │ │ Email Verified   │ │ Credentials  │
        │ + OTP Confirm    │ │ + OTP Confirm    │ │   Verified   │
        └────────┬─────────┘ └────────┬─────────┘ └──────┬───────┘
                 │                    │                  │
                 └────────────────────┼──────────────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │   JWT GENERATED     │
                            │   Token Stored in   │
                            │   localStorage      │
                            └──────────┬──────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                │                      │                      │
                ▼                      ▼                      ▼
        ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐
        │ PATIENT HOME     │  │  DOCTOR HOME     │  │  ADMIN PANEL   │
        │ DASHBOARD        │  │  DASHBOARD       │  │                │
        └────────┬─────────┘  └────────┬─────────┘  └────────┬───────┘
                 │                      │                     │
    ┌────────────┼────────────┐         │          ┌──────────┼──────────┐
    │            │            │         │          │          │          │
    ▼            ▼            ▼         ▼          ▼          ▼          ▼
┌─────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────┐ ┌────────┐
│Therapies│ │Appt    │ │Documents │ │Appts   │ │Doctor  │ │User  │ │System  │
│Tracking │ │Booking │ │/Reports  │ │Manage  │ │Profile │ │Mgmt  │ │Config  │
└─────────┘ └────────┘ └──────────┘ └────────┘ └────────┘ └──────┘ └────────┘
    │            │            │         │          │          │          │
    └────────────┼────────────┘         │          └──────────┼──────────┘
                 │                      │                     │
                 └──────────────────────┼─────────────────────┘
                                        │
                                        ▼
                        ┌──────────────────────────┐
                        │   API REQUESTS (Axios)   │
                        │   + Socket.io Events     │
                        └────────────┬─────────────┘
                                     │
                                     ▼
                        ┌──────────────────────────┐
                        │    BACKEND (Express)     │
                        │  + MongoDB Database      │
                        │  + Real-time Updates     │
                        └──────────────────────────┘
```

---

## 🔐 Authentication & Signup Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW CHART                             │
└──────────────────────────────────────────────────────────────────────────┘

START
  │
  ▼
┌─────────────────────────────────────┐
│   User Visits Landing Page          │
│   (Landing Page Component)          │
│   - Three Options Available:        │
│     • Login (Existing User)         │
│     • Patient Signup                │
│     • Doctor Signup                 │
│     • Admin Login                   │
└─────────────┬───────────────────────┘
              │
    ┌─────────┼─────────┬─────────┐
    │         │         │         │
    ▼         ▼         ▼         ▼
  PATIENT  DOCTOR    ADMIN     LOGIN
  SIGNUP   SIGNUP    LOGIN      PAGE
    │         │         │         │
    └─────────┴─────────┴─────────┘
              │
              ▼
    ┌──────────────────────────────┐
    │  Signup Form Component       │
    │  ─────────────────────────   │
    │  • Name                      │
    │  • Email                     │
    │  • Phone                     │
    │  • Password                  │
    │  • Role Selection            │
    │  • Medical ID (Doctor only)  │
    │  • Specialization (Doctor)   │
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │  Frontend Validation         │
    │  (SignupPage Component)      │
    │  ✓ Email format check        │
    │  ✓ Password strength check   │
    │  ✓ Phone format check        │
    │  ✓ Required fields check     │
    └──────────────┬───────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
    Valid ▼             Invalid ▼
      │                  │
      │            Show Error
      │            Message
      │                  │
      │                  └───┐
      │                      │
      ▼                      │
┌──────────────────────────┐ │
│ Send Signup Request      │ │
│ POST /api/auth/signup    │ │
│ (userService.signup)     │ │
└────────────┬─────────────┘ │
             │                │
        ▼         ▼           │
    ┌────────────────────┐    │
    │  Backend Validates │    │
    │  ✓ Duplicate check │    │
    │  ✓ Email validator │    │
    │  ✓ Phone validator │    │
    │  ✓ Hash password   │    │
    │  ✓ Create user DB  │    │
    └────────┬───────────┘    │
             │                │
        ┌────┴────┐           │
        │          │          │
    Success ▼   Fail ▼        │
        │        │            │
        │        └────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  Send OTP to Email              │
│  (sendOTPEmail utility)         │
│  ✓ Generate 6-digit OTP         │
│  ✓ Store in DB (OTP model)      │
│  ✓ Send via Nodemailer (SMTP)   │
│  ✓ Set 10-min expiry            │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  OTP Verification Screen        │
│  (OtpVerificationScreen Comp)   │
│  ─────────────────────────────  │
│  • Show Email                   │
│  • Input 6-digit OTP            │
│  • Resend OTP Button (if expired)
│  • Verify Button                │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────┐
        │             │
    Valid ▼        Invalid ▼
        │               │
        │         Show Error
        │         "Invalid OTP"
        │               │
        │               └────┐
        │                    │
        ▼                    │
┌──────────────────────────┐│
│ POST /api/otp/verify    ││
│ (Verify OTP in Backend) ││
└────────────┬─────────────┘
             │
        ┌────┴────┐
        │          │
    Success ▼   Fail ▼
        │        │
        │        └────────┐
        │                 │
        ▼                 │
┌──────────────────────────────┐│
│ Update User in DB            ││
│ • Set isEmailVerified: true  ││
│ • Delete OTP record          ││
│ • Create JWT Token           ││
└────────────┬─────────────────┘
             │
        ▼    │
┌──────────────────────────┐  │
│ Store JWT in localStorage│  │
│ • token                  │  │
│ • refreshToken           │  │
│ • expiresIn              │  │
└────────────┬─────────────┘  │
             │                │
             └────────────────┘
                     │
                     ▼
         ┌─────────────────────────┐
         │ AuthContext Updated     │
         │ • user = userData       │
         │ • isAuthenticated = true│
         │ • redirectTo = Role-    │
         │   specific Dashboard    │
         └────────────┬────────────┘
                      │
                      ▼
         ┌─────────────────────────┐
         │ Navigate to Dashboard   │
         │ • Patient → Patient     │
         │   Dashboard             │
         │ • Doctor → Doctor       │
         │   Dashboard             │
         │ • Admin → Admin Panel   │
         └────────────┬────────────┘
                      │
                      ▼
                   SUCCESS ✓
                   User Logged In
```

---

## 👥 Patient Dashboard Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                   PATIENT DASHBOARD FLOW                            │
└──────────────────────────────────────────────────────────────────────┘

              ┌─────────────────────────────────┐
              │  PATIENT HOME PAGE              │
              │  (PatientDashboard Component)   │
              └──────────────┬──────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  APPOINTMENTS │  │  THERAPIES  │  │  DOCUMENTS  │
    │  TAB         │  │  TAB        │  │  TAB        │
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
           │                 │                 │
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │ Book         │   │ View        │   │ Download    │
    │ Appointment  │   │ Therapies   │   │ Prescriptions
    │              │   │ Progress    │   │ & Reports   │
    │ View         │   │             │   │             │
    │ Bookings     │   │ Track       │   │ View        │
    │              │   │ Sessions    │   │ Documents   │
    │ Cancel/      │   │             │   │             │
    │ Reschedule   │   │ Get Diet    │   │ Export PDF  │
    │              │   │ Plans       │   │             │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                             ▼
    ┌────────────────────────────────────┐
    │ Notification Center                │
    │ (Real-time Socket.io Updates)      │
    │ ✓ Appointment reminders            │
    │ ✓ Doctor messages                  │
    │ ✓ Booking confirmations            │
    │ ✓ System alerts                    │
    └────────────────────────────────────┘


    ┌─────────────────────────────────────────────────────────┐
    │              APPOINTMENTS TAB FLOW                      │
    └─────────────────────────────────────────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  View All Bookings   │
                │  (Upcoming/Past)     │
                └──────────┬───────────┘
                           │
         ┌─────────────────┼──────────────────┐
         │                 │                  │
         ▼                 ▼                  ▼
    ┌──────────┐   ┌──────────────┐   ┌──────────────┐
    │   BOOK   │   │    VIEW      │   │   MANAGE     │
    │   NEW    │   │   DETAILS    │   │  BOOKING     │
    │   APPT   │   │              │   │              │
    └────┬─────┘   └──────┬───────┘   └────────┬─────┘
         │                │                    │
         ▼                │                    │
    Select Therapy        │          ┌─────────┴─────┐
         │                │          │               │
         ▼                │     Reschedule       Cancel
    Select Doctor         │          │               │
         │                │          ▼               ▼
         ▼                │     Select New      Confirm
    View Doctor           │     Date/Time       Cancellation
    Profile               │          │               │
         │                │          ▼               ▼
         ▼                │     GET /api/appts    DELETE
    View Availability    │     PATCH /api/appts /api/appts
    Slots                │          │               │
         │                │          ▼               ▼
         ▼                │     Update DB        Update DB
    SlotPicker           │          │               │
    Component            │          ▼               ▼
         │                │     Show Success   Show Success
         ▼                │          │               │
    Select Slot          │          └───────┬───────┘
         │                │                  │
         ▼                │                  ▼
    Enter Symptoms       │         Navigate Back
    & Notes              │         to Appointments
         │                │                  │
         ▼                └──────────────────┘
    POST /api/appts/book
    (appointmentService)
         │
         ▼
    ┌──────────────────────┐
    │ Appointment Created  │
    │ in DB                │
    │ ✓ Confirmation email │
    │ ✓ Socket.io emit     │
    │ ✓ Add to calendar    │
    └──────────┬───────────┘
               │
               ▼
        Show Success &
        Booking Details


    ┌──────────────────────────────────────────────────────────┐
    │              THERAPIES TAB FLOW                          │
    └──────────────────────────────────────────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  Load Therapies      │
                │  GET /api/therapies  │
                │  (therapyService)    │
                └──────────┬───────────┘
                           │
                           ▼
        ┌────────────────────────────────┐
        │ Display Therapy List with:     │
        │ • Name, Description            │
        │ • Duration, Cost               │
        │ • Benefits                     │
        │ • Doctor Recommendations       │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Click Therapy Card to:     │
        │ • View Details             │
        │ • See Sessions Progress    │
        │ • View Next Scheduled Date │
        │ • Get Care Instructions    │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Load Therapy Tracking      │
        │ GET /api/tracking/therapy  │
        │ Show Progress Graph        │
        └────────────────────────────┘


    ┌──────────────────────────────────────────────────────────┐
    │              DOCUMENTS TAB FLOW                          │
    └──────────────────────────────────────────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  Load Documents      │
                │  GET /api/documents  │
                │  (userService)       │
                └──────────┬───────────┘
                           │
                           ▼
        ┌────────────────────────────────┐
        │ Display Document Categories:   │
        │ • Prescriptions                │
        │ • Medical Reports              │
        │ • Lab Results                  │
        │ • Discharge Summaries          │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ For Each Document:             │
        │ • Display Filename             │
        │ • Upload Date                  │
        │ • Doctor Name                  │
        └────────────┬───────────────────┘
                     │
           ┌─────────┴──────────┐
           │                    │
           ▼                    ▼
        DOWNLOAD            SHARE
        (Generate PDF)      (Send to
        html2pdf.js         Email/
                            WhatsApp)
           │                 │
           ▼                 ▼
        Save to PC        Recipient
                          Receives Link
```

---

## 👨‍⚕️ Doctor Dashboard Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                   DOCTOR DASHBOARD FLOW                             │
└──────────────────────────────────────────────────────────────────────┘

              ┌─────────────────────────────────┐
              │  DOCTOR HOME PAGE               │
              │  (DoctorDashboard Component)    │
              └──────────────┬──────────────────┘
                             │
         ┌───────────────────┼────────────────────┬──────────┐
         │                   │                    │          │
         ▼                   ▼                    ▼          ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐
    │ APPOINTMENTS│  │  PATIENTS   │  │ ANALYTICS   │  │SCHEDULE  │
    │ TAB         │  │  TAB        │  │ TAB         │  │ TAB      │
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬─────┘
           │                 │                 │             │
           │                 │                 │             │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──┐
    │ View Today's │   │ View All    │   │ Patient     │   │ Set     │
    │ Appointments│   │ Patients    │   │ Statistics  │   │ Weekly  │
    │              │   │             │   │             │   │ Hours   │
    │ Start        │   │ View Patient│   │ Revenue     │   │         │
    │ Session      │   │ History     │   │ Analytics   │   │ Block   │
    │              │   │             │   │             │   │ Time    │
    │ Complete     │   │ Send        │   │ Feedback    │   │         │
    │ Appointment  │   │ Prescriptions
    │              │   │             │   │ Reports     │   │ View    │
    │ Add Notes    │   │ Upload      │   │             │   │ Blocked │
    │ & Diagnosis  │   │ Documents   │   │ Export Data │   │ Dates   │
    │              │   │             │   │             │   │         │
    │ Mark         │   │ View        │   │ Filter by   │   │ Mark    │
    │ Completed    │   │ Feedback    │   │ Date Range  │   │ Holiday │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └────┬────┘
           │                 │                 │             │
           └─────────────────┼─────────────────┼─────────────┘
                             │
                             ▼
    ┌────────────────────────────────────┐
    │ Real-time Notifications            │
    │ (Socket.io Events)                 │
    │ ✓ New booking alerts               │
    │ ✓ Patient messages                 │
    │ ✓ Document uploads                 │
    │ ✓ Feedback received                │
    └────────────────────────────────────┘


    ┌────────────────────────────────────────────────────────┐
    │         APPOINTMENTS TAB FLOW (Doctor View)           │
    └────────────────────────────────────────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │ GET /api/appointments/doctor   │
          │ Load Today's Appointments      │
          │ (Filter by doctorId)           │
          └────────────┬───────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │ Display Appointment List       │
          │ • Time, Patient Name           │
          │ • Therapy Type                 │
          │ • Appointment Status           │
          │ • Notes from Patient           │
          └────────────┬───────────────────┘
                       │
          ┌────────────┴──────────────────┐
          │                               │
          ▼                               ▼
    ┌────────────┐              ┌─────────────────┐
    │ START      │              │ COMPLETE APPT   │
    │ SESSION    │              │                 │
    │            │              │ • Add Diagnosis │
    │ PATCH      │              │ • Add Notes     │
    │ /api/appts │              │ • Prescribe     │
    │ (status:   │              │   Therapy       │
    │ "in-       │              │ • Upload Docs   │
    │ progress") │              │ • Generate      │
    │            │              │   Invoice       │
    │ Show Timer │              │                 │
    │ & patient  │              │ PATCH /api/appts
    │ vitals     │              │ (status:        │
    │            │              │ "completed")    │
    └────────────┘              │                 │
          │                     │ Send            │
          │                     │ Confirmation    │
          │                     │ Email           │
          │                     └────────┬────────┘
          │                             │
          └─────────────┬───────────────┘
                        │
                        ▼
              Appointment Updated
              Invoice Created
              Notification Sent


    ┌────────────────────────────────────────────────────────┐
    │         PATIENTS TAB FLOW (Doctor View)               │
    └────────────────────────────────────────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │ GET /api/users?role=patient    │
          │ Load All Patients              │
          │ (doctorSchedule filter)        │
          └────────────┬───────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │ Patient Cards Display:         │
          │ • Name, Age, Phone             │
          │ • Total Appointments           │
          │ • Last Visit Date              │
          │ • Active Therapies             │
          └────────────┬───────────────────┘
                       │
             ┌─────────┴──────────┐
             │                    │
             ▼                    ▼
        Click Patient        Send Prescription
             │                    │
             ▼                    ▼
    View Full Profile     Show Form:
    • Medical History     • Therapy Name
    • All Appointments    • Duration
    • Feedback Score      • Cost
    • Documents           • Instructions
             │                    │
             ▼                    ▼
    Send Message       POST /api/
    (Socket.io)        prescriptions
             │                    │
             └────────┬───────────┘
                      │
                      ▼
          Patient Receives Update


    ┌────────────────────────────────────────────────────────┐
    │         ANALYTICS TAB FLOW (Doctor View)              │
    └────────────────────────────────────────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │ GET /api/analytics/doctor      │
          │ Load Analytics Data            │
          │ (doctorId, date range filter)  │
          └────────────┬───────────────────┘
                       │
      ┌────────────────┼────────────────┬─────────────┐
      │                │                │             │
      ▼                ▼                ▼             ▼
   PATIENTS        REVENUE          FEEDBACK      SESSIONS
   STATISTICS      ANALYTICS        SCORES        COMPLETION
      │                │                │             │
      ├─ Total        ├─ Total earned   ├─ Avg score │
      │  Patients     │  Revenue         │ 4.8/5      │
      ├─ New this    │                  │            │
      │  Month       ├─ Invoices        ├─ Top       │
      ├─ Returning   │  Generated       │  Feedback  │
      │  Patients    │                  │            │
      └─ Avg Age     ├─ Pending         └─ Detailed  │
                     │  Payments            Comments │
                     │                            
                     └─ Avg Amount             
                        per Session            

      Charts (Recharts):
      • Patient Growth (Line Chart)
      • Revenue Trend (Area Chart)
      • Therapy Distribution (Pie Chart)
      • Monthly Comparison (Bar Chart)


    ┌────────────────────────────────────────────────────────┐
    │         SCHEDULE TAB FLOW (Doctor View)               │
    └────────────────────────────────────────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │ Get Doctor Schedule            │
          │ GET /api/doctor-schedule       │
          │ (Current Week + Next 4 weeks)  │
          └────────────┬───────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │ Display Weekly Calendar        │
          │ Monday - Friday: 9am - 6pm     │
          │ Saturday: 9am - 1pm            │
          │ Sunday: Closed                 │
          └────────────┬───────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
         ▼                            ▼
    EDIT SCHEDULE            SET AVAILABILITY
         │                            │
         ▼                            ▼
    Change Working       • Mark busy slots
    Hours                • Set break times
    • Start Time         • Block dates
    • End Time             (holiday, leave)
    • Days               • Recurring blocks
         │                    │
         ▼                    ▼
    PATCH /api/          PATCH /api/
    doctor-schedule      blocks/add
         │                    │
         └────────┬───────────┘
                  │
                  ▼
          Schedule Updated
```

---

## 🛡️ Admin Panel Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                   ADMIN PANEL FLOW                                  │
└──────────────────────────────────────────────────────────────────────┘

              ┌─────────────────────────────────┐
              │  ADMIN LOGIN PAGE               │
              │  (AdminLoginPage Component)     │
              └──────────────┬──────────────────┘
                             │
                             ▼
              ┌─────────────────────────────────┐
              │  Verify Admin Credentials       │
              │  POST /api/auth/admin-login     │
              │  • Email                        │
              │  • Password                     │
              └──────────────┬──────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                Success ▼         Fail ▼
                    │               │
                    │         Show Error
                    │               │
                    │               └─────┐
                    │                     │
                    ▼                     │
          ┌──────────────────┐           │
          │ Generate JWT     │           │
          │ Store Token      │           │
          │ Redirect to      │           │
          │ Admin Panel      │           │
          └──────────┬───────┘           │
                     │                   │
                     └───────────────────┘
                             │
                             ▼
        ┌─────────────────────────────────────┐
        │      ADMIN PANEL HOME               │
        │      (AdminPanel Component)         │
        └───┬────────────────────────────┬────┘
            │                            │
            ▼                            ▼
        Sidebar Menu              Main Content Area
            │                            │
    ┌───────┼───────┬───────────┐       │
    │       │       │           │       │
    ▼       ▼       ▼           ▼       ▼
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│User│ │Doc │ │Appt│ │Inv │ │Sys │
│Mgmt│ │ Mgmt│ │Mgmt│ │Mgmt│ │Cfg │
└──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘
   │      │      │      │      │
   │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼
┌──────────────────────────────────────────┐
│     SELECTED TAB CONTENT LOADS            │
│     (Dynamic component rendering)        │
└──────────────────────────────────────────┘


    ┌──────────────────────────────────────────────────────┐
    │         USER MANAGEMENT TAB (Admin View)            │
    └──────────────────────────────────────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │ GET /api/users/all-users       │
          │ Load All Users in System       │
          │ (Pagination: 10 per page)      │
          └────────────┬───────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │ Display User Table:            │
          │ • ID, Name, Email, Phone       │
          │ • Role (Patient/Doctor/Admin)  │
          │ • Status (Active/Inactive)     │
          │ • Join Date                    │
          │ • Actions (Edit, Deactivate)   │
          └────────────┬───────────────────┘
                       │
         ┌─────────────┼──────────────┐
         │             │              │
         ▼             ▼              ▼
    SEARCH        FILTER         ACTION
    By Name/    By Role/        Edit/
    Email       Status          Delete/
         │             │        Deactivate
         └─────────────┼──────────────┘
                       │
                       ▼
         On Action Click:
         • View User Details
         • Edit User Info
         • Change Role
         • Deactivate Account
         • Delete User
         • Send Message


    ┌──────────────────────────────────────────────────────┐
    │         DOCTOR MANAGEMENT TAB (Admin)               │
    └──────────────────────────────────────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │ GET /api/users?role=doctor     │
          │ Load All Doctors               │
          └────────────┬───────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │ Display Doctor Cards:          │
          │ • Name, Medical ID             │
          │ • Specialization               │
          │ • Total Patients               │
          │ • Avg Rating                   │
          │ • Status (Active/Inactive)     │
          └────────────┬───────────────────┘
                       │
         ┌─────────────┼──────────────┐
         │             │              │
         ▼             ▼              ▼
    VIEW PROFILE  APPROVE NEW    DEACTIVATE
    • Bio         DOCTORS        • Reason
    • Services    • Verify       • Send email
    • Schedule    • Approve      • Mark inactive
    • Patients    • Reject
         │             │              │
         └─────────────┼──────────────┘
                       │
                       ▼
         Update Doctor Status
         PATCH /api/users/:id


    ┌──────────────────────────────────────────────────────┐
    │      APPOINTMENT MANAGEMENT TAB (Admin)             │
    └──────────────────────────────────────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │ GET /api/appointments          │
          │ Load All Appointments          │
          │ (Advanced Filters Available)   │
          └────────────┬───────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │ Display Appointment Table:     │
          │ • ID, Patient, Doctor          │
          │ • Date, Time, Type             │
          │ • Status                       │
          │ • Duration, Cost               │
          │ • Actions (View, Edit, Cancel) │
          └────────────┬───────────────────┘
                       │
      ┌────────────────┼──────────────────┐
      │                │                  │
      ▼                ▼                  ▼
   FILTER           VIEW              MANAGE
   By Date        Details            • Reschedule
   By Status      • Full info        • Cancel
   By Type        • Notes            • Modify status
      │            • Feedback        • Refund
      │                               │
      └────────────────┬──────────────┘
                       │
                       ▼
         Show Cancelled/Completed/
         Upcoming Count Stats


    ┌──────────────────────────────────────────────────────┐
    │      INVOICE MANAGEMENT TAB (Admin)                 │
    └──────────────────────────────────────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │ GET /api/invoices              │
          │ Load All Invoices              │
          │ (Filter: Status, Date Range)   │
          └────────────┬───────────────────┘
                       │
                       ▼
          ┌────────────────────────────────┐
          │ Display Invoice Table:         │
          │ • Invoice #, Amount            │
          │ • Doctor, Patient              │
          │ • Date, Due Date               │
          │ • Status (Sent/Paid/Overdue)   │
          │ • Actions                      │
          └────────────┬───────────────────┘
                       │
      ┌────────────────┼──────────────────┐
      │                │                  │
      ▼                ▼                  ▼
   VIEW              SEND              MARK
   Details           Reminder          PAID
   • Breakdown       • Resend PDF      • Update
   • Payment         • SMS             • Record
     history         • WhatsApp          payment
   • Print                                │
      │                │                  │
      └────────────────┼──────────────────┘
                       │
                       ▼
         Update Invoice Record
         PATCH /api/invoices/:id


    ┌──────────────────────────────────────────────────────┐
    │      SYSTEM CONFIGURATION TAB (Admin)               │
    └──────────────────────────────────────────────────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │ System Settings                │
          │ • Email Configuration          │
          │ • SMS Settings                 │
          │ • WhatsApp Integration         │
          │ • Therapies/Pricing            │
          │ • System Parameters            │
          └────────────┬───────────────────┘
                       │
      ┌────────────────┼──────────────────┐
      │                │                  │
      ▼                ▼                  ▼
   THERAPY         PRICING           NOTIFICATIONS
   MANAGEMENT      SETTINGS          SETTINGS
   • Add           • Cost per         • Email
   • Edit            therapy          • SMS
   • Delete        • Duration         • WhatsApp
      │            • Modify           • In-app
      │                │              │
      └────────────────┼──────────────┘
                       │
                       ▼
         POST/PATCH Settings
```

---

## 🔗 Complete Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                    COMPLETE DATA FLOW ARCHITECTURE                  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│       FRONTEND LAYER (React)     │
│                                  │
│  ┌─ AuthContext (Global State)  │
│  │  • user                       │
│  │  • token                      │
│  │  • isAuthenticated            │
│  │                               │
│  ├─ Pages (Views)                │
│  │  • LoginPage                  │
│  │  • SignupPage                 │
│  │  • PatientDashboard           │
│  │  • DoctorDashboard            │
│  │  • AdminPanel                 │
│  │                               │
│  ├─ Components (UI)              │
│  │  • OtpVerificationScreen      │
│  │  • SlotPicker                 │
│  │  • AppointmentCard            │
│  │  • AnalyticsChart             │
│  │                               │
│  └─ Services (API Layer)         │
│     • userService                │
│     • appointmentService         │
│     • therapyService             │
│     • invoiceService             │
│     • feedbackService            │
└────────────────┬─────────────────┘
                 │
                 │ HTTP Requests (Axios)
                 │ WebSocket (Socket.io)
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│              API LAYER (Express Middleware)                      │
│                                                                  │
│  Request Flow:                                                  │
│  1. Incoming Request                                            │
│  2. CORS Middleware (origin check)                              │
│  3. Auth Middleware (JWT verification)                          │
│  4. Route Handler                                               │
│  5. Response                                                    │
└────────────┬───────────────────────────────────────────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌────────────────────────────────────────────────────────────────┐
│              ROUTE HANDLERS (17 Route Groups)                  │
│                                                                │
│  • /api/auth          → Authentication logic                  │
│  • /api/users         → User management                       │
│  • /api/appointments  → Booking & scheduling                  │
│  • /api/therapies     → Therapy info                          │
│  • /api/invoices      → Billing                               │
│  • /api/notifications → Messages                              │
│  • /api/documents     → Files & reports                       │
│  • /api/feedback      → Reviews                               │
│  ... (10 more routes)                                         │
└────────────┬───────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────┐
│              SERVICES & UTILITIES                              │
│                                                                │
│  • notificationService → Email/SMS/WhatsApp dispatch          │
│  • emailValidator      → Domain & format check                │
│  • phoneValidator      → Phone number validation              │
│  • firebaseAdmin       → Custom token generation              │
│  • sendOTPEmail        → OTP delivery                          │
│  • notifyPatient       → Real-time alerts                      │
└────────────┬───────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (Mongoose Models)                  │
│                                                                │
│  ┌─ User Schema                                               │
│  │  • _id, email, password, phone, role, profile              │
│  │                                                             │
│  ├─ Appointment Schema                                        │
│  │  • patientId, doctorId, type, date, status                │
│  │  • duration, cost, notes, diagnosis                        │
│  │                                                             │
│  ├─ Invoice Schema                                            │
│  │  • invoiceNumber, doctorId, patientId                      │
│  │  • amount, dueDate, status, items                          │
│  │                                                             │
│  ├─ Notification Schema                                       │
│  │  • userId, type, title, message, read                      │
│  │                                                             │
│  ├─ Therapy Schema                                            │
│  │  • name, description, cost, duration, benefits            │
│  │                                                             │
│  ├─ OTP Schema                                                │
│  │  • email/phone, code, expiresAt, used                      │
│  │                                                             │
│  ├─ DoctorSchedule Schema                                     │
│  │  • doctorId, weekdays, startTime, endTime                 │
│  │                                                             │
│  ├─ DoctorBlock Schema                                        │
│  │  • doctorId, startDate, endDate, reason                   │
│  │                                                             │
│  └─ Document/Feedback/Invoice etc.                            │
└────────────┬───────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────┐
│              MONGODB DATABASE (Cloud)                          │
│                                                                │
│  ┌─────────────────────────────────────────┐                 │
│  │  ayursutra_db                           │                 │
│  │  ├─ users (collection)                  │                 │
│  │  ├─ appointments                        │                 │
│  │  ├─ invoices                            │                 │
│  │  ├─ notifications                       │                 │
│  │  ├─ therapies                           │                 │
│  │  ├─ otps                                │                 │
│  │  ├─ doctorschedules                     │                 │
│  │  ├─ doctorblocks                        │                 │
│  │  ├─ documents                           │                 │
│  │  ├─ feedback                            │                 │
│  │  └─ ... (8+ more collections)           │                 │
│  └─────────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────┘

Bidirectional Communication (Real-time):
┌──────────────────────────────────────────────────────────────┐
│                   SOCKET.IO EVENTS                           │
│                                                              │
│  Client → Server:                                           │
│  • join_user_room (userId)                                  │
│  • disconnect                                               │
│                                                              │
│  Server → Client:                                           │
│  • appointment_status_changed                               │
│  • new_notification                                         │
│  • invoice_updated                                          │
│  • message_received                                         │
│  • booking_confirmed                                        │
│  • doctor_online_status                                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 State Management Flow (AuthContext)

```
┌──────────────────────────────────────────────────────────────┐
│              AUTH CONTEXT STATE MANAGEMENT                   │
└──────────────────────────────────────────────────────────────┘

         ┌─────────────────────────────────┐
         │   AuthContext.js (Provider)     │
         └──────────────┬──────────────────┘
                        │
                        ▼
         ┌─────────────────────────────────┐
         │   Global State Variables        │
         │ ─────────────────────────────   │
         │ • user: null | userData         │
         │ • token: null | jwtToken        │
         │ • loading: boolean              │
         │ • isAuthenticated: boolean      │
         │ • userRole: 'patient' |         │
         │   'doctor' | 'admin' | null     │
         └──────────────┬──────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
    ┌─────────────┐            ┌──────────────┐
    │  ACTION     │            │  EFFECT      │
    │  HANDLERS   │            │  HOOK        │
    └─────────────┘            └──────────────┘
         │                             │
         ├─ login()                    ├─ useEffect:
         │  • Validate creds            │ Get localStorage token
         │  • POST /api/auth/login      │ on mount
         │  • Store JWT                 │ • Refresh if expired
         │  • Update context            │ • Set auth status
         │                              │
         ├─ signup()                    ├─ useEffect:
         │  • Validate input             │ Listen to auth
         │  • POST /api/auth/signup      │ changes
         │  • Send OTP                  │ • Update UI
         │  • Await verification        │ • Redirect as needed
         │                              │
         ├─ verifyOTP()                 │
         │  • POST /api/otp/verify      │
         │  • Get JWT on success        │
         │  • Complete signup           │
         │                              │
         ├─ logout()                    │
         │  • Clear localStorage        │
         │  • Reset context             │
         │  • Redirect to login         │
         │                              │
         └─ refreshToken()              │
            • POST /api/auth/refresh    │
            • Update JWT               │
            • Extend session           │
                        │
                        ▼
         ┌─────────────────────────────┐
         │ ALL PAGES/COMPONENTS         │
         │ CONSUME CONTEXT              │
         │ useContext(AuthContext)      │
         │                             │
         │ Access:                     │
         │ • user                      │
         │ • isAuthenticated           │
         │ • login()                   │
         │ • logout()                  │
         │ • signup()                  │
         └─────────────────────────────┘
```

---

## 📱 Component Hierarchy

```
┌──────────────────────────────────────────────────────────────┐
│                   REACT COMPONENT TREE                       │
└──────────────────────────────────────────────────────────────┘

App.jsx (Root)
│
├─ AuthContext Provider
│  │
│  ├─ LoginPage
│  │
│  ├─ SignupPage
│  │  ├─ OtpVerificationScreen
│  │  └─ PatientSignup / DoctorSignup
│  │
│  ├─ AdminLoginPage
│  │
│  └─ ProtectedRoute Wrapper
│     │
│     ├─ PatientDashboard
│     │  ├─ AppointmentsTab
│     │  │  ├─ BookingForm
│     │  │  ├─ SlotPicker
│     │  │  ├─ AppointmentList
│     │  │  └─ AppointmentCard
│     │  │
│     │  ├─ TherapiesTab
│     │  │  ├─ TherapyList
│     │  │  ├─ TherapyCard
│     │  │  └─ ProgressChart
│     │  │
│     │  ├─ DocumentsTab
│     │  │  ├─ DocumentUpload
│     │  │  └─ DocumentList
│     │  │
│     │  └─ NotificationCenter
│     │     └─ NotificationList
│     │
│     ├─ DoctorDashboard
│     │  ├─ AppointmentsTab
│     │  │  ├─ TodaySchedule
│     │  │  ├─ SessionTimer
│     │  │  └─ DiagnosisForm
│     │  │
│     │  ├─ PatientsTab
│     │  │  ├─ PatientList
│     │  │  ├─ PatientCard
│     │  │  ├─ PatientDetails
│     │  │  └─ PrescriptionForm
│     │  │
│     │  ├─ AnalyticsTab
│     │  │  ├─ StatisticsCard
│     │  │  ├─ RevenueChart
│     │  │  ├─ PatientGrowthChart
│     │  │  └─ FeedbackAnalytics
│     │  │
│     │  ├─ ScheduleTab
│     │  │  ├─ WeeklyCalendar
│     │  │  ├─ AvailabilitySettings
│     │  │  └─ BlockTimeForm
│     │  │
│     │  └─ PrescriptionsTab
│     │     ├─ PrescriptionList
│     │     └─ CreatePrescription
│     │
│     └─ AdminPanel
│        ├─ UserManagement
│        │  ├─ UserTable
│        │  ├─ UserSearch
│        │  └─ UserActions
│        │
│        ├─ DoctorManagement
│        │  ├─ DoctorList
│        │  └─ ApprovalForm
│        │
│        ├─ AppointmentManagement
│        │  └─ AppointmentTable
│        │
│        ├─ InvoiceManagement
│        │  └─ InvoiceTable
│        │
│        └─ SystemConfiguration
│           ├─ TherapySettings
│           ├─ PricingSettings
│           └─ NotificationSettings
│
└─ Global Modals
   ├─ ChangeDoctorModal
   ├─ ConfirmationModal
   ├─ ErrorModal
   └─ SuccessModal
```

---

## 🔐 Authentication & Authorization Flow

```
┌────────────────────────────────────────────────────────────┐
│           COMPLETE AUTH & AUTHORIZATION FLOW              │
└────────────────────────────────────────────────────────────┘

REQUEST LIFECYCLE:
─────────────────

1. USER INITIATES REQUEST
   ↓
2. AXIOS INTERCEPTOR
   • Add JWT token to Authorization header
   • Set Content-Type: application/json
   ↓
3. REQUEST SENT TO BACKEND
   ↓
4. CORS MIDDLEWARE
   • Check Origin header
   • Allow/Deny based on whitelist
   ↓
5. BODY PARSER MIDDLEWARE
   • Parse JSON body
   ↓
6. AUTH MIDDLEWARE (auth.js)
   • Extract token from header
   • Verify JWT signature
   • Check token expiry
   • Decode token payload
   ↓
7. AUTHORIZATION MIDDLEWARE
   • Extract user role from token
   • Check if role allowed for route
   • Check if user owns resource
   ↓
8. ROUTE HANDLER
   • Execute business logic
   ↓
9. RESPONSE
   • Send data with 200/201 status
   • Or error with 400/401/403 status
   ↓
10. AXIOS RESPONSE INTERCEPTOR
    • Check if token expired
    • Refresh token if needed
    • Handle errors
    ↓
11. UPDATE COMPONENT STATE
    • Show data / error message
    • Update UI


JWT TOKEN PAYLOAD:
──────────────────

{
  "userId": "ObjectId",
  "email": "user@gmail.com",
  "role": "patient" | "doctor" | "admin",
  "iat": timestamp,
  "exp": timestamp + 24hours
}


ROLE-BASED ACCESS CONTROL (RBAC):
──────────────────────────────────

PATIENT:
  ✓ /api/appointments (book, view own)
  ✓ /api/therapies (view)
  ✓ /api/documents (upload, view own)
  ✓ /api/feedback (submit)
  ✗ Admin features
  ✗ Doctor schedules

DOCTOR:
  ✓ /api/appointments (view, update own)
  ✓ /api/patients (view own patients)
  ✓ /api/prescriptions (create)
  ✓ /api/invoices (create, view)
  ✓ /api/doctor-schedule (manage)
  ✓ /api/analytics (own data)
  ✗ Other doctors' data
  ✗ Admin features

ADMIN:
  ✓ /api/users/* (all users)
  ✓ /api/appointments/* (all appointments)
  ✓ /api/invoices/* (all invoices)
  ✓ /api/system-config (settings)
  ✓ All features
  ✗ Cannot perform user actions
```

---

## 🔄 Real-time Communication (Socket.io)

```
┌────────────────────────────────────────────────────────────┐
│            SOCKET.IO REAL-TIME FLOW                       │
└────────────────────────────────────────────────────────────┘

CLIENT SIDE (Frontend):
──────────────────────
import io from 'socket.io-client'

const socket = io('http://localhost:5000')

// Join user room
socket.emit('join_user_room', userId)

// Listen for events
socket.on('appointment_status_changed', (data) => {
  // Update local state
  // Show notification
  // Refresh appointment list
})

socket.on('invoice_updated', (data) => {
  // Update invoice list
  // Show alert
})

socket.on('new_notification', (data) => {
  // Add to notification center
  // Show toast
})


SERVER SIDE (Backend):
─────────────────────
io.on('connection', (socket) => {
  
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`)
  })
  
  socket.on('disconnect', () => {
    // Cleanup
  })
})

// Emit to specific user
io.to(`user_${patientId}`).emit('appointment_status_changed', {
  appointmentId: appt._id,
  status: 'confirmed'
})

// Broadcast to all users
io.emit('system_announcement', {
  message: 'System maintenance at 10pm'
})


REAL-TIME EVENTS:
─────────────────
✓ appointment_status_changed
✓ new_appointment_booking
✓ invoice_created
✓ invoice_updated
✓ new_notification
✓ message_received
✓ doctor_online_status
✓ appointment_reminder
✓ prescription_created
✓ feedback_submitted
```

---

## 🎯 Complete User Journey Map

```
┌────────────────────────────────────────────────────────────┐
│             USER JOURNEY MAP (End-to-End)                 │
└────────────────────────────────────────────────────────────┘

PATIENT JOURNEY:
────────────────

1. SIGNUP
   Landing → SignupPage → Fill Form → OTP Email
   → Verify OTP → Account Created → Auto-Login
   
2. FIRST LOGIN
   → PatientDashboard → Welcome Message
   → Edit Profile → Add Medical History
   
3. BOOK APPOINTMENT
   → Therapies Tab → Select Therapy
   → Select Doctor → View Schedule
   → Pick Time Slot → Enter Symptoms
   → Confirm → Receive Confirmation Email & In-app Notification
   
4. PRE-APPOINTMENT
   → Receive Reminder 24h before
   → Receive Reminder 1h before
   → Prepare documents (upload if needed)
   
5. DURING APPOINTMENT
   → Doctor starts session
   → Chat/Share files
   → Doctor takes notes & diagnosis
   
6. POST-APPOINTMENT
   → Receive Prescription (email + in-app)
   → Receive Care Instructions (email + in-app)
   → Invoice generated automatically
   → Request to provide Feedback
   
7. ONGOING
   → Track therapy progress
   → Reschedule appointments
   → View all documents in one place
   → Monitor health metrics
   → Communicate with doctor via messages
   → Pay invoices


DOCTOR JOURNEY:
───────────────

1. SIGNUP
   Landing → DoctorSignup → Fill Form + Medical ID
   → OTP Verification → Profile Complete
   → Admin Approval (pending) → Wait for verification
   → Admin Approves → Account Activated
   
2. FIRST LOGIN
   → DoctorDashboard → Setup Schedule
   → Define working hours → Set availability
   → Add specializations → Upload credentials
   
3. PATIENT BOOKS
   → Real-time notification (in-app)
   → See patient request → Review patient history
   → Accept/Decline → Appointment Confirmed
   
4. APPOINTMENT MANAGEMENT
   → View today's schedule
   → Start session at scheduled time
   → Document diagnosis & notes
   → Create prescription
   → Upload documents
   → Mark as completed
   
5. AFTER APPOINTMENT
   → Invoice auto-generated
   → Notifications sent to patient
   → Real-time update in both dashboards
   → Track payment status
   
6. ANALYTICS
   → View patient growth chart
   → Track revenue
   → Monitor feedback scores
   → Analyze session completion rates
   → Export reports
   
7. ONGOING
   → Manage schedule blocks (holidays/leave)
   → Send messages to patients
   → Respond to feedback
   → Monitor upcoming appointments
   → Update availability


ADMIN JOURNEY:
──────────────

1. LOGIN
   AdminLoginPage → Credentials → Admin Panel
   
2. USER OVERSIGHT
   → View all users (patients, doctors)
   → Search/filter users
   → Edit user roles
   → Deactivate accounts
   → Monitor user activity
   
3. DOCTOR VERIFICATION
   → See pending doctor approvals
   → Verify credentials
   → Check medical ID
   → Approve/Reject
   → Send notification
   
4. SYSTEM MONITORING
   → View total appointments
   → Monitor revenue
   → Check pending invoices
   → See system health
   → Monitor cron jobs
   
5. SETTINGS MANAGEMENT
   → Define therapy types & costs
   → Set pricing
   → Configure notification settings
   → Update system parameters
   → Manage email templates
   
6. REPORTS & ANALYTICS
   → Generate reports
   → Export data
   → View trends
   → Monitor compliance
```

---

## ✅ Final Summary Table

```
┌────────────────────────────────────────────────────────────┐
│           COMPLETE FEATURE INTEGRATION MAP                │
└────────────────────────────────────────────────────────────┘

FEATURE              PATIENT    DOCTOR    ADMIN     BACKEND
─────────────────────────────────────────────────────────────
Authentication       ✓          ✓         ✓         JWT + OTP
Email Verification   ✓          ✓         ✓         Nodemailer
Signup/Login         ✓          ✓         ✓         /api/auth
Home Dashboard       ✓          ✓         ✓         Dashboard
Appointments         ✓ (book)   ✓ (manage) ✓        /api/appts
Therapies            ✓ (view)   ✓ (assign) ✓        /api/therapies
Doctor Schedule      ✗          ✓         ✓         /api/doctor-*
Patient Profiles     ✓          ✓ (own)   ✓         /api/users
Prescriptions        ✓ (view)   ✓ (create) ✓        /api/prescriptions
Documents            ✓          ✓         ✓         /api/documents
Invoices             ✓ (pay)    ✓ (create) ✓        /api/invoices
Notifications        ✓          ✓         ✓         Socket.io
Feedback/Reviews     ✓ (submit) ✓ (view) ✓         /api/feedback
Analytics            ✗          ✓         ✓         /api/analytics
Messaging            ✓          ✓         ✗         Socket.io
Real-time Updates    ✓          ✓         ✓         Socket.io
PDF Export           ✓          ✓         ✓         html2pdf
Multi-language       ✗          ✗         ✗         Can be added
Dark Mode            ✗          ✗         ✗         Can be added

TECHNICAL DETAILS:
──────────────────
• Frontend: React 19 + Vite + Context API
• Backend: Express.js + Node.js + Socket.io
• Database: MongoDB with 18+ collections
• Authentication: JWT + OTP + Firebase Admin
• Communications: Email (Nodemailer) + SMS (Fast2SMS) + WhatsApp (Whapi)
• Real-time: Socket.io with room-based notifications
• State: AuthContext + Component-local state + localStorage
• UI: CSS3 + Responsive Design + Charts (Recharts)
• Validation: Frontend + Backend validators
• Security: CORS + RBAC + Password hashing + Audit logs
```

---

## 📋 Deployment Checklist

```
FRONTEND (Vercel):
  ✓ vite.config.js configured
  ✓ All environment variables set
  ✓ Build: npm run build
  ✓ Output: dist folder
  ✓ API URL configured
  ✓ Socket.io URL configured

BACKEND (Render):
  ✓ package.json configured
  ✓ server.js listening on PORT
  ✓ MongoDB connection ready
  ✓ Environment variables set
  ✓ Cron jobs enabled
  ✓ Socket.io enabled
  ✓ CORS configured

DATABASE (MongoDB Atlas):
  ✓ Collections created
  ✓ Indexes configured
  ✓ Connection string ready
  ✓ Backup enabled
  ✓ IP whitelist updated

INTEGRATIONS:
  ✓ Gmail SMTP configured
  ✓ Fast2SMS API key ready
  ✓ Whapi API key ready
  ✓ Firebase Admin SDK ready
```

---

**Professional Senior Developer Documentation**  
*Comprehensive Frontend & System Architecture Overview*  
*Date: April 28, 2026*
