# 🧪 SCHEDULE SYSTEM - QUICK TESTING GUIDE

**Time to complete**: 15-20 minutes  
**What to test**: Doctor availability UI + Patient booking + Reschedule flow

---

## 🔧 SETUP

Make sure both servers are running:

```bash
# Terminal 1: Backend
cd ayursutra-backend
npm run dev
# Should see: Server running on port 5000

# Terminal 2: Frontend
cd ayursutra-react
npm run dev
# Should see: Local:   http://localhost:5173/
```

Open browser: http://localhost:5173

---

## ✅ TEST 1: Doctor Availability UI (5 minutes)

### Step 1: Login as Doctor
```
Click "Login" → Doctor Email
Email: doctor@demo.com
Password: demo123
```

Expected: DoctorDashboard opens

### Step 2: Navigate to Availability Tab
```
Left sidebar → "⏰ My Availability"
```

Expected: 
- ✅ "My Availability" page loads
- ✅ Green button "+ Add Unavailable Time"
- ✅ Message: "✅ You are always available"

### Step 3: Create One-Time Block
```
Click: "+ Add Unavailable Time"
Select: "One-Time Block (Specific Date)"
Date: Today + 2 days
Start Time: 12:00
End Time: 13:00
Reason: Lunch Break
Click: "➕ Create Block"
```

Expected:
- ✅ Form closes
- ✅ Success message: "Availability block created!"
- ✅ Block appears in list below
- ✅ Shows: "📅 One-Time | [Date] - 12:00-13:00 | Lunch Break"

### Step 4: Create Recurring Block
```
Click: "+ Add Unavailable Time"
Select: "Recurring Block (Every Week)"
Day: Monday
Start Time: 10:00
End Time: 11:00
Reason: Admin Meeting
Click: "➕ Create Block"
```

Expected:
- ✅ Success message
- ✅ Recurring block appears in list
- ✅ Shows: "🔄 Recurring | Mondays - 10:00-11:00 | Admin Meeting"

### Step 5: Edit Block
```
Find the lunch block in list
Click: "✏️" (pencil icon)
Change End Time: 13:30
Click: "💾 Update Block"
```

Expected:
- ✅ Form closes
- ✅ Success message: "Availability block updated!"
- ✅ Block time updated to "12:00-13:30"

### Step 6: Delete Block
```
Find the admin meeting block
Click: "🗑️" (trash icon)
Confirm: "Yes, delete it"
```

Expected:
- ✅ Block removed immediately
- ✅ Success message: "Availability block deleted!"

---

## ✅ TEST 2: Slot Picker Respects Blocks (5 minutes)

### Step 1: Login as Patient
```
Logout as doctor (top right button)
Login as Patient:
Email: patient@demo.com
Password: demo123
```

Expected: PatientDashboard opens

### Step 2: Open Book Appointment
```
Navigate to: "📅 Appointments" tab
Click: "📅 Book New Appointment" button
Select Doctor: (same doctor as before)
Select Date: Today + 2 days (same as block date)
Click: Next
```

Expected:
- ✅ SlotPicker component loads
- ✅ Shows time slots in grid (7 columns × 3 rows)
- ✅ 12:00-12:30 slot is **RED** (blocked)
- ✅ 12:30-13:00 slot is **RED** (blocked)
- ✅ 13:00-13:30 slot is **RED** (blocked, spans 13:00-13:30)
- ✅ 11:30-12:00 slot is **GREEN** (available)

### Step 3: Try to Book During Block
```
Try to click: Red slot (12:00-12:30)
```

Expected:
- ✅ Slot doesn't respond (can't click)
- OR shows warning: "That time is unavailable - blocked for [reason]"

### Step 4: Book During Free Time
```
Click: Green slot (11:30-12:00)
Select Duration: 60 minutes
Click: "✅ Book Appointment"
```

Expected:
- ✅ Success message
- ✅ Appointment created
- ✅ Redirects to appointment list

---

## ✅ TEST 3: Reschedule & Reminder Flags (5 minutes)

### Step 1: Doctor Completes Appointment
```
Login as doctor again
Go to: "📅 Appointments" tab
Find: The appointment just booked
Status: Click "Confirm" → "Completed"
```

Expected:
- ✅ Appointment marked as completed
- ✅ Notification sent to patient

### Step 2: Check Console for Reminder Flags
```
Browser DevTools: F12 → Network tab
Look for API calls:
POST /api/appointments/:id
```

Expected:
- ✅ Should see flags:
  - `postCareReminderSent: false` (initially)
  - `notificationsScheduled: false` (initially)

