# 🏥 Ayursutra Panchkarma Clinic — Invoice Module Implementation Spec

> **Version:** 1.0.0
> **Currency:** INR ₹
> **Stack:** React (SPA) · Context API · Async Service Layer · Font Awesome 6 · html2pdf.js
> **Backend Ready:** All data calls are written as async service functions — swap mock data for real API with zero refactoring

---

## 📁 Project Architecture

```
/src
  /components
    /layout
      Navbar.jsx              ← Pill navbar, tab buttons, notification bell
      StatsRow.jsx            ← 4 live-calculated stat cards
    /invoice
      InvoiceList.jsx         ← Doctor invoice dashboard with filters
      InvoiceForm.jsx         ← Create / Edit invoice form
      InvoicePreviewModal.jsx ← A4-style preview overlay
      InvoiceCard.jsx         ← Single invoice card with status border
      ItemsTable.jsx          ← Dynamic line items table
      SummaryPanel.jsx        ← Totals + signature/stamp uploads
      PaymentRow.jsx          ← Status, paid amount, balance, notes
    /patient
      PatientSearch.jsx       ← Live search input with dropdown results
      PatientCard.jsx         ← Selected patient display card
      NewPatientModal.jsx     ← Add new patient modal form
    /shared
      Badge.jsx               ← Status / type colored badge
      Button.jsx              ← Pill-shaped button variants
      Table.jsx               ← Reusable table component
      Modal.jsx               ← Generic modal wrapper
      NotificationBanner.jsx  ← Patient portal notification strip
  /context
    InvoiceContext.jsx        ← Invoice state + CRUD actions
    PatientContext.jsx        ← Patient + appointment state
    NotificationContext.jsx   ← Notification queue + bell badge count
  /services
    invoiceService.js         ← Invoice CRUD (mock → swap to API)
    patientService.js         ← Patient fetch + appointment link
    appointmentService.js     ← Appointment fetch by doctor / patient
  /hooks
    useInvoice.js             ← Consumes InvoiceContext
    usePatient.js             ← Consumes PatientContext
    useAppointment.js         ← Appointment data + linking logic
  /utils
    pdfGenerator.js           ← html2pdf.js wrapper function
    formatCurrency.js         ← ₹ formatter helper
    dateHelpers.js            ← Due date checks, overdue detection
  /data
    mockPatients.js           ← Sample patient records
    mockAppointments.js       ← Sample booked appointments
    mockInvoices.js           ← Sample finalized invoices
    mockItems.js              ← Catalogue: consultations, therapies, medicines, rooms
  App.jsx                     ← Root with context providers + view routing
  main.jsx                    ← React DOM entry point
```

---

## 🔌 Service Layer — Mock to API Pattern

Every service function is `async/await`. To connect a real backend, only the service files need to change — no component code changes required.

### `invoiceService.js`

```js
// MOCK — replace return values with axios/fetch calls for real API

export const getInvoices = async () => {
  return mockInvoices;
  // REAL: return await axios.get('/api/invoices');
};

export const getInvoiceById = async (id) => {
  return mockInvoices.find(inv => inv.id === id);
  // REAL: return await axios.get(`/api/invoices/${id}`);
};

export const saveInvoice = async (invoice) => {
  mockInvoices.push(invoice);
  return invoice;
  // REAL: return await axios.post('/api/invoices', invoice);
};

export const updateInvoice = async (id, data) => {
  const idx = mockInvoices.findIndex(inv => inv.id === id);
  mockInvoices[idx] = { ...mockInvoices[idx], ...data };
  return mockInvoices[idx];
  // REAL: return await axios.put(`/api/invoices/${id}`, data);
};

export const deleteInvoice = async (id) => {
  mockInvoices = mockInvoices.filter(inv => inv.id !== id);
  // REAL: return await axios.delete(`/api/invoices/${id}`);
};

export const getNextInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const count = mockInvoices.length + 1;
  return `INV-${year}-${String(count).padStart(5, '0')}`;
  // REAL: return await axios.get('/api/invoices/next-number');
};
```

