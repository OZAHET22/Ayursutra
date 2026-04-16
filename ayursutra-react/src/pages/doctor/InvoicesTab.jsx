import { useState, useRef, useEffect } from 'react';
import { getInvoices, createInvoice, updateInvoice, updateInvoiceStatus, deleteInvoice } from '../../services/invoiceService';
import { getMyPatients } from '../../services/userService';
import { getCatalogueItems, saveCatalogueItem, updateCatalogueItem, deleteCatalogueItem } from '../../services/catalogueService';

// Fallback default items shown when catalogue is empty (seeded on first use)
const DEFAULT_CATALOGUE = [
    { type: 'Consultation', name: 'Initial Consultation',   price: 800,  gst: 18 },
    { type: 'Consultation', name: 'Follow-up Consultation', price: 400,  gst: 18 },
    { type: 'Consultation', name: 'Emergency Consultation', price: 1200, gst: 18 },
    { type: 'Medicine',  name: 'Ashwagandha',    price: 450,  gst: 5 },
    { type: 'Medicine',  name: 'Triphala',       price: 300,  gst: 5 },
    { type: 'Medicine',  name: 'Brahmi',         price: 350,  gst: 5 },
    { type: 'Medicine',  name: 'Tulsi Ark',      price: 200,  gst: 5 },
    { type: 'Medicine',  name: 'Chyawanprash',   price: 500,  gst: 5 },
    { type: 'Medicine',  name: 'Trikatu Churna', price: 250,  gst: 5 },
    { type: 'Therapy',   name: 'Panchakarma Detox', price: 5000, gst: 18 },
    { type: 'Therapy',   name: 'Abhyanga Massage',  price: 1500, gst: 18 },
    { type: 'Therapy',   name: 'Shirodhara',         price: 2000, gst: 18 },
    { type: 'Therapy',   name: 'Vamana',             price: 3000, gst: 18 },
    { type: 'Therapy',   name: 'Virechana',          price: 2500, gst: 18 },
    { type: 'Therapy',   name: 'Nasya',              price: 1200, gst: 18 },
    { type: 'Therapy',   name: 'Basti',              price: 2800, gst: 18 },
    { type: 'Therapy',   name: 'Raktamokshana',      price: 3500, gst: 18 },
    { type: 'Room Charges', name: 'Deluxe Room (per day)',   price: 3000, gst: 18 },
    { type: 'Room Charges', name: 'Standard Room (per day)', price: 1800, gst: 18 },
    { type: 'Room Charges', name: 'Suite Room (per day)',    price: 5000, gst: 18 },
];

const ALL_ITEM_TYPES = ['Consultation', 'Medicine', 'Therapy', 'Room Charges'];

// ─── Item Catalogues (prices/types only — not patient data) ────────────────
const MEDICINE_ITEMS = [
    { id: 1, name: 'Ashwagandha', price: 450, gst: 5 },
    { id: 2, name: 'Triphala', price: 300, gst: 5 },
    { id: 3, name: 'Brahmi', price: 350, gst: 5 },
    { id: 4, name: 'Tulsi Ark', price: 200, gst: 5 },
    { id: 5, name: 'Chyawanprash', price: 500, gst: 5 },
    { id: 6, name: 'Trikatu Churna', price: 250, gst: 5 },
];
const THERAPY_ITEMS = [
    { id: 1, name: 'Panchakarma Detox', price: 5000, gst: 18 },
    { id: 2, name: 'Abhyanga Massage', price: 1500, gst: 18 },
    { id: 3, name: 'Shirodhara', price: 2000, gst: 18 },
    { id: 4, name: 'Vamana', price: 3000, gst: 18 },
    { id: 5, name: 'Virechana', price: 2500, gst: 18 },
    { id: 6, name: 'Nasya', price: 1200, gst: 18 },
    { id: 7, name: 'Basti', price: 2800, gst: 18 },
    { id: 8, name: 'Raktamokshana', price: 3500, gst: 18 },
];
const CONSULTATION_ITEMS = [
    { id: 1, name: 'Initial Consultation', price: 800, gst: 18 },
    { id: 2, name: 'Follow-up Consultation', price: 400, gst: 18 },
    { id: 3, name: 'Emergency Consultation', price: 1200, gst: 18 },
];
const ROOM_CHARGES_ITEMS = [
    { id: 1, name: 'Deluxe Room (per day)', price: 3000, gst: 18 },
    { id: 2, name: 'Standard Room (per day)', price: 1800, gst: 18 },
    { id: 3, name: 'Suite Room (per day)', price: 5000, gst: 18 },
];

function getTypeOptions(invoiceType) {
    if (invoiceType === 'OPD') return ['Consultation', 'Medicine', 'Therapy'];
    if (invoiceType === 'IPD') return ['Room Charges', 'Medicine', 'Therapy'];
    if (invoiceType === 'Medicine') return ['Medicine'];
    return ['Therapy', 'Consultation'];
}

function makeRow() {
    return { id: Date.now() + Math.random(), type: 'Consultation', name: '', desc: '', qty: 1, price: 0, gst: 18 };
}

function nowDT() {
    const d = new Date();
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0') + 'T' +
        String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0');
}

