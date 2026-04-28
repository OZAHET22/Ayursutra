# 📐 FRONTEND ARCHITECTURE & TECH STACK VISUAL GUIDE

---

## 🏗️ OVERALL ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BROWSER / CLIENT SIDE                              │
└─────────────────────────────────────────────────────────────────────────────┘

                          ┌──────────────────────┐
                          │   index.html         │
                          │  (HTML Template)     │
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │   main.jsx           │
                          │  (Entry Point)       │
                          │  Uses React 19.2.0   │
                          └──────────┬───────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────────┐
                    │   App.jsx (Root Component)         │
                    │  - AuthProvider (Context API)      │
                    │  - Router logic                    │
                    │  - State management                │
                    └─────────────────┬────────────────┘
                                      │
        ┌─────────────────────────────┼──────────────────────────────┐
        │                             │                              │
        ▼                             ▼                              ▼
  ┌─────────────────┐         ┌────────────────────┐        ┌────────────────┐
  │  Navbar         │         │  Page Components   │        │  Notification  │
  │  Component      │         │  - HomePage        │        │  Toast System  │
  └─────────────────┘         │  - LoginPage       │        └────────────────┘
                              │  - DoctorDashboard │
                              │  - PatientDash     │
                              │  - AdminPanel      │
                              └────────────────────┘
                                      │
        ┌─────────────────────────────┼──────────────────────────────────┐
        │                             │                                  │
        ▼                             ▼                                  ▼
  ┌─────────────────────┐    ┌──────────────────┐           ┌──────────────────┐
  │  Doctor Dashboard   │    │ Patient Dashboard│           │  Admin Panel     │
  │  - AppointmentsTab  │    │ - AppointmentsTab│           │  - User Mgmt     │
  │  - FeedbackTab      │    │ - FeedbackTab    │           │  - Analytics     │
  │  - InvoicesTab      │    │ - DocumentsTab   │           │  - Settings      │
  │  - AnalyticsTab     │    │ - DietsTab       │           └──────────────────┘
  │  - TherapiesTab     │    └──────────────────┘
  └─────────────────────┘
```

---

## 🔄 DATA FLOW ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND DATA FLOW                               │
└──────────────────────────────────────────────────────────────────────────┘

USER INTERACTION (Click, Type, etc)
    │
    ▼
┌──────────────────────────────────────────────┐
│  React Component                             │
│  - useState hooks for local state           │
│  - Event handlers (onClick, onChange)       │
│  - Validation logic                         │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Service Layer     │  ← API Communication
        │  (e.g., feedback   │
        │   Service.js)      │
        └────────┬───────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │  Axios HTTP Client             │
    │  - Adds JWT Token             │
    │  - Handles errors             │
    │  - Retries on failure         │
    └────────────┬───────────────────┘
                 │
                 ▼ (HTTPS Request)
    ╔════════════════════════════════╗
    ║   BACKEND API SERVER           ║  ← Port 5000
    ║   Node.js + Express            ║
    ║   MongoDB Database             ║
    ╚════════════════════════════════╝
                 │
                 ▼ (JSON Response)
    ┌────────────────────────────────┐
    │  Response Handler              │
    │  - Parse JSON                  │
    │  - Check for errors            │
    │  - Extract data                │
    └────────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Update State      │
        │  setState(data)    │
        └────────┬───────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │  React Re-renders Component    │
    │  - Compares old & new state    │
    │  - Updates only changed parts  │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │  DOM Updated (via Virtual DOM) │
    │  - Fast rendering             │
    │  - Browser displays update     │
    └────────────────────────────────┘
```

---

