# 🌿 Ayursutra — Ayurvedic Wellness Platform

> Full-stack web application for managing Ayurvedic wellness centres — appointments, therapies, patient tracking, analytics, and multi-channel notifications.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Architecture & Data Flow](#architecture--data-flow)
- [Database Models](#database-models)
- [Backend — All Files Explained](#backend--all-files-explained)
- [Frontend — All Files Explained](#frontend--all-files-explained)
- [API Reference](#api-reference)
- [Notification System](#notification-system)
- [Authentication & Security](#authentication--security)
- [OTP Flow](#otp-flow)
- [Appointment Scheduling System](#appointment-scheduling-system)
- [Therapy Tracking System](#therapy-tracking-system)
- [Known Issues & Security Notes](#known-issues--security-notes)

---

## Tech Stack

| Layer       | Technology                                       |
|-------------|--------------------------------------------------|
| Frontend    | React 18, Vite, React Router, Axios, Socket.io-client |
| Backend     | Node.js, Express.js                              |
| Database    | MongoDB (Mongoose ODM)                           |
| Real-time   | Socket.io                                        |
| Auth        | JWT (jsonwebtoken) + Firebase Admin SDK (custom tokens) |
| Email       | Nodemailer (Gmail SMTP / App Password)           |
| SMS         | Fast2SMS (Indian bulk SMS gateway)               |
| WhatsApp    | Whapi Cloud REST API                             |
| Cron Jobs   | node-cron (automated reminders)                  |
| Validation  | Custom email/phone validators + disposable-domain blocklist |

---

## Project Structure

```
React Final version/
├── ayursutra-backend/          # Express.js REST API + Socket.io server
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── middleware/
│   │   └── auth.js             # JWT protect + RBAC authorize middleware
│   ├── models/                 # Mongoose schemas
│   │   ├── AbuseLog.js
│   │   ├── Appointment.js
│   │   ├── CatalogueItem.js
│   │   ├── Centre.js
│   │   ├── DietPlan.js
│   │   ├── DoctorBlock.js
│   │   ├── Document.js
│   │   ├── Feedback.js
│   │   ├── Invoice.js
│   │   ├── Notification.js
│   │   ├── OTP.js
│   │   ├── Therapy.js
│   │   └── User.js
│   ├── routes/                 # Express route handlers
│   │   ├── analytics.js
│   │   ├── appointments.js
│   │   ├── auth.js
│   │   ├── blocks.js
│   │   ├── catalogue.js
│   │   ├── centres.js
│   │   ├── diets.js
│   │   ├── documents.js
│   │   ├── feedback.js
│   │   ├── invoices.js
│   │   ├── notifications.js
│   │   ├── otp.js
│   │   ├── stats.js
│   │   ├── therapies.js
│   │   ├── therapyTracking.js
│   │   └── users.js
│   ├── services/
│   │   └── notificationService.js  # Email / SMS / WhatsApp / in-app dispatchers
│   ├── utils/
│   │   ├── disposableEmailBlocklist.js
│   │   ├── emailValidator.js
│   │   ├── firebaseAdmin.js
│   │   ├── notifyPatient.js
│   │   ├── phoneValidator.js
│   │   └── sendOTPEmail.js
│   ├── data/                   # Auto-generated cache files (disposable email list)
│   ├── server.js               # App entry point, Socket.io, CRON scheduler
│   ├── seedData.js             # Dev seed script
│   ├── clearDemoData.js        # Dev data cleanup script
│   ├── package.json
│   └── .env                    # ⚠️ Never commit this file
│
└── ayursutra-react/            # React 18 + Vite frontend
    └── src/
        ├── App.jsx             # Router + protected routes
        ├── main.jsx            # React DOM entry point
        ├── index.css           # Global design system (CSS variables, utilities)
        ├── dashboard.css       # Dashboard-specific styles
        ├── context/
        │   └── AuthContext.jsx # Global auth state (user, token, login/logout)
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Notification.jsx        # Single notification card component
        │   ├── NotificationBell.jsx    # Header bell with unread count + dropdown
        │   ├── OtpVerificationScreen.jsx
        │   └── SlotPicker.jsx          # Visual time-slot booking grid
        ├── pages/
        │   ├── HomePage.jsx
        │   ├── LoginPage.jsx
        │   ├── SignupPage.jsx
        │   ├── AdminLoginPage.jsx
        │   ├── AdminPanel.jsx
        │   ├── DoctorDashboard.jsx     # Shell/tab-router for doctor views
        │   ├── PatientDashboard.jsx    # Shell/tab-router for patient views
        │   ├── doctor/
        │   │   ├── AnalyticsTab.jsx
        │   │   ├── AppointmentsTab.jsx
        │   │   ├── DietTableTab.jsx
        │   │   ├── FeedbackTab.jsx
        │   │   ├── InvoicesTab.jsx
        │   │   ├── NotificationsTab.jsx
        │   │   ├── PatientFilesTab.jsx
        │   │   ├── PatientsTab.jsx
        │   │   ├── ScheduleTab.jsx
        │   │   ├── TherapiesTab.jsx
        │   │   └── TherapyTrackingTab.jsx
        │   └── patient/
        │       ├── AppointmentsTab.jsx
        │       ├── DocumentsTab.jsx
        │       ├── FeedbackTab.jsx
        │       ├── NotificationPrefsTab.jsx
        │       ├── ProgressTab.jsx
        │       ├── TherapiesTab.jsx
        │       └── TherapyTrackingTab.jsx
        └── services/           # Axios API wrappers (one per domain)
            ├── api.js                  # Axios instance + JWT interceptor
            ├── appointmentService.js
            ├── authService.js
            ├── blockService.js
            ├── catalogueService.js
            ├── centreService.js
            ├── documentService.js
            ├── feedbackService.js
            ├── invoiceService.js
            ├── notificationService.js
            ├── otpService.js
            ├── passwordResetService.js
            ├── therapyService.js
            ├── trackingService.js
            └── userService.js
```

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`mongod`) on port 27017
- Gmail account with an **App Password** (not your regular Gmail password)

### 1. Backend

```bash
cd ayursutra-backend
npm install
# Configure .env (see section below)
npm run dev          # starts with nodemon on port 5000
```

### 2. Frontend

```bash
cd ayursutra-react
npm install
npm run dev          # starts Vite dev server on port 5173
```

### 3. Seed Demo Data (optional)

```bash
cd ayursutra-backend
node seedData.js     # seeds demo doctor, patient, admin + sample appointments
```

Default demo accounts after seeding:

| Role    | Email               | Password   |
|---------|---------------------|------------|
| Doctor  | `doctor@demo.com`   | `demo1234` |
| Patient | `patient@demo.com`  | `demo1234` |
| Admin   | `admin@demo.com`    | `demo1234` |

---

## Environment Variables

Create `ayursutra-backend/.env`:

```env
# ─── Core ─────────────────────────────────────────────────────────────────────
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ayursutra
JWT_SECRET=your_very_long_random_secret_here   # CHANGE IN PRODUCTION
JWT_EXPIRE=7d
NODE_ENV=development

# ─── Email (Gmail App Password) ───────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx           # 16-char Gmail App Password

# ─── SMS via Fast2SMS (India) ─────────────────────────────────────────────────
FAST2SMS_API_KEY=your_fast2sms_api_key  # Register at https://www.fast2sms.com

# ─── WhatsApp via Whapi Cloud ─────────────────────────────────────────────────
WHAPI_TOKEN=your_whapi_cloud_token      # https://app.whapi.cloud
WHAPI_API_URL=https://gate.whapi.cloud  # default — or your custom channel URL

# ─── Firebase Admin SDK ───────────────────────────────────────────────────────
# Option A: paste the entire serviceAccountKey.json as a single-line JSON string
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# Option B: individual fields (alternative to Option A)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ─── Optional: Twilio Lookup (VoIP phone validation) ─────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
```

> ⚠️ **Never commit `.env` to Git.** It's already in `.gitignore`.

### Render / Production (MongoDB Atlas non-SRV example)

When deploying to Render you should set the `MONGO_URI` environment variable in the Render Dashboard. If your Render instance cannot resolve SRV records you can use the non-SRV (standard) connection string from Atlas. Example (replace <YOUR_ENCODED_PASSWORD> with the URL‑encoded DB password):

```
mongodb://Ayursutra:<YOUR_ENCODED_PASSWORD>@ac-x5ftyfv-shard-00-00.lymj0vw.mongodb.net:27017,ac-x5ftyfv-shard-00-01.lymj0vw.mongodb.net:27017,ac-x5ftyfv-shard-00-02.lymj0vw.mongodb.net:27017/ayursutra?ssl=true&replicaSet=atlas-r4lq2z-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Ayursutra
```

Set `PORT=3000` (or leave blank to use Render's default) and other secrets in the Render Environment section. After saving, trigger a manual redeploy so the new variables take effect.


---

## Architecture & Data Flow

```
Browser (React)
     │
     ├─── HTTP REST  ──────────────► Express API (port 5000)
     │                                    │
     │                                    ├── JWT Middleware (auth)
     │                                    ├── Route Handlers
     │                                    └── Mongoose (MongoDB)
     │
     └─── WebSocket  ◄────────────── Socket.io Server
               (real-time events: new_notification, appointment_booked,
                slots_updated, symptom_logged)
```

### Complete Request Lifecycle

1. **React** makes an API call via `src/services/api.js` (Axios instance).
2. The **Axios interceptor** automatically attaches `Authorization: Bearer <token>` from `localStorage`.
3. **Express** receives the request → passes through **CORS** middleware → hits the relevant **route**.
4. The **`protect` middleware** (in `middleware/auth.js`) verifies the JWT, fetches the user from MongoDB, and attaches `req.user`.
5. The **route handler** queries MongoDB via Mongoose, applies business logic, and may call:
   - `notifyPatient()` → sends Socket.io event + Email + SMS
   - `notificationService` → dispatches Email / WhatsApp / SMS
6. The **Socket.io server** pushes real-time events to the connected client's room (`user_<userId>`).
7. **React** receives the Socket event (via `NotificationBell`) and updates state instantly.

### CRON Scheduler (automated reminders)

Runs **every minute** inside `server.js`:
- **Pre-procedure (24h before):** Finds upcoming appointments 24 hours away → sends reminder via `notifyPatient()`.
- **Post-procedure (2h after completion):** Finds completed appointments → sends post-care instructions.

---

## Database Models

### `User`
Stores both patients and doctors (and admins) in one collection, differentiated by `role`.

| Field              | Type      | Notes                                        |
|--------------------|-----------|----------------------------------------------|
| `name`             | String    | Required                                     |
| `email`            | String    | Unique, lowercase                            |
| `password`         | String    | Bcrypt-hashed (pre-save hook)                |
| `role`             | String    | `patient` / `doctor` / `admin`               |
| `phone`            | String    | Indian format (+91XXXXXXXXXX)                |
| `approved`         | Boolean   | Doctors require admin approval               |
| `available`        | Boolean   | Doctor availability toggle                   |
| `speciality`       | String    | Doctor field                                 |
| `licenseNumber`    | String    | Doctor field                                 |
| `notificationPrefs`| Object    | `{ in_app, email, whatsapp, sms }` booleans  |
| `dosha`            | Object    | `{ vata, pitta, kapha }` percentages         |

### `Appointment`
Core booking record.

| Field                    | Type      | Notes                                      |
|--------------------------|-----------|--------------------------------------------|
| `patientId` / `doctorId` | ObjectId  | References User                            |
| `type`                   | String    | Therapy type (Panchakarma, Abhyanga, etc.) |
| `date`                   | Date      | Session start datetime                     |
| `duration`               | Number    | Minutes (default: 60)                      |
| `status`                 | String    | `pending/confirmed/completed/missed/cancelled` |
| `checklistItems`         | Array     | Pre-appointment patient checklist          |
| `symptomLog`             | Array     | Patient-reported symptoms per session      |
| `rescheduleHistory`      | Array     | Full audit trail of date changes           |
| `notificationsScheduled` | Boolean   | Prevents duplicate CRON reminders          |
| `postCareReminderSent`   | Boolean   | Prevents duplicate post-care CRON sends    |
| `precautions`            | String    | Auto-populated from therapy templates      |
| `postCare`               | String    | Auto-populated from therapy templates      |

### `OTP`
Time-limited verification codes.

| Field        | Type    | Notes                                          |
|--------------|---------|------------------------------------------------|
| `target`     | String  | Email address or phone number                  |
| `targetType` | String  | `email` / `phone`                              |
| `purpose`    | String  | `register` / `login` / `reset`                 |
| `code`       | String  | 6-digit numeric code                           |
| `attempts`   | Number  | Wrong attempt counter (max 5)                  |
| `used`       | Boolean | Single-use enforcement                         |
| `expiresAt`  | Date    | TTL index auto-deletes 10 min after expiry     |

### `Notification`
Audit log for every notification dispatched.

| Field          | Notes                                              |
|----------------|----------------------------------------------------|
| `userId`       | Recipient                                          |
| `appointmentId`| Optional linked appointment                        |
| `channel`      | `in_app` / `email` / `whatsapp` / `sms`           |
| `type`         | `pre_24h` / `pre_1h` / `post_session` / `general` |
| `status`       | `pending` / `sent` / `failed` / `read`            |

### `DoctorBlock`
Doctor-controlled unavailability windows.

| Field         | Notes                                                |
|---------------|------------------------------------------------------|
| `isRecurring` | If true, repeats every week on `dayOfWeek`           |
| `date`        | YYYY-MM-DD for one-time blocks                       |
| `dayOfWeek`   | 0 (Sunday) – 6 (Saturday) for recurring blocks       |
| `startHour/Minute`, `endHour/Minute` | Time window             |
| `active`      | Soft-delete — set to false to remove                 |

### `Therapy`
An ongoing therapy programme (multiple sessions).

| Field               | Notes                                          |
|---------------------|------------------------------------------------|
| `patientId/doctorId`| References User                                |
| `name`              | Programme name                                 |
| `sessions/completed`| Total planned vs sessions done                 |
| `progress`          | 0–100 percentage                               |
| `milestones`        | Array of named achievements                    |
| `symptomLog`        | Patient symptom entries across the programme   |
| `practitionerNotes` | Doctor's private notes                         |

### `AbuseLog`
Brute-force lockout tracker for OTP endpoints.

| Field        | Notes                                            |
|--------------|--------------------------------------------------|
| `identifier` | Email or phone being locked                      |
| `failures`   | Count of consecutive failures                    |
| `lockedUntil`| Datetime until which requests are blocked        |
| TTL index    | Auto-deleted after 24 hours                      |

### `Invoice`, `DietPlan`, `Document`, `Feedback`, `CatalogueItem`, `Centre`
Supporting models for their respective feature areas (invoicing, Ayurvedic diet plans, patient file uploads, session feedback, therapy catalogue, and wellness centres).

---

## Backend — All Files Explained

### `server.js` — Application Entry Point
- Loads `.env` manually using `fs.readFileSync` (compatible with all Node.js versions)
- Creates Express app + HTTP server + Socket.io server
- Registers all route modules under `/api/*`
- Initializes Socket.io room management (`join_user_room` event)
- Runs the CRON job scheduler on startup
- Calls `verifyWhatsAppConnection()` on startup to check Whapi credentials

### `config/db.js` — MongoDB Connection
- Single function `connectDB()` using Mongoose
- Exits the process on connection failure

### `middleware/auth.js` — Authentication Middleware
- **`protect`**: Extracts and verifies the JWT from `Authorization: Bearer` header. Attaches the full user document to `req.user`.
- **`authorize(...roles)`**: Role-based access guard. Used as `authorize('doctor', 'admin')` to restrict routes.

### `routes/auth.js` — Authentication Routes
| Method | Path                    | Description                                    |
|--------|-------------------------|------------------------------------------------|
| POST   | `/api/auth/register`    | Create new user account (doctor, patient)      |
| POST   | `/api/auth/login`       | Password login → returns JWT                   |
| GET    | `/api/auth/me`          | Get current user profile (protected)           |
| POST   | `/api/auth/check-email` | Pre-registration email availability check      |
| POST   | `/api/auth/forgot-password` | Send OTP for password reset               |
| POST   | `/api/auth/reset-password`  | Verify OTP + set new password             |
| POST   | `/api/auth/migrate-doctors` | Bulk-approve doctors (admin only)         |

Registration validates email (disposable domain block + DNS MX check) and phone (format + repetitive pattern + optional Twilio VoIP check) before creating the user. Doctors are created with `approved: false` and must be approved by an admin before they can log in.

### `routes/otp.js` — OTP Verification Routes
| Method | Path              | Description                                              |
|--------|-------------------|----------------------------------------------------------|
| POST   | `/api/otp/send`   | Generate + dispatch 6-digit OTP (email or SMS)           |
| POST   | `/api/otp/verify` | Verify OTP → returns Firebase Custom Token or JWT        |

Features: rate limiting (3/hour), resend cooldown (30s), 5-attempt lock, AbuseLog 10-minute IP-level lockout.

### `routes/appointments.js` — Appointment CRUD
| Method | Path                              | Description                                  |
|--------|-----------------------------------|----------------------------------------------|
| GET    | `/api/appointments`               | Role-filtered list (patient sees own, doctor sees own) |
| GET    | `/api/appointments/slots`         | Full 30-min slot grid for a doctor+date combo |
| POST   | `/api/appointments`               | Book appointment (atomic overlap check)      |
| PUT    | `/api/appointments/:id`           | Update / reschedule (ownership enforced)     |
| POST   | `/api/appointments/:id/notes`     | Doctor saves session notes                   |
| POST   | `/api/appointments/:id/symptom-log` | Patient submits symptom entry             |
| PUT    | `/api/appointments/:id/checklist-item` | Patient ticks checklist                |
| DELETE | `/api/appointments/bulk/delete`   | Admin bulk delete by status/date            |
| DELETE | `/api/appointments/:id`           | Soft-cancel (doctor/patient) or hard delete (admin) |

### `routes/notifications.js` — Notification Management
| Method | Path                               | Description                                  |
|--------|------------------------------------|----------------------------------------------|
| GET    | `/api/notifications`               | Patient's in-app notification feed           |
| PUT    | `/api/notifications/:id/read`      | Mark single notification as read             |
| PUT    | `/api/notifications/read-all/mark` | Mark all as read                             |
| POST   | `/api/notifications/send`          | Doctor sends manual notification (doctor/admin only) |
| GET    | `/api/notifications/prefs`         | Get patient notification preferences         |
| PUT    | `/api/notifications/prefs`         | Update patient notification preferences      |
| POST   | `/api/notifications/test-whatsapp` | Send test WhatsApp (doctor/admin only)        |
| POST   | `/api/notifications/test-sms`      | Send test SMS (doctor/admin only)             |

### `routes/users.js` — User Management
| Method | Path                       | Description                                      |
|--------|----------------------------|--------------------------------------------------|
| GET    | `/api/users/my-patients`   | Doctor's own patients (via appointment history)  |
| GET    | `/api/users/patients`      | All patients (admin only)                        |
| GET    | `/api/users/doctors`       | All approved doctors (public — used on signup page) |
| GET    | `/api/users/doctors/pending` | Unapproved doctors (admin only)               |
| PUT    | `/api/users/:id/approve`   | Admin approves a doctor                          |
| GET    | `/api/users/:id`           | Get user profile (self / doctor fetching patient / admin) |
| PUT    | `/api/users/:id`           | Update user profile (self or admin)              |
| DELETE | `/api/users/:id`           | Delete user (admin only, cannot self-delete)     |

### `routes/therapyTracking.js` — Therapy Progress Tracking
| Method | Path                                    | Description                             |
|--------|-----------------------------------------|-----------------------------------------|
| GET    | `/api/tracking/therapies`               | Therapy list (role-filtered)            |
| POST   | `/api/tracking/milestone`               | Doctor adds milestone → notifies patient |
| POST   | `/api/tracking/feedback`                | Patient submits symptom feedback        |
| PUT    | `/api/tracking/practitioner-notes/:id`  | Doctor saves private notes              |
| GET    | `/api/tracking/session/:appointmentId`  | Live session status (upcoming/in_progress/overdue) |
| PATCH  | `/api/tracking/:therapyId/symptom-action` | Doctor flags symptom + auto-reschedules |
| GET    | `/api/tracking/:therapyId/progress-data` | Chart data for session + symptom trends |

### `routes/blocks.js` — Doctor Availability Blocks
| Method | Path            | Description                                        |
|--------|-----------------|----------------------------------------------------|
| GET    | `/api/blocks`   | Get blocks for a doctor on a date (or all active)  |
| GET    | `/api/blocks/all` | All blocks for the logged-in doctor (management UI) |
| POST   | `/api/blocks`   | Create a new block (one-time or recurring)         |
| DELETE | `/api/blocks/:id` | Soft-delete a block (sets active: false)         |

### `routes/analytics.js`
Single `GET /api/analytics` — returns for the logged-in doctor:
- Therapy success rates (% completed per type)
- Patient distribution by therapy type
- Monthly growth (last 12 months)
- Retention rate (patients with >1 appointment)
- Appointment status breakdown

### Other Routes
- `routes/therapies.js` — CRUD for Therapy programmes
- `routes/invoices.js` — Invoice generation and listing
- `routes/documents.js` — Patient document upload/download
- `routes/feedback.js` — Post-session feedback forms
- `routes/diets.js` — Ayurvedic diet plan management
- `routes/catalogue.js` — Therapy/treatment catalogue items
- `routes/centres.js` — Wellness centre management
- `routes/stats.js` — Quick summary stats for dashboards

### `services/notificationService.js` — Notification Engine
The central dispatcher. Contains:

- **`sendEmail(to, subject, html)`** — Nodemailer via Gmail SMTP. Skips gracefully if SMTP not configured.
- **`sendSMS(to, message)`** — Fast2SMS bulk API. Strips WhatsApp bold markdown before sending. Skips if `FAST2SMS_API_KEY` not set.
- **`sendWhatsApp(to, message)`** — Whapi Cloud REST API. Normalizes Indian numbers to `@s.whatsapp.net` format.
- **`createInApp(userId, ...)`** — Saves a Notification document to MongoDB.
- **`emitToUser(io, userId, event, data)`** — Socket.io targeted emit to `user_<userId>` room.
- **`sendNotification(io, opts)`** — Orchestrates all channels based on `channels` array.
- **`verifyWhatsAppConnection()`** — Called on startup to test Whapi credentials.
- **`THERAPY_TEMPLATES`** — Pre/post care and medication instructions for 8 therapy types.
- **`getTemplate(therapyType, phase)`** — Looks up a template string.

### `utils/notifyPatient.js` — Unified Patient Notifier
Convenience wrapper used by appointment routes and the CRON scheduler. Fetches the patient's `email`, `phone`, and `notificationPrefs` then calls `createInApp`, `sendSMS`, and `sendEmail` appropriately.

### `utils/sendOTPEmail.js` — OTP Email Template
Sends a branded HTML OTP email (green Ayursutra theme). Creates the Nodemailer transporter lazily on each send so env vars are always resolved at call time.

### `utils/firebaseAdmin.js` — Firebase Admin SDK Init
Initializes Firebase Admin SDK from env vars. Supports two config styles: JSON string (`FIREBASE_SERVICE_ACCOUNT_JSON`) or individual fields (`FIREBASE_PROJECT_ID`, etc.). Falls back gracefully to JWT-only mode if Firebase credentials are missing.

### `utils/emailValidator.js` — Email Security Validator
Three-layer validation pipeline:
1. Regex format check
2. Disposable email domain blocklist (8,000+ domains, weekly auto-update from GitHub)
3. DNS MX record lookup — confirms the domain can actually receive email

### `utils/phoneValidator.js` — Phone Security Validator
Validates Indian mobile numbers:
1. Strips formatting characters
2. Normalizes +91/91/0 prefixes
3. TRAI regex (must start with 6–9, exactly 10 digits)
4. Blocks repetitive fake patterns (e.g., 9999999999)
5. Optional Twilio Lookup API for VoIP detection (only if `TWILIO_ACCOUNT_SID` is set)

---

## Frontend — All Files Explained

### `src/services/api.js` — Axios Instance
- Single Axios instance pointing to `http://localhost:5000/api`
- **Request interceptor**: Reads `ayursutra_token` from localStorage and adds `Authorization: Bearer` header automatically
- **Response interceptor**: On 401 with token-invalid message → clears localStorage and reloads (forces re-login)

### `src/context/AuthContext.jsx` — Global Auth State
- Provides `{ user, token, login, logout }` to all components
- `login(token, user)` → saves to localStorage + state
- `logout()` → clears localStorage + redirects to home
- On mount: reads localStorage to restore session

### `src/App.jsx` — Router
- React Router v6 with protected route pattern
- Role-based redirects: `/doctor-dashboard` requires `role === 'doctor'`, etc.
- Default redirect to `/` (HomePage)

### `src/components/NotificationBell.jsx`
- Shows real-time unread count badge on the header bell icon
- Connects to Socket.io on mount, joins `user_<userId>` room
- Listens for `new_notification` events → updates unread count instantly
- Fetches notification list from `GET /api/notifications`
- Dropdown displays last 10 notifications with mark-as-read

### `src/components/SlotPicker.jsx`
- Visual 30-minute time-slot grid (08:00 – 19:00)
- Fetches slot availability from `GET /api/appointments/slots?doctorId=&date=`
- Listens for `slots_updated` Socket.io events → auto-refreshes when another user books
- Shows blocked slots (doctor unavailability) in a different colour
- Supports custom slot size (15, 30, 45, 60 min)

### `src/components/OtpVerificationScreen.jsx`
- 6-digit OTP input with auto-advance between boxes
- Resend cooldown timer (30s)
- Calls `POST /api/otp/verify` → on success, calls `POST /api/auth/login` to get a full JWT session

### Doctor Dashboard Pages (`src/pages/doctor/`)
| File                    | What it does                                                            |
|-------------------------|-------------------------------------------------------------------------|
| `ScheduleTab.jsx`       | Full appointment calendar. Integrates SlotPicker. Manages appointment CRUD, reschedule, status updates, and doctor blocks (breaks/unavailability). |
| `AppointmentsTab.jsx`   | List view of all appointments with filters, status management, and symptom log viewer. |
| `PatientsTab.jsx`       | Patient roster from `GET /api/users/my-patients`. Click to view profile & history. |
| `PatientFilesTab.jsx`   | Upload/view patient documents and medical files.                        |
| `TherapiesTab.jsx`      | Create and manage therapy programmes for patients.                      |
| `TherapyTrackingTab.jsx`| Live session tracking: checklists, symptom logging, progress charts.   |
| `NotificationsTab.jsx`  | Send manual notifications to patients via chosen channels (in-app/email/SMS/WhatsApp). |
| `AnalyticsTab.jsx`      | Charts: therapy success rates, patient distribution, monthly growth, retention rate. |
| `InvoicesTab.jsx`       | Invoice generation, print, and payment tracking.                        |
| `DietTableTab.jsx`      | Ayurvedic diet plan creation and assignment.                            |
| `FeedbackTab.jsx`       | View patient session feedback and ratings.                              |

### Patient Dashboard Pages (`src/pages/patient/`)
| File                        | What it does                                                     |
|-----------------------------|------------------------------------------------------------------|
| `AppointmentsTab.jsx`       | Book appointments (SlotPicker), view history, cancel, submit symptoms. |
| `TherapiesTab.jsx`          | View assigned therapy programmes and progress.                   |
| `TherapyTrackingTab.jsx`    | Symptom tracking forms, session checklists, milestone view.      |
| `ProgressTab.jsx`           | Visual progress charts for ongoing therapies.                    |
| `NotificationPrefsTab.jsx`  | Toggle email/SMS/WhatsApp notification preferences.              |
| `DocumentsTab.jsx`          | Upload personal medical documents.                               |
| `FeedbackTab.jsx`           | Submit post-session ratings and feedback.                        |

---

## API Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require:
```
Authorization: Bearer <jwt_token>
```

### Response Format
All responses follow the envelope pattern:
```json
{
  "success": true | false,
  "data": { ... },       // or array
  "message": "...",      // on error or informational
  "unreadCount": 3       // where applicable
}
```

---

## Notification System

### Channel Architecture

```
notifyPatient() / sendNotification()
         │
         ├── 1. In-App (Socket.io + MongoDB)   ← Always sent
         ├── 2. Email (Nodemailer/SMTP)         ← If SMTP configured + patient pref enabled
         ├── 3. SMS (Fast2SMS)                  ← If FAST2SMS_API_KEY set + patient pref enabled
         └── 4. WhatsApp (Whapi Cloud)          ← If WHAPI_TOKEN set + patient pref enabled
```

### Automated (CRON) Notifications
| Trigger                          | Template                     | Channel      |
|----------------------------------|------------------------------|--------------|
| 24h before appointment           | Pre-procedure care           | All enabled  |
| 2h after session completion      | Post-procedure care          | All enabled  |
| Doctor adds milestone            | Milestone achievement        | In-app + email |
| Doctor flags symptom (postpone)  | Session rescheduled          | In-app + email |

### Manual Notifications (Doctor)
Doctors can send custom messages via `POST /api/notifications/send` choosing any combination of:
- `in_app` — instant push via Socket.io
- `email` — branded HTML via Gmail SMTP
- `sms` — plain text via Fast2SMS
- `whatsapp` — formatted message via Whapi Cloud

### Therapy-Specific Templates
Pre-built pre/post care messages for 8 therapy types:
`Panchakarma`, `Abhyanga`, `Shirodhara`, `Basti`, `Nasya`, `Virechana`, `Vamana`, `Consultation`

---

## Authentication & Security

### JWT Flow
1. User logs in via `POST /api/auth/login` → receives a JWT (7-day expiry by default)
2. JWT stored in `localStorage` as `ayursutra_token`
3. Every API call attaches the token via Axios interceptor
4. Backend `protect` middleware verifies signature + expiry + user existence
5. On 401 (token invalid), frontend clears session and reloads

### Password Security
- Passwords are hashed with **bcryptjs** (salt rounds: 10) via a Mongoose `pre('save')` hook
- Passwords are never returned in API responses (`.select('-password')`)
- Minimum length: 6 characters

### Email Uniqueness
- Enforced at the database level (`unique: true` index on `User.email`)
- Also enforced at the application level in both `/register` and `/otp/send` routes
- Cross-role uniqueness: the same email cannot be a doctor AND a patient

### Rate Limiting (OTP Endpoints)
- Maximum 3 OTP requests per target per hour
- 30-second cooldown between resend requests
- Maximum 5 wrong verification attempts → OTP invalidated
- 5+ failures → AbuseLog entry created, target locked for 10 minutes

### Role-Based Access Control (RBAC)
| Route Category            | patient | doctor | admin |
|---------------------------|:-------:|:------:|:-----:|
| View own appointments     | ✅      | ✅     | ✅    |
| Book appointment          | ✅      | ✅     | ✅    |
| Update own appointment    | ✅      | ✅     | ✅    |
| View all patients         | ❌      | ❌     | ✅    |
| View my patients          | ❌      | ✅     | ✅    |
| Send notifications        | ❌      | ✅     | ✅    |
| Approve doctors           | ❌      | ❌     | ✅    |
| Delete users              | ❌      | ❌     | ✅    |
| Create doctor blocks      | ❌      | ✅     | ✅    |
| Bulk delete appointments  | ❌      | ❌     | ✅    |

---

## OTP Flow

### Registration (Email OTP)
```
1. User enters email on SignupPage
2. POST /api/otp/send { target: email, targetType: 'email', purpose: 'register' }
   → Validates email (format + blocklist + MX DNS)
   → Checks email is not already registered
   → Generates 6-digit code, saves to OTP collection
   → Sends branded OTP email via Gmail SMTP
3. User enters code in OtpVerificationScreen
4. POST /api/otp/verify { target: email, code, purpose: 'register' }
   → Returns verification JWT (15-min expiry)
5. POST /api/auth/register { ...userData }
   → Creates User document
   → Returns long-lived JWT (7-day)
```

### Password Reset
```
1. POST /api/auth/forgot-password { email }
   → Rate limited (3 per hour, 30s cooldown)
   → Sends 10-minute OTP
2. POST /api/auth/reset-password { email, otp, newPassword }
   → Validates OTP (5 attempts max)
   → Updates password (Mongoose pre-save hashes it)
```

---

## Appointment Scheduling System

### Slot Grid Algorithm
`GET /api/appointments/slots?doctorId=&date=&slotSize=30`

- Generates slots from **08:00 to 19:00** in `slotSize`-minute increments
- For each slot: checks both **appointment overlaps** and **doctor block overlaps**
- Overlap logic: `slotStart < existingEnd AND slotEnd > existingStart` (true interval overlap, not just point-in-time)
- Returns: `{ booked, blocked, blockReason, bookedBy, bookedType, appointmentId }`

### Atomic Booking
`POST /api/appointments`
- Before creating: runs a MongoDB query to find any existing non-cancelled appointment where time windows overlap
- Uses `$expr` + `$add`/`$multiply` to compute the end time in milliseconds directly in the query
- If conflict found → returns `409 Conflict` with details of the conflicting appointment
- On success: emits `appointment_booked` to doctor + `slots_updated` broadcast (all open slot pickers auto-refresh)

### Reschedule History
Every `PUT /api/appointments/:id` that changes the date automatically `$push`es a `rescheduleHistory` entry capturing: from, to, reason, requestedBy (doctor/patient), requestedAt.

---

## Therapy Tracking System

### Symptom Action Flow (Doctor)
`PATCH /api/tracking/:therapyId/symptom-action`

Actions available:
| Action                | What happens                                                        |
|-----------------------|---------------------------------------------------------------------|
| `postpone_session`    | Finds next upcoming appointment → moves it +1 day (conflict-checked) → notifies patient |
| `update_post_care`    | Updates post-care instructions on linked appointment → re-sends care notification |
| `add_recovery_day`    | Saves doctor note only (no auto-action)                             |
| `no_change`           | Saves doctor note only                                              |

### Progress Data
`GET /api/tracking/:therapyId/progress-data`
Returns structured data for charts:
- `sessionTrend[]` — session number, date, status, severity score
- `symptomTrend[]` — date, severity, severity score (1/2/3)
- `overallProgress` — percentage (completed / total sessions × 100)
- `milestoneCount`, `totalSessions`, `completedSessions`

---

## Known Issues & Security Notes

### ⚠️ Firebase Admin Vulnerabilities
`npm audit` reports 8 **low severity** vulnerabilities in `firebase-admin >= v11` (via `@google-cloud/storage` → `teeny-request` → `@tootallnate/once`).

The fix (`npm audit fix --force`) would **downgrade firebase-admin to v10** which is a breaking change. These are low severity and not exploitable in a backend-only context. **Recommended action**: wait for a firebase-admin patch release above v13 that resolves the upstream issue.

### ✅ Fixed Issues (this version)
| Issue | Fix Applied |
|-------|-------------|
| `OTP.purpose` enum missing `'reset'` — forgot-password flow would fail silently | Added `'reset'` to enum |
| `/api/auth/migrate-doctors` was publicly accessible (no auth) | Added `protect` + admin role check |
| `/api/users/patients` was accessible to all doctors (leaking patient PII) | Restricted to admin only |
| `/api/users/:id` a patient could fetch any other user's profile | Added patient self-only guard |
| `/api/notifications/send` a patient could send notifications | Added doctor/admin role guard |
| `/api/notifications/test-sms` and `/test-whatsapp` had no role check | Added doctor/admin guard |
| `PUT /api/appointments/:id` — no ownership check | Added patient/doctor ownership verification |
| `sendOTPEmail.js` — `rejectUnauthorized: false` disables TLS certificate validation | Removed insecure option; made transporter lazy |
| `sendOTPEmail.js` — transporter created at module load (before env vars loaded) | Made transporter lazy (created per-send) |
| `@sendgrid/mail` — installed but never used anywhere in the codebase | Removed from dependencies |

### Frontend Security Note
The JWT is stored in `localStorage`. For higher security in production, consider `httpOnly` cookies with CSRF protection. For an internal clinic tool, localStorage is acceptable.

### Production Checklist
- [ ] Change `JWT_SECRET` to a long random string (≥32 chars)
- [ ] Set `NODE_ENV=production`
- [ ] Use a real MongoDB Atlas URI (not localhost)
- [ ] Enable HTTPS (reverse proxy via nginx or Caddy)
- [ ] Restrict CORS origins in `server.js` to your actual domain
- [ ] Set up Firebase App Check for additional API abuse prevention
- [ ] Register DLT template with Fast2SMS for transactional SMS (required in India for bulk SMS)

---

*Ayursutra — Built with 🌿 for Ayurvedic wellness centres*
