import { useState, useEffect } from 'react';
import { getTrackingTherapies, submitFeedback, getTherapySlots } from '../../services/trackingService';
import { getAppointments } from '../../services/appointmentService';

const SEV_COLOR = { mild: '#4caf50', moderate: '#ff9800', severe: '#f44336' };
const STATUS_COLOR = {
    scheduled: '#1976d2', completed: '#388e3c', missed: '#f44336',
    cancelled: '#9e9e9e', confirmed: '#1976d2', pending: '#ff9800',
    rescheduled: '#9c27b0',
};
const SLOT_STATUS_STYLE = {
    scheduled:   { bg: '#e3f2fd', color: '#1565c0', label: '📅 Scheduled' },
    completed:   { bg: '#e8f5e9', color: '#2a7d2e', label: '✅ Completed' },
    missed:      { bg: '#ffebee', color: '#c62828', label: '⚠️ Missed' },
    rescheduled: { bg: '#f3e5f5', color: '#6a1b9a', label: '🔄 Rescheduled' },
    cancelled:   { bg: '#fafafa', color: '#9e9e9e', label: '❌ Cancelled' },
};

function Countdown({ targetDate }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [pct, setPct] = useState(0);

    useEffect(() => {
        const update = () => {
            const now = new Date();
            const target = new Date(targetDate);
            const diff = target - now;
            if (diff <= 0) { setTimeLeft('Starting now!'); setPct(100); return; }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
            const maxMs = 7 * 24 * 3600000;
            setPct(Math.max(0, Math.min(100, 100 - (diff / maxMs) * 100)));
        };
        update();
        const iv = setInterval(update, 1000);
        return () => clearInterval(iv);
    }, [targetDate]);

    const r = 54, c = 2 * Math.PI * r;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
                <circle cx="65" cy="65" r={r} fill="none" stroke="#e8f5e9" strokeWidth="10" />
                <circle cx="65" cy="65" r={r} fill="none" stroke="#2a7d2e" strokeWidth="10"
                    strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
                    strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '65px 65px', transition: 'stroke-dashoffset 1s linear' }} />
                <text x="65" y="58" textAnchor="middle" fontSize="11" fill="#2a7d2e" fontWeight="700">NEXT SESSION</text>
                <text x="65" y="75" textAnchor="middle" fontSize="10" fill="#555">{timeLeft}</text>
            </svg>
        </div>
    );
}