## 🧬 TECH STACK LAYERS

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Components (JSX)                              │   │
│  │  - Navbar, Dashboard, Forms, Cards, etc              │   │
│  │  - Version: React 19.2.0                             │   │
│  │  - Uses Hooks: useState, useEffect, useCallback      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    STYLING LAYER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  CSS Files                                           │   │
│  │  - App.css (main styles)                             │   │
│  │  - dashboard.css (dashboard styles)                  │   │
│  │  - index.css (global styles)                         │   │
│  │  - Inline styles in JSX for dynamic values           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT LAYER                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AuthContext (Global State)                          │   │
│  │  - User authentication data                          │   │
│  │  - JWT token management                              │   │
│  │  - Logout function                                   │   │
│  │                                                      │   │
│  │  Component State (Local State)                       │   │
│  │  - Forms, UI state, lists, etc                       │   │
│  │  - useState hooks                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services (src/services/)                            │   │
│  │  - authService.js (login, signup, logout)            │   │
│  │  - feedbackService.js (feedback CRUD)                │   │
│  │  - appointmentService.js (appointment CRUD)          │   │
│  │  - invoiceService.js (invoice CRUD)                  │   │
│  │  - userService.js (user data)                        │   │
│  │  - api.js (Axios + interceptors)                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    HTTP CLIENT LAYER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Axios (^1.13.6)                                     │   │
│  │  - HTTP requests (GET, POST, PUT, DELETE)            │   │
│  │  - JWT token injection (interceptor)                 │   │
│  │  - Error handling                                    │   │
│  │  - Response transformation                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMMUNICATION LAYER                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Socket.io Client (^4.8.3)                           │   │
│  │  - WebSocket real-time updates                       │   │
│  │  - Appointment notifications                         │   │
│  │  - Feedback replies                                  │   │
│  │  - Bi-directional communication                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Backend Server (Node.js + Express) - Port 5000      │   │
│  │  MongoDB Database                                    │   │
│  │  JWT Authentication                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 COMPONENT STRUCTURE

```
App.jsx (Root)
│
├── AuthProvider (Context)
│
├── Navbar (Global)
│   ├── Logo
│   ├── Navigation Links
│   └── Login Dropdown
│
├── Notification (Global Toast)
│   └── Toast Messages
│
└── Page Components (Conditional Rendering)
    │
    ├── HomePage (Public)
    │   ├── Hero Section
    │   ├── Features
    │   └── Footer
    │
    ├── LoginPage (Public)
    │   └── Login Form
    │
    ├── SignupPage (Public)
    │   └── Registration Form
    │
    ├── PatientDashboard (Protected)
    │   ├── Header
    │   ├── TabContainer
    │   ├── AppointmentsTab
    │   │   ├── NextSessionCard
    │   │   ├── AppointmentList
    │   │   ├── SlotPicker
    │   │   └── BookingForm
    │   ├── FeedbackTab
    │   │   ├── FeedbackForm
    │   │   ├── FeedbackHistory (with Edit/Delete)
    │   │   └── StarRating
    │   ├── DocumentsTab
    │   │   └── DocumentList
    │   ├── DietsTab
    │   │   └── DietList
    │   └── Profile
    │
    ├── DoctorDashboard (Protected)
    │   ├── Header
    │   ├── TabContainer
    │   ├── AppointmentsTab
    │   │   ├── AppointmentList
    │   │   ├── PatientSelector
    │   │   └── SlotPicker
    │   ├── FeedbackTab
    │   │   ├── FeedbackList
    │   │   ├── ReplyForm (with Edit)
    │   │   └── Statistics
    │   ├── InvoicesTab
    │   │   ├── InvoiceList
    │   │   ├── InvoiceForm
    │   │   └── CatalogueManager
    │   ├── TherapiesTab
    │   │   └── TherapyList
    │   ├── AnalyticsTab
    │   │   ├── Charts (Chart.js, Recharts)
    │   │   └── Statistics
    │   └── Profile
    │
    ├── AdminPanel (Protected)
    │   ├── DashboardTab
    │   ├── UsersTab
    │   ├── AnalyticsTab
    │   └── SettingsTab
    │
    └── ChangeDoctorModal (Modal)
        └── DoctorSelector
```

---

## 🔐 AUTHENTICATION FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                 AUTHENTICATION FLOW                         │
└─────────────────────────────────────────────────────────────┘

1. USER VISITS APP
   ↓
2. App.jsx Loads
   ├── Checks localStorage for token
   ├── If token exists → Validate it
   └── If valid → Set user in AuthContext
   ↓
3. TWO SCENARIOS:

   SCENARIO A: User NOT logged in
   ├── Shows HomePage/LoginPage
   ├── User enters credentials
   └── Clicks "Login"
       ↓
       4A. authService.login(email, password)
           ├── POST to /api/auth/login
           ├── Backend validates credentials
           ├── Backend returns JWT token
           ├── Token saved to localStorage
           ├── AuthContext updated
           ├── App shows Dashboard
           └── Auto-refresh to preserve login
   
   SCENARIO B: User IS logged in
   ├── localStorage has valid token
   ├── AuthContext populated
   └── Shows appropriate Dashboard
       ↓
       4B. API.interceptors adds token to all requests
           ├── Every API call includes: Authorization: Bearer {token}
           ├── Backend validates token
           ├── If valid → Returns data
           ├── If invalid → Returns 401 Unauthorized
           ├── interceptors catch 401
           ├── Clears localStorage
           ├── Redirects to login
           └── User logs in again

