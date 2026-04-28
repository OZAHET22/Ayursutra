# Invoice & Feedback API Quick Reference

## 🧾 INVOICE ENDPOINTS

### List Invoices
```
GET /api/invoices?page=1&limit=20
Authorization: Bearer token
Response: { success, data: [], pagination: { page, limit, total, pages } }
```

### Get Single Invoice
```
GET /api/invoices/:id
Authorization: Bearer token
Response: { success, data: { ...invoice } }
Error: 404 if not found, 403 if unauthorized
```

### Create Invoice
```
POST /api/invoices
Authorization: Bearer token (doctor/admin)
Body: {
    invoiceNo: "INV-001",
    issueDateTime: "2024-04-17",
    patient: { name: "John", age: 30, phone: "9876543210", address: "..." },
    items: [
        { name: "Consultation", qty: 1, price: 500, gst: 18 },
        { name: "Medicine", qty: 2, price: 200, gst: 18 }
    ],
    subtotal: 900,
    taxTotal: 162,
    grandTotal: 1062,
    clinicName: "Clinic Name",
    clinicAddress: "Address",
    clinicMobile: "1234567890",
    clinicGst: "27AABCU1234A1Z5",
    notes: "Any notes"
}
Response: { success, data: { ...created invoice } }
Error: 400 if validation fails, 409 if duplicate invoiceNo
```

### Update Invoice
```
PUT /api/invoices/:id
Authorization: Bearer token (owner only)
Body: { ...fields to update, doctorId will be ignored }
Response: { success, data: { ...updated invoice } }
Error: 403 if not owner, 403 if finalized, 400 if validation fails
```

### Update Invoice Status (Payment)
```
PATCH /api/invoices/:id/status
Authorization: Bearer token (owner only)
Body: { paymentStatus: "Paid", paidAmount: 1062 }
Response: { success, data: { ...invoice with updated status } }
Error: 400 if paidAmount > grandTotal
```

### Finalize Invoice (Lock for editing)
```
PATCH /api/invoices/:id/finalize
Authorization: Bearer token (owner only)
Body: {} (empty)
Response: { success, data: { ...finalized invoice }, message: "..." }
Error: 400 if already finalized
```

### Delete Invoice
```
DELETE /api/invoices/:id
Authorization: Bearer token (owner only)
Response: { success, message: "Invoice deleted" }
Error: 403 if not draft, 403 if not owner
```

---

## 💬 FEEDBACK ENDPOINTS

### List Feedback
```
GET /api/feedback?page=1&limit=10
Authorization: Bearer token
Response: { success, data: [], pagination: { page, limit, total, pages } }
Note: Patients see own, doctors see their feedback, admins see all
```

### Get Single Feedback
```
GET /api/feedback/:id
Authorization: Bearer token
Response: { success, data: { ...feedback } }
Error: 404 if not found, 403 if unauthorized
```

### Submit Feedback
```
POST /api/feedback
Authorization: Bearer token (patient only)
Body: {
    doctorId: "doctor_id",
    rating: 5,
    content: "Excellent service and very helpful doctor"
}
Response: { success, data: { ...created feedback } }
Error: 400 if validation fails, 429 if duplicate (same-day same-doctor)
Validation:
- content: 10-2000 chars
- rating: 1-5
- doctorId: must exist and be approved
```

### Update Feedback (Patient Only)
```
PUT /api/feedback/:id
Authorization: Bearer token (patient owner only)
Body: { 
    content: "Updated feedback text",
    rating: 4
}
Response: { success, data: { ...updated feedback }, message: "..." }
Error: 400 if doctor already replied, 403 if not owner
```

### Add Reply (Doctor Only)
```
PUT /api/feedback/:id/reply
Authorization: Bearer token (doctor owner only)
Body: { reply: "Thank you for your feedback!" }
Response: { success, data: { ...feedback with reply }, message: "..." }
Error: 403 if not feedback owner, 403 if doctor no longer approved
```

### Update Reply (Doctor Only)
```
PATCH /api/feedback/:id/reply
Authorization: Bearer token (doctor owner only)
Body: { reply: "Updated reply text" }
Response: { success, data: { ...feedback with updated reply }, message: "..." }
Error: 400 if no reply to edit yet
```