### `patientService.js`

```js
export const getPatients = async () => {
  return mockPatients;
  // REAL: return await axios.get('/api/patients');
};

export const getPatientById = async (patientId) => {
  return mockPatients.find(p => p.id === patientId);
  // REAL: return await axios.get(`/api/patients/${patientId}`);
};

export const getPatientByAppointmentId = async (appointmentId) => {
  const appt = mockAppointments.find(a => a.id === appointmentId);
  return mockPatients.find(p => p.id === appt?.patientId) || null;
  // REAL: return await axios.get(`/api/appointments/${appointmentId}/patient`);
};

export const addPatient = async (patientData) => {
  const newPatient = { id: `PAT-${Date.now()}`, ...patientData };
  mockPatients.push(newPatient);
  return newPatient;
  // REAL: return await axios.post('/api/patients', patientData);
};
```

### `appointmentService.js`

```js
export const getAppointments = async () => {
  return mockAppointments;
  // REAL: return await axios.get('/api/appointments');
};

export const getAppointmentsByDoctor = async (doctorId) => {
  return mockAppointments.filter(a => a.doctorId === doctorId);
  // REAL: return await axios.get(`/api/appointments?doctorId=${doctorId}`);
};

export const getAppointmentsByPatient = async (patientId) => {
  return mockAppointments.filter(a => a.patientId === patientId);
  // REAL: return await axios.get(`/api/appointments?patientId=${patientId}`);
};
```

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary Color | `#0a4b6e` (Deep Navy) |
| Background | `#eef2f6` (Soft Grey-Blue) |
| Card Background | `#ffffff` |
| Border Radius — Cards | `18px` |
| Border Radius — Pills / Buttons | `60px` |
| Border Radius — Inner Sections | `12px` |
| Font Family | `Inter` (Google Fonts) |
| Box Shadow | `0 4px 24px rgba(10,75,110,0.10)` |
| Paid Border | `#22c55e` (Green) |
| Partial Border | `#f97316` (Orange) |
| Pending Border | `#ef4444` (Red) |
| Overdue Border | `#a855f7` (Purple) |
| Cancelled/Draft Border | `#9ca3af` (Grey) |
| Sent/Finalized Border | `#3b82f6` (Blue) |

---

## 🔝 Navbar Component

```
[ 💰 AYURSUTRA · Billing ]         [ Dashboard ]  [ Doctor View ]  [ Patient Portal ]  [ 🔔 3 ]
```

- Pill-shaped navbar, full-width, navy background
- Logo on left, tab buttons on right
- Active tab: white text on navy pill highlight
- 🔔 bell icon with red badge showing unread notification count from `NotificationContext`
- Clicking bell opens notification dropdown panel

---

## 📊 Stats Row — 4 Cards

All values computed via `useMemo` over invoice context state. Update instantly on any invoice change.

| Card | Calculation |
|---|---|
| **Today's Collection** | `sum(invoice.paidAmount)` where `invoiceDate === today` and status = Paid/Partial |
| **Pending Amount** | `sum(invoice.balance)` where status = Pending / Unpaid / Partial |
| **Monthly Total** | `sum(invoice.grandTotal)` where `invoiceDate` is within current month |
| **Overdue Count** | `count` where `dueDate < today` and status ∈ {Pending, Unpaid} |

---

## 👁️ View 1 — Doctor Invoice Dashboard

### Invoice List Features

- **Search bar** — filters by Invoice No., Patient Name, Doctor Name in real time
- **Filter pill buttons:** All | OPD | IPD | Medicine | Therapy | Paid | Pending | Overdue | Cancelled
- Invoices rendered as `<InvoiceCard />` components, sorted by date descending

### Invoice Card Layout

