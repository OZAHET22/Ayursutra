import { useState, useEffect, useMemo } from 'react';
import * as appointmentService from '../../services/appointmentService';
import { getDoctors } from '../../services/userService';
import { updateChecklistItem } from '../../services/trackingService';
import SlotPicker from '../../components/SlotPicker';

const THERAPY_TYPES = ['Panchakarma', 'Abhyanga', 'Shirodhara', 'Basti', 'Nasya', 'Consultation', 'Virechana', 'Vamana'];

function NextSessionCard({ appointment }) {
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
        const update = () => {
            const target = new Date(appointment.date);
            const diff = target - new Date();
            if (diff <= 0) { setTimeLeft('Starting now!'); return; }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
        };
        update();
        const iv = setInterval(update, 1000);
        return () => clearInterval(iv);
    }, [appointment.date]);

    return (
        <div style={{ background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)', borderRadius: '16px', padding: '1.2rem 1.5rem', marginBottom: '1.5rem', border: '1px solid #c8e6c9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#2a7d2e' }}>⏳ Next Session</div>
                <div style={{ fontWeight: 700, fontSize: '1.6rem', color: '#2a7d2e', margin: '4px 0' }}>{timeLeft}</div>
                <div style={{ color: '#555', fontSize: '0.9rem' }}>
                    <strong>{appointment.type}</strong> · {new Date(appointment.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
                <div style={{ color: '#777', fontSize: '0.85rem' }}>👨‍⚕️ {appointment.doctorName} · {appointment.duration} min</div>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '0.75rem 1.2rem', border: '1px solid #c8e6c9' }}>
                <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '4px', fontWeight: 600 }}>PREPARATION</div>
                <div style={{ fontSize: '0.8rem', color: '#666', maxWidth: '220px', lineHeight: 1.5 }}>
                    {appointment.precautions || "Follow your doctor's pre-procedure instructions."}
                </div>
            </div>
        </div>
    );
}