### Delete Feedback
```
DELETE /api/feedback/:id
Authorization: Bearer token (patient owner OR admin)
Response: { success, message: "Feedback deleted successfully" }
Error: 403 if not authorized
```

---

## 📋 VALIDATION RULES

### Invoice
- `invoiceNo`: Required, unique per doctor
- `patient.name`: Required
- `items`: At least 1, max field lengths enforced
- `items[].qty`: > 0, <= 10,000
- `items[].price`: >= 0, <= 1,000,000
- `items[].gst`: >= 0, <= 100%
- `grandTotal`: > 0
- `paidAmount`: Cannot exceed grandTotal
- `notes`: Max 1000 chars

### Feedback
- `content`: 10-2000 chars (required)
- `rating`: 1-5 (required)
- `doctorId`: Must exist and be approved
- Rate limit: 1 per doctor per 24 hours
- `reply`: 5-2000 chars (when replying)

---

## 🔐 AUTHORIZATION MATRIX

| Endpoint | Patient | Doctor | Admin |
|----------|---------|--------|-------|
| GET /invoices | ❌ | Own only | All |
| GET /invoices/:id | ❌ | Own only | Any |
| POST /invoices | ❌ | ✅ | ✅ |
| PUT /invoices/:id | ❌ | Own only | Any |
| PATCH /invoices/:id/status | ❌ | Own only | Any |
| PATCH /invoices/:id/finalize | ❌ | Own only | Any |
| DELETE /invoices/:id | ❌ | Own draft only | Any |
| GET /feedback | Own | Own | All |
| GET /feedback/:id | Own | Own | Any |
| POST /feedback | ✅ | ❌ | ❌ |
| PUT /feedback/:id | Own | ❌ | ❌ |
| PUT /feedback/:id/reply | ❌ | Own | Own |
| PATCH /feedback/:id/reply | ❌ | Own | Own |
| DELETE /feedback/:id | Own | ❌ | Any |

---

## ⚠️ ERROR RESPONSES

### Common Status Codes
- `400` - Validation failed (bad request)
- `401` - Not authenticated
- `403` - Not authorized
- `404` - Resource not found
- `409` - Duplicate (e.g., invoiceNo)
- `429` - Too many requests (rate limited)
- `500` - Server error

### Example Error Response
```json
{
    "success": false,
    "message": "Feedback must be at least 10 characters"
}
```

---

## 🚀 FRONTEND USAGE

### Invoice Service
```javascript
import * as invoiceService from '@/services/invoiceService';

// Get invoices with pagination
const { data, pagination } = await invoiceService.getInvoices(1, 20);

// Create invoice with validation
const errors = invoiceService.validateInvoiceData(invoiceData);
if (errors.length === 0) {
    const invoice = await invoiceService.createInvoice(invoiceData);
}

// Finalize invoice
await invoiceService.finalizeInvoice(invoiceId);

// Update status
await invoiceService.updateInvoiceStatus(invoiceId, 'Paid', 1062);
```

### Feedback Service
```javascript
import * as feedbackService from '@/services/feedbackService';

// Submit feedback with validation
const errors = feedbackService.validateFeedbackData(feedbackData);
if (errors.length === 0) {
    const feedback = await feedbackService.submitFeedback(feedbackData);
}

// Patient edits feedback
await feedbackService.updateFeedback(feedbackId, { content, rating });

// Doctor adds reply
await feedbackService.replyFeedback(feedbackId, replyText);

// Doctor edits reply
await feedbackService.updateReply(feedbackId, newReplyText);
```

---

## 📊 DATABASE MIGRATIONS

After deployment, run:

```javascript
// Create indexes
db.invoices.createIndex({ invoiceNo: 1, doctorId: 1 }, { unique: true });
db.invoices.createIndex({ doctorId: 1, createdAt: -1 });
db.feedback.createIndex({ doctorId: 1, createdAt: -1 });
db.feedback.createIndex({ patientId: 1, createdAt: -1 });

// Add new fields to existing docs
db.invoices.updateMany({}, {
    $set: { 
        isFinalized: false, 
        finalizedAt: null,
        paymentHistory: []
    }
});

db.feedback.updateMany({}, {
    $set: { 
        isEdited: false, 
        editHistory: [],
        replyDate: null
    }
});
```

---

**Last Updated:** April 17, 2026  
**Version:** 1.0  
**Status:** Production Ready ✅