```
┌─[STATUS BORDER]────────────────────────────────────────────────────────────┐
│  INV-2026-001          [OPD Badge]      [Paid Badge]                       │
│  Aarav Shah · PAT-001  APT-001          Dr. Sharma                         │
│  20 Apr 2026           Due: 27 Apr 2026                   ₹ 944.00         │
│  [ ✏️ Edit ] [ 👁️ Preview ] [ ⬇️ PDF ] [ 🗑️ Delete ] [ 📤 Set Status ▾ ] │
└────────────────────────────────────────────────────────────────────────────┘
```

- Edit and Delete buttons are **disabled + hidden** for Finalized invoices
- Status badge color matches left border color
- `Set Status` inline dropdown fires `updateInvoice()` from service layer

---

## 👁️ View 2 — Invoice Creation / Edit Form

### Section 1 — Clinic Header

| Field | Type | Notes |
|---|---|---|
| Clinic Logo | File Upload | Square dashed placeholder, image preview |
| Clinic Name | Text Input | Pre-filled: "Ayursutra Panchkarma Clinic" |
| Clinic Address | Text Input | Pre-filled with clinic address |
| Clinic Mobile | Text Input | Pre-filled with clinic mobile |
| Invoice Type | Dropdown | OPD / IPD / Medicine / Therapy — drives item type options |

### Section 2 — Invoice Meta

| Field | Type | Notes |
|---|---|---|
| Invoice Number | Text (readonly) | Auto-generated via `getNextInvoiceNumber()` |
| Invoice Date | DateTime Picker | Auto-filled to current datetime |
| Due Date | Date Picker | Manual input |
| Appointment ID | Dropdown | Pulls from `appointmentService.getAppointments()` — auto-links patient |
| Consultation Type | Dropdown | In-Clinic / Online / Follow-up |
| Doctor Name | Text Input | Auto-filled from selected appointment |
| GST Number | Text Input | Clinic GST number |
| Payment Method | Dropdown | Cash / Card / UPI / Online / Insurance |
| Currency | Text (disabled) | INR ₹ |

### Section 3 — Patient Section

#### Appointment-Linked Auto-Population Flow

```
User selects Appointment ID (APT-002)
          ↓
useAppointment hook calls:
  patientService.getPatientByAppointmentId('APT-002')
          ↓
Returns: { name: 'Meera Patel', age: 28, phone: '+91 98002 22222', ... }
          ↓
PatientCard renders with green badge: "✅ Linked from Appointment"
          ↓
Patient search input is hidden (patient already populated)
```

#### Manual Patient Search Flow (no appointment selected)

```
User types in search input → filters mockPatients by name / phone
          ↓
Dropdown shows: [ Aarav Shah · +91 98001 11111 · Age 34 ]
          ↓
User clicks → PatientCard renders
```

#### New Patient Modal Fields

| Field | Validation |
|---|---|
| Full Name | Required |
| Age | Required, number |
| Phone | Required, 10 digits |
| Address | Optional |

On save → calls `patientService.addPatient()` → adds to PatientContext → auto-selects new patient.

### Section 4 — Items Table

#### Type → Item Options Mapping

| Invoice Type | Available Item Types |
|---|---|
| OPD | Consultation |
| IPD | Room Charges, Medicine, Therapy |
| Medicine | Medicine |
| Therapy | Therapy Package |

#### Catalogue Dropdown by Item Type

| Item Type | Item Name | Unit Price | GST% |
|---|---|---|---|
| Consultation | Initial Consultation | ₹800 | 18% |
| Consultation | Follow-up | ₹400 | 18% |
| Consultation | Senior Doctor | ₹1,200 | 18% |
| Therapy Package | Panchakarma Full | ₹3,500 | 12% |
| Therapy Package | Shirodhara | ₹1,800 | 12% |
| Therapy Package | Abhyanga Massage | ₹1,200 | 12% |
| Medicine | Ashwagandha 60tab | ₹350 | 5% |
| Medicine | Triphala Churna | ₹180 | 5% |
| Medicine | Brahmi Oil | ₹220 | 5% |
| Room Charges | General Ward | ₹1,500/day | 12% |
| Room Charges | Private Room | ₹3,500/day | 12% |