5. TOKEN EXPIRATION
   ├── If token expires on backend
   ├── API returns 401 Unauthorized
   ├── Frontend interceptor catches it
   ├── Clears user session
   ├── Redirects to login page
   └── Shows "Session expired" message
```

---

## 🔌 REAL-TIME UPDATES WITH SOCKET.IO

```
┌─────────────────────────────────────────────────────────────┐
│            SOCKET.IO REAL-TIME ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────┘

FRONTEND                                    BACKEND
  │                                            │
  │─── Connect WebSocket ─────────────────────→│
  │    (with JWT token)                        │
  │                                            │
  │←─── Connection Confirmed ─────────────────│
  │                                            │
  │                                    (Event Triggers)
  │                                            │
  │←─── appointment_booked ─────────────────┤│
  │     { appointmentId, doctorId, ... }    ││
  │                                            │
  │ [React Component Listens]                 │
  │ socket.on('appointment_booked', () => {  │
  │   loadAppointments();                    │
  │ });                                       │
  │                                            │
  │←─── feedback_replied ─────────────────────│
  │     { feedbackId, reply, doctorId }      │
  │                                            │
  │ [Updates state automatically]             │
  │ setFeedbacks(prev =>                      │
  │   prev.map(f =>                           │
  │     f._id === feedbackId                 │
  │       ? { ...f, reply: reply }           │
  │       : f                                 │
  │   )                                       │
  │ );                                        │
  │                                            │
  │←─── notification_sent ─────────────────────│
  │     { type, message, ... }                │
  │                                            │
  │ [Shows toast notification]                │
  │ showNotification(message, 'success');    │
  │                                            │
```

---

## 📊 STATE MANAGEMENT ARCHITECTURE

```
┌──────────────────────────────────────────────────────────┐
│           REACT STATE MANAGEMENT                         │
└──────────────────────────────────────────────────────────┘

GLOBAL STATE (AuthContext)
│
├── user: { 
│   │   _id, name, email, phone, role, 
│   │   preferredDoctor, centreId, ...
│   │ }
│
├── token: "eyJhbGciOiJIUzI1NiIs..."
│
└── logout: () => { ... }


LOCAL STATE (Component-Level)
│
├── PatientDashboard
│   ├── currentPage: 'appointments' | 'feedback' | ...
│   ├── notification: { message, type }
│   └── appointments: [...]
│       └── feedbacks: [...]
│           └── documents: [...]
│
├── FeedbackTab
│   ├── feedbacks: []
│   ├── loading: boolean
│   ├── editingId: string | null
│   ├── editContent: string
│   ├── editRating: number
│   └── deletingId: string | null
│
├── AppointmentsTab
│   ├── appointments: []
│   ├── doctors: []
│   ├── loading: boolean
│   ├── filter: 'all' | 'today' | 'upcoming'
│   └── showModal: boolean
│
└── InvoicesTab
    ├── invoices: []
    ├── catalogue: []
    ├── loading: boolean
    ├── view: 'list' | 'form' | 'preview'
    └── editingId: string | null
```

---

## 🔄 COMPONENT LIFECYCLE

```
┌────────────────────────────────────────────────┐
│      REACT COMPONENT LIFECYCLE                 │
└────────────────────────────────────────────────┘

MOUNT PHASE
│
├── 1. Component Created
├── 2. Initialize State (useState)
├── 3. useEffect Hook (with [] dependency)
│   └── Fetch initial data
│   └── Set up event listeners
│   └── Return cleanup function
├── 4. Render JSX
└── 5. Update DOM
    │
    ▼
UPDATE PHASE
│
├── User Interaction or State Change
├── Component Re-renders
├── useEffect Hook (with dependencies)
│   └── If dependencies changed:
│   └── Run effect
│   └── Cleanup previous effect
├── New Render
└── DOM Updated
    │
    ▼
CLEANUP PHASE
│
├── Component Unmounts
├── useEffect Cleanup Functions Run
│   └── Remove event listeners
│   └── Cancel API requests
│   └── Clear intervals/timeouts
└── Component Removed from DOM