// ── Per-therapy slot viewer (what doctor has scheduled for this patient) ───────
function TherapySlotsViewer({ therapyId }) {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        getTherapySlots(therapyId)
            .then(s => setSlots(s || []))
            .catch(() => setSlots([]))
            .finally(() => setLoading(false));
    }, [therapyId]);

    if (loading) return <div style={{ color: '#aaa', fontSize: '0.8rem', padding: '0.5rem' }}>Loading session schedule…</div>;
    if (slots.length === 0) return (
        <div style={{ color: '#aaa', fontSize: '0.82rem', padding: '0.5rem', fontStyle: 'italic' }}>
            No session slots have been scheduled by your doctor yet.
        </div>
    );

    const visibleSlots = expanded ? slots : slots.slice(0, 4);
    const completedCount = slots.filter(s => s.status === 'completed').length;

    return (
        <div>
            {/* Mini progress banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#555', fontWeight: 600 }}>
                    {completedCount}/{slots.length} sessions completed
                </span>
                <span style={{ fontSize: '0.78rem', color: '#2a7d2e', fontWeight: 700 }}>
                    {slots.length > 0 ? Math.round((completedCount / slots.length) * 100) : 0}%
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {visibleSlots.map((slot, i) => {
                    const style = SLOT_STATUS_STYLE[slot.status] || SLOT_STATUS_STYLE.scheduled;
                    const upcoming = slot.status === 'scheduled' && slot.date;
                    return (
                        <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.5rem 0.8rem', borderRadius: '8px',
                            background: style.bg, border: `1px solid ${style.color}30`,
                        }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#888', minWidth: '30px' }}>
                                    #{slot.slotIndex}
                                </span>
                                <div>
                                    {slot.date && (
                                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#333' }}>
                                            {new Date(slot.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            {slot.time && ` · ${slot.time}`}
                                        </div>
                                    )}
                                    {slot.notes && (
                                        <div style={{ fontSize: '0.75rem', color: '#777', marginTop: '1px' }}>📝 {slot.notes}</div>
                                    )}
                                </div>
                            </div>
                            <span style={{
                                padding: '2px 9px', borderRadius: '10px',
                                background: style.color + '18', color: style.color,
                                fontSize: '0.73rem', fontWeight: 700, whiteSpace: 'nowrap',
                            }}>
                                {style.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            {slots.length > 4 && (
                <button onClick={() => setExpanded(e => !e)}
                    style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#2a7d2e', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                    {expanded ? '▲ Show less' : `▼ Show all ${slots.length} sessions`}
                </button>
            )}
        </div>
    );
}

export default function PatientTherapyTrackingTab({ user, showNotification, socketRef }) {
    const [therapies, setTherapies] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedbackFor, setFeedbackFor] = useState(null);
    const [feedbackForm, setFeedbackForm] = useState({ symptoms: '', severity: 'mild', notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const [expandedTherapyId, setExpandedTherapyId] = useState(null);
    // Bumped whenever a therapy_slots_updated socket event arrives → forces TherapySlotsViewer to remount & re-fetch
    const [slotsRefreshKey, setSlotsRefreshKey] = useState(0);

    const loadData = async () => {
        try {
            const [t, a] = await Promise.all([getTrackingTherapies(), getAppointments()]);
            setTherapies(t || []);
            // appointments may come as { data, success } or plain array
            const apptArr = Array.isArray(a) ? a : (a?.data || []);
            setAppointments(apptArr);
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => {
        loadData();
        // Polling fallback: refresh every 15 s in case socket is unavailable
        const iv = setInterval(loadData, 15000);
        return () => clearInterval(iv);
    }, []);

    // Real-time: re-fetch immediately when the doctor touches therapy slots
    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket) return;
        const onSlotsUpdated = (data) => {
            // Reload therapies and bump the slots viewer key so it re-fetches
            loadData();
            setSlotsRefreshKey(k => k + 1);
        };
        const onApptBooked = () => loadData();
        socket.on('therapy_slots_updated', onSlotsUpdated);
        socket.on('appointment_booked',    onApptBooked);
        socket.on('slots_updated',         onApptBooked);
        return () => {
            socket.off('therapy_slots_updated', onSlotsUpdated);
            socket.off('appointment_booked',    onApptBooked);
            socket.off('slots_updated',         onApptBooked);
        };
    }, [socketRef]);

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const appt = feedbackFor;
            await submitFeedback({
                appointmentId: appt._id,
                therapyId: null,
                ...feedbackForm,
            });
            showNotification('Feedback submitted! Thank you.', 'success');
            setFeedbackFor(null);
            setFeedbackForm({ symptoms: '', severity: 'mild', notes: '' });
            loadData();
        } catch { showNotification('Failed to submit feedback', 'error'); }
        finally { setSubmitting(false); }
    };

    const now = new Date();
    const nextAppt = appointments
        .filter(a => new Date(a.date) > now && a.status !== 'cancelled')
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    const recentCompleted = appointments.filter(a => {
        const apptDate = new Date(a.date);
        const hoursAgo = (now - apptDate) / (1000 * 60 * 60);
        return a.status === 'completed' && hoursAgo >= 0 && hoursAgo <= 24;
    });

    const sortedAppts = [...appointments].sort((a, b) => new Date(b.date) - new Date(a.date));

    const activeTherapies = therapies.filter(t => t.status === 'active' || t.status === 'upcoming');
    const completedTherapies = therapies.filter(t => t.status === 'completed');

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}><div style={{ fontSize: '2rem' }}>🌿</div><p>Loading tracking...</p></div>
        </div>
    );

    return (
        <div className="tab-content active">
            <div className="tab-header"><h2>🌿 My Therapy Journey</h2></div>

            {/* ── Top Row: Countdown + Quick Stats ──────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>
                {/* Countdown */}
                <div className="card" style={{ textAlign: 'center', minWidth: '200px' }}>
                    <h4 style={{ color: '#2a7d2e', marginBottom: '0.75rem' }}>⏳ Next Session</h4>
                    {nextAppt ? (
                        <>
                            <Countdown targetDate={nextAppt.date} />
                            <div style={{ marginTop: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>{nextAppt.type}</div>
                            <div style={{ color: '#777', fontSize: '0.8rem' }}>{new Date(nextAppt.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                            <div style={{ color: '#777', fontSize: '0.8rem' }}>👨‍⚕️ {nextAppt.doctorName}</div>
                        </>
                    ) : <div style={{ color: '#aaa', fontSize: '0.9rem', padding: '1rem' }}>No upcoming sessions</div>}
                </div>

                {/* Active Therapies & Doctor Updates */}
                <div>
                    <h3 style={{ color: '#2a7d2e', marginBottom: '1rem' }}>My Active Therapies</h3>
                    {activeTherapies.length === 0 && (
                        <p style={{ color: '#777' }}>No active therapies. Your doctor will assign them.</p>
                    )}
                    {activeTherapies.map(therapy => (
                        <div key={therapy._id} className="card" style={{ marginBottom: '1rem', border: '1px solid #e8f5e9' }}>
                            {/* Therapy header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{therapy.name}</div>
                                    <div style={{ color: '#666', fontSize: '0.82rem' }}>
                                        {therapy.type} · {therapy.completed}/{therapy.sessions} sessions · 👨‍⚕️ {therapy.doctorName}
                                    </div>
                                </div>
                                <span className={`status-badge status-${therapy.status}`}>{therapy.status}</span>
                            </div>

                            {/* Progress bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div style={{ flex: 1, height: '10px', background: '#e0e0e0', borderRadius: '5px', overflow: 'hidden' }}>
                                    <div style={{ height: '10px', background: 'linear-gradient(90deg, #2a7d2e, #66bb6a)', borderRadius: '5px', width: `${therapy.progress}%`, transition: 'width 0.5s ease' }} />
                                </div>
                                <span style={{ fontWeight: 700, color: '#2a7d2e', minWidth: '36px', fontSize: '0.9rem' }}>{therapy.progress}%</span>
                            </div>

                            {/* Milestones row */}
                            {(therapy.milestones || []).length > 0 && (
                                <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {therapy.milestones.map((m, i) => (
                                        <div key={i} title={m.description || m.name}
                                            style={{ background: '#fff9c4', borderRadius: '8px', padding: '3px 10px', border: '1px solid #ffe082', fontSize: '0.78rem' }}>
                                            {m.icon} {m.name}
                                            <span style={{ color: '#aaa', marginLeft: '4px' }}>· {new Date(m.achievedAt).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Doctor's practitioner notes (visible to patient) */}
                            {therapy.practitionerNotes && (
                                <div style={{ background: '#f0f9f0', borderRadius: '8px', padding: '0.6rem 0.85rem', marginBottom: '0.75rem', border: '1px solid #c8e6c9', fontSize: '0.83rem' }}>
                                    <div style={{ fontWeight: 700, color: '#2a7d2e', marginBottom: '3px', fontSize: '0.78rem' }}>👨‍⚕️ DOCTOR'S NOTES</div>
                                    <div style={{ color: '#444', lineHeight: 1.5 }}>{therapy.practitionerNotes}</div>
                                </div>
                            )}

                            {/* Toggle to show/hide session slots */}
                            <button
                                onClick={() => setExpandedTherapyId(expandedTherapyId === therapy._id ? null : therapy._id)}
                                style={{ background: 'none', border: '1px solid #c8e6c9', borderRadius: '8px', padding: '5px 12px', color: '#2a7d2e', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                            >
                                {expandedTherapyId === therapy._id ? '▲ Hide session schedule' : '▼ View doctor-scheduled sessions'}
                            </button>

                            {expandedTherapyId === therapy._id && (
                                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fafafa', borderRadius: '10px', border: '1px solid #f0f0f0' }}>
                                    <div style={{ fontWeight: 700, color: '#2a7d2e', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                        📅 Session Schedule (set by Dr. {therapy.doctorName})
                                    </div>
                                    {/* key={slotsRefreshKey} forces remount & re-fetch when doctor updates slots */}
                                    <TherapySlotsViewer key={`${therapy._id}-${slotsRefreshKey}`} therapyId={therapy._id} />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Completed Therapies (collapsed) */}
                    {completedTherapies.length > 0 && (
                        <div style={{ background: '#fafafa', borderRadius: '12px', padding: '0.75rem 1rem', border: '1px solid #e0e0e0' }}>
                            <div style={{ fontWeight: 700, color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                ✅ Completed Therapies ({completedTherapies.length})
                            </div>
                            {completedTherapies.map(t => (
                                <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.83rem', color: '#666' }}>
                                    <span>{t.name}</span>
                                    <span style={{ color: '#388e3c', fontWeight: 600 }}>{t.sessions} sessions ✓</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Post-Session Feedback Banners ─────────────────────────────── */}
            {recentCompleted.length > 0 && (
                <div style={{ background: 'linear-gradient(135deg, #e3f2fd, #e8f5e9)', borderRadius: '14px', padding: '1rem 1.5rem', marginBottom: '1.5rem', border: '1px solid #90caf9' }}>
                    <h4 style={{ color: '#1565c0', marginBottom: '0.75rem' }}>📋 Recent Sessions — Share Your Feedback</h4>
                    {recentCompleted.map(a => (
                        <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{a.type} — {new Date(a.date).toLocaleDateString()}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>with {a.doctorName}</div>
                            </div>
                            {(a.symptomLog || []).length > 0 ? (
                                <span style={{ color: '#4caf50', fontSize: '0.85rem', fontWeight: 600 }}>✓ Feedback submitted</span>
                            ) : (
                                <button className="dash-btn dash-btn-primary dash-btn-sm" onClick={() => setFeedbackFor(a)}>
                                    Log Symptoms
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Session Timeline ──────────────────────────────────────────── */}
            <h3 style={{ color: '#2a7d2e', marginBottom: '1rem' }}>📅 Session Timeline</h3>
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
                <div style={{ position: 'absolute', left: '10px', top: 0, bottom: 0, width: '2px', background: '#e0e0e0' }} />
                {sortedAppts.slice(0, 12).map((a) => (
                    <div key={a._id} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', position: 'relative' }}>
                        <div style={{
                            position: 'absolute', left: '-18px', top: '8px',
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: STATUS_COLOR[a.status] || '#ccc',
                            border: '2px solid #fff',
                            boxShadow: '0 0 0 2px ' + (STATUS_COLOR[a.status] || '#ccc'),
                        }} />
                        <div style={{ flex: 1, background: '#fafafa', borderRadius: '10px', padding: '0.75rem 1rem', border: `1px solid ${STATUS_COLOR[a.status] || '#eee'}30` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.type}</div>
                                <span className={`status-badge status-${a.status}`}>{a.status}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                                {new Date(a.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {a.duration} min · 👨‍⚕️ {a.doctorName}
                            </div>
                            {/* Show doctor's adjusted post-care if available */}
                            {a.postCare && a.status === 'completed' && (
                                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#2a7d2e', background: '#e8f5e9', padding: '4px 8px', borderRadius: '6px' }}>
                                    🌿 Post-care: {a.postCare.substring(0, 100)}{a.postCare.length > 100 ? '…' : ''}
                                </div>
                            )}
                            {/* Show doctor's symptom action response if exists */}
                            {(a.symptomLog || []).some(s => s.doctorAction?.action && s.doctorAction.action !== 'no_change') && (
                                <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#e65100', background: '#fff8e1', padding: '4px 8px', borderRadius: '6px', border: '1px solid #ffe082' }}>
                                    👨‍⚕️ Doctor adjusted your schedule based on reported symptoms.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {sortedAppts.length === 0 && <p style={{ color: '#777' }}>No session history yet.</p>}
            </div>

            {/* ── Feedback Modal ─────────────────────────────────────────────── */}
            {feedbackFor && (
                <div className="dash-modal open">
                    <div className="dash-modal-content">
                        <div className="modal-header">
                            <h3>🌿 Post-Session Feedback</h3>
                            <button className="modal-close" onClick={() => setFeedbackFor(null)}>×</button>
                        </div>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            {feedbackFor.type} on {new Date(feedbackFor.date).toLocaleDateString()} with {feedbackFor.doctorName}
                        </p>
                        <form onSubmit={handleFeedbackSubmit}>
                            <div className="dash-form-group">
                                <label>How are you feeling now? (Symptoms)</label>
                                <textarea required rows={3} value={feedbackForm.symptoms}
                                    onChange={e => setFeedbackForm(f => ({ ...f, symptoms: e.target.value }))}
                                    placeholder="Describe any symptoms or changes you notice..." />
                            </div>
                            <div className="dash-form-group">
                                <label>Severity</label>
                                <select value={feedbackForm.severity} onChange={e => setFeedbackForm(f => ({ ...f, severity: e.target.value }))}>
                                    <option value="mild">😊 Mild — Feeling good overall</option>
                                    <option value="moderate">😐 Moderate — Some discomfort</option>
                                    <option value="severe">😟 Severe — Significant discomfort</option>
                                </select>
                            </div>
                            <div className="dash-form-group">
                                <label>Additional Notes</label>
                                <input value={feedbackForm.notes} onChange={e => setFeedbackForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any other observations..." />
                            </div>
                            <button type="submit" className="dash-btn dash-btn-primary" style={{ width: '100%' }} disabled={submitting}>
                                {submitting ? 'Submitting...' : '✓ Submit Feedback'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
