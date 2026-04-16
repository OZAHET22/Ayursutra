import { useState, useEffect, useMemo } from 'react';
import * as appointmentService from '../../services/appointmentService';
import { getMyPatients } from '../../services/userService';
import SlotPicker from '../../components/SlotPicker';

const THERAPY_TYPES = ['Consultation', 'Panchakarma', 'Abhyanga', 'Shirodhara', 'Vamana', 'Virechana', 'Basti', 'Nasya'];

export default function AppointmentsTab({ user, showNotification, socketRef }) {
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notifToast, setNotifToast] = useState(null);
    const [conflictMsg, setConflictMsg] = useState('');

    const [form, setForm] = useState({
        patientId: '', type: '', duration: '60', notes: '',
        selectedDate: '', selectedTime: '',
    });

    const loadData = async () => {
        try {
            const [appts, pats] = await Promise.all([
                appointmentService.getAppointments(),
                getMyPatients(),
            ]);
            setAppointments(appts || []);
            setPatients(pats || []);
        } catch (err) { console.error('Load error:', err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, []);

    // Real-time: refresh when another patient books a slot
    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket) return;
        const handler = () => loadData();
        socket.on('appointment_booked', handler);
        return () => socket.off('appointment_booked', handler);
    }, [socketRef]);

    const filtered = useMemo(() => {
        const today = new Date().toDateString();
        let list = appointments.filter(a =>
            (a.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.type || '').toLowerCase().includes(search.toLowerCase())
        );
        if (filter === 'today') list = list.filter(a => new Date(a.date).toDateString() === today);
        else if (filter === 'upcoming') list = list.filter(a => new Date(a.date) > new Date() && a.status !== 'completed');
        else if (filter === 'pending') list = list.filter(a => a.status === 'pending');
        else if (filter === 'confirmed') list = list.filter(a => a.status === 'confirmed');
        return list.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [appointments, filter, search]);

    const showNotifToast = (notifResult) => {
        if (!notifResult) return;
        setNotifToast(notifResult);
        setTimeout(() => setNotifToast(null), 4000);
    };

    const updateStatus = async (id, status) => {
        try {
            const res = await appointmentService.updateAppointment(id, { status });
            showNotification(`Appointment marked as ${status}.`, 'success');
            if (res?.notifResult) showNotifToast(res.notifResult);
            loadData();
        } catch { showNotification('Failed to update appointment.', 'error'); }
    };

    const submitAppt = async (e) => {
        e.preventDefault();
        if (!form.selectedTime) {
            setConflictMsg('Please select an available time slot from the grid below.');
            return;
        }
        setSubmitting(true);
        setConflictMsg('');
        try {
            const patient = patients.find(p => p._id === form.patientId);
            await appointmentService.createAppointment({
                patientId: form.patientId,
                patientName: patient?.name || '',
                doctorId: user.id || user._id,
                doctorName: user.name,
                type: form.type,
                date: form.selectedTime,
                status: 'confirmed',
                duration: Number(form.duration),
                centre: user.centreId || '',
                notes: form.notes,
            });
            setShowModal(false);
            setForm({ patientId: '', type: '', duration: '60', notes: '', selectedDate: '', selectedTime: '' });
            showNotification('Appointment added successfully!', 'success');
            loadData();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to create appointment.';
            if (err.response?.status === 409) {
                setConflictMsg('⚠️ ' + msg + ' Choose a different slot.');
                setForm(prev => ({ ...prev, selectedTime: '' }));
                loadData();
            } else {
                showNotification(msg, 'error');
            }
        } finally { setSubmitting(false); }
    };

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                <p>Loading appointments...</p>
            </div>
        </div>
    );

    const todayCount = appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length;
    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    const doctorId = user.id || user._id;
    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div className="tab-content active">
            <div className="tab-header">
                <h2>Appointment Management
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#999', fontWeight: 400 }}>🔄 10s</span>
                </h2>
                <button className="dash-btn dash-btn-primary" onClick={() => { setShowModal(true); setConflictMsg(''); }}>+ Add New Appointment</button>
            </div>

            {/* Notification delivery toast */}
            {notifToast && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: notifToast.socketSent ? '#f0fdf4' : '#fff3e0',
                    border: `1px solid ${notifToast.socketSent ? '#86efac' : '#ffb74d'}`,
                    borderRadius: '10px', padding: '0.65rem 1rem',
                    marginBottom: '1rem', fontSize: '0.85rem', flexWrap: 'wrap',
                }}>
                    <span style={{ fontWeight: 600 }}>📡 Patient notified via:</span>
                    {[
                        { label: 'App', ok: notifToast.socketSent, err: null },
                        { label: 'SMS', ok: notifToast.smsSent, err: notifToast.smsError },
                        { label: 'Email', ok: notifToast.emailSent, err: notifToast.emailError },
                    ].map(ch => (
                        <span key={ch.label} title={ch.err || ''} style={{
                            padding: '2px 10px', borderRadius: '20px', fontWeight: 600,
                            background: ch.ok ? '#dcfce7' : '#fee2e2',
                            color: ch.ok ? '#166534' : '#991b1b',
                        }}>
                            {ch.label} {ch.ok ? '✓' : `✗${ch.err ? ` (${ch.err})` : ''}`}
                        </span>
                    ))}
                </div>
            )}

            {/* Quick stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card"><div className="stat-content"><h3>Total</h3><p className="stat-value">{appointments.length}</p></div><div className="stat-icon">📋</div></div>
                <div className="stat-card"><div className="stat-content"><h3>Today</h3><p className="stat-value">{todayCount}</p></div><div className="stat-icon">📅</div></div>
                <div className="stat-card"><div className="stat-content"><h3>Pending</h3><p className="stat-value" style={{ color: pendingCount > 0 ? '#ff9800' : undefined }}>{pendingCount}</p></div><div className="stat-icon">⏳</div></div>
                <div className="stat-card"><div className="stat-content"><h3>Confirmed</h3><p className="stat-value">{appointments.filter(a => a.status === 'confirmed').length}</p></div><div className="stat-icon">✅</div></div>
            </div>

            <div className="filters-section">
                <div className="filters-row">
                    <div className="search-box">
                        <input type="text" placeholder="Search by patient or type..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="filter-options">
                        {['all', 'today', 'upcoming', 'pending', 'confirmed'].map(f => (
                            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="appointments-list">
                <h3>Appointments ({filtered.length})</h3>
                {filtered.length === 0 && <p style={{ padding: '1rem', color: '#777' }}>No appointments found.</p>}
                {filtered.map(a => (
                    <div key={a._id} className="appointment-item">
                        <div className="appointment-details">
                            <h4>{a.patientName}</h4>
                            <p>🔬 {a.type} · {a.duration} min</p>
                            <p>📅 {new Date(a.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                            {a.notes && <p style={{ fontSize: '0.85rem', color: '#777' }}>📝 {a.notes}</p>}
                        </div>
                        <div className="appointment-actions">
                            <span className={`status-badge status-${a.status}`}>{a.status}</span>
                            {a.status === 'pending' && <button className="dash-btn dash-btn-success dash-btn-sm" onClick={() => updateStatus(a._id, 'confirmed')}>✓ Confirm</button>}
                            {(a.status === 'pending' || a.status === 'confirmed') && <button className="dash-btn dash-btn-primary dash-btn-sm" onClick={() => updateStatus(a._id, 'completed')}>Complete</button>}
                            {a.status !== 'cancelled' && a.status !== 'completed' && <button className="dash-btn dash-btn-danger dash-btn-sm" onClick={() => updateStatus(a._id, 'cancelled')}>Cancel</button>}
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── ADD APPOINTMENT MODAL (with SlotPicker) ─── */}
            {showModal && (
                <div className="dash-modal open">
                    <div className="dash-modal-content" style={{ maxWidth: '700px', width: '95vw' }}>
                        <div className="modal-header">
                            <h3>📅 Add New Appointment</h3>
                            <button className="modal-close" onClick={() => { setShowModal(false); setConflictMsg(''); }}>×</button>
                        </div>

                        {conflictMsg && (
                            <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#c62828', fontSize: '0.85rem' }}>
                                {conflictMsg}
                            </div>
                        )}

                        <form onSubmit={submitAppt}>
                            <div className="form-row">
                                <div className="dash-form-group">
                                    <label>Patient *</label>
                                    <select required value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}>
                                        <option value="">Select Patient</option>
                                        {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="dash-form-group">
                                    <label>Appointment Type *</label>
                                    <select required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="">Select Type</option>
                                        {THERAPY_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="dash-form-group">
                                    <label>Duration (min)</label>
                                    <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value, selectedTime: '' })}>
                                        <option value="30">30</option>
                                        <option value="45">45</option>
                                        <option value="60">60</option>
                                        <option value="90">90</option>
                                        <option value="120">120</option>
                                    </select>
                                </div>
                                <div className="dash-form-group">
                                    <label>Date *</label>
                                    <input
                                        type="date"
                                        required
                                        min={todayStr}
                                        value={form.selectedDate}
                                        onChange={e => setForm({ ...form, selectedDate: e.target.value, selectedTime: '' })}
                                    />
                                </div>
                            </div>

                            {/* Slot picker — doctor sees their own schedule */}
                            <div className="dash-form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Available Time Slots (Your Schedule)
                                    {form.selectedTime && (
                                        <span style={{ fontSize: '0.8rem', color: '#2a7d2e', fontWeight: 600, background: '#dcfce7', padding: '2px 8px', borderRadius: '20px' }}>
                                            ✓ {new Date(form.selectedTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} selected
                                        </span>
                                    )}
                                </label>
                                <SlotPicker
                                    doctorId={doctorId}
                                    date={form.selectedDate}
                                    duration={Number(form.duration)}
                                    selectedTime={form.selectedTime}
                                    onSelect={(time) => setForm(prev => ({ ...prev, selectedTime: time || '' }))}
                                />
                            </div>

                            <div className="dash-form-group">
                                <label>Notes</label>
                                <textarea placeholder="Internal notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>

                            <button
                                type="submit"
                                className="dash-btn dash-btn-primary"
                                style={{ width: '100%' }}
                                disabled={submitting || !form.selectedTime}
                            >
                                {submitting ? 'Saving...'
                                    : form.selectedTime
                                        ? `Book ${new Date(form.selectedTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} Slot`
                                        : 'Select a Slot to Book'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