export default function AppointmentsTab({ user, showNotification, socketRef }) {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('date-asc');
    const [showModal, setShowModal] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);
    const [rescheduleAppt, setRescheduleAppt] = useState(null); // full appt object
    const [submitting, setSubmitting] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [conflictMsg, setConflictMsg] = useState('');

    // Book form
    const [apptForm, setApptForm] = useState({
        type: '', doctorId: '', duration: '60', notes: '',
        selectedDate: '', selectedTime: '',
    });

    // Reschedule form — now uses slot picker
    const [rescheduleForm, setRescheduleForm] = useState({
        selectedDate: '', selectedTime: '', reason: '',
    });

    const today = new Date();
    const [calMonth, setCalMonth] = useState(today.getMonth());
    const [calYear, setCalYear] = useState(today.getFullYear());
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const loadData = async () => {
        try {
            const [appts, docs] = await Promise.all([
                appointmentService.getAppointments(),
                getDoctors(),
            ]);
            setAppointments(appts || []);
            const centreDoc = docs.filter(d => !user.centreId || d.centreId === user.centreId || d.centreId === '');
            setDoctors(centreDoc.length > 0 ? centreDoc : docs);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 15000);
        return () => clearInterval(interval);
    }, []);

    const sorted = useMemo(() => {
        const copy = [...appointments];
        copy.sort((a, b) => {
            const da = new Date(a.date), db = new Date(b.date);
            if (sortBy === 'date-asc')  return da - db;
            if (sortBy === 'date-desc') return db - da;
            if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
            if (sortBy === 'type')   return (a.type || '').localeCompare(b.type || '');
            return 0;
        });
        return copy;
    }, [appointments, sortBy]);

    const nextAppt = useMemo(() =>
        appointments
            .filter(a => new Date(a.date) > new Date() && a.status !== 'cancelled')
            .sort((a, b) => new Date(a.date) - new Date(b.date))[0],
        [appointments]);

    const eventDates = useMemo(() => {
        const map = {};
        appointments.forEach(a => {
            const d = new Date(a.date);
            if (d.getMonth() === calMonth && d.getFullYear() === calYear) map[d.getDate()] = true;
        });
        return map;
    }, [appointments, calMonth, calYear]);

    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay    = new Date(calYear, calMonth, 1).getDay();

    const cancelAppt = async (id) => {
        if (!window.confirm('Cancel this appointment?')) return;
        try {
            await appointmentService.updateAppointment(id, { status: 'cancelled' });
            showNotification('Appointment cancelled.', 'info');
            loadData();
        } catch { showNotification('Failed to cancel appointment.', 'error'); }
    };

    const toggleChecklist = async (apptId, itemId, done) => {
        try { await updateChecklistItem(apptId, itemId, done); loadData(); } catch { /* silent */ }
    };

    // ── Book new appointment ────────────────────────────────────────────────────
    const submitAppt = async (e) => {
        e.preventDefault();
        if (!apptForm.selectedTime) {
            setConflictMsg('Please select an available time slot from the grid below.');
            return;
        }
        setSubmitting(true);
        setConflictMsg('');
        try {
            const doc = doctors.find(d => d._id === apptForm.doctorId);
            await appointmentService.createAppointment({
                patientName: user.name,
                doctorId:    apptForm.doctorId,
                doctorName:  doc?.name || '',
                type:        apptForm.type,
                date:        apptForm.selectedTime,
                status:      'pending',
                duration:    Number(apptForm.duration),
                centre:      user.centreId || '',
                notes:       apptForm.notes,
            });
            setShowModal(false);
            setApptForm({ type: '', doctorId: '', duration: '60', notes: '', selectedDate: '', selectedTime: '' });
            showNotification('Appointment scheduled successfully! 🌿', 'success');
            loadData();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to book appointment.';
            if (err.response?.status === 409) {
                setConflictMsg('⚠️ ' + msg + ' Please choose a different slot.');
                setApptForm(prev => ({ ...prev, selectedTime: '' }));
                loadData(); // refresh so the newly-booked slot shows as locked
            } else {
                showNotification(msg, 'error');
            }
        } finally { setSubmitting(false); }
    };

    // ── Reschedule appointment ──────────────────────────────────────────────────
    const openReschedule = (appt) => {
        setRescheduleAppt(appt);
        setRescheduleForm({ selectedDate: '', selectedTime: '', reason: '' });
        setShowReschedule(true);
    };

    const submitReschedule = async (e) => {
        e.preventDefault();
        if (!rescheduleForm.selectedTime) {
            showNotification('Please pick a slot for the new time.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await appointmentService.updateAppointment(rescheduleAppt._id, {
                date:             rescheduleForm.selectedTime,
                status:           'pending',
                rescheduleReason: rescheduleForm.reason,
            });
            setShowReschedule(false);
            setRescheduleAppt(null);
            setRescheduleForm({ selectedDate: '', selectedTime: '', reason: '' });
            showNotification('Reschedule request submitted.', 'success');
            loadData();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to reschedule.';
            showNotification(msg, 'error');
        }
        finally { setSubmitting(false); }
    };

    const todayStr = new Date().toISOString().split('T')[0];

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}><div style={{ fontSize: '2rem' }}>🌿</div><p>Loading appointments...</p></div>
        </div>
    );

    return (
        <div className="tab-content active">
            <div className="tab-header">
                <h2>Appointment Management</h2>
                <div className="sort-controls">
                    <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="date-asc">Date (Oldest First)</option>
                        <option value="date-desc">Date (Newest First)</option>
                        <option value="status">Status</option>
                        <option value="type">Type</option>
                    </select>
                    <button className="dash-btn dash-btn-primary" onClick={() => setShowModal(true)}>+ Schedule New</button>
                </div>
            </div>

            {nextAppt && <NextSessionCard appointment={nextAppt} />}

            {/* Calendar mini-view */}
            <div className="card">
                <div className="calendar-header">
                    <h3>My Therapy Schedule</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => { let m = calMonth - 1, y = calYear; if (m < 0) { m = 11; y--; } setCalMonth(m); setCalYear(y); }}>‹</button>
                        <span style={{ fontWeight: 600, minWidth: '140px', textAlign: 'center' }}>{monthNames[calMonth]} {calYear}</span>
                        <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => { let m = calMonth + 1, y = calYear; if (m > 11) { m = 0; y++; } setCalMonth(m); setCalYear(y); }}>›</button>
                    </div>
                </div>
                <div className="calendar-grid">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="calendar-day">{d}</div>)}
                    {Array(firstDay).fill(null).map((_, i) => <div key={'e' + i} className="calendar-date empty" />)}
                    {Array(daysInMonth).fill(null).map((_, i) => {
                        const day = i + 1;
                        const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                        return <div key={day} className={`calendar-date ${isToday ? 'today' : ''} ${eventDates[day] ? 'has-event' : ''}`}>{day}</div>;
                    })}
                </div>
            </div>

            {/* Appointments List */}
            <div className="appointments-list">
                <h3>Your Appointments <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#999', fontWeight: 400 }}>🔄 15s</span></h3>
                {sorted.length === 0 && <p style={{ color: '#777', padding: '1rem' }}>No appointments found. Schedule your first one!</p>}
                {sorted.map(a => (
                    <div key={a._id} className="appointment-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="appointment-details">
                                <h4>{a.type}</h4>
                                <p>📅 {new Date(a.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {a.duration} min</p>
                                <p>👨‍⚕️ {a.doctorName}</p>
                                {a.notes && <p style={{ color: '#777', fontSize: '0.85rem' }}>📝 {a.notes}</p>}
                            </div>
                            <div className="appointment-actions">
                                <span className={`status-badge status-${a.status}`}>{a.status}</span>
                                {(a.status === 'pending' || a.status === 'confirmed') && (
                                    <>
                                        <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => openReschedule(a)}>Reschedule</button>
                                        <button className="dash-btn dash-btn-danger dash-btn-sm" onClick={() => cancelAppt(a._id)}>Cancel</button>
                                    </>
                                )}
                                {(a.checklistItems?.length > 0 || a.precautions || a.postCare) && (
                                    <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => setExpandedId(expandedId === a._id ? null : a._id)}>
                                        {expandedId === a._id ? '▲ Less' : '▼ Details'}
                                    </button>
                                )}
                            </div>
                        </div>
                        {expandedId === a._id && (
                            <div style={{ marginTop: '0.75rem', padding: '1rem', background: '#f9fbe7', borderRadius: '10px', border: '1px solid #e8f5e9' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    {a.precautions && <div><div style={{ fontWeight: 600, color: '#2a7d2e', fontSize: '0.85rem', marginBottom: '0.4rem' }}>⚠️ Pre-Procedure Instructions</div><p style={{ fontSize: '0.82rem', color: '#555', lineHeight: 1.5 }}>{a.precautions}</p></div>}
                                    {a.postCare    && <div><div style={{ fontWeight: 600, color: '#2a7d2e', fontSize: '0.85rem', marginBottom: '0.4rem' }}>🌿 Post-Procedure Care</div><p style={{ fontSize: '0.82rem', color: '#555', lineHeight: 1.5 }}>{a.postCare}</p></div>}
                                </div>
                                {a.checklistItems?.length > 0 && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <div style={{ fontWeight: 600, color: '#2a7d2e', fontSize: '0.85rem', marginBottom: '0.5rem' }}>✅ Preparation Checklist</div>
                                        {a.checklistItems.map(item => (
                                            <label key={item._id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={item.done} onChange={e => toggleChecklist(a._id, item._id, e.target.checked)} />
                                                <span style={{ fontSize: '0.85rem', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? '#aaa' : '#333' }}>{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {a.rescheduleHistory?.length > 0 && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <div style={{ fontWeight: 600, color: '#888', fontSize: '0.82rem', marginBottom: '0.4rem' }}>🔄 Reschedule History</div>
                                        {a.rescheduleHistory.map((r, i) => (
                                            <div key={i} style={{ fontSize: '0.78rem', color: '#777', padding: '3px 0' }}>
                                                {new Date(r.from).toLocaleDateString()} → {new Date(r.to).toLocaleDateString()} ({r.requestedBy}: {r.reason || 'No reason'})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ─── BOOKING MODAL ─────────────────────────────────────────────────── */}
            {showModal && (
                <div className="dash-modal open">
                    <div className="dash-modal-content" style={{ maxWidth: '700px', width: '95vw' }}>
                        <div className="modal-header">
                            <h3>📅 Schedule New Appointment</h3>
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
                                    <label>Therapy Type *</label>
                                    <select required value={apptForm.type} onChange={e => setApptForm({ ...apptForm, type: e.target.value })}>
                                        <option value="">Select Therapy</option>
                                        {THERAPY_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="dash-form-group">
                                    <label>Preferred Doctor *</label>
                                    <select required value={apptForm.doctorId} onChange={e => setApptForm({ ...apptForm, doctorId: e.target.value, selectedTime: '' })}>
                                        <option value="">Select Doctor</option>
                                        {doctors.map(d => <option key={d._id} value={d._id}>{d.name} — {d.speciality || 'Ayurveda'}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="dash-form-group">
                                    <label>Duration (minutes)</label>
                                    <select value={apptForm.duration} onChange={e => setApptForm({ ...apptForm, duration: e.target.value, selectedTime: '' })}>
                                        <option value="30">30 min</option>
                                        <option value="45">45 min</option>
                                        <option value="60">60 min</option>
                                        <option value="90">90 min</option>
                                        <option value="120">120 min</option>
                                    </select>
                                </div>
                                <div className="dash-form-group">
                                    <label>Preferred Date *</label>
                                    <input
                                        type="date"
                                        required
                                        min={todayStr}
                                        value={apptForm.selectedDate}
                                        onChange={e => setApptForm({ ...apptForm, selectedDate: e.target.value, selectedTime: '' })}
                                    />
                                </div>
                            </div>

                            {/* Visual slot grid — locked slots are unclickable */}
                            <div className="dash-form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Available Time Slots
                                    {apptForm.selectedTime && (
                                        <span style={{ fontSize: '0.8rem', color: '#2a7d2e', fontWeight: 600, background: '#dcfce7', padding: '2px 8px', borderRadius: '20px' }}>
                                            ✓ {new Date(apptForm.selectedTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} selected
                                        </span>
                                    )}
                                </label>
                                <SlotPicker
                                    doctorId={apptForm.doctorId}
                                    date={apptForm.selectedDate}
                                    duration={Number(apptForm.duration)}
                                    selectedTime={apptForm.selectedTime}
                                    onSelect={(time) => {
                                        setApptForm(prev => ({ ...prev, selectedTime: time || '' }));
                                        if (conflictMsg) setConflictMsg('');
                                    }}
                                    socketRef={socketRef}
                                />
                            </div>

                            <div className="dash-form-group">
                                <label>Notes (Optional)</label>
                                <textarea placeholder="Any specific concerns..." value={apptForm.notes} onChange={e => setApptForm({ ...apptForm, notes: e.target.value })} />
                            </div>

                            <button
                                type="submit"
                                className="dash-btn dash-btn-primary"
                                style={{ width: '100%', marginTop: '0.5rem' }}
                                disabled={submitting || !apptForm.selectedTime}
                            >
                                {submitting ? 'Scheduling…'
                                    : apptForm.selectedTime
                                        ? `Book ${new Date(apptForm.selectedTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} Slot`
                                        : 'Select a Slot to Book'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── RESCHEDULE MODAL ──────────────────────────────────────────────── */}
            {showReschedule && rescheduleAppt && (
                <div className="dash-modal open">
                    <div className="dash-modal-content" style={{ maxWidth: '700px', width: '95vw' }}>
                        <div className="modal-header">
                            <h3>🔄 Reschedule Appointment</h3>
                            <button className="modal-close" onClick={() => { setShowReschedule(false); setRescheduleAppt(null); }}>×</button>
                        </div>

                        {/* Info card */}
                        <div style={{ background: '#fff3e0', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', border: '1px solid #ffe0b2', fontSize: '0.85rem', color: '#e65100' }}>
                            📌 Rescheduling: <strong>{rescheduleAppt.type}</strong> with {rescheduleAppt.doctorName}
                            <br />
                            Current slot: {new Date(rescheduleAppt.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>

                        <form onSubmit={submitReschedule}>
                            <div className="form-row">
                                <div className="dash-form-group">
                                    <label>New Date *</label>
                                    <input
                                        type="date"
                                        required
                                        min={todayStr}
                                        value={rescheduleForm.selectedDate}
                                        onChange={e => setRescheduleForm(prev => ({ ...prev, selectedDate: e.target.value, selectedTime: '' }))}
                                    />
                                </div>
                                <div className="dash-form-group">
                                    <label>Reason for Rescheduling *</label>
                                    <select required value={rescheduleForm.reason} onChange={e => setRescheduleForm(prev => ({ ...prev, reason: e.target.value }))}>
                                        <option value="">Select reason</option>
                                        <option>Personal commitment</option>
                                        <option>Medical condition</option>
                                        <option>Travel</option>
                                        <option>Work conflict</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Slot Picker — shows real-time locked/free slots for this doctor */}
                            <div className="dash-form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Select New Slot
                                    {rescheduleForm.selectedTime && (
                                        <span style={{ fontSize: '0.8rem', color: '#2a7d2e', fontWeight: 600, background: '#dcfce7', padding: '2px 8px', borderRadius: '20px' }}>
                                            ✓ {new Date(rescheduleForm.selectedTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} selected
                                        </span>
                                    )}
                                </label>
                                <SlotPicker
                                    doctorId={rescheduleAppt.doctorId}
                                    date={rescheduleForm.selectedDate}
                                    duration={rescheduleAppt.duration}
                                    selectedTime={rescheduleForm.selectedTime}
                                    onSelect={(time) => setRescheduleForm(prev => ({ ...prev, selectedTime: time || '' }))}
                                    socketRef={socketRef}
                                />
                            </div>

                            <button
                                type="submit"
                                className="dash-btn dash-btn-primary"
                                style={{ width: '100%', marginTop: '0.5rem' }}
                                disabled={submitting || !rescheduleForm.selectedTime || !rescheduleForm.reason}
                            >
                                {submitting ? 'Submitting…'
                                    : rescheduleForm.selectedTime
                                        ? `Move to ${new Date(rescheduleForm.selectedTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                                        : 'Pick a Slot Above'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