EXAMPLE: useEffect in FeedbackTab
┌─────────────────────────────────────────────┐
│ useEffect(() => {                           │
│   // SETUP                                  │
│   loadFeedback();                           │
│   const interval = setInterval(() => {      │
│     loadFeedback();                         │
│   }, 15000);                                │
│                                             │
│   // CLEANUP (return function)              │
│   return () => {                            │
│     clearInterval(interval);                │
│   };                                        │
│ }, [loadFeedback]);   // dependencies       │
│                                             │
│ ✅ Sets up auto-refresh                     │
│ ✅ Cleanup prevents memory leaks            │
│ ✅ Runs when loadFeedback changes           │
└─────────────────────────────────────────────┘
```

---

## 📈 BUILD & DEPLOYMENT FLOW

```
┌─────────────────────────────────────────────────────────┐
│         DEVELOPMENT → PRODUCTION FLOW                   │
└─────────────────────────────────────────────────────────┘

DEVELOPMENT ENVIRONMENT
│
├── npm run dev
├── Vite starts dev server
├── Port: http://localhost:5173
├── Hot Module Replacement (HMR)
├── Source maps for debugging
└── Unprocessed modules for speed
    │
    ▼ (When ready for production)

BUILD PROCESS
│
├── npm run build
├── Vite bundles code
├── Tree-shaking (removes unused code)
├── Minification (reduces file size)
├── Asset optimization
├── CSS processing
└── Creates `dist/` folder
    │
    ▼

PRODUCTION BUILD ARTIFACTS
│
└── dist/
    ├── index.html (small, ~2KB)
    ├── assets/
    │   ├── index-xxxxxx.js (minified, ~250KB)
    │   ├── index-xxxxxx.css (minified, ~50KB)
    │   └── other assets
    │
    ▼ (Deploy these files to server)

PRODUCTION SERVER
│
├── Serve dist/ files
├── index.html served on all routes
├── JavaScript code executed
├── Connects to backend API
└── User sees fast, optimized app
```

---

## 🎯 TECHNOLOGIES SUMMARY TABLE

```
┌─────────────────────┬──────────────┬────────────────────────────────┐
│ Technology          │ Version      │ Purpose                        │
├─────────────────────┼──────────────┼────────────────────────────────┤
│ React               │ ^19.2.0      │ UI Framework                   │
│ React DOM           │ ^19.2.0      │ DOM Rendering                  │
│ Vite                │ ^7.3.1       │ Build Tool & Dev Server        │
│ Axios               │ ^1.13.6      │ HTTP Client                    │
│ Socket.io Client    │ ^4.8.3       │ Real-time Communication        │
│ Firebase            │ ^12.12.0     │ Auth & Storage                 │
│ Chart.js            │ ^4.5.1       │ Charts Library                 │
│ React ChartJS-2     │ ^5.3.1       │ React Chart Wrapper            │
│ Recharts            │ ^3.8.1       │ React Charts                   │
│ ESLint              │ ^9.39.1      │ Code Quality                   │
│ @vitejs/plugin-react│ ^5.1.1       │ React Plugin for Vite          │
└─────────────────────┴──────────────┴────────────────────────────────┘
```

---

## 🚀 KEY FEATURES ARCHITECTURE

```
APPOINTMENT BOOKING
│
├── Patient selects Doctor
├── Chooses date/time via SlotPicker
├── System checks availability
├── Calls appointmentService.createAppointment()
├── Backend stores in MongoDB
├── Socket.io notifies Doctor
└── Real-time update on Doctor Dashboard

FEEDBACK SYSTEM
│
├── Patient submits feedback + rating
├── Feedback stored in MongoDB
├── Doctor receives notification
├── Doctor replies
├── Socket.io notifies Patient
├── Patient can EDIT feedback (before reply)
├── Patient can DELETE feedback
├── Doctor can EDIT reply
└── Real-time updates for both

INVOICE MANAGEMENT
│
├── Doctor creates invoice
├── Adds items from catalogue
├── Calculates totals automatically
├── Stores in MongoDB
├── Patient can view invoice
├── Doctor tracks payment status
├── Can finalize/lock completed invoices
└── Real-time updates

REAL-TIME NOTIFICATIONS
│
├── Appointment booked → Notify Doctor
├── Feedback received → Notify Doctor
├── Reply sent → Notify Patient
├── Document uploaded → Notify Patient
└── All via Socket.io WebSocket
```

---

