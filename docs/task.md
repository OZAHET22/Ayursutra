# Ayursutra Feature Implementation Tasks

## Phase 1: Backend — Scheduling & Notification Infrastructure
- [ ] Install new backend dependencies (socket.io, node-cron, nodemailer, twilio, @sendgrid/mail)
- [ ] Enhance [Appointment](file:///c:/Users/het22/Downloads/React%20Final%20version/ayursutra-react/src/pages/patient/AppointmentsTab.jsx#5-280) model (add `missedReason`, `rescheduleHistory`, `checklistItems`, `sessionNotes`, `precautions`, `postCare`, `notificationPrefs` fields)
- [ ] Create `Notification` model (type, channel, appointmentId, userId, message, status, scheduledAt, sentAt)
- [ ] Enhance `therapy` model (add `milestones`, `feedback`, `symptomLog` fields)
- [ ] Update [appointments.js](file:///c:/Users/het22/Downloads/React%20Final%20version/ayursutra-backend/routes/appointments.js) route (conflict detection, slot suggestions, status history)
- [ ] Create `notifications.js` route (CRUD for notification prefs, manual triggers, in-app list)
- [ ] Create `therapyTracking.js` route (session status, feedback, symptom log, practitioner notes)
- [ ] Set up Socket.io in [server.js](file:///c:/Users/het22/Downloads/React%20Final%20version/ayursutra-backend/server.js) (real-time updates)
- [ ] Set up `node-cron` scheduler for automated notifications (24h, 1h before; post-session)
- [ ] Add notification service utilities (email, WhatsApp templates)

## Phase 2: Backend — Notification Service
- [ ] Create `services/notificationService.js` (email via Nodemailer/SendGrid, WhatsApp via Twilio)
- [ ] Create notification templates per therapy type (pre/post instructions)
- [ ] Add [.env](file:///c:/Users/het22/Downloads/React%20Final%20version/ayursutra-backend/.env) keys for Twilio, SendGrid/Nodemailer, and Socket.io port

## Phase 3: Frontend — Doctor Dashboard Enhancements
- [ ] Upgrade [ScheduleTab.jsx](file:///c:/Users/het22/Downloads/React%20Final%20version/ayursutra-react/src/pages/doctor/ScheduleTab.jsx) (day/week/month view toggle, conflict highlighting, slot suggestions, drag-to-reschedule)
- [ ] Upgrade [AppointmentsTab.jsx](file:///c:/Users/het22/Downloads/React%20Final%20version/ayursutra-react/src/pages/doctor/AppointmentsTab.jsx) (doctor: session history with full status tracking, practitioner notes, precautions/post-care fields)
- [ ] Create `TherapyTrackingTab.jsx` for doctor (live session status, patient symptom log, progress annotations)
- [ ] Add Notifications Management tab in Doctor dashboard (template editor per therapy, send manual alerts)
- [ ] Update [DoctorDashboard.jsx](file:///c:/Users/het22/Downloads/React%20Final%20version/ayursutra-react/src/pages/DoctorDashboard.jsx) to include new tabs + bell icon with in-app notification count

## Phase 4: Frontend — Patient Dashboard Enhancements
- [ ] Upgrade patient [AppointmentsTab.jsx](file:///c:/Users/het22/Downloads/React%20Final%20version/ayursutra-react/src/pages/doctor/AppointmentsTab.jsx) (upcoming session countdown, preparation checklist, reschedule confirmation flow)
- [ ] Upgrade [ProgressTab.jsx](file:///c:/Users/het22/Downloads/React%20Final%20version/ayursutra-react/src/pages/patient/ProgressTab.jsx) (live data from API, milestone tracker, recovery completion indicators)
- [ ] Create patient `TherapyTrackingTab.jsx` (session countdown, symptom/feedback log after session, precautions checklist)
- [ ] Create patient `NotificationPrefsTab.jsx` (manage channels: in-app, email, WhatsApp; per-therapy type preferences)
- [ ] Update [PatientDashboard.jsx](file:///c:/Users/het22/Downloads/React%20Final%20version/ayursutra-react/src/pages/PatientDashboard.jsx) (add new tabs + bell icon for in-app notifications)

## Phase 5: In-App Notification Bell
- [ ] Create `NotificationBell.jsx` component (real-time badge, dropdown list, mark-as-read)
- [ ] Wire up Socket.io client in [App.jsx](file:///c:/Users/het22/Downloads/React%20Final%20version/ayursutra-react/src/App.jsx) / Auth context for live push
- [ ] Integrate `NotificationBell` into both [DoctorDashboard](file:///c:/Users/het22/Downloads/React%20Final%20version/ayursutra-react/src/pages/DoctorDashboard.jsx#26-86) and [PatientDashboard](file:///c:/Users/het22/Downloads/React%20Final%20version/ayursutra-react/src/pages/PatientDashboard.jsx#18-77) headers

## Phase 6: Verification
- [ ] Manual test: Doctor creates appointment → conflict detection works
- [ ] Manual test: In-app notification bell shows new alerts in real time
- [ ] Manual test: Patient views countdown, checklist, and symptom log
- [ ] Manual test: Therapy tracking shows practitioner notes and milestones