### Step 3: Reschedule Appointment
```
Login as patient
Go to: "📅 Appointments"
Find: A completed appointment
Click: "🔄 Reschedule"
Pick new date/time
Click: "✅ Reschedule"
```

Expected:
- ✅ Success message: "Appointment rescheduled!"
- ✅ New date/time updated
- ✅ OLD FLAGS CLEARED (important!)

### Step 4: Verify Flags Were Cleared
```
Check browser DevTools → Network
Look at PUT request that rescheduled
```

Expected in Response:
```json
{
  "success": true,
  "data": {
    "postCareReminderSent": false,  ✅ CLEARED
    "notificationsScheduled": false, ✅ CLEARED
    "date": "[new date]",
    "rescheduleHistory": [...]
  }
}
```

---

## ✅ TEST 4: Recurring Blocks (3 minutes)

### Step 1: Doctor Creates Monday Block
```
Login as doctor
Go to: "⏰ My Availability"
Click: "+ Add Unavailable Time"
Type: Recurring Block
Day: Monday
Time: 14:00 - 15:00
Reason: Surgery Time
Create: ✅
```

### Step 2: Patient Books on Monday
```
Login as patient
Book Appointment Modal
Date: Next Monday
Doctor: Same doctor
```

Expected:
- ✅ SlotPicker loads Monday
- ✅ 14:00-14:30 and 14:30-15:00 slots are RED
- ✅ Can't book during 2-3 PM

### Step 3: Patient Books on Tuesday
```
Date: Next Tuesday (day after Monday)
```

Expected:
- ✅ SlotPicker loads Tuesday
- ✅ 2-3 PM slots are GREEN (available)
- ✅ Can book 2 PM on Tuesday

---

## 🚨 ERROR CHECKS

If you see these errors, the fixes didn't work:

### ❌ Error: "Cannot read property 'blockService' of undefined"
**Fix**: Make sure blockService is imported in AvailabilityTab
```javascript
import * as blockService from '../../services/blockService';
```

### ❌ Error: "PATCH /api/blocks/... 404 Not Found"
**Fix**: Restart backend (npm run dev)

### ❌ Error: Doctor sees PATCH in console but 500 error
**Fix**: Check backend logs for MongoDB validation errors

### ❌ Error: Slots don't change after block created
**Fix**: Refresh page or wait for Socket.io refresh (15 seconds)

---

## 📱 FULL END-TO-END FLOW (10 minutes)

```
1. Doctor sets availability blocks
   ↓
2. Patient tries to book
   ✅ Blocked slots are RED
   ✅ Can't click them
   ↓
3. Patient books free slot
   ↓
4. Doctor confirms appointment
   ↓
5. Session time arrives
   ✅ Both see appointment in list
   ↓
6. Patient gets reminder notification
   (Pre-appointment: 24h before, 1h before)
   ↓
7. Session ends
   ✅ Doctor marks completed
   ✓ Reminder flags clear on reschedule
   ↓
8. Patient gets post-care notification
   ↓
9. If patient no-shows:
   ✅ Auto-marked as missed after 15 min
   ✅ Both get "Marked as Missed" notifications
```

---

## 💾 RESULTS CHECKLIST

### Doctor Availability
- [ ] Can create one-time blocks
- [ ] Can create recurring blocks
- [ ] Can edit blocks
- [ ] Can delete blocks
- [ ] Real-time list updates
- [ ] Form validates inputs

### Patient Booking
- [ ] Slots respect doctor blocks
- [ ] Blocked times show RED
- [ ] Can't click blocked slots
- [ ] Can book free slots

### Reschedule
- [ ] Can reschedule appointment
- [ ] Reminder flags are cleared
- [ ] Pre-appointment reminder fires on new date
- [ ] Post-care reminder fires on new date

### Notifications
- [ ] Auto-missed notification sent to patient
- [ ] Auto-missed notification sent to doctor
- [ ] Messages are clear and helpful

---

## 📊 LOGGING

Open browser DevTools (F12) → Console to check logs:

```
✅ Should see:
[Cron] Pre-notification sent for appt...
[Cron] Post-care reminder sent for appt...
[Cron] Auto-missed... stale appointment(s)
[Socket] Slots updated from doctor block

❌ Should NOT see:
errors
undefined references
404 endpoints
```

---

## 🎯 SUMMARY

After completing all tests:

| Component | Status | Issues |
|-----------|--------|--------|
| Availability UI | ✅ | None |
| Block Creation | ✅ | None |
| Block Editing | ✅ | None |
| Slot Picker Respect | ✅ | None |
| Reschedule Flags | ✅ | None |
| Recurring Blocks | ✅ | None |
| Notifications | ✅ | None |

If all ✅, system is **READY FOR PRODUCTION**! 🚀

---
