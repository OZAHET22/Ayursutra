const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Recompute totals from line items + discountAmount, then save */
function recomputeTotals(invoice) {
    let subtotal = 0;
    let gstTotal = 0;
    invoice.items.forEach(item => {
        const base = item.qty * item.unitPrice * (1 - (item.itemDiscount || 0) / 100);
        const gstAmt = base * ((item.gst || 0) / 100);
        item.lineTotal = parseFloat((base + gstAmt).toFixed(2));
        subtotal += item.qty * item.unitPrice;
        gstTotal += gstAmt;
    });
    invoice.subtotal = parseFloat(subtotal.toFixed(2));
    invoice.gstTotal = parseFloat(gstTotal.toFixed(2));
    const disc = invoice.discountAmount || 0;
    invoice.grandTotal = parseFloat(Math.max(0, subtotal - disc + gstTotal).toFixed(2));
    invoice.balance = parseFloat(Math.max(0, invoice.grandTotal - (invoice.paidAmount || 0)).toFixed(2));
}

/** Emit socket event to doctor and (if registered) patient */
async function emitInvoiceEvent(io, invoice, event) {
    if (!io) return;
    try {
        const payload = {
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            patientId: invoice.patientId,
            doctorId: invoice.doctorId,
        };
        // Always notify doctor
        io.to(`user_${invoice.doctorId}`).emit(event, payload);
        // Notify patient only if they are a registered user
        if (invoice.isRegisteredPatient && mongoose.Types.ObjectId.isValid(invoice.patientId)) {
            io.to(`user_${invoice.patientId}`).emit(event, payload);
        }
    } catch (e) {
        console.error('[Invoice] Socket emit error:', e.message);
    }
}

/** Push an in-app notification to the patient (registered only) */
async function notifyPatientInApp(io, invoice, title, message) {
    if (!invoice.isRegisteredPatient || !mongoose.Types.ObjectId.isValid(invoice.patientId)) return;
    try {
        const Notification = require('../models/Notification');
        const notif = await Notification.create({
            userId: invoice.patientId,
            title,
            message,
            type: 'info',
        });
        if (io) {
            io.to(`user_${invoice.patientId}`).emit('new_notification', {
                _id: notif._id,
                title: notif.title,
                message: notif.message,
                type: notif.type,
                read: false,
                createdAt: notif.createdAt,
            });
        }
    } catch (e) {
        console.error('[Invoice] Patient notify error:', e.message);
    }
}

// ─── GET /api/invoices/next-number ─────────────────────────────────────────────
// Must be BEFORE /:id routes
router.get('/next-number', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const year = new Date().getFullYear();
        const count = await Invoice.countDocuments();
        const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
        res.json({ success: true, invoiceNumber });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/invoices ──────────────────────────────────────────────────────────
// Doctor: all invoices for this doctor
// Patient: all non-draft invoices for this patient
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'doctor') {
            query.doctorId = req.user._id;
        } else if (req.user.role === 'patient') {
            query.patientId = String(req.user._id);
            query.status = { $nin: ['Draft'] };
        } else if (req.user.role === 'admin') {
            // admin sees everything — optional filters
            if (req.query.doctorId) query.doctorId = req.query.doctorId;
        }

        const invoices = await Invoice.find(query)
            .sort({ invoiceDate: -1 })
            .lean();

        res.json({ success: true, data: invoices });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/invoices/:id ──────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).lean();
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

        // Access control
        if (
            req.user.role === 'patient' &&
            String(invoice.patientId) !== String(req.user._id)
        ) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (
            req.user.role === 'doctor' &&
            String(invoice.doctorId) !== String(req.user._id)
        ) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, data: invoice });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── POST /api/invoices ─────────────────────────────────────────────────────────
