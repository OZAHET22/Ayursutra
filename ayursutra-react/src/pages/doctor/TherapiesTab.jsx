import { useState, useEffect } from 'react';
import * as therapyService from '../../services/therapyService';
import { getMyPatients } from '../../services/userService';
import { getTherapySlots, saveTherapySlots, updateTherapySlotStatus } from '../../services/trackingService';

const THERAPY_TYPES = ['All', 'panchakarma', 'abhyanga', 'shirodhara', 'basti', 'nasya'];
const statusColor = { active: '#4caf50', upcoming: '#ff9800', completed: '#9e9e9e', paused: '#f44336' };
const SLOT_STATUS_OPTS = [
    { value: 'scheduled',   label: '📅 Scheduled' },
    { value: 'completed',   label: '✅ Completed' },
    { value: 'missed',      label: '⚠️ Missed' },
    { value: 'rescheduled', label: '🔄 Rescheduled' },
    { value: 'cancelled',   label: '❌ Cancelled' },
];

// ── Per-patient Therapy Slot Manager ─────────────────────────────────────────
function TherapySlotsManager({ therapy, showNotification, onRefresh }) {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingSlotIdx, setSavingSlotIdx] = useState(null);
    const [dirty, setDirty] = useState(false);
    const totalSessions = therapy.sessions || 1;

    const loadSlots = async () => {
        try {
            const s = await getTherapySlots(therapy._id);
            // If no slots exist yet, pre-fill from totalSessions
            if (!s || s.length === 0) {
                const generated = Array.from({ length: totalSessions }, (_, i) => ({
                    slotIndex: i + 1,
                    date: '',
                    time: '',
                    duration: 60,
                    notes: '',
                    status: 'scheduled',
                }));
                setSlots(generated);
            } else {
                setSlots(s);
            }
        } catch { setSlots([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadSlots(); }, [therapy._id]);

    const updateField = (idx, field, value) => {
        setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
        setDirty(true);
    };

    const addSlot = () => {
        setSlots(prev => [...prev, { slotIndex: prev.length + 1, date: '', time: '', duration: 60, notes: '', status: 'scheduled' }]);
        setDirty(true);
    };

    const removeSlot = (idx) => {
        setSlots(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, slotIndex: i + 1 })));
        setDirty(true);
    };

    const saveAll = async () => {
        setSaving(true);
        try {
            await saveTherapySlots(therapy._id, slots);
            showNotification('Session schedule saved & patient notified!', 'success');
            setDirty(false);
            onRefresh();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to save slots.', 'error');
        } finally { setSaving(false); }
    };

    const markSlotStatus = async (slot, newStatus) => {
        setSavingSlotIdx(slot.slotIndex);
        try {
            await updateTherapySlotStatus(therapy._id, slot.slotIndex, newStatus, slot.notes);
            showNotification(`Session ${slot.slotIndex} marked as ${newStatus}.`, 'success');
            loadSlots();
            onRefresh();
        } catch {
            showNotification('Failed to update slot status.', 'error');
        } finally { setSavingSlotIdx(null); }
    };

    if (loading) return <div style={{ padding: '1rem', color: '#aaa', fontSize: '0.85rem' }}>Loading session schedule…</div>;

    const completedCount = slots.filter(s => s.status === 'completed').length;

    return (
        <div>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#555' }}>
                    👤 <strong>{therapy.patientName}</strong> · {completedCount}/{slots.length} sessions completed
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={addSlot}
                        style={{ padding: '5px 12px', borderRadius: '7px', border: '1px solid #c8e6c9', background: '#e8f5e9', color: '#2a7d2e', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                        + Add Slot
                    </button>
                    {dirty && (
                        <button onClick={saveAll} disabled={saving}
                            style={{ padding: '5px 14px', borderRadius: '7px', border: 'none', background: saving ? '#ccc' : '#2a7d2e', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
                            {saving ? 'Saving…' : '💾 Save All'}
                        </button>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                <div style={{ height: '6px', background: 'linear-gradient(90deg, #2a7d2e, #66bb6a)', borderRadius: '3px', width: `${slots.length > 0 ? Math.round((completedCount / slots.length) * 100) : 0}%`, transition: 'width 0.5s' }} />
            </div>

            {/* Slot rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
                {slots.map((slot, i) => (
                    <div key={i} style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr 90px 70px 1fr auto',
                        gap: '0.4rem',
                        alignItems: 'center',
                        padding: '0.5rem 0.6rem',
                        borderRadius: '8px',
                        background: slot.status === 'completed' ? '#e8f5e9' : slot.status === 'missed' ? '#ffebee' : '#fafafa',
                        border: `1px solid ${slot.status === 'completed' ? '#c8e6c9' : slot.status === 'missed' ? '#ffcdd2' : '#eee'}`,
                    }}>
                        {/* Index */}
                        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#888', textAlign: 'center' }}>#{slot.slotIndex}</span>

                        {/* Date */}
                        <input type="date" value={slot.date || ''}
                            onChange={e => updateField(i, 'date', e.target.value)}
                            disabled={slot.status === 'completed'}
                            style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.78rem', width: '100%', boxSizing: 'border-box' }} />

                        {/* Time */}
                        <input type="time" value={slot.time || ''}
                            onChange={e => updateField(i, 'time', e.target.value)}
                            disabled={slot.status === 'completed'}
                            style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.78rem', width: '100%' }} />

                        {/* Duration */}
                        <select value={slot.duration || 60}
                            onChange={e => updateField(i, 'duration', Number(e.target.value))}
                            disabled={slot.status === 'completed'}
                            style={{ padding: '3px 4px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.75rem' }}>
                            {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d}m</option>)}
                        </select>

                        {/* Notes */}
                        <input type="text" value={slot.notes || ''} placeholder="Notes…"
                            onChange={e => updateField(i, 'notes', e.target.value)}
                            style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.75rem', width: '100%', boxSizing: 'border-box' }} />

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '3px' }}>
                            {slot.status !== 'completed' && (
                                <button
                                    onClick={() => markSlotStatus(slot, 'completed')}
                                    disabled={savingSlotIdx === slot.slotIndex}
                                    title="Mark as completed"
                                    style={{ padding: '3px 7px', borderRadius: '6px', border: 'none', background: '#e8f5e9', color: '#2a7d2e', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700 }}>
                                    ✓
                                </button>
                            )}
                            {slot.status !== 'missed' && slot.status !== 'completed' && (
                                <button
                                    onClick={() => markSlotStatus(slot, 'missed')}
                                    disabled={savingSlotIdx === slot.slotIndex}
                                    title="Mark as missed"
                                    style={{ padding: '3px 7px', borderRadius: '6px', border: 'none', background: '#ffebee', color: '#c62828', fontSize: '0.8rem', cursor: 'pointer' }}>
                                    ✗
                                </button>
                            )}
                            {slot.status === 'scheduled' && (
                                <button
                                    onClick={() => removeSlot(i)}
                                    title="Remove slot"
                                    style={{ padding: '3px 7px', borderRadius: '6px', border: 'none', background: '#f5f5f5', color: '#aaa', fontSize: '0.8rem', cursor: 'pointer' }}>
                                    🗑
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {slots.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#aaa', fontSize: '0.85rem' }}>
                    No slots yet. Click + Add Slot above.
                </div>
            )}

            {dirty && (
                <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: '#e65100', textAlign: 'right' }}>
                    ⚠️ Unsaved changes — click Save All to notify the patient.
                </div>
            )}
        </div>
    );
}