#### Line Total Formula

```
Line Total = Qty × UnitPrice × (1 − itemDiscount / 100) × (1 + GST / 100)
```

- Computed in real time using `useMemo` per row
- Minimum 1 row always present in table
- ➕ Add Row / 🗑️ Delete Row buttons

### Section 5 — Summary Panel

```
┌──────────────────────────┬──────────────────────────────┐
│  Subtotal:   ₹ 3,500.00  │  [  📷 Upload Signature  ]   │
│  Discount:   ₹ 0.00      │  [ Preview | Clear ]         │
│  GST Total:  ₹ 420.00    │                              │
│  ─────────────────────── │  [  🔏 Upload Stamp      ]   │
│  Grand Total: ₹ 3,920.00 │  [ Preview | Clear ]         │
│  (large, navy bold)      │                              │
└──────────────────────────┴──────────────────────────────┘
```

### Section 6 — Payment Row

| Field | Type | Logic |
|---|---|---|
| Payment Status | Dropdown | Auto Paid if paidAmount = grandTotal; Auto Partial if 0 < paidAmount < grandTotal |
| Paid Amount | Number Input | Auto-fills grandTotal when status = Paid |
| Balance Due | Number (readonly) | `grandTotal − paidAmount` |
| Notes / Remarks | Textarea | Free text |

#### Auto Overdue Detection (`useEffect`)

```js
useEffect(() => {
  invoices.forEach(inv => {
    if (
      new Date(inv.dueDate) < new Date() &&
      ['Pending', 'Unpaid'].includes(inv.status)
    ) {
      updateInvoice(inv.id, { status: 'Overdue' });
      notificationContext.add({
        message: `Invoice ${inv.invoiceNumber} is now overdue`,
        type: 'warning',
        patientId: inv.patientId
      });
    }
  });
}, [invoices]);
```

### Section 7 — Action Buttons

| Button | Status Set | Patient Visibility | Editable After |
|---|---|---|---|
| 💾 Save Draft | Draft | ❌ Hidden | ✅ Yes |
| 📤 Send to Patient | Sent | ✅ Visible | ✅ Yes |
| 🔒 Finalize | Finalized | 🔒 Locked | ❌ No |
| 👁️ Preview | — | — | — |
| ✖️ Cancel | — | — | — |

---

## 👁️ View 3 — Patient Portal

### Patient Selector

- Dropdown at top of Patient Portal (simulates logged-in patient for demo)
- **Only shows patients who have at least one booked appointment** in `mockAppointments`
- On patient switch → invoice list and notifications re-filter

### Patient Invoice List Rules

- Shows **only invoices where status ≠ Draft** for selected patient
- All actions: **View Detail** and **Download PDF** only — strictly read-only
- No edit, delete, or status-change controls visible

### Notification Banner

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🔔  New invoice INV-2026-002 sent by Dr. Sharma · View →              │
│  ⚠️  Invoice INV-2026-003 is overdue — Balance due: ₹ 5,460.00        │
│  📅  Payment reminder: INV-2026-004 due tomorrow                       │
└─────────────────────────────────────────────────────────────────────────┘
```

- Notifications generated by `NotificationContext` on every status change
- Payment due reminder: generated on load if `dueDate === tomorrow`
- Bell icon in Navbar shows unread count badge — clears when viewed

---

## 📄 Invoice Preview Modal

Full-screen overlay → A4 white paper (max-width: 794px, centered, `box-shadow` heavy)

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Clinic Logo]   Ayursutra Panchkarma Clinic          INVOICE           │
│  123 Wellness Street, Surat                    INV-2026-001             │
│  +91 98765 00000 · GST: 24XXXXX               Date: 20 Apr 2026        │
│  ─────────────────────────────────────────────Due: 27 Apr 2026─────── │
│                                                                         │
│  Patient: Aarav Shah · Age 34 · +91 98001 11111 · PAT-001              │
│  Doctor: Dr. Sharma · Appt: APT-001 · Type: In-Clinic                  │
│ ─────────────────────────────────────────────────────────────────────  │
│  #  Item Name        Desc    Qty   Price    Disc   GST%    Total        │
│  1  Initial Consult          1    ₹800.00   0%     18%    ₹944.00      │
│ ─────────────────────────────────────────────────────────────────────  │
│                                   Subtotal:              ₹800.00       │
│                                   Total Discount:        ₹0.00         │
│                                   GST Total:             ₹144.00       │
│                              ════ Grand Total:           ₹944.00 ════  │
│                                                                         │
│  Payment: UPI · Status: Paid · Paid: ₹944.00 · Balance: ₹0.00         │
│ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - │
│  [Doctor Signature Image]              [Clinic Stamp Image]             │
│                                                                         │
│  Remarks: Thank you for visiting Ayursutra Panchkarma Clinic.          │
│ ─────────────────────────────────────────────────────────────────────  │
│              [ ⬇️ Download PDF ]  [ 🖨️ Print ]  [ ✖️ Close ]          │
└─────────────────────────────────────────────────────────────────────────┘
```