router.post('/', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const io = req.app.get('io');
        const body = req.body;

        // Check for duplicate invoice number
        const existing = await Invoice.findOne({ invoiceNumber: body.invoiceNumber });
        if (existing) {
            // Re-generate a safe unique number
            const year = new Date().getFullYear();
            const count = await Invoice.countDocuments();
            body.invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
        }

        // Auto-populate doctor info from JWT user
        body.doctorId = req.user._id;
        if (!body.doctorName) body.doctorName = req.user.name;

        // If appointmentId provided, auto-link patient
        if (body.appointmentId && mongoose.Types.ObjectId.isValid(body.appointmentId)) {
            const appt = await Appointment.findById(body.appointmentId).lean();
            if (appt) {
                body.patientId = String(appt.patientId);
                if (!body.patientName) body.patientName = appt.patientName;
                if (!body.consultationType) body.consultationType = appt.type;
                if (!body.doctorName) body.doctorName = appt.doctorName;
            }
        }

        const invoice = new Invoice(body);
        recomputeTotals(invoice);
        await invoice.save();

        // Emit socket + notify patient if status is Sent+
        await emitInvoiceEvent(io, invoice, 'invoice_created');
        if (invoice.status === 'Sent') {
            await notifyPatientInApp(io, invoice,
                `New Invoice: ${invoice.invoiceNumber}`,
                `Dr. ${invoice.doctorName} sent you a new invoice for ₹${invoice.grandTotal.toLocaleString('en-IN')}.`
            );
        }

        res.status(201).json({ success: true, data: invoice });
    } catch (err) {
        console.error('[Invoice POST]', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── PUT /api/invoices/:id ──────────────────────────────────────────────────────
router.put('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const io = req.app.get('io');
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

        // Finalized invoices are locked
        if (invoice.status === 'Finalized') {
            return res.status(403).json({ success: false, message: 'Finalized invoices cannot be edited' });
        }

        // Doctor can only update their own invoices
        if (req.user.role === 'doctor' && String(invoice.doctorId) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const prevStatus = invoice.status;

        // Apply updates
        const allowed = [
            'invoiceType', 'invoiceDate', 'dueDate', 'consultationType', 'paymentMethod',
            'clinicName', 'clinicAddress', 'clinicMobile', 'gstNumber', 'clinicLogoBase64',
            'doctorName', 'patientName', 'patientAge', 'patientPhone', 'patientAddress',
            'appointmentId', 'items', 'discountAmount', 'status',
            'paidAmount', 'notes', 'signatureBase64', 'stampBase64',
        ];
        allowed.forEach(key => {
            if (req.body[key] !== undefined) invoice[key] = req.body[key];
        });

        // Auto-status switch based on payment
        if (req.body.paidAmount !== undefined && invoice.status !== 'Finalized' && invoice.status !== 'Cancelled') {
            const paid = Number(req.body.paidAmount);
            const grand = invoice.grandTotal;
            if (paid >= grand && grand > 0) invoice.status = 'Paid';
            else if (paid > 0 && paid < grand) invoice.status = 'Partial';
            else if (paid === 0 && invoice.status !== 'Overdue') invoice.status = 'Unpaid';
        }

        recomputeTotals(invoice);
        await invoice.save();

        // Emit update event
        await emitInvoiceEvent(io, invoice, 'invoice_updated');

        // Status-change notifications
        if (prevStatus !== invoice.status) {
            let title = `Invoice ${invoice.invoiceNumber} Updated`;
            let msg = `Your invoice status changed to ${invoice.status}.`;
            if (invoice.status === 'Sent') {
                title = `New Invoice: ${invoice.invoiceNumber}`;
                msg = `Dr. ${invoice.doctorName} sent you an invoice for ₹${invoice.grandTotal.toLocaleString('en-IN')}.`;
            } else if (invoice.status === 'Paid') {
                title = `Payment Confirmed: ${invoice.invoiceNumber}`;
                msg = `Your payment of ₹${invoice.paidAmount.toLocaleString('en-IN')} has been confirmed.`;
            } else if (invoice.status === 'Overdue') {
                title = `⚠️ Overdue: ${invoice.invoiceNumber}`;
                msg = `Your invoice is overdue. Balance due: ₹${invoice.balance.toLocaleString('en-IN')}.`;
            }
            if (invoice.status !== 'Draft') {
                await notifyPatientInApp(io, invoice, title, msg);
            }
        }

        res.json({ success: true, data: invoice });
    } catch (err) {
        console.error('[Invoice PUT]', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── DELETE /api/invoices/:id ───────────────────────────────────────────────────
router.delete('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const io = req.app.get('io');
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

        if (invoice.status === 'Finalized') {
            return res.status(403).json({ success: false, message: 'Finalized invoices cannot be deleted' });
        }
        if (req.user.role === 'doctor' && String(invoice.doctorId) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await invoice.deleteOne();
        await emitInvoiceEvent(io, invoice, 'invoice_deleted');
        res.json({ success: true, message: 'Invoice deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── GET /api/invoices/stats/summary ───────────────────────────────────────────
// Dashboard stat cards for the doctor
router.get('/stats/summary', protect, authorize('doctor', 'admin'), async (req, res) => {
    try {
        const doctorId = req.user.role === 'admin' ? null : req.user._id;
        const query = doctorId ? { doctorId } : {};

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const all = await Invoice.find(query).lean();

        const todayCollection = all
            .filter(i => new Date(i.invoiceDate) >= todayStart && ['Paid', 'Partial'].includes(i.status))
            .reduce((s, i) => s + (i.paidAmount || 0), 0);

        const pendingAmount = all
            .filter(i => ['Pending', 'Unpaid', 'Partial', 'Sent'].includes(i.status))
            .reduce((s, i) => s + (i.balance || 0), 0);

        const monthlyTotal = all
            .filter(i => new Date(i.invoiceDate) >= monthStart)
            .reduce((s, i) => s + (i.grandTotal || 0), 0);

        const overdueCount = all.filter(i =>
            i.dueDate &&
            new Date(i.dueDate) < today &&
            ['Pending', 'Unpaid', 'Sent'].includes(i.status)
        ).length;

        res.json({
            success: true,
            data: { todayCollection, pendingAmount, monthlyTotal, overdueCount },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
