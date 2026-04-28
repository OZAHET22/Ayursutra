import { useState, useEffect } from 'react';
import * as appointmentService from '../../services/appointmentService';
import { getAvailableSlots } from '../../services/trackingService';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);   // 8 – 19
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// 22 half-hour slots: 8:00, 8:30, 9:00 … 18:30
const HALF_SLOTS = [];
for (let h = 8; h < 19; h++) {
    HALF_SLOTS.push({ hour: h, minute: 0 });
    HALF_SLOTS.push({ hour: h, minute: 30 });
}
// Cap at 18:30 (19:00 excluded)
const SLOT_PERIODS = HALF_SLOTS.filter(s => s.hour < 19);

function formatSlot(h, m) {
    const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}
const STATUS_BG     = { pending: '#fff3e0', confirmed: '#e8f5e9', completed: '#f5f5f5', missed: '#ffebee', cancelled: '#fafafa' };
const STATUS_BORDER = { pending: '#ff9800', confirmed: '#4caf50', completed: '#9e9e9e', missed: '#f44336', cancelled: '#e0e0e0' };

// ─── Inline derived slot grid (no API call — uses appointments already loaded) ───
// Now shows 22 thirty-minute slots (8:00 AM – 6:30 PM)
function DerivedSlotGrid({ appointments, date }) {
    const dateObj  = new Date(date + 'T00:00:00'); // local midnight
    const dateStr  = dateObj.toDateString();
    // Real-time clock for past-slot marking (updates every 30s)
    const [nowMs, setNowMs] = useState(Date.now());
    useEffect(() => {
        const iv = setInterval(() => setNowMs(Date.now()), 30000);
        return () => clearInterval(iv);
    }, []);

    const dayAppts = appointments.filter(a => {
        const d = new Date(a.date);
        return d.toDateString() === dateStr && a.status !== 'cancelled';
    });

    const freeCount   = SLOT_PERIODS.filter(({ hour, minute }) => {
        const baseDate    = new Date(date + 'T00:00:00');
        const slotStartMs = new Date(baseDate).setHours(hour, minute, 0, 0);
        if (slotStartMs <= nowMs) return false; // past slot = not free
        const slotEnd = slotStartMs + 30 * 60000;
        return !dayAppts.some(a => {
            const aStart = new Date(a.date).getTime();
            return aStart < slotEnd && (aStart + a.duration * 60000) > slotStartMs;
        });
    }).length;
    const pastCount   = SLOT_PERIODS.filter(({ hour, minute }) => {
        const baseDate    = new Date(date + 'T00:00:00');
        const slotStartMs = new Date(baseDate).setHours(hour, minute, 0, 0);
        return slotStartMs <= nowMs;
    }).length;
    const bookedCount = SLOT_PERIODS.length - freeCount - pastCount;

    return (
        <div>
            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#555', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                    <span style={{ fontWeight: freeCount > 0 ? 700 : 400 }}>Available ({freeCount})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                    <span style={{ fontWeight: bookedCount > 0 ? 700 : 400 }}>Booked ({bookedCount})</span>
                </div>
                {pastCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#9ca3af', flexShrink: 0 }} />
                        <span>Expired ({pastCount})</span>
                    </div>
                )}
                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#9ca3af' }}>
                    🔒 Booked slots locked · ⏰ Past slots expired
                </span>
            </div>

            {/* 30-min Slot Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: '0.45rem' }}>
                {SLOT_PERIODS.map(({ hour, minute }) => {
                    const baseDate    = new Date(date + 'T00:00:00');
                    const slotStartMs = new Date(baseDate).setHours(hour, minute, 0, 0);
                    const slotEndMs   = slotStartMs + 30 * 60000;
                    const isExpired   = slotStartMs <= nowMs;
                    const overlap     = dayAppts.find(a => {
                        const aStart = new Date(a.date).getTime();
                        const aEnd   = aStart + a.duration * 60000;
                        return slotStartMs < aEnd && slotEndMs > aStart;
                    });
                    const booked = !!overlap;
                    const bg     = isExpired ? '#f3f4f6'
                        : booked
                        ? (overlap.status === 'confirmed' ? '#fee2e2'
                            : overlap.status === 'completed' ? '#f3f4f6' : '#fef3c7')
                        : '#f0fdf4';
                    const border = isExpired ? '#d1d5db'
                        : booked
                        ? (overlap.status === 'confirmed' ? '#ef4444'
                            : overlap.status === 'completed' ? '#9ca3af' : '#f59e0b')
                        : '#22c55e';
                    const color  = isExpired ? '#9ca3af' : (booked ? '#7f1d1d' : '#14532d');

                    return (
                        <div
                            key={`${hour}-${minute}`}
                            id={`slot-lock-${hour}-${minute}`}
                            style={{
                                borderRadius: '10px',
                                padding: '0.5rem 0.3rem',
                                textAlign: 'center',
                                background: bg,
                                border: `2px solid ${border}`,
                                color,
                                minHeight: '72px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                cursor: 'default',
                                opacity: isExpired ? 0.55 : 1,
                                transition: 'box-shadow 0.15s',
                            }}
                            title={isExpired
                                ? '⏰ Past slot — expired'
                                : booked
                                ? `🔒 ${overlap.type} — ${overlap.patientName}`
                                : '✅ Available'}
                        >
                            <div style={{ fontWeight: 700, fontSize: '0.74rem', lineHeight: 1.2 }}>{formatSlot(hour, minute)}</div>
                            {isExpired ? (
                                <>
                                    <div style={{ fontSize: '0.9rem' }}>⏰</div>
                                    <div style={{ fontSize: '0.64rem', opacity: 0.85 }}>Expired</div>
                                </>
                            ) : booked ? (
                                <>
                                    <div style={{ fontSize: '0.9rem' }}>🔒</div>
                                    <div style={{ fontSize: '0.64rem', opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '82px' }}>{overlap.type}</div>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '82px' }}>
                                        {overlap.patientName?.split(' ')[0]}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: '0.9rem' }}>○</div>
                                    <div style={{ fontSize: '0.64rem', opacity: 0.75 }}>Free</div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


export default function ScheduleTab({ user, showNotification, socketRef }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [weekOffset, setWeekOffset]     = useState(0);
    const [viewMode, setViewMode]         = useState('week');
    const [selectedDay, setSelectedDay]   = useState(new Date());
    const [selectedAppt, setSelectedAppt] = useState(null);

    // Slot Availability Lock View date
    const [slotViewDate, setSlotViewDate] = useState(new Date().toISOString().split('T')[0]);

    const doctorId = user.id || user._id;

    const loadAppointments = async () => {
        try {
            const data = await appointmentService.getAppointments();
            setAppointments(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        loadAppointments();
        const interval = setInterval(loadAppointments, 20000);
        return () => clearInterval(interval);
    }, []);

    // Real-time: re-fetch when a patient books a slot
    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket) return;
        const handler = (data) => {
            showNotification(`🔔 New booking: ${data.patientName || 'Patient'} — ${data.type}`, 'info');
            loadAppointments();
        };
        const slotsHandler = () => loadAppointments();
        socket.on('appointment_booked', handler);
        socket.on('slots_updated', slotsHandler);
        return () => {
            socket.off('appointment_booked', handler);
            socket.off('slots_updated', slotsHandler);
        };
    }, [socketRef]);

    const getWeekDates = (offset = 0) => {
        const now = new Date();
        const day = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - day + (offset * 7));
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    };
    const weekDates = getWeekDates(weekOffset);

    const getMonthDates = () => {
        const d = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), 1);
        const firstDay = d.getDay();
        const daysInMonth = new Date(selectedDay.getFullYear(), selectedDay.getMonth() + 1, 0).getDate();
        return { firstDay, daysInMonth };
    };

    const getApptForSlot = (date, hour) => appointments.filter(a => {
        const d = new Date(a.date);
        return d.toDateString() === date.toDateString() && d.getHours() === hour && a.status !== 'cancelled';
    });

    const getApptForDay = (date) => appointments.filter(a =>
        new Date(a.date).toDateString() === date.toDateString() && a.status !== 'cancelled'
    );

    const handleSlotClick = async (date, hour) => {
        if (!selectedAppt) return;
        const newDate = new Date(date);
        newDate.setHours(hour, 0, 0, 0);
        try {
            const slotData = await getAvailableSlots(doctorId, newDate.toISOString());
            const busy = slotData.busyWindows || [];
            const startMs = newDate.getTime();
            const endMs   = startMs + selectedAppt.duration * 60000;
            const conflict = busy.find(w => w.start < endMs && startMs < w.end && selectedAppt._id !== w.id);
            if (conflict) {
                showNotification(`Conflict! Slot already taken: ${conflict.label}`, 'error');
            } else {
                await appointmentService.updateAppointment(selectedAppt._id, {
                    date: newDate.toISOString(),
                    rescheduleReason: 'Rescheduled by doctor via schedule view',
                });
                showNotification(`Moved to ${newDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 'success');
                setSelectedAppt(null);
                loadAppointments();
            }
        } catch { showNotification('Failed to move appointment', 'error'); }
    };

    const todayAppts    = appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString() && a.status !== 'cancelled');
    const upcomingAppts = appointments.filter(a => new Date(a.date) > new Date() && a.status !== 'cancelled' && a.status !== 'completed');
    const now = new Date();

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}><div style={{ fontSize: '2rem' }}>🗓️</div><p>Loading schedule...</p></div>
        </div>
    );

    return (
        <div className="tab-content active">
            <div className="tab-header">
                <h2>My Schedule
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#999', fontWeight: 400 }}>🔄 20s · Live</span>
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {['day', 'week', 'month'].map(vm => (
                        <button key={vm} className={`filter-btn ${viewMode === vm ? 'active' : ''}`} onClick={() => setViewMode(vm)}>
                            {vm.charAt(0).toUpperCase() + vm.slice(1)}
                        </button>
                    ))}
                    {viewMode === 'week' && (
                        <>
                            <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => setWeekOffset(w => w - 1)}>‹ Prev</button>
                            <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => setWeekOffset(0)}>Today</button>
                            <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => setWeekOffset(w => w + 1)}>Next ›</button>
                        </>
                    )}
                    {viewMode === 'day' && (
                        <>
                            <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => { const d = new Date(selectedDay); d.setDate(d.getDate() - 1); setSelectedDay(d); }}>‹ Prev</button>
                            <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => setSelectedDay(new Date())}>Today</button>
                            <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => { const d = new Date(selectedDay); d.setDate(d.getDate() + 1); setSelectedDay(d); }}>Next ›</button>
                        </>
                    )}
                    {viewMode === 'month' && (
                        <>
                            <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => { const d = new Date(selectedDay); d.setMonth(d.getMonth() - 1); setSelectedDay(d); }}>‹</button>
                            <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => setSelectedDay(new Date())}>Today</button>
                            <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => { const d = new Date(selectedDay); d.setMonth(d.getMonth() + 1); setSelectedDay(d); }}>›</button>
                        </>
                    )}
                </div>
            </div>

            {/* Move-appointment banner */}
            {selectedAppt && (
                <div style={{ background: '#fff3e0', borderRadius: '12px', padding: '0.75rem 1.2rem', marginBottom: '1rem', border: '2px solid #ff9800', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📌 Moving: <strong>{selectedAppt.patientName} — {selectedAppt.type}</strong> · Click an empty slot to relocate</span>
                    <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => setSelectedAppt(null)}>✕ Cancel</button>
                </div>
            )}

            {/* Quick Stats */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                    { label: "Today's",  value: todayAppts.length,    color: '#2a7d2e', bg: '#e8f5e9' },
                    { label: 'Upcoming', value: upcomingAppts.length,  color: '#ff9800', bg: '#fff3e0' },
                    { label: 'This Week', value: appointments.filter(a => { const d = new Date(a.date); return weekDates.some(w => w.toDateString() === d.toDateString()) && a.status !== 'cancelled'; }).length, color: '#1976d2', bg: '#e3f2fd' },
                ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '1rem 1.5rem', flex: 1, minWidth: '130px' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.5rem', color: s.color }}>{s.value}</div>
                        <div style={{ color: '#555', fontSize: '0.9rem' }}>{s.label} Appointments</div>
                    </div>
                ))}
            </div>

            {/* ════════════════════════════════════════
                SLOT AVAILABILITY LOCK VIEW
                Derives slot data from already-loaded appointments array
                — no extra API call needed, always shows 11 slots
                ════════════════════════════════════════ */}
            <div style={{
                background: 'linear-gradient(135deg, #f0fdf4, #f9fafb)',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.75rem',
                border: '1px solid #d1fae5',
                boxShadow: '0 2px 8px rgba(42,125,46,0.06)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#14532d', fontSize: '1rem' }}>🗓️ Slot Availability — Lock View</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                            Real-time view of your booked &amp; free slots. Booked slots are <strong>locked</strong> — patients cannot double-book them.
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="date"
                            value={slotViewDate}
                            onChange={e => setSlotViewDate(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', color: '#1f2937' }}
                        />
                        <button
                            className="dash-btn dash-btn-secondary dash-btn-sm"
                            onClick={() => setSlotViewDate(new Date().toISOString().split('T')[0])}
                        >
                            Today
                        </button>
                        <button
                            className="dash-btn dash-btn-secondary dash-btn-sm"
                            onClick={loadAppointments}
                            title="Refresh"
                        >
                            ↻
                        </button>
                    </div>
                </div>

                {/* Derived slot grid — always shows 11 slots from 8AM to 6PM */}
                <DerivedSlotGrid appointments={appointments} date={slotViewDate} />
            </div>

            {/* ─── DAY VIEW ─── */}
            {viewMode === 'day' && (
                <div>
                    <div style={{ textAlign: 'center', marginBottom: '1rem', fontWeight: 600, color: '#2a7d2e' }}>
                        {selectedDay.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        {HOURS.map(hour => {
                            const slotAppts = getApptForSlot(selectedDay, hour);
                            const isEmpty = slotAppts.length === 0;
                            return (
                                <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '8px', marginBottom: '4px', minHeight: '64px' }}
                                    onClick={() => isEmpty && handleSlotClick(selectedDay, hour)}>
                                    <div style={{ fontSize: '0.8rem', color: '#999', paddingTop: '0.4rem' }}>
                                        {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                                    </div>
                                    <div style={{ background: selectedAppt && isEmpty ? '#f1fff1' : isEmpty ? '#fafafa' : 'transparent', borderRadius: '8px', border: selectedAppt && isEmpty ? '2px dashed #66bb6a' : '1px solid #eee', padding: '4px', minHeight: '60px', cursor: selectedAppt && isEmpty ? 'pointer' : 'default' }}>
                                        {slotAppts.map((a, ai) => (
                                            <div key={ai} onClick={(e) => { e.stopPropagation(); setSelectedAppt(a); }}
                                                style={{ background: STATUS_BG[a.status] || '#fff', borderLeft: `4px solid ${STATUS_BORDER[a.status] || '#ddd'}`, borderRadius: '6px', padding: '6px 10px', marginBottom: '3px', cursor: 'grab' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{a.patientName}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#555' }}>{a.type} · {a.duration}min</div>
                                            </div>
                                        ))}
                                        {selectedAppt && isEmpty && <div style={{ color: '#66bb6a', fontSize: '0.8rem', padding: '0.5rem', textAlign: 'center' }}>Drop here</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ─── WEEK VIEW ─── */}
            {viewMode === 'week' && (
                <div>
                    <div style={{ textAlign: 'center', marginBottom: '1rem', fontWeight: 600, color: '#2a7d2e' }}>
                        Week of {weekDates[0].toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })} — {weekDates[6].toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ minWidth: '700px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gap: '2px', marginBottom: '2px' }}>
                                <div />
                                {weekDates.map((d, i) => {
                                    const isToday = d.toDateString() === now.toDateString();
                                    return (
                                        <div key={i}
                                            onClick={() => { setSelectedDay(d); setViewMode('day'); setSlotViewDate(d.toISOString().split('T')[0]); }}
                                            style={{ textAlign: 'center', padding: '0.5rem', borderRadius: '8px', background: isToday ? '#2a7d2e' : '#f5f5f5', color: isToday ? '#fff' : '#333', fontWeight: isToday ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer' }}>
                                            <div>{DAYS[d.getDay()]}</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{d.getDate()}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            {HOURS.map(hour => (
                                <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gap: '2px', marginBottom: '2px', minHeight: '56px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#999', padding: '0.25rem' }}>
                                        {hour > 12 ? `${hour - 12}PM` : `${hour}AM`}
                                    </div>
                                    {weekDates.map((d, di) => {
                                        const slotAppts = getApptForSlot(d, hour);
                                        const isToday = d.toDateString() === now.toDateString();
                                        const isEmpty = slotAppts.length === 0;
                                        return (
                                            <div key={di}
                                                onClick={() => isEmpty && handleSlotClick(d, hour)}
                                                style={{ background: selectedAppt && isEmpty ? '#f1fff1' : isToday ? '#f0f9f0' : '#fafafa', borderRadius: '4px', border: selectedAppt && isEmpty ? '2px dashed #66bb6a' : isToday ? '1px solid #c8e6c9' : '1px solid #eee', padding: '2px', minHeight: '52px', cursor: selectedAppt && isEmpty ? 'pointer' : 'default' }}>
                                                {slotAppts.map((a, ai) => (
                                                    <div key={ai}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedAppt(a); }}
                                                        style={{ background: STATUS_BG[a.status] || '#fff', borderLeft: `3px solid ${STATUS_BORDER[a.status] || '#ddd'}`, borderRadius: '4px', padding: '3px 5px', fontSize: '0.7rem', lineHeight: '1.3', marginBottom: '2px', cursor: 'grab' }}
                                                        title={`Click to move: ${a.patientName} — ${a.type}`}>
                                                        <div style={{ fontWeight: 700, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{a.patientName}</div>
                                                        <div style={{ color: '#555' }}>{a.type}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MONTH VIEW ─── */}
            {viewMode === 'month' && (() => {
                const { firstDay, daysInMonth } = getMonthDates();
                const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                return (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '1rem', fontWeight: 600, color: '#2a7d2e', fontSize: '1.1rem' }}>
                            {monthNames[selectedDay.getMonth()]} {selectedDay.getFullYear()}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                            {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', color: '#888', padding: '0.4rem 0' }}>{d}</div>)}
                            {Array(firstDay).fill(null).map((_, i) => <div key={'e' + i} />)}
                            {Array(daysInMonth).fill(null).map((_, i) => {
                                const day = i + 1;
                                const date = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), day);
                                const dayAppts = getApptForDay(date);
                                const isToday = date.toDateString() === now.toDateString();
                                return (
                                    <div key={day}
                                        onClick={() => { setSelectedDay(date); setViewMode('day'); setSlotViewDate(date.toISOString().split('T')[0]); }}
                                        style={{ minHeight: '80px', borderRadius: '10px', padding: '0.4rem', background: isToday ? '#e8f5e9' : '#fafafa', border: `1px solid ${isToday ? '#2a7d2e' : '#eee'}`, cursor: 'pointer' }}>
                                        <div style={{ fontWeight: isToday ? 700 : 500, color: isToday ? '#2a7d2e' : '#333', fontSize: '0.85rem', marginBottom: '2px' }}>{day}</div>
                                        {dayAppts.slice(0, 2).map((a, ai) => (
                                            <div key={ai} style={{ background: STATUS_BORDER[a.status] || '#2a7d2e', color: '#fff', borderRadius: '4px', padding: '1px 5px', fontSize: '0.65rem', marginBottom: '2px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                                {a.type}
                                            </div>
                                        ))}
                                        {dayAppts.length > 2 && <div style={{ fontSize: '0.65rem', color: '#888' }}>+{dayAppts.length - 2} more</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* Upcoming list */}
            <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Upcoming Appointments</h3>
                {upcomingAppts.length === 0 && <p style={{ color: '#777' }}>No upcoming appointments.</p>}
                {upcomingAppts.slice(0, 5).map(a => (
                    <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f9f9f9', borderRadius: '10px', marginBottom: '0.5rem' }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>{a.patientName} — {a.type}</div>
                            <div style={{ fontSize: '0.85rem', color: '#777' }}>📅 {new Date(a.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                        </div>
                        <span className={`status-badge status-${a.status}`}>{a.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