### PDF Generation (`pdfGenerator.js`)

```js
import html2pdf from 'html2pdf.js';

export const generateInvoicePDF = (elementId, filename) => {
  const element = document.getElementById(elementId);
  const options = {
    margin:       10,
    filename:     filename || 'invoice.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(options).from(element).save();
};
```

---

## 🖨️ Print CSS

```css
@media print {
  body > *:not(#invoice-print-area) { display: none !important; }
  #invoice-print-area {
    width: 100%;
    box-shadow: none;
    margin: 0;
    padding: 0;
  }
  .no-print { display: none !important; }
}
```

---

## 🔗 Patient ↔ Appointment ↔ Invoice — Full Connection Flow

```
1. Appointment is booked (exists in mockAppointments)
          ↓
2. appointmentService.getAppointments() returns list
   { id: 'APT-001', patientId: 'PAT-001', doctorName: 'Dr. Sharma',
     date: '2026-04-20', type: 'In-Clinic' }
          ↓
3. Doctor opens Invoice Form → Appointment ID dropdown shows APT-001
          ↓
4. Doctor selects APT-001
   → patientService.getPatientByAppointmentId('APT-001') called
   → Returns: { name: 'Aarav Shah', age: 34, phone: '+91 98001 11111' }
          ↓
5. Patient section auto-fills + "✅ Linked from Appointment" badge shown
   Doctor Name, Consultation Type also auto-filled
          ↓
6. Doctor fills items, clicks "Send to Patient"
   → invoiceService.saveInvoice(invoice) called with status: 'Sent'
          ↓
7. InvoiceContext updates → Patient Portal re-renders
   → Invoice appears in Meera / Aarav's portal instantly
          ↓
8. NotificationContext fires:
   { message: 'New invoice INV-2026-002 sent by Dr. Sharma', patientId: 'PAT-002' }
          ↓
9. Bell badge count increments in Navbar
   Notification banner shows in Patient Portal
```

---

## 📦 Pre-loaded Mock Data

### `mockPatients.js`

