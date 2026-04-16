import { useState, useEffect } from 'react';
import { getTrackingTherapies, addMilestone, updatePractitionerNotes, saveSymptomAction, getProgressData } from '../../services/trackingService';
import { getAppointments, updateAppointment } from '../../services/appointmentService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';

const MILESTONE_ICONS = ['🏆', '⭐', '💪', '🌟', '🎯', '🌿', '💚', '🏃', '🧘', '✨'];
const SEV_COLOR = { mild: '#4caf50', moderate: '#ff9800', severe: '#f44336' };

// ── Gap 2: Symptom Action Panel (inline, not modal) ──────────────────────────
function SymptomActionPanel({ symptom, therapyId, appointmentId, onSave, onCancel }) {
    const [action, setAction] = useState('no_change');
    const [doctorNote, setDoctorNote] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!doctorNote.trim()) return alert('Please enter a note.');
        setSaving(true);
        try {
            await saveSymptomAction(therapyId, {
                symptomId: symptom._id,
                action,
                doctorNote,
                appointmentId: appointmentId || null,
            });
            onSave();
        } catch (err) {
            alert('Failed to save: ' + (err.response?.data?.message || err.message));
        } finally { setSaving(false); }
    };

    return (
        <div style={{ background: '#fffde7', border: '1.5px solid #ffe082', borderRadius: '10px', padding: '1rem', marginTop: '0.5rem' }}>
            <div style={{ fontWeight: 600, color: '#e65100', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                ⚠ Adjust Schedule — <span style={{ color: SEV_COLOR[symptom.severity] }}>{symptom.severity?.toUpperCase()}</span>: "{symptom.symptoms}"
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Action</label>
                    <select value={action} onChange={e => setAction(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.82rem' }}>
                        <option value="postpone_session">Postpone Next Session (+1 Day)</option>
                        <option value="add_recovery_day">Add Recovery Day (Note Only)</option>
                        <option value="update_post_care">Update Post-Care Instructions</option>
                        <option value="no_change">No Change Needed</option>
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Doctor's Note *</label>
                    <input type="text" placeholder="Adjustment reason or updated instructions..."
                        value={doctorNote} onChange={e => setDoctorNote(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleSave} disabled={saving}
                    style={{ padding: '6px 16px', background: '#ff9800', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                    {saving ? 'Saving...' : '💾 Save Adjustment'}
                </button>
                <button onClick={onCancel}
                    style={{ padding: '6px 12px', background: '#f5f5f5', color: '#555', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem' }}>
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ── Gap 3: Progress Charts ───────────────────────────────────────────────────
function ProgressCharts({ therapyId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getProgressData(therapyId)
            .then(d => setData(d))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [therapyId]);

    if (loading) return <div style={{ padding: '1rem', color: '#aaa', fontSize: '0.85rem' }}>📊 Loading charts...</div>;
    if (error) return <div style={{ padding: '1rem', color: '#f44336', fontSize: '0.85rem' }}>⚠ Could not load chart data.</div>;
    if (!data) return null;

    const { sessionTrend, symptomTrend, overallProgress, milestoneCount, totalSessions, completedSessions } = data;
    const hasEnoughData = sessionTrend && sessionTrend.length >= 2;

    // Completion bar data
    const completionData = [
        { name: 'Completed', value: completedSessions, fill: '#4caf50' },
        { name: 'Remaining', value: Math.max(0, totalSessions - completedSessions), fill: '#e0e0e0' },
    ];

    return (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f0f0f0', paddingTop: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label style={{ fontWeight: 600, color: '#2a7d2e', fontSize: '0.9rem' }}>📊 Progress Charts</label>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>{milestoneCount} milestones · {overallProgress}% overall</span>
            </div>

            {/* Chart B: Completion bar */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem' }}>
                    Session Completion: {completedSessions} / {totalSessions}
                </div>
                <div style={{ display: 'flex', height: '28px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                    <div style={{ width: `${overallProgress}%`, background: 'linear-gradient(90deg, #2a7d2e, #66bb6a)', transition: 'width 0.6s', display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                        {overallProgress > 15 && <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>{overallProgress}%</span>}
                    </div>
                    <div style={{ flex: 1, background: '#f0f0f0', display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                        {overallProgress <= 15 && <span style={{ color: '#888', fontSize: '0.75rem' }}>{overallProgress}%</span>}
                    </div>
                </div>
            </div>

            {/* Chart A: Symptom severity trend */}
            {!hasEnoughData ? (
                <div style={{ padding: '1rem', background: '#fafafa', borderRadius: '8px', color: '#aaa', fontSize: '0.85rem', textAlign: 'center' }}>
                    📉 Not enough data yet — needs at least 2 sessions to show trend chart.
                </div>
            ) : (
                <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#555', marginBottom: '0.5rem' }}>
                        Symptom Severity Trend (↓ = improving)
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={sessionTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="sessionNumber" label={{ value: 'Session', position: 'insideBottom', offset: -2 }} tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]}
                                tickFormatter={v => ['', 'Mild', 'Mod', 'Sev'][v] || ''}
                                tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(v) => [['None', 'Mild', 'Moderate', 'Severe'][v] || v, 'Severity']} />
                            <Line type="monotone" dataKey="severityScore" stroke="#ff9800" strokeWidth={2}
                                dot={{ r: 4, fill: '#ff9800' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                    {symptomTrend.length > 0 && (
                        <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.25rem' }}>
                            Latest: <strong style={{ color: SEV_COLOR[symptomTrend[symptomTrend.length - 1]?.severity] }}>
                                {symptomTrend[symptomTrend.length - 1]?.severity}
                            </strong> — "{symptomTrend[symptomTrend.length - 1]?.symptomText}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DoctorTherapyTrackingTab({ user, showNotification, socketRef }) {
    const [therapies, setTherapies] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [notesEditing, setNotesEditing] = useState({});
    const [showMilestoneFor, setShowMilestoneFor] = useState(null);
    const [milestoneForm, setMilestoneForm] = useState({ name: '', icon: '🏆', description: '' });
    // Gap 2: track which symptom has the action panel open {therapyId, symptomId}
    const [activeSymptomAction, setActiveSymptomAction] = useState(null);

    const loadData = async () => {
        try {
            const [t, a] = await Promise.all([getTrackingTherapies(), getAppointments()]);
            setTherapies(t || []);
            // getAppointments now returns { success, data, notifResult } — extract .data
            setAppointments((a?.data || a) || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        loadData();
        // Polling fallback: refresh every 15 s in case socket is unavailable
        const iv = setInterval(loadData, 15000);
        return () => clearInterval(iv);
    }, []);

    // Real-time: refresh immediately when relevant events arrive
    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket) return;
        const refresh = () => loadData();
        socket.on('appointment_booked',    refresh);
        socket.on('slots_updated',         refresh);
        socket.on('therapy_slots_updated', refresh);
        return () => {
            socket.off('appointment_booked',    refresh);
            socket.off('slots_updated',         refresh);
            socket.off('therapy_slots_updated', refresh);
        };
    }, [socketRef]);

    const saveNotes = async (therapyId, notes) => {
        try {
            await updatePractitionerNotes(therapyId, notes);
            showNotification('Notes saved!', 'success');
        } catch { showNotification('Failed to save notes', 'error'); }
    };

    const submitMilestone = async (therapyId) => {
        if (!milestoneForm.name) return;
        try {
            await addMilestone({ therapyId, ...milestoneForm });
            setShowMilestoneFor(null);
            setMilestoneForm({ name: '', icon: '🏆', description: '' });
            showNotification('Milestone added!', 'success');
            loadData();
        } catch { showNotification('Failed to add milestone', 'error'); }
    };

    const updateStatus = async (apptId, status) => {
        try {
            await updateAppointment(apptId, { status });
            showNotification(`Session marked as ${status}`, 'success');
            loadData();
        } catch { showNotification('Failed to update', 'error'); }
    };

    // Live session detection
    const now = new Date();
    const apptList = Array.isArray(appointments) ? appointments : (appointments?.data || []);
    const liveSessions = apptList.filter(a => {
        const s = new Date(a.date);
        const e = new Date(s.getTime() + a.duration * 60000);
        return a.status !== 'cancelled' && a.status !== 'completed' && now >= s && now <= e;
    });
    const todaySessions = apptList.filter(a =>
        new Date(a.date).toDateString() === now.toDateString() && a.status !== 'cancelled'
    );

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}>
                <div style={{ fontSize: '2rem' }}>🔴</div><p>Loading tracking data...</p>
            </div>
        </div>
    );

    return (
        <div className="tab-content active">
            <div className="tab-header">
                <h2>🔴 Live Therapy Tracking</h2>
                <span style={{ fontSize: '0.8rem', color: '#999' }}>🔄 15s auto-refresh</span>
            </div>

            {/* Live Sessions Banner */}
            {liveSessions.length > 0 && (
                <div style={{ background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)', borderRadius: '14px', padding: '1rem 1.5rem', marginBottom: '1.5rem', border: '2px solid #4caf50' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ animation: 'pulse 1.5s infinite', fontSize: '1rem' }}>🟢</span>
                        <span style={{ fontWeight: 700, color: '#2a7d2e', fontSize: '1.05rem' }}>Live Sessions In Progress ({liveSessions.length})</span>
                    </div>
                    {liveSessions.map(a => (
                        <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.5rem', gap: '1rem' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{a.patientName} — {a.type}</div>
                                <div style={{ fontSize: '0.82rem', color: '#666' }}>Started at {new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {a.duration} min</div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="dash-btn dash-btn-primary dash-btn-sm" onClick={() => updateStatus(a._id, 'completed')}>✓ Complete</button>
                                <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => updateStatus(a._id, 'missed')}>Missed</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Stats */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                    { label: "Today's Sessions", value: todaySessions.length, color: '#2a7d2e', bg: '#e8f5e9', icon: '📅' },
                    { label: 'Active Therapies', value: therapies.filter(t => t.status === 'active').length, color: '#1976d2', bg: '#e3f2fd', icon: '💆' },
                    { label: 'Completed Today', value: todaySessions.filter(a => a.status === 'completed').length, color: '#388e3c', bg: '#f1f8e9', icon: '✅' },
                    { label: 'Live Now', value: liveSessions.length, color: '#f44336', bg: '#ffebee', icon: '🔴' },
                ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '1rem 1.5rem', flex: 1, minWidth: '130px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.85rem', color: '#555' }}>{s.icon} {s.label}</div>
                    </div>
                ))}
            </div>

            {/* Therapy Cards */}
            <h3 style={{ marginBottom: '1rem', color: '#2a7d2e' }}>Patient Therapy Tracking</h3>
            {therapies.length === 0 && <p style={{ color: '#777' }}>No therapies found.</p>}
            {therapies.map(therapy => (
                <div key={therapy._id} style={{ background: '#fff', borderRadius: '14px', marginBottom: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #e8f5e9' }}>
                    {/* Card Header */}
                    <div onClick={() => setExpandedId(expandedId === therapy._id ? null : therapy._id)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.2rem', cursor: 'pointer', background: expandedId === therapy._id ? '#f0f9f0' : '#fff' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>💆</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{therapy.name}</div>
                                <div style={{ color: '#666', fontSize: '0.85rem' }}>{therapy.patientName} · {therapy.type || 'N/A'}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                                    <div style={{ height: '6px', background: '#e0e0e0', borderRadius: '3px', flex: 1, maxWidth: '120px' }}>
                                        <div style={{ height: '6px', background: 'linear-gradient(90deg, #2a7d2e, #66bb6a)', borderRadius: '3px', width: `${therapy.progress}%`, transition: 'width 0.5s' }} />
                                    </div>
                                    <span style={{ fontSize: '0.78rem', color: '#2a7d2e', fontWeight: 600 }}>{therapy.progress}%</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span className={`status-badge status-${therapy.status}`}>{therapy.status}</span>
                            <span style={{ color: '#aaa' }}>{expandedId === therapy._id ? '▲' : '▼'}</span>
                        </div>
                    </div>

                    {/* Expanded Panel */}
                    {expandedId === therapy._id && (
                        <div style={{ padding: '1.2rem', borderTop: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {/* Practitioner Notes */}
                                <div>
                                    <label style={{ fontWeight: 600, color: '#2a7d2e', fontSize: '0.9rem' }}>📝 Practitioner Notes</label>
                                    <textarea
                                        value={notesEditing[therapy._id] !== undefined ? notesEditing[therapy._id] : (therapy.practitionerNotes || '')}
                                        onChange={e => setNotesEditing(n => ({ ...n, [therapy._id]: e.target.value }))}
                                        rows={4}
                                        style={{ width: '100%', borderRadius: '8px', border: '1px solid #e0e0e0', padding: '0.5rem', fontSize: '0.85rem', resize: 'vertical', marginTop: '0.4rem', boxSizing: 'border-box' }}
                                        placeholder="Add clinical observations..."
                                    />
                                    <button className="dash-btn dash-btn-primary dash-btn-sm" style={{ marginTop: '0.4rem' }}
                                        onClick={() => saveNotes(therapy._id, notesEditing[therapy._id] || therapy.practitionerNotes || '')}>
                                        Save Notes
                                    </button>
                                </div>

                                {/* Symptom Log — Gap 2: with ⚠ Adjust Schedule button */}
                                <div>
                                    <label style={{ fontWeight: 600, color: '#2a7d2e', fontSize: '0.9rem' }}>🩺 Patient Symptom Log</label>
                                    <div style={{ marginTop: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                                        {(therapy.symptomLog || []).length === 0 ? (
                                            <p style={{ color: '#aaa', fontSize: '0.85rem' }}>No symptoms logged yet.</p>
                                        ) : [...(therapy.symptomLog || [])].reverse().map((s, i) => {
                                            const isActive = activeSymptomAction?.symptomId === (s._id?.toString() || i.toString()) &&
                                                activeSymptomAction?.therapyId === therapy._id;
                                            const canAdjust = s.severity === 'moderate' || s.severity === 'severe';
                                            return (
                                                <div key={s._id || i}>
                                                    <div style={{ background: '#fafafa', borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '0.4rem', borderLeft: `3px solid ${SEV_COLOR[s.severity] || '#999'}` }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: SEV_COLOR[s.severity] }}>{s.severity?.toUpperCase()}</span>
                                                                <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{new Date(s.loggedAt).toLocaleDateString()}</span>
                                                            </div>
                                                            {/* Gap 2: Adjust Schedule button — only for moderate/severe */}
                                                            {canAdjust && !isActive && (
                                                                <button
                                                                    onClick={() => setActiveSymptomAction({
                                                                        therapyId: therapy._id,
                                                                        symptomId: s._id?.toString() || i.toString(),
                                                                        symptom: s,
                                                                    })}
                                                                    style={{ fontSize: '0.72rem', padding: '2px 8px', background: '#fff3e0', color: '#e65100', border: '1px solid #ffb74d', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                                                                    ⚠ Adjust Schedule
                                                                </button>
                                                            )}
                                                            {/* Show saved action badge */}
                                                            {s.doctorAction?.action && s.doctorAction.action !== 'no_change' && (
                                                                <span style={{ fontSize: '0.7rem', background: '#e8f5e9', color: '#2a7d2e', padding: '2px 6px', borderRadius: '4px' }}>
                                                                    ✓ {s.doctorAction.action.replace(/_/g, ' ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#444' }}>{s.symptoms}</p>
                                                        {s.doctorAction?.note && <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#2a7d2e', fontStyle: 'italic' }}>📝 {s.doctorAction.note}</p>}
                                                    </div>
                                                    {/* Gap 2: Inline action panel */}
                                                    {isActive && (
                                                        <SymptomActionPanel
                                                            symptom={activeSymptomAction.symptom}
                                                            therapyId={therapy._id}
                                                            appointmentId={apptList.find(a => a.patientId === therapy.patientId?.toString())?._id}
                                                            onSave={() => {
                                                                setActiveSymptomAction(null);
                                                                showNotification('Adjustment saved!', 'success');
                                                                loadData();
                                                            }}
                                                            onCancel={() => setActiveSymptomAction(null)}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Milestones */}
                            <div style={{ marginTop: '1.2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <label style={{ fontWeight: 600, color: '#2a7d2e', fontSize: '0.9rem' }}>🏆 Milestones</label>
                                    <button className="dash-btn dash-btn-primary dash-btn-sm" onClick={() => setShowMilestoneFor(therapy._id)}>+ Add Milestone</button>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {(therapy.milestones || []).length === 0 && <p style={{ color: '#aaa', fontSize: '0.85rem' }}>No milestones yet.</p>}
                                    {(therapy.milestones || []).map((m, i) => (
                                        <div key={i} style={{ background: '#fff9c4', borderRadius: '10px', padding: '0.5rem 1rem', border: '1px solid #ffe082', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '1.2rem' }}>{m.icon}</span>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{m.name}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#888' }}>{new Date(m.achievedAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Gap 3: Progress Charts — lazy loaded on card expand */}
                            <ProgressCharts therapyId={therapy._id} />
                        </div>
                    )}
                </div>
            ))}

            {/* Milestone Modal */}
            {showMilestoneFor && (
                <div className="dash-modal open">
                    <div className="dash-modal-content">
                        <div className="modal-header">
                            <h3>Add Milestone</h3>
                            <button className="modal-close" onClick={() => setShowMilestoneFor(null)}>×</button>
                        </div>
                        <div className="dash-form-group">
                            <label>Milestone Name</label>
                            <input type="text" value={milestoneForm.name} onChange={e => setMilestoneForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., First Week Complete" />
                        </div>
                        <div className="dash-form-group">
                            <label>Icon</label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {MILESTONE_ICONS.map(icon => (
                                    <button key={icon} onClick={() => setMilestoneForm(f => ({ ...f, icon }))}
                                        style={{ fontSize: '1.4rem', padding: '4px 8px', borderRadius: '8px', border: milestoneForm.icon === icon ? '2px solid #2a7d2e' : '1px solid #ddd', background: milestoneForm.icon === icon ? '#e8f5e9' : '#fff', cursor: 'pointer' }}>
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="dash-form-group">
                            <label>Description (Optional)</label>
                            <input type="text" value={milestoneForm.description} onChange={e => setMilestoneForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." />
                        </div>
                        <button className="dash-btn dash-btn-primary" style={{ width: '100%' }} onClick={() => submitMilestone(showMilestoneFor)}>
                            🏆 Add Milestone
                        </button>
                    </div>
                </div>
            )}

            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
    );
}