export default function InvoicesTab({ showNotification }) {
    const [invoices, setInvoices]       = useState([]);
    const [allPatients, setAllPatients] = useState([]);
    const [catalogue, setCatalogue]     = useState([]);  // DB-backed item catalogue
    const [loading, setLoading]         = useState(true);
    const [view, setView]               = useState('list');
    const [editingId, setEditingId]     = useState(null);
    const [error, setError]             = useState(null);

    // ── Catalogue management state ─────────────────────────────────────────────
    const [showCatMgr, setShowCatMgr]   = useState(false);
    const [catForm, setCatForm]         = useState({ type: 'Consultation', name: '', desc: '', price: '', gst: 18 });
    const [catSaving, setCatSaving]     = useState(false);
    const [catEditId, setCatEditId]     = useState(null);
    const [catSearch, setCatSearch]     = useState('');
    const [catTypeFilter, setCatTypeFilter] = useState('all');

    // ── Form state ─────────────────────────────────────────────────────────
    const [clinicName, setClinicName] = useState('Ayursutra Panchkarma Clinic');
    const [clinicAddress, setClinicAddress] = useState('');
    const [clinicMobile, setClinicMobile] = useState('');
    const [clinicGst, setClinicGst] = useState('');
    const [invoiceNo, setInvoiceNo] = useState('');
    const [issueDateTime, setIssueDateTime] = useState(nowDT());
    const [invoiceType, setInvoiceType] = useState('OPD');
    const [patient, setPatient] = useState(null);
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientResults, setShowPatientResults] = useState(false);
    const [rows, setRows] = useState([makeRow()]);
    const [paymentStatus, setPaymentStatus] = useState('Pending');
    const [paidAmount, setPaidAmount] = useState(0);
    const [notes, setNotes] = useState('');
    const [signatureData, setSignatureData] = useState('');
    const [stampData, setStampData] = useState('');
    const [logoData, setLogoData] = useState('');

    // ── List state ─────────────────────────────────────────────────────────
    const [listFilter, setListFilter] = useState('all');
    const [listSearch, setListSearch] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [showQuickPatient, setShowQuickPatient] = useState(false);
    const [qpForm, setQpForm] = useState({ name: '', age: '', gender: 'Male', phone: '', address: '' });

    const sigInputRef = useRef();
    const stampInputRef = useRef();
    const logoInputRef = useRef();

    // ── Load invoices + patients + catalogue from DB ───────────────────────────
    const loadData = async () => {
        try {
            setError(null);
            const [invData, patData, catData] = await Promise.all([
                getInvoices(),
                getMyPatients(),
                getCatalogueItems(),
            ]);
            setInvoices(invData || []);
            setAllPatients((patData || []).map(p => ({
                id: p._id,
                name: p.name,
                age: p.age || '—',
                phone: p.phone || '',
                address: p.address || '',
            })));
            // Merge DB catalogue with DEFAULT_CATALOGUE (DB takes priority by overriding defaults)
            const dbNames = new Set((catData || []).map(i => i.type + '|' + i.name));
            const merged  = [
                ...(catData || []),
                ...DEFAULT_CATALOGUE.filter(d => !dbNames.has(d.type + '|' + d.name)),
            ];
            setCatalogue(merged);
        } catch (err) {
            setError('Failed to load data. Please refresh.');
            showNotification && showNotification('Failed to load invoices', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // ── Computed totals ────────────────────────────────────────────────────
    const subtotal = rows.reduce((s, r) => s + r.qty * r.price, 0);
    const taxTotal = rows.reduce((s, r) => s + r.qty * r.price * r.gst / 100, 0);
    const grandTotal = subtotal + taxTotal;
    const balance = grandTotal - paidAmount;

    // ── Stats ──────────────────────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);
    const todayTotal = invoices.filter(i => !i.isDraft && (i.issueDateTime || '').slice(0, 10) === today).reduce((s, i) => s + (i.paidAmount || 0), 0);
    const pendingTotal = invoices.filter(i => !i.isDraft && i.paymentStatus !== 'Paid').reduce((s, i) => s + ((i.grandTotal || 0) - (i.paidAmount || 0)), 0);
    const monthTotal = invoices.filter(i => !i.isDraft && new Date(i.issueDateTime).getMonth() === new Date().getMonth()).reduce((s, i) => s + (i.paidAmount || 0), 0);

    function genInvoiceNo() {
        return 'INV-' + new Date().getFullYear() + '-' + String(invoices.filter(i => !i.isDraft).length + 1).padStart(3, '0');
    }

    function openCreate() {
        setEditingId(null);
        setInvoiceNo(genInvoiceNo());
        setIssueDateTime(nowDT());
        setInvoiceType('OPD');
        setPatient(null);
        setPatientSearch('');
        setRows([makeRow()]);
        setPaymentStatus('Pending');
        setPaidAmount(0);
        setNotes('');
        setSignatureData('');
        setStampData('');
        setLogoData('');
        setView('create');
    }

    function openEdit(inv) {
        setEditingId(inv._id || inv.id);
        setClinicName(inv.clinicName || 'Ayursutra Panchkarma Clinic');
        setClinicAddress(inv.clinicAddress || '');
        setClinicMobile(inv.clinicMobile || '');
        setClinicGst(inv.clinicGst || '');
        setInvoiceNo(inv.invoiceNo);
        setIssueDateTime(inv.issueDateTime || nowDT());
        setInvoiceType(inv.invoiceType || 'OPD');
        setPatient(inv.patient || null);
        setPatientSearch(inv.patient?.name || '');
        setRows((inv.items || []).map((it, i) => ({ ...it, id: i })));
        setPaymentStatus(inv.paymentStatus || 'Pending');
        setPaidAmount(inv.paidAmount || 0);
        setNotes(inv.notes || '');
        setSignatureData(inv.signatureData || '');
        setStampData(inv.stampData || '');
        setLogoData(inv.logoData || '');
        setView('create');
    }

    function getCurrentInvoice(isDraft) {
        return {
            invoiceNo,
            issueDateTime,
            clinicName, clinicAddress, clinicMobile, clinicGst,
            invoiceType,
            patient,
            items: rows,
            subtotal, taxTotal, grandTotal,
            paymentStatus, paidAmount: Number(paidAmount), balance,
            notes, isDraft,
            logoData, signatureData, stampData,
        };
    }

    async function saveInvoice(isDraft) {
        if (!patient) { showNotification && showNotification('Please select a patient.', 'error'); return; }
        if (rows.length === 0) { showNotification && showNotification('Please add at least one item.', 'error'); return; }
        const inv = getCurrentInvoice(isDraft);
        try {
            if (editingId) {
                await updateInvoice(editingId, inv);
                showNotification && showNotification(`Invoice ${invoiceNo} updated!`, 'success');
            } else {
                await createInvoice(inv);
                showNotification && showNotification(`Invoice ${invoiceNo} ${isDraft ? 'saved as draft' : 'finalized'}!`, 'success');
            }
            await loadData();
            setView('list');
        } catch (err) {
            showNotification && showNotification('Failed to save invoice', 'error');
        }
    }

    async function handleDeleteInvoice(id) {
        if (!window.confirm('Delete this invoice permanently?')) return;
        try {
            await deleteInvoice(id);
            showNotification && showNotification('Invoice deleted', 'success');
            await loadData();
        } catch {
            showNotification && showNotification('Failed to delete invoice', 'error');
        }
    }

    // Helper: get filtered catalogue items for a given item type
    function getCatItemsByType(type) {
        return catalogue.filter(c => c.type === type);
    }

    // Row management (now auto-fills from catalogue)
    function updateRow(id, key, val) {
        setRows(prev => prev.map(r => {
            if (r.id !== id) return r;
            let updated = { ...r, [key]: val };
            if (key === 'type') { updated.name = ''; updated.price = 0; updated.gst = 18; updated.nameSearch = ''; }
            if (key === 'name') {
                const found = getCatItemsByType(r.type).find(it => it.name === val);
                if (found) { updated.price = found.price; updated.gst = found.gst; updated.desc = found.desc || ''; }
                updated.nameSearch = val;
            }
            if (key === 'nameSearch') {
                updated.nameSearch = val;
                // If exact match in catalogue, auto-fill
                const found = getCatItemsByType(r.type).find(it => it.name.toLowerCase() === val.toLowerCase());
                if (found) { updated.name = found.name; updated.price = found.price; updated.gst = found.gst; }
                else { updated.name = val; }
            }
            return updated;
        }));
    }

    // Save a new item to the catalogue from the invoice row
    async function saveItemToCatalogue(row) {
        if (!row.name?.trim()) return;
        try {
            const saved = await saveCatalogueItem({ type: row.type, name: row.name.trim(), desc: row.desc || '', price: row.price, gst: row.gst });
            setCatalogue(prev => {
                const idx = prev.findIndex(c => c.type === row.type && c.name === row.name);
                if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
                return [...prev, saved];
            });
            showNotification && showNotification(`✅ “${row.name}” saved to catalogue`, 'success');
        } catch {
            showNotification && showNotification('Failed to save to catalogue', 'error');
        }
    }
    function addRow() { setRows(prev => [...prev, makeRow()]); }
    function removeRow(id) {
        if (rows.length <= 1) { showNotification && showNotification('At least one item required.', 'error'); return; }
        setRows(prev => prev.filter(r => r.id !== id));
    }

    // ── Catalogue Manager Handlers ─────────────────────────────────────────────
    async function handleCatSave(e) {
        e.preventDefault();
        if (!catForm.name.trim() || !catForm.price) {
            showNotification && showNotification('Name and price are required.', 'error');
            return;
        }
        setCatSaving(true);
        try {
            if (catEditId) {
                const updated = await updateCatalogueItem(catEditId, { ...catForm, price: Number(catForm.price), gst: Number(catForm.gst) });
                setCatalogue(prev => prev.map(c => c._id === catEditId ? updated : c));
                showNotification && showNotification('Item updated!', 'success');
            } else {
                const saved = await saveCatalogueItem({ ...catForm, price: Number(catForm.price), gst: Number(catForm.gst) });
                setCatalogue(prev => {
                    const idx = prev.findIndex(c => c.type === saved.type && c.name === saved.name);
                    if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
                    return [...prev, saved];
                });
                showNotification && showNotification(`“${saved.name}” added to catalogue!`, 'success');
            }
            setCatForm({ type: 'Consultation', name: '', desc: '', price: '', gst: 18 });
            setCatEditId(null);
        } catch (err) {
            showNotification && showNotification(err.response?.data?.message || 'Failed to save item.', 'error');
        } finally {
            setCatSaving(false);
        }
    }

    async function handleCatDelete(item) {
        if (!item._id) { // default item, no DB record
            showNotification && showNotification('Default items cannot be deleted.', 'info');
            return;
        }
        if (!window.confirm(`Remove “${item.name}” from catalogue?`)) return;
        try {
            await deleteCatalogueItem(item._id);
            setCatalogue(prev => prev.filter(c => c._id !== item._id));
            showNotification && showNotification('Item removed.', 'success');
        } catch {
            showNotification && showNotification('Failed to remove item.', 'error');
        }
    }

    function startCatEdit(item) {
        if (!item._id) { showNotification && showNotification('Default items can be customised by saving with new values.', 'info'); return; }
        setCatEditId(item._id);
        setCatForm({ type: item.type, name: item.name, desc: item.desc || '', price: item.price, gst: item.gst });
        setShowCatMgr(true);
    }

    function handlePaidChange(val) {
        setPaidAmount(val);
        const v = Number(val);
        if (v >= grandTotal) setPaymentStatus('Paid');
        else if (v > 0) setPaymentStatus('Partial');
        else setPaymentStatus('Pending');
    }
    function handleStatusChange(val) {
        setPaymentStatus(val);
        if (val === 'Paid') setPaidAmount(grandTotal.toFixed(2));
        else if (val === 'Pending') setPaidAmount(0);
    }

    function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (file) { const r = new FileReader(); r.onload = ev => setLogoData(ev.target.result); r.readAsDataURL(file); }
    }
    function handleSigUpload(e) {
        const file = e.target.files[0];
        if (file) { const r = new FileReader(); r.onload = ev => setSignatureData(ev.target.result); r.readAsDataURL(file); }
    }
    function handleStampUpload(e) {
        const file = e.target.files[0];
        if (file) { const r = new FileReader(); r.onload = ev => setStampData(ev.target.result); r.readAsDataURL(file); }
    }

    const patientResults = allPatients.filter(p =>
        patientSearch.length >= 2 && (
            p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
            p.phone.includes(patientSearch)
        )
    );

    function selectPatient(p) { setPatient(p); setPatientSearch(p.name); setShowPatientResults(false); }

    function addQuickPatient(e) {
        e.preventDefault();
        const np = { id: 'temp_' + Date.now(), name: qpForm.name, age: parseInt(qpForm.age), phone: qpForm.phone, address: qpForm.address };
        setAllPatients(prev => [...prev, np]);
        selectPatient(np);
        setShowQuickPatient(false);
        setQpForm({ name: '', age: '', gender: 'Male', phone: '', address: '' });
    }

    function buildPreviewHTML(inv) {
        const p = inv.patient || { name: 'Walk-in Patient', age: '—', phone: '—', address: '' };
        const itemsHtml = (inv.items || []).map(it => {
            const total = it.qty * it.price * (1 + it.gst / 100);
            return `<tr><td>${it.name}</td><td>${it.qty}</td><td>₹${Number(it.price).toFixed(2)}</td><td>${it.gst}%</td><td>₹${total.toFixed(2)}</td></tr>`;
        }).join('');
        const logoHtml = inv.logoData ? `<img src="${inv.logoData}" style="max-height:70px;max-width:200px;object-fit:contain;margin-bottom:0.4rem;">` : '';
        return `<html><head><title>Invoice ${inv.invoiceNo}</title>
<style>body{font-family:Arial,sans-serif;margin:30px;color:#333}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #2a7d2e;padding-bottom:1rem;margin-bottom:1rem}.clinic-detail h2{color:#2a7d2e;margin:0 0 .25rem}.patient-block{background:#f0f7f0;padding:.75rem 1rem;border-radius:6px;display:flex;justify-content:space-between;margin-bottom:1rem}table{width:100%;border-collapse:collapse;margin-bottom:1rem}th{background:#2a7d2e;color:#fff;padding:.6rem;text-align:left}td{padding:.5rem;border-bottom:1px solid #eee}.totals-box{display:flex;justify-content:flex-end;margin-bottom:1rem}.totals-inner{min-width:220px}.total-line{display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px dashed #ddd}.grand-total-line{font-weight:700;font-size:1.1rem}</style>
</head><body>
<div class="header"><div class="clinic-left">${logoHtml}<div class="clinic-detail"><h2>${inv.clinicName}</h2><p>${inv.clinicAddress}<br>${inv.clinicMobile}<br>GST: ${inv.clinicGst}</p></div></div><div><h3>INVOICE</h3><p>${inv.invoiceNo}<br>${(inv.issueDateTime || '').replace('T', ' ')}</p></div></div>
<div class="patient-block"><span><strong>${p.name}</strong> | Age ${p.age} | ${p.phone}</span><span>${p.address || ''}</span></div>
<table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>GST</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
<div class="totals-box"><div class="totals-inner"><div class="total-line"><span>Subtotal</span><span>₹${(inv.subtotal || 0).toFixed(2)}</span></div><div class="total-line"><span>GST total</span><span>₹${(inv.taxTotal || 0).toFixed(2)}</span></div><div class="total-line grand-total-line"><span>Grand total</span><span>₹${(inv.grandTotal || 0).toFixed(2)}</span></div></div></div>
${inv.notes ? `<p style="margin-top:1rem;font-style:italic;">${inv.notes}</p>` : ''}
</body></html>`;
    }

    function printInvoice() {
        const inv = getCurrentInvoice(true);
        const win = window.open('', '_blank');
        win.document.write(buildPreviewHTML(inv));
        win.document.close(); win.focus(); win.print();
    }
    function downloadSinglePdf(inv) {
        const win = window.open('', '_blank');
        win.document.write(buildPreviewHTML(inv));
        win.document.close(); win.focus();
        setTimeout(() => win.print(), 500);
    }

    const filteredInvoices = invoices.filter(inv => {
        const search = listSearch.toLowerCase();
        const matchSearch = !listSearch || (inv.invoiceNo || '').toLowerCase().includes(search) || (inv.patient?.name || '').toLowerCase().includes(search);
        if (listFilter === 'opd') return matchSearch && inv.invoiceType === 'OPD';
        if (listFilter === 'paid') return matchSearch && inv.paymentStatus === 'Paid';
        return matchSearch;
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}><div style={{ fontSize: '2rem' }}>💰</div><p>Loading invoices...</p></div>
        </div>
    );

    if (error) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem' }}>⚠️</div><p style={{ color: '#f44336' }}>{error}</p>
                <button className="dash-btn dash-btn-primary" onClick={loadData}>Retry</button></div>
        </div>
    );

    const typeOptions = getTypeOptions(invoiceType);
    const filteredCat = catalogue.filter(c =>
        (catTypeFilter === 'all' || c.type === catTypeFilter) &&
        (!catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase()))
    );

    return (
        <div className="tab-content active">
            <div className="tab-header">
                <h2>Invoice Management</h2>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="dash-btn dash-btn-secondary" onClick={() => setShowCatMgr(p => !p)} title="Manage item catalogue">
                        {showCatMgr ? '▲ Hide Catalogue' : '📂 Manage Catalogue'}
                    </button>
                    <button className="dash-btn dash-btn-primary" onClick={openCreate}>+ New Invoice</button>
                    {view === 'create' && <button className="dash-btn dash-btn-secondary" onClick={() => setView('list')}>📋 All Invoices</button>}
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card"><div className="stat-content"><h3>Today's Collection</h3><p className="stat-value">₹{todayTotal.toLocaleString('en-IN')}</p></div><div className="stat-icon">💰</div></div>
                <div className="stat-card"><div className="stat-content"><h3>Pending Amount</h3><p className="stat-value">₹{pendingTotal.toLocaleString('en-IN')}</p></div><div className="stat-icon">⏳</div></div>
                <div className="stat-card"><div className="stat-content"><h3>Month Collection</h3><p className="stat-value">₹{monthTotal.toLocaleString('en-IN')}</p></div><div className="stat-icon">📊</div></div>
            </div>

            {/* ──── CATALOGUE MANAGER ──── */}
            {showCatMgr && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
                    <h4 style={{ margin: '0 0 1rem', color: '#1e293b' }}>📂 Item Catalogue <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 400 }}>Reusable items auto-filled in invoices</span></h4>

                    {/* Add / Edit form */}
                    <form onSubmit={handleCatSave} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Type</label>
                            <select value={catForm.type} onChange={e => setCatForm(p => ({ ...p, type: e.target.value }))} style={{ padding: '0.4rem 0.6rem', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                                {ALL_ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 2, minWidth: 140 }}>
                            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Name *</label>
                            <input required placeholder="Item name" value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} style={{ padding: '0.4rem 0.6rem', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 100 }}>
                            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Price (₹) *</label>
                            <input required type="number" min={0} placeholder="0" value={catForm.price} onChange={e => setCatForm(p => ({ ...p, price: e.target.value }))} style={{ padding: '0.4rem 0.6rem', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 60 }}>
                            <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>GST%</label>
                            <input type="number" min={0} max={28} value={catForm.gst} onChange={e => setCatForm(p => ({ ...p, gst: e.target.value }))} style={{ padding: '0.4rem 0.6rem', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: 60 }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button type="submit" className="dash-btn dash-btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} disabled={catSaving}>
                                {catSaving ? '⏳' : catEditId ? '✓ Update' : '+ Add'}
                            </button>
                            {catEditId && <button type="button" className="dash-btn dash-btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} onClick={() => { setCatEditId(null); setCatForm({ type: 'Consultation', name: '', desc: '', price: '', gst: 18 }); }}>✗</button>}
                        </div>
                    </form>

                    {/* Filter + search */}
                    <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        <input placeholder="Search items..." value={catSearch} onChange={e => setCatSearch(e.target.value)} style={{ padding: '0.35rem 0.65rem', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.82rem', width: 180 }} />
                        {['all', ...ALL_ITEM_TYPES].map(t => (
                            <button key={t} onClick={() => setCatTypeFilter(t)} style={{ padding: '0.3rem 0.65rem', borderRadius: '20px', border: `1px solid ${catTypeFilter === t ? '#2a7d2e' : '#cbd5e1'}`, background: catTypeFilter === t ? '#2a7d2e' : '#fff', color: catTypeFilter === t ? '#fff' : '#475569', fontSize: '0.78rem', cursor: 'pointer' }}>
                                {t === 'all' ? 'All' : t}
                            </button>
                        ))}
                    </div>

                    {/* Catalogue item list */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.5rem', maxHeight: 280, overflowY: 'auto' }}>
                        {filteredCat.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No items found.</p>}
                        {filteredCat.map((item, i) => (
                            <div key={item._id || i} style={{ background: '#fff', borderRadius: '10px', padding: '0.6rem 0.85rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.type} · ₹{item.price} · GST {item.gst}%{!item._id ? ' · default' : ''}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2a7d2e', fontSize: '0.9rem' }} title="Edit" onClick={() => startCatEdit(item)}>✏️</button>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: item._id ? '#f44336' : '#cbd5e1', fontSize: '0.9rem' }} title={item._id ? 'Delete' : 'Cannot delete default'} onClick={() => handleCatDelete(item)}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── CREATE / EDIT ── */}
            {view === 'create' && (
                <div className="invoice-section">
                    {/* Clinic Info */}
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        <div style={{ flex: 1, minWidth: 260 }}>
                            <h4 style={{ marginBottom: '0.75rem' }}>Clinic Details</h4>
                            <div className="dash-form-group">
                                <label>Hospital Logo</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <div style={{ width: 100, height: 60, border: '2px dashed #c8e6c9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', overflow: 'hidden' }}>
                                        {logoData ? <img src={logoData} alt="logo" style={{ maxWidth: 96, maxHeight: 56, objectFit: 'contain' }} /> : <span style={{ color: '#aaa', fontSize: '0.75rem', textAlign: 'center' }}>🏥<br />Logo</span>}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        <button className="dash-btn dash-btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => logoInputRef.current?.click()}>📤 Upload Logo</button>
                                        {logoData && <button className="dash-btn dash-btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: '#f44336' }} onClick={() => setLogoData('')}>✕ Remove</button>}
                                    </div>
                                    <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                                </div>
                            </div>
                            <div className="dash-form-group"><label>Clinic Name</label><input value={clinicName} onChange={e => setClinicName(e.target.value)} /></div>
                            <div className="dash-form-group"><label>Address</label><input value={clinicAddress} onChange={e => setClinicAddress(e.target.value)} /></div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <div className="dash-form-group" style={{ flex: 1 }}><label>Mobile</label><input value={clinicMobile} onChange={e => setClinicMobile(e.target.value)} /></div>
                                <div className="dash-form-group" style={{ flex: 1 }}><label>GST No.</label><input value={clinicGst} onChange={e => setClinicGst(e.target.value)} /></div>
                            </div>
                        </div>
                        <div style={{ minWidth: 220 }}>
                            <h4 style={{ marginBottom: '0.75rem' }}>Invoice Info</h4>
                            <div className="dash-form-group"><label>Invoice No.</label><input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} /></div>
                            <div className="dash-form-group"><label>Date & Time</label><input type="datetime-local" value={issueDateTime} onChange={e => setIssueDateTime(e.target.value)} /></div>
                            <div className="dash-form-group">
                                <label>Invoice Type</label>
                                <select value={invoiceType} onChange={e => { setInvoiceType(e.target.value); setRows([makeRow()]); }}>
                                    {['OPD', 'IPD', 'Medicine', 'Therapy'].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Patient Search */}
                    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Patient</label>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input type="text" placeholder="Search patient by name or phone..." style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                    value={patientSearch}
                                    onChange={e => { setPatientSearch(e.target.value); setShowPatientResults(true); }}
                                    onFocus={() => setShowPatientResults(true)} />
                                {showPatientResults && patientSearch.length >= 2 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: '8px', zIndex: 100, maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 16px rgba(0,0,0,0.12)' }}>
                                        {patientResults.length === 0
                                            ? <div style={{ padding: '0.75rem', color: '#777' }}>No patient found</div>
                                            : patientResults.map(p => (
                                                <div key={p.id} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }} onMouseDown={() => selectPatient(p)}>
                                                    <strong>{p.name}</strong> | {p.phone}
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}
                            </div>
                            <button className="dash-btn dash-btn-secondary" onClick={() => setShowQuickPatient(true)}>+ New Patient</button>
                        </div>
                        {patient && (
                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0f7f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span><strong>{patient.name}</strong> · Age {patient.age} · {patient.phone} · {patient.address}</span>
                                <span className="status-badge status-confirmed">Selected</span>
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    <h4 style={{ marginBottom: '1rem' }}>Invoice Items</h4>
                    <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
                        <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                            <thead>
                                <tr style={{ background: '#2a7d2e', color: '#fff' }}>
                                    {['Type', 'Item Name', 'Description', 'Qty', 'Price (₹)', 'GST%', 'Total', ''].map(h => (
                                        <th key={h} style={{ padding: '0.65rem', textAlign: 'left', fontWeight: 500 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(row => {
                                    const rowTypeOptions = getTypeOptions(invoiceType);
                                    const catItems       = getCatItemsByType(row.type);
                                    const nameSearch     = row.nameSearch ?? row.name;
                                    const suggestions    = catItems.filter(it =>
                                        nameSearch.length >= 1 &&
                                        it.name.toLowerCase().includes(nameSearch.toLowerCase())
                                    );
                                    const isNewItem = nameSearch.trim() && !catItems.find(it => it.name.toLowerCase() === nameSearch.toLowerCase());
                                    const rowTotal   = row.qty * row.price * (1 + row.gst / 100);
                                    return (
                                        <tr key={row.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '0.4rem' }}>
                                                <select style={{ padding: '0.35rem', border: '1px solid #ddd', borderRadius: '5px', fontSize: '0.88rem' }} value={row.type} onChange={e => updateRow(row.id, 'type', e.target.value)}>
                                                    {rowTypeOptions.map(t => <option key={t}>{t}</option>)}
                                                </select>
                                            </td>
                                            {/* Searchable name field with catalogue dropdown */}
                                            <td style={{ padding: '0.4rem', position: 'relative', minWidth: 180 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Type to search or add new..."
                                                    style={{ padding: '0.35rem', border: '1px solid #ddd', borderRadius: '5px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box' }}
                                                    value={nameSearch}
                                                    onChange={e => updateRow(row.id, 'nameSearch', e.target.value)}
                                                    autoComplete="off"
                                                />
                                                {/* Dropdown suggestions */}
                                                {suggestions.length > 0 && (
                                                    <div style={{ position: 'absolute', top: '100%', left: '0.4rem', right: '0.4rem', background: '#fff', border: '1px solid #ddd', borderRadius: '7px', zIndex: 200, boxShadow: '0 6px 16px rgba(0,0,0,0.12)', maxHeight: 180, overflowY: 'auto' }}>
                                                        {suggestions.map(it => (
                                                            <div key={it.name} onMouseDown={() => updateRow(row.id, 'name', it.name)}
                                                                style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5', fontSize: '0.85rem' }}
                                                                onMouseEnter={e => e.currentTarget.style.background='#f0fdf4'}
                                                                onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                                                                <span>{it.name}</span>
                                                                <span style={{ color: '#64748b', fontSize: '0.78rem' }}>₹{it.price}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Save new item to catalogue */}
                                                {isNewItem && nameSearch.length > 1 && (
                                                    <button
                                                        onMouseDown={e => { e.preventDefault(); saveItemToCatalogue(row); }}
                                                        style={{ position: 'absolute', top: '100%', left: '0.4rem', right: '0.4rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '7px', padding: '0.35rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', color: '#166534', zIndex: 200, textAlign: 'left', marginTop: suggestions.length ? 0 : 0 }}
                                                    >
                                                        + Save “{nameSearch}” to catalogue for reuse
                                                    </button>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.4rem' }}><input type="text" placeholder="desc" style={{ padding: '0.35rem', border: '1px solid #ddd', borderRadius: '5px', width: 100, fontSize: '0.88rem' }} value={row.desc} onChange={e => updateRow(row.id, 'desc', e.target.value)} /></td>
                                            <td style={{ padding: '0.4rem' }}><input type="number" min={1} style={{ padding: '0.35rem', border: '1px solid #ddd', borderRadius: '5px', width: 55, fontSize: '0.88rem' }} value={row.qty} onChange={e => updateRow(row.id, 'qty', Number(e.target.value))} /></td>
                                            <td style={{ padding: '0.4rem' }}><input type="number" min={0} step="0.01" style={{ padding: '0.35rem', border: '1px solid #ddd', borderRadius: '5px', width: 80, fontSize: '0.88rem' }} value={row.price} onChange={e => updateRow(row.id, 'price', Number(e.target.value))} /></td>
                                            <td style={{ padding: '0.4rem' }}><input type="number" min={0} step="0.1" style={{ padding: '0.35rem', border: '1px solid #ddd', borderRadius: '5px', width: 55, fontSize: '0.88rem' }} value={row.gst} onChange={e => updateRow(row.id, 'gst', Number(e.target.value))} /></td>
                                            <td style={{ padding: '0.4rem', fontWeight: 600 }}>₹{rowTotal.toFixed(2)}</td>
                                            <td style={{ padding: '0.4rem' }}>
                                                <button style={{ background: 'none', border: 'none', color: '#4caf50', fontSize: '1.1rem', cursor: 'pointer' }} onClick={addRow}>➕</button>
                                                <button style={{ background: 'none', border: 'none', color: '#f44336', fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => removeRow(row.id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <button className="dash-btn dash-btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={addRow}>+ Add Item</button>

                    {/* Summary + Signature */}
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '8px' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            {[['Subtotal', subtotal], ['GST total', taxTotal], ['Grand total', grandTotal]].map(([l, v]) => (
                                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: l === 'Grand total' ? '0.5rem 0' : '0.35rem 0', borderBottom: '1px dashed #ddd', fontWeight: l === 'Grand total' ? 700 : 400, fontSize: l === 'Grand total' ? '1.05rem' : 'inherit' }}>
                                    <span>{l}</span><span style={l === 'Grand total' ? { color: '#2a7d2e' } : {}}>{typeof v === 'number' ? `₹${v.toFixed(2)}` : v}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ minWidth: 220 }}>
                            <div className="dash-form-group">
                                <label>Payment Status</label>
                                <select value={paymentStatus} onChange={e => handleStatusChange(e.target.value)}>
                                    <option>Pending</option><option>Partial</option><option>Paid</option>
                                </select>
                            </div>
                            <div className="dash-form-group">
                                <label>Paid Amount (₹)</label>
                                <input type="number" min={0} value={paidAmount} onChange={e => handlePaidChange(e.target.value)} />
                            </div>
                            <div style={{ fontWeight: 600, color: balance > 0 ? '#f44336' : '#4caf50' }}>Balance: ₹{Number(balance).toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            {[['Signature', signatureData, sigInputRef, setSignatureData, handleSigUpload], ['Stamp', stampData, stampInputRef, setStampData, handleStampUpload]].map(([label, data, ref, setData, handler]) => (
                                <div key={label} style={{ textAlign: 'center', minWidth: 140 }}>
                                    <div style={{ height: 60, borderBottom: '2px solid #aaa', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {data ? <img src={data} alt={label} style={{ maxHeight: 56, maxWidth: 130 }} /> : <span style={{ color: '#aaa', fontSize: '0.8rem' }}>{label} area</span>}
                                    </div>
                                    <button className="dash-btn dash-btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', marginRight: '0.3rem' }} onClick={() => ref.current?.click()}>Upload {label}</button>
                                    {data && <button className="dash-btn dash-btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} onClick={() => setData('')}>Clear</button>}
                                    <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handler} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="dash-form-group" style={{ marginBottom: '1.5rem' }}>
                        <label>Notes (optional)</label>
                        <input type="text" placeholder="Any notes..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button className="dash-btn dash-btn-secondary" onClick={() => setShowPreview(true)}>👁 Preview</button>
                        <button className="dash-btn dash-btn-secondary" onClick={() => saveInvoice(true)}>💾 Save Draft</button>
                        <button className="dash-btn dash-btn-primary" onClick={() => saveInvoice(false)}>✅ Finalize</button>
                        <button className="dash-btn dash-btn-secondary" onClick={() => { if (window.confirm('Discard changes?')) setView('list'); }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* ── LIST ── */}
            {view === 'list' && (
                <div className="invoice-section">
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <input type="text" placeholder="Search invoice / patient" style={{ padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '8px', width: 260, fontSize: '0.95rem' }}
                            value={listSearch} onChange={e => setListSearch(e.target.value)} />
                        <div className="filter-options">
                            {[['all', 'All'], ['opd', 'OPD'], ['paid', 'Paid']].map(([f, l]) => (
                                <button key={f} className={`filter-btn ${listFilter === f ? 'active' : ''}`} onClick={() => setListFilter(f)}>{l}</button>
                            ))}
                        </div>
                    </div>
                    {filteredInvoices.length === 0
                        ? <p style={{ textAlign: 'center', color: '#777', padding: '2rem' }}>No invoices found.</p>
                        : filteredInvoices.map(inv => {
                            const statusClass = inv.paymentStatus === 'Paid' ? 'paid' : inv.paymentStatus === 'Partial' ? 'partial' : 'pending';
                            return (
                                <div key={inv._id || inv.id} className="invoice-list-item">
                                    <div>
                                        <strong>{inv.invoiceNo}</strong> · {inv.patient?.name || 'Walk-in'}
                                        <br />
                                        <small style={{ color: '#777' }}>{(inv.issueDateTime || '').slice(0, 16)} · {inv.invoiceType}{inv.isDraft ? ' · Draft' : ''}</small>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span className={`inv-badge ${statusClass}`}>{inv.paymentStatus}</span>
                                        <span style={{ fontWeight: 700, color: '#2a7d2e' }}>₹{(inv.grandTotal || 0).toFixed(2)}</span>
                                        <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => openEdit(inv)}>✏️ Edit</button>
                                        <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => downloadSinglePdf(inv)}>⬇️ PDF</button>
                                        <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => handleDeleteInvoice(inv._id || inv.id)}>🗑️</button>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && (
                <div className="dash-modal open" onClick={() => setShowPreview(false)}>
                    <div className="dash-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <h3>Invoice Preview</h3>
                            <button className="dash-btn dash-btn-secondary" onClick={() => setShowPreview(false)}>✖</button>
                        </div>
                        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2a7d2e', paddingBottom: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                                <div>
                                    {logoData && <img src={logoData} alt="logo" style={{ maxHeight: 64, maxWidth: 180, objectFit: 'contain', marginBottom: '0.3rem' }} />}
                                    <h2 style={{ color: '#2a7d2e', margin: '0 0 0.25rem' }}>{clinicName}</h2>
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{clinicAddress}<br />{clinicMobile}<br />GST: {clinicGst}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}><h3>INVOICE</h3><p>{invoiceNo}<br />{issueDateTime.replace('T', ' ')}</p></div>
                            </div>
                            {patient && (
                                <div style={{ background: '#f0f7f0', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span><strong>{patient.name}</strong> | Age {patient.age} | {patient.phone}</span>
                                    <span>{patient.address}</span>
                                </div>
                            )}
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                                <thead><tr style={{ background: '#2a7d2e', color: '#fff' }}>
                                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Item</th><th style={{ padding: '0.5rem' }}>Qty</th><th style={{ padding: '0.5rem' }}>Price</th><th style={{ padding: '0.5rem' }}>GST</th><th style={{ padding: '0.5rem' }}>Total</th>
                                </tr></thead>
                                <tbody>{rows.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.5rem' }}>{r.name || '—'}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{r.qty}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>₹{Number(r.price).toFixed(2)}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{r.gst}%</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>₹{(r.qty * r.price * (1 + r.gst / 100)).toFixed(2)}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                                <div style={{ minWidth: 210 }}>
                                    {[['Subtotal', subtotal], ['GST total', taxTotal], ['Grand total', grandTotal]].map(([l, v]) => (
                                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px dashed #ddd', fontWeight: l === 'Grand total' ? 700 : 400 }}>
                                            <span>{l}</span><span>₹{v.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {notes && <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>{notes}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button className="dash-btn dash-btn-primary" onClick={printInvoice}>⬇️ Download PDF</button>
                            <button className="dash-btn dash-btn-secondary" onClick={printInvoice}>🖨 Print</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Patient Modal */}
            {showQuickPatient && (
                <div className="dash-modal open" onClick={() => setShowQuickPatient(false)}>
                    <div className="dash-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h3>New Patient</h3>
                            <button className="modal-close" onClick={() => setShowQuickPatient(false)}>×</button>
                        </div>
                        <form onSubmit={addQuickPatient}>
                            <div className="dash-form-group"><label>Full name</label><input required value={qpForm.name} onChange={e => setQpForm({ ...qpForm, name: e.target.value })} /></div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <div className="dash-form-group" style={{ flex: 1 }}><label>Age</label><input type="number" required value={qpForm.age} onChange={e => setQpForm({ ...qpForm, age: e.target.value })} /></div>
                                <div className="dash-form-group" style={{ flex: 1 }}><label>Gender</label><select value={qpForm.gender} onChange={e => setQpForm({ ...qpForm, gender: e.target.value })}><option>Male</option><option>Female</option></select></div>
                            </div>
                            <div className="dash-form-group"><label>Mobile</label><input required value={qpForm.phone} onChange={e => setQpForm({ ...qpForm, phone: e.target.value })} /></div>
                            <div className="dash-form-group"><label>Address</label><input value={qpForm.address} onChange={e => setQpForm({ ...qpForm, address: e.target.value })} /></div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                <button type="button" className="dash-btn dash-btn-secondary" onClick={() => setShowQuickPatient(false)}>Cancel</button>
                                <button type="submit" className="dash-btn dash-btn-primary">Add & Select</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