```

### `mockAppointments.js`

```js

];
```

### `mockInvoices.js`



### `mockItems.js`

```js
export const mockItems = {
  'Consultation': [
    { name: 'Initial Consultation', price: 800,  gst: 18 },
    { name: 'Follow-up',            price: 400,  gst: 18 },
    { name: 'Senior Doctor',        price: 1200, gst: 18 },
  ],
  'Therapy Package': [
    { name: 'Panchakarma Full',   price: 3500, gst: 12 },
    { name: 'Shirodhara',         price: 1800, gst: 12 },
    { name: 'Abhyanga Massage',   price: 1200, gst: 12 },
  ],
  'Medicine': [
    { name: 'Ashwagandha 60tab', price: 350, gst: 5 },
    { name: 'Triphala Churna',   price: 180, gst: 5 },
    { name: 'Brahmi Oil',        price: 220, gst: 5 },
  ],
  'Room Charges': [
    { name: 'General Ward',  price: 1500, gst: 12 },
    { name: 'Private Room',  price: 3500, gst: 12 },
  ],
};
```

---

## ⚙️ Invoice Status Lifecycle

| Status | Meaning | Patient Visibility | Editable |
|---|---|---|---|
| Draft | Created, not sent | ❌ Hidden | ✅ Yes |
| Sent | Pushed to patient | ✅ Visible | ✅ Yes |
| Paid | Payment confirmed | ✅ Live update | ✅ Yes |
| Partial | Balance pending | ✅ Live update | ✅ Yes |
| Unpaid | No payment received | ✅ Live update | ✅ Yes |
| Overdue | Past due date | ✅ Patient notified | ✅ Yes |
| Cancelled | Invoice voided | ✅ Marked cancelled | ✅ Yes |
| Finalized | Locked forever | 🔒 Both sides locked | ❌ No |

### Doctor Action → Patient Effect

| Doctor Action | Patient Effect |
|---|---|
| Creates (Draft) | Not visible in Patient Portal |
| Sets to Sent | Invoice instantly appears in Patient Portal |
| Updates (pre-Finalized) | Patient view auto-updates via context |
| Marks Paid | Status badge updates to Paid instantly |
| Marks Overdue | Notification fires + status badge updates |
| Cancels | Marked Cancelled on patient side instantly |
| Finalizes | Locked and non-editable on both sides |

---

## 🧠 Core Business Logic Rules

| Rule | Implementation |
|---|---|
| Auto-increment invoice numbers | `getNextInvoiceNumber()` via invoiceService |
| Patient list in Invoice Form | Only patients with ≥1 booked appointment shown |
| Appointment → Patient auto-link | `getPatientByAppointmentId()` called on appt select |
| Overdue auto-detection | `useEffect` on mount checks `dueDate < today` |
| Stats recalculation | `useMemo` over full invoice array in InvoiceContext |
| Notifications | `NotificationContext.add()` called on every status change |
| Draft hidden from Patient Portal | Filter: `status !== 'Draft'` in patient view |
| Finalized = fully locked | Edit, Delete, Status-change all disabled |
| Line Total formula | `Qty × Price × (1 − disc/100) × (1 + gst/100)` |
| Grand Total formula | `Σ(Line Totals) − globalDiscount` |
| Balance formula | `grandTotal − paidAmount` |
| Auto status switch to Paid | `paidAmount >= grandTotal → status = 'Paid'` |
| Auto status switch to Partial | `0 < paidAmount < grandTotal → status = 'Partial'` |

---

## 📋 Component Props Reference

### `<InvoiceCard invoice={} onEdit onPreview onDelete onStatusChange />`

### `<InvoiceForm invoiceId={null|id} onSave onCancel />`

### `<InvoicePreviewModal invoice={} isOpen onClose />`

### `<PatientSearch onSelect onNewPatient />`

### `<PatientCard patient={} appointmentLinked={bool} />`

### `<ItemsTable invoiceType="" items={[]} onChange />`

### `<SummaryPanel subtotal gstTotal grandTotal onSignatureUpload onStampUpload />`

### `<PaymentRow status paidAmount grandTotal onChange />`

### `<NotificationBanner notifications={[]} onDismiss />`

---

## 🚀 Backend Integration Checklist

When connecting a real backend, only these files need to change:

- [ ] `src/services/invoiceService.js` — replace mock returns with `axios` calls
- [ ] `src/services/patientService.js` — replace mock returns with `axios` calls
- [ ] `src/services/appointmentService.js` — replace mock returns with `axios` calls
- [ ] `src/data/mock*.js` — can be deleted once API is live
- [ ] Add `axios` or `fetch` wrapper with auth headers / base URL config
- [ ] Add loading states (`isLoading`) and error handling to all service calls
- [ ] No component, context, or hook files need to change

---

*Spec Version 1.0.0 — Ayursutra Panchkarma Clinic — Invoice Module*