export default function TherapiesTab({ user, showNotification }) {
    const [therapies, setTherapies] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [sessionModal, setSessionModal] = useState(null);
    const [sessionForm, setSessionForm] = useState({ type: 'Treatment', status: 'completed', notes: '' });
    const [form, setForm] = useState({ name: '', patientId: '', description: '', type: '', sessions: '10', startDate: '', endDate: '' });
    // Which therapy has its slot manager expanded
    const [slotsOpenFor, setSlotsOpenFor] = useState(null);

    const loadData = async () => {
        try {
            const [ts, ps] = await Promise.all([therapyService.getTherapies(), getMyPatients()]);
            setTherapies(ts || []);
            setPatients(ps || []);
        } catch (err) { console.error('Load error:', err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 15000);
        return () => clearInterval(interval);
    }, []);

    const filtered = therapies.filter(t => filter === 'all' || t.type === filter);

    const submitTherapy = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const patient = patients.find(p => p._id === form.patientId);
            await therapyService.createTherapy({
                name: form.name,
                patientId: form.patientId,
                patientName: patient?.name || '',
                doctorId: user.id || user._id,
                doctorName: user.name,
                description: form.description,
                type: form.type,
                sessions: Number(form.sessions),
                completed: 0, progress: 0,
                status: 'upcoming',
                startDate: form.startDate,
                endDate: form.endDate,
                centre: user.centreId || '',
                sessionsList: [],
            });
            setShowModal(false);
            setForm({ name: '', patientId: '', description: '', type: '', sessions: '10', startDate: '', endDate: '' });
            showNotification('Therapy plan created successfully!', 'success');
            loadData();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to create therapy.', 'error');
        } finally { setSubmitting(false); }
    };

    const logSession = async (therapy) => {
        setSubmitting(true);
        try {
            const completed = (therapy.completed || 0) + 1;
            const progress = Math.min(100, Math.round((completed / therapy.sessions) * 100));
            const status = progress >= 100 ? 'completed' : 'active';
            const newSession = { ...sessionForm, date: new Date().toISOString() };
            await therapyService.updateTherapy(therapy._id, {
                completed,
                progress,
                status,
                sessionsList: [...(therapy.sessionsList || []), newSession],
            });
            setSessionModal(null);
            setSessionForm({ type: 'Treatment', status: 'completed', notes: '' });
            showNotification(`Session logged! ${completed}/${therapy.sessions} completed.`, 'success');
            loadData();
        } catch { showNotification('Failed to log session.', 'error'); }
        finally { setSubmitting(false); }
    };

    const updateStatus = async (therapy, newStatus) => {
        try {
            await therapyService.updateTherapy(therapy._id, { status: newStatus });
            showNotification(`Therapy status updated to ${newStatus}.`, 'success');
            loadData();
        } catch { showNotification('Failed to update status.', 'error'); }
    };

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💆</div>
                <p>Loading therapies...</p>
            </div>
        </div>
    );

    return (
        <div className="tab-content active">
            <div className="tab-header">
                <h2>Therapy Management
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#999', fontWeight: 400 }}>🔄 15s</span>
                </h2>
                <button className="dash-btn dash-btn-primary" onClick={() => setShowModal(true)}>+ Add New Therapy</button>
            </div>

            <div className="stats-grid">
                <div className="stat-card"><div className="stat-content"><h3>Active</h3><p className="stat-value">{therapies.filter(t => t.status === 'active').length}</p></div><div className="stat-icon">💆</div></div>
                <div className="stat-card"><div className="stat-content"><h3>Upcoming</h3><p className="stat-value">{therapies.filter(t => t.status === 'upcoming').length}</p></div><div className="stat-icon">📅</div></div>
                <div className="stat-card"><div className="stat-content"><h3>Completed</h3><p className="stat-value">{therapies.filter(t => t.status === 'completed').length}</p></div><div className="stat-icon">✅</div></div>
                <div className="stat-card"><div className="stat-content"><h3>Total Sessions</h3><p className="stat-value">{therapies.reduce((s, t) => s + (t.completed || 0), 0)}</p></div><div className="stat-icon">🗓️</div></div>
            </div>

            <div className="filters-section">
                <div className="filter-options">
                    {THERAPY_TYPES.map(f => (
                        <button key={f} className={`filter-btn ${(filter === 'all' && f === 'All') || filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f === 'All' ? 'all' : f)}>
                            {f === 'All' ? 'All Therapies' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="therapies-grid">
                {filtered.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#777' }}>
                        <p>No therapies found. Create a therapy plan for your patients.</p>
                    </div>
                )}
                {filtered.map(t => (
                    <div key={t._id} className="therapy-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="therapy-header">
                            <div className="therapy-name">{t.name}</div>
                            <span className="status-badge" style={{ background: (statusColor[t.status] || '#999') + '22', color: statusColor[t.status] || '#999' }}>{t.status}</span>
                        </div>
                        <div className="therapy-details">
                            <p>👤 {t.patientName}</p>
                            <p>📋 {t.description || 'No description'}</p>
                            <p>📅 {t.startDate ? new Date(t.startDate).toLocaleDateString('en-IN') : '—'} → {t.endDate ? new Date(t.endDate).toLocaleDateString('en-IN') : '—'}</p>
                            <p>✅ {t.completed}/{t.sessions} sessions</p>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${t.progress || 0}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#777', marginBottom: '0.75rem' }}>
                            <span>Progress</span><span>{t.progress || 0}%</span>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                            {t.status !== 'completed' && (
                                <button className="dash-btn dash-btn-primary dash-btn-sm" onClick={() => setSessionModal(t)}>
                                    + Log Session
                                </button>
                            )}
                            {t.status === 'upcoming' && <button className="dash-btn dash-btn-success dash-btn-sm" onClick={() => updateStatus(t, 'active')}>▶ Activate</button>}
                            {t.status === 'active' && <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => updateStatus(t, 'paused')}>⏸ Pause</button>}
                            {t.status === 'paused' && <button className="dash-btn dash-btn-success dash-btn-sm" onClick={() => updateStatus(t, 'active')}>▶ Resume</button>}
                            {(t.status === 'active' || t.status === 'paused') && <button className="dash-btn dash-btn-danger dash-btn-sm" onClick={() => updateStatus(t, 'completed')}>✓ Complete</button>}
                        </div>

                        {/* ── Per-patient Therapy Slot Manager Toggle ───────────────── */}
                        <button
                            onClick={() => setSlotsOpenFor(slotsOpenFor === t._id ? null : t._id)}
                            style={{
                                padding: '6px 0', background: 'none',
                                border: '1px solid #c8e6c9', borderRadius: '8px',
                                color: '#2a7d2e', fontWeight: 600, fontSize: '0.8rem',
                                cursor: 'pointer', textAlign: 'center',
                                marginTop: 'auto',
                            }}
                        >
                            {slotsOpenFor === t._id ? '▲ Hide Session Schedule' : '▼ Manage Session Slots'}
                        </button>

                        {slotsOpenFor === t._id && (
                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f9fbe7', borderRadius: '10px', border: '1px solid #e8f5e9' }}>
                                <div style={{ fontWeight: 700, color: '#2a7d2e', fontSize: '0.85rem', marginBottom: '0.6rem' }}>
                                    📅 Per-Patient Session Schedule
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.6rem' }}>
                                    Set individual date/time for each session. Patient sees this in their Therapy Tracking tab in real-time.
                                </div>
                                <TherapySlotsManager
                                    therapy={t}
                                    showNotification={showNotification}
                                    onRefresh={loadData}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Log Session Modal */}
            {sessionModal && (
                <div className="dash-modal open">
                    <div className="dash-modal-content">
                        <div className="modal-header">
                            <h3>Log Session — {sessionModal.name}</h3>
                            <button className="modal-close" onClick={() => setSessionModal(null)}>×</button>
                        </div>
                        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f0f9f0', borderRadius: '8px', fontSize: '0.9rem', color: '#2a7d2e' }}>
                            Sessions completed: {sessionModal.completed}/{sessionModal.sessions} ({sessionModal.progress || 0}%)
                        </div>
                        <div className="dash-form-group">
                            <label>Session Type</label>
                            <select value={sessionForm.type} onChange={e => setSessionForm({ ...sessionForm, type: e.target.value })}>
                                {['Treatment', 'Consultation', 'Follow-up', 'Assessment'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="dash-form-group">
                            <label>Outcome</label>
                            <select value={sessionForm.status} onChange={e => setSessionForm({ ...sessionForm, status: e.target.value })}>
                                <option value="completed">Completed</option>
                                <option value="missed">Patient Missed</option>
                            </select>
                        </div>
                        <div className="dash-form-group">
                            <label>Session Notes</label>
                            <textarea rows={3} placeholder="Patient observations, progress notes..." value={sessionForm.notes} onChange={e => setSessionForm({ ...sessionForm, notes: e.target.value })} />
                        </div>
                        <button className="dash-btn dash-btn-primary" style={{ width: '100%' }} disabled={submitting} onClick={() => logSession(sessionModal)}>
                            {submitting ? 'Logging...' : '✓ Log This Session'}
                        </button>
                    </div>
                </div>
            )}

            {/* Add Therapy Modal */}
            {showModal && (
                <div className="dash-modal open">
                    <div className="dash-modal-content">
                        <div className="modal-header">
                            <h3>Add New Therapy Plan</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={submitTherapy}>
                            <div className="dash-form-group"><label>Therapy Name</label><input required type="text" placeholder="e.g., Stress Relief Program" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="form-row">
                                <div className="dash-form-group">
                                    <label>Patient</label>
                                    <select required value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}>
                                        <option value="">Select Patient</option>
                                        {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="dash-form-group">
                                    <label>Therapy Type</label>
                                    <select required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="">Select Type</option>
                                        {['panchakarma', 'abhyanga', 'shirodhara', 'basti', 'nasya'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="dash-form-group"><label>Description</label><textarea placeholder="Therapy goals and details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            <div className="form-row">
                                <div className="dash-form-group"><label>Total Sessions</label><input type="number" min="1" value={form.sessions} onChange={e => setForm({ ...form, sessions: e.target.value })} /></div>
                                <div className="dash-form-group"><label>Start Date</label><input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
                            </div>
                            <div className="dash-form-group"><label>End Date</label><input type="date" required value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
                            <button type="submit" className="dash-btn dash-btn-primary" style={{ width: '100%' }} disabled={submitting}>{submitting ? 'Creating...' : 'Create Therapy Plan'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
