import { useState, useEffect, useCallback } from 'react';
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
            if (!s || s.length === 0) {
                const generated = Array.from({ length: totalSessions }, (_, i) => ({
                    slotIndex: i + 1, date: '', time: '', duration: 60, notes: '', status: 'scheduled',
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

    // Save ONE slot: PATCH status/notes first (backend auto-recalculates therapy.completed & progress),
    // then POST the full slots array to persist date/time/duration changes.
    const saveSlot = async (slot, idx) => {
        setSavingSlotIdx(slot.slotIndex);
        try {
            await updateTherapySlotStatus(therapy._id, slot.slotIndex, slot.status, slot.notes);
            const updatedSlots = slots.map((s, i) => i === idx ? { ...s } : s);
            await saveTherapySlots(therapy._id, updatedSlots);
            showNotification(`Session #${slot.slotIndex} updated successfully!`, 'success');
            setDirty(false);
            loadSlots();
            onRefresh();
        } catch (err) {
            showNotification(err.response?.data?.message || `Failed to save session #${slot.slotIndex}.`, 'error');
        } finally { setSavingSlotIdx(null); }
    };

    // Save ALL slots at once (date/time/duration/notes — status is batched too via saveTherapySlots)
    const saveAll = async () => {
        setSaving(true);
        try {
            await saveTherapySlots(therapy._id, slots);
            showNotification('All sessions saved & patient notified!', 'success');
            setDirty(false);
            loadSlots();
            onRefresh();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to save.', 'error');
        } finally { setSaving(false); }
    };

    if (loading) return <div style={{ padding: '1rem', color: '#aaa', fontSize: '0.85rem' }}>Loading sessions…</div>;

    const completedCount = slots.filter(s => s.status === 'completed').length;
    const BG  = { completed: '#e8f5e9', missed: '#ffebee', rescheduled: '#fff8e1', cancelled: '#f5f5f5', scheduled: '#f5f9ff' };
    const BD  = { completed: '#c8e6c9', missed: '#ffcdd2', rescheduled: '#ffe082', cancelled: '#eee',    scheduled: '#bbdefb' };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#555' }}>
                    👤 <strong>{therapy.patientName}</strong> · {completedCount}/{slots.length} completed
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={addSlot} style={{ padding: '4px 10px', borderRadius: '7px', border: '1px solid #c8e6c9', background: '#e8f5e9', color: '#2a7d2e', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                        + Add Session
                    </button>
                    {dirty && (
                        <button onClick={saveAll} disabled={saving} style={{ padding: '4px 12px', borderRadius: '7px', border: 'none', background: saving ? '#ccc' : '#2a7d2e', color: '#fff', fontWeight: 700, fontSize: '0.75rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
                            {saving ? 'Saving…' : '💾 Save All'}
                        </button>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: '5px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.7rem' }}>
                <div style={{ height: '5px', background: 'linear-gradient(90deg,#2a7d2e,#66bb6a)', width: `${slots.length > 0 ? Math.round((completedCount/slots.length)*100) : 0}%`, transition: 'width 0.5s', borderRadius: '3px' }} />
            </div>

            {/* Column labels */}
            <div style={{ display: 'grid', gridTemplateColumns: '26px 108px 76px 58px 1fr 105px 82px', gap: '0.3rem', padding: '0 0.4rem 0.3rem', fontSize: '0.68rem', color: '#aaa', fontWeight: 700, textTransform: 'uppercase' }}>
                <span>#</span><span>Date</span><span>Time</span><span>Min</span><span>Notes</span><span>Status</span><span>Save/Del</span>
            </div>

            {/* Session rows — every field always editable */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '2px' }}>
                {slots.map((slot, i) => (
                    <div key={slot.slotIndex} style={{
                        display: 'grid',
                        gridTemplateColumns: '26px 108px 76px 58px 1fr 105px 82px',
                        gap: '0.3rem',
                        alignItems: 'center',
                        padding: '0.45rem 0.5rem',
                        borderRadius: '8px',
                        background: BG[slot.status] || '#fafafa',
                        border: `1px solid ${BD[slot.status] || '#eee'}`,
                        transition: 'background 0.2s',
                    }}>
                        {/* # */}
                        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#777', textAlign: 'center' }}>#{slot.slotIndex}</span>

                        {/* Date — always editable */}
                        <input type="date" value={slot.date || ''}
                            onChange={e => updateField(i, 'date', e.target.value)}
                            style={{ padding: '3px 4px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.73rem', width: '100%', boxSizing: 'border-box' }} />

                        {/* Time — always editable */}
                        <input type="time" value={slot.time || ''}
                            onChange={e => updateField(i, 'time', e.target.value)}
                            style={{ padding: '3px 4px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.73rem', width: '100%' }} />

                        {/* Duration */}
                        <select value={slot.duration || 60}
                            onChange={e => updateField(i, 'duration', Number(e.target.value))}
                            style={{ padding: '3px 2px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.7rem' }}>
                            {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>

                        {/* Notes — always editable */}
                        <input type="text" value={slot.notes || ''} placeholder="Session notes…"
                            onChange={e => updateField(i, 'notes', e.target.value)}
                            style={{ padding: '3px 5px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.71rem', width: '100%', boxSizing: 'border-box' }} />

                        {/* Status dropdown — doctor can change to any status at any time */}
                        <select value={slot.status || 'scheduled'}
                            onChange={e => updateField(i, 'status', e.target.value)}
                            style={{
                                padding: '3px 3px', borderRadius: '6px', fontSize: '0.71rem',
                                border: `1px solid ${BD[slot.status] || '#ddd'}`,
                                background: BG[slot.status] || '#fff',
                                fontWeight: 600, cursor: 'pointer',
                            }}>
                            {SLOT_STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>

                        {/* Save + Delete */}
                        <div style={{ display: 'flex', gap: '3px' }}>
                            <button
                                onClick={() => saveSlot(slot, i)}
                                disabled={savingSlotIdx === slot.slotIndex}
                                title="Save this session"
                                style={{ flex: 1, padding: '4px 0', borderRadius: '6px', border: 'none', background: '#2a7d2e', color: '#fff', fontSize: '0.75rem', cursor: savingSlotIdx === slot.slotIndex ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: savingSlotIdx === slot.slotIndex ? 0.6 : 1 }}>
                                {savingSlotIdx === slot.slotIndex ? '…' : '💾'}
                            </button>
                            <button
                                onClick={() => removeSlot(i)}
                                title="Remove session"
                                style={{ padding: '4px 7px', borderRadius: '6px', border: 'none', background: '#ffebee', color: '#c62828', fontSize: '0.75rem', cursor: 'pointer' }}>
                                🗑
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {slots.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#aaa', fontSize: '0.83rem' }}>
                    No sessions yet. Click <strong>+ Add Session</strong> above to schedule.
                </div>
            )}

            {dirty && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#e65100', textAlign: 'right' }}>
                    ⚠️ Unsaved changes — use 💾 per row or <strong>Save All</strong>
                </div>
            )}
        </div>
    );
}

export default function TherapiesTab({ user, showNotification, socketRef }) {
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
    // Edit modal
    const [editModal, setEditModal] = useState(null); // holds therapy being edited
    const [editForm, setEditForm] = useState({ name: '', description: '', type: '', sessions: '10', startDate: '', endDate: '', status: 'upcoming' });
    const [deleting, setDeleting] = useState(null); // holds therapy._id being deleted

    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        setError(null);
        try {
            // Run both fetches in parallel for speed — failures are caught independently
            const [ts, ps] = await Promise.allSettled([
                therapyService.getTherapies(),
                getMyPatients(),
            ]);
            // therapies
            if (ts.status === 'fulfilled') {
                setTherapies(Array.isArray(ts.value) ? ts.value : []);
            } else {
                const msg = ts.reason?.message || 'Failed to load therapies';
                console.error('[TherapiesTab] getTherapies:', msg);
                setTherapies([]);
                setError(msg);
            }
            // patients (non-blocking — dropdown just stays empty)
            if (ps.status === 'fulfilled') {
                setPatients(Array.isArray(ps.value) ? ps.value : []);
            } else {
                console.error('[TherapiesTab] getMyPatients:', ps.reason?.message);
                setPatients([]);
            }
        } finally {
            // ALWAYS clear the loading spinner, even on unexpected errors
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 15000);
        return () => clearInterval(interval);
    }, [loadData]);

    // Real-time: refresh therapy list when a slot update arrives
    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket) return;
        socket.on('therapy_slots_updated', loadData);
        socket.on('appointment_booked',    loadData);
        return () => {
            socket.off('therapy_slots_updated', loadData);
            socket.off('appointment_booked',    loadData);
        };
    }, [socketRef, loadData]);

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

    // ── Open Edit Modal pre-filled with existing data ──────────────────────────
    const openEdit = (therapy) => {
        setEditForm({
            name: therapy.name || '',
            description: therapy.description || '',
            type: therapy.type || '',
            sessions: String(therapy.sessions || 10),
            startDate: therapy.startDate ? therapy.startDate.slice(0, 10) : '',
            endDate: therapy.endDate ? therapy.endDate.slice(0, 10) : '',
            status: therapy.status || 'upcoming',
        });
        setEditModal(therapy);
    };

    const submitEdit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await therapyService.updateTherapy(editModal._id, {
                name: editForm.name,
                description: editForm.description,
                type: editForm.type,
                sessions: Number(editForm.sessions),
                startDate: editForm.startDate,
                endDate: editForm.endDate,
                status: editForm.status,
            });
            setEditModal(null);
            showNotification('Therapy plan updated successfully!', 'success');
            loadData();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to update therapy.', 'error');
        } finally { setSubmitting(false); }
    };

    const deleteTherapy = async (therapy) => {
        if (!window.confirm(`Delete "${therapy.name}" for ${therapy.patientName}? This cannot be undone.`)) return;
        setDeleting(therapy._id);
        try {
            await therapyService.deleteTherapy(therapy._id);
            showNotification('Therapy plan deleted.', 'success');
            loadData();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to delete therapy.', 'error');
        } finally { setDeleting(null); }
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

            {/* Error banner */}
            {error && (
                <div style={{ background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#c62828', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>⚠️</span>
                    <span>{error}</span>
                    <button onClick={loadData} style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '6px', border: 'none', background: '#c62828', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}>Retry</button>
                </div>
            )}

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
                            {/* ── Edit & Delete ──────────────────────── */}
                            <button
                                className="dash-btn dash-btn-sm"
                                onClick={() => openEdit(t)}
                                style={{ background: '#fff3e0', color: '#e65100', border: '1px solid #ffe0b2', fontWeight: 600 }}
                            >
                                ✏️ Edit
                            </button>
                            <button
                                className="dash-btn dash-btn-sm"
                                onClick={() => deleteTherapy(t)}
                                disabled={deleting === t._id}
                                style={{ background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', fontWeight: 600 }}
                            >
                                {deleting === t._id ? '…' : '🗑️ Delete'}
                            </button>
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

            {/* ── Edit Therapy Modal ─────────────────────────────────────── */}
            {editModal && (
                <div className="dash-modal open">
                    <div className="dash-modal-content">
                        <div className="modal-header">
                            <h3>✏️ Edit Therapy Plan</h3>
                            <button className="modal-close" onClick={() => setEditModal(null)}>×</button>
                        </div>
                        <form onSubmit={submitEdit}>
                            <div className="dash-form-group">
                                <label>Therapy Name</label>
                                <input required type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="dash-form-group">
                                    <label>Therapy Type</label>
                                    <select required value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                                        <option value="">Select Type</option>
                                        {['panchakarma','abhyanga','shirodhara','basti','nasya'].map(tp => (
                                            <option key={tp} value={tp}>{tp.charAt(0).toUpperCase() + tp.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="dash-form-group">
                                    <label>Status</label>
                                    <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                                        {['upcoming','active','paused','completed'].map(s => (
                                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="dash-form-group">
                                <label>Description</label>
                                <textarea rows={3} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="dash-form-group">
                                    <label>Total Sessions</label>
                                    <input type="number" min="1" value={editForm.sessions} onChange={e => setEditForm({ ...editForm, sessions: e.target.value })} />
                                </div>
                                <div className="dash-form-group">
                                    <label>Start Date</label>
                                    <input type="date" required value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="dash-form-group">
                                <label>End Date</label>
                                <input type="date" required value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" className="dash-btn dash-btn-secondary" style={{ flex: 1 }} onClick={() => setEditModal(null)}>Cancel</button>
                                <button type="submit" className="dash-btn dash-btn-primary" style={{ flex: 1 }} disabled={submitting}>
                                    {submitting ? 'Saving…' : '💾 Save Changes'}
                                </button>
                            </div>
                        </form>
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
