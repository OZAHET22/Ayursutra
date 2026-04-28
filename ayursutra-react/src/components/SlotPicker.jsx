import { useState, useEffect, useCallback, useRef } from 'react';
import { getSlots } from '../services/appointmentService';

/**
 * SlotPicker — Visual 30-minute slot selector (8:00 AM – 6:30 PM, 22 slots).
 *
 * Strategy:
 *  1. Try to fetch from backend /appointments/slots (returns 22 half-hour slots)
 *  2. If backend returns 0 slots or fails → generate 22 free slots client-side
 *     (patient can still pick a time; conflict is enforced server-side on POST)
 *  3. Live socket refresh via slots_updated + appointment_booked events
 *
 * Props:
 *  doctorId     – required for fetching availability
 *  date         –  "YYYY-MM-DD" string
 *  duration     – minutes for the booking (used for display only; server checks conflict)
 *  selectedTime – controlled ISO datetime or null
 *  onSelect     – callback(isoDatetime | null)
 *  readOnly     – lock view, no selection allowed
 *  socketRef    – optional ref to socket.io client
 */

// 22 half-hour slots: 8:00, 8:30, 9:00 … 18:30
const WORK_SLOTS = [];
for (let h = 8; h < 19; h++) {
    WORK_SLOTS.push({ hour: h, minute: 0 });
    if (h < 18 || true) WORK_SLOTS.push({ hour: h, minute: 30 });
}
// Trim any slots at/after 19:00
const SLOTS = WORK_SLOTS.filter(s => s.hour < 19 || (s.hour === 18 && s.minute === 30));

function formatSlot(hour, minute) {
    const h12  = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

/** Build a slot ISO time string from a YYYY-MM-DD date, hour, and minute */
function buildSlotTime(date, hour, minute) {
    const [yr, mo, dy] = date.split('-').map(Number);
    return new Date(yr, mo - 1, dy, hour, minute, 0, 0).toISOString();
}

/** Generate 22 free slots (client-side fallback when API is unavailable) */
function generateFreeSlots(date) {
    return SLOTS.map(({ hour, minute }) => ({
        time:   buildSlotTime(date, hour, minute),
        hour,
        minute,
        label:  `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,
        booked: false,
        bookedBy:     null,
        bookedType:   null,
        bookedStatus: null,
        appointmentId: null,
    }));
}

export default function SlotPicker({
    doctorId,
    date,
    duration = 30,
    selectedTime,
    onSelect,
    readOnly = false,
    socketRef,
}) {
    const [slots, setSlots]         = useState([]);
    const [loading, setLoading]     = useState(false);
    const [apiError, setApiError]   = useState('');
    const [lastRefresh, setLastRefresh] = useState(null);
    // Real-time clock so past-slot highlighting updates without refetching
    const [nowMs, setNowMs] = useState(Date.now());
    const fetchingRef = useRef(false);

    const fetchSlots = useCallback(async (quiet = false) => {
        if (!doctorId || !date) { setSlots([]); return; }
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        if (!quiet) setLoading(true);
        setApiError('');
        try {
            const data = await getSlots(doctorId, date, duration);
            const backendSlots = data?.slots;

            if (Array.isArray(backendSlots) && backendSlots.length > 0) {
                // ✅ Backend returned 30-min slot grid
                setSlots(backendSlots);
                setApiError('');
            } else {
                // ⚠️ Backend returned empty/missing slots — use client fallback
                console.warn('[SlotPicker] Backend returned empty slots, using client-side fallback');
                setSlots(generateFreeSlots(date));
                setApiError('live-locks-unavailable');
            }
            setLastRefresh(new Date());
        } catch (err) {
            console.error('[SlotPicker] API error:', err.response?.status, err.message);
            setSlots(generateFreeSlots(date));
            setApiError('offline');
        } finally {
            fetchingRef.current = false;
            if (!quiet) setLoading(false);
        }
    }, [doctorId, date, duration]);

    useEffect(() => { fetchSlots(); }, [fetchSlots]);

    // Real-time clock: update nowMs every 30 s so past slots grey-out automatically
    useEffect(() => {
        const iv = setInterval(() => setNowMs(Date.now()), 30000);
        return () => clearInterval(iv);
    }, []);

    // Auto-refresh slots every 60 seconds to stay in sync with server
    useEffect(() => {
        if (!doctorId || !date) return;
        const iv = setInterval(() => fetchSlots(true), 60000);
        return () => clearInterval(iv);
    }, [fetchSlots, doctorId, date]);

    // Live socket refresh
    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket) return;
        const handler = (data) => {
            if (!data?.doctorId || data.doctorId === doctorId) {
                fetchSlots(true);
            }
        };
        socket.on('slots_updated', handler);
        socket.on('appointment_booked', handler);
        return () => {
            socket.off('slots_updated', handler);
            socket.off('appointment_booked', handler);
        };
    }, [socketRef, doctorId, fetchSlots]);

    const isSelected = (slot) => {
        if (!selectedTime) return false;
        return new Date(selectedTime).getTime() === new Date(slot.time).getTime();
    };

    const handleClick = (slot) => {
        if (apiError) {
            alert('⚠️ Server unavailable. Cannot book at this time. Please try again in a moment.');
            return;
        }
        // Prevent booking past or expired slots
        if (slot.isPast || new Date(slot.time).getTime() <= nowMs) {
            alert('⏰ This time slot has already passed and cannot be booked.');
            return;
        }
        if (readOnly || slot.booked) return;
        if (isSelected(slot)) {
            onSelect && onSelect(null);
        } else {
            onSelect && onSelect(slot.time);
        }
    };

    // ─── Placeholder: no doctorId or date selected yet ───────────────────────
    if (!doctorId || !date) {
        return (
            <div style={styles.placeholder}>
                <span>👆 Select a doctor and date to view available slots</span>
            </div>
        );
    }

    // ─── Loading spinner ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={styles.placeholder}>
                <div style={styles.spinner} />
                <span style={{ color: '#2a7d2e' }}>Loading available slots…</span>
            </div>
        );
    }

    const freeCount    = slots.filter(s => !s.booked && !s.isPast && new Date(s.time).getTime() > nowMs).length;
    const bookedCount  = slots.filter(s => s.booked && !s.blocked && !s.isPast).length;
    const blockedCount = slots.filter(s => s.blocked).length;
    const pastCount    = slots.filter(s => s.isPast || new Date(s.time).getTime() <= nowMs).length;

    return (
        <div style={styles.wrapper}>
            {/* ── Soft warning if lock data unavailable ── */}
            {apiError === 'live-locks-unavailable' && (
                <div style={{ background: '#fffbea', border: '1px solid #fbbf24', borderRadius: '8px', padding: '0.5rem 0.9rem', marginBottom: '0.6rem', fontSize: '0.78rem', color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>⚠️ Real-time lock data unavailable — grid shows all slots as free. Server prevents double-booking.</span>
                    <button onClick={() => fetchSlots()} style={{ ...styles.retryBtn, marginLeft: '0.5rem' }}>Retry</button>
                </div>
            )}
            {apiError === 'offline' && (
                <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.5rem 0.9rem', marginBottom: '0.6rem', fontSize: '0.78rem', color: '#991b1b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>🔴 Could not reach server. Slots shown may not reflect real availability. Server still enforces conflict-prevention.</span>
                    <button onClick={() => fetchSlots()} style={{ ...styles.retryBtn, marginLeft: '0.5rem' }}>Retry</button>
                </div>
            )}

            {/* Legend */}
            <div style={styles.legend}>
                <div style={styles.legendItem}>
                    <div style={{ ...styles.dot, background: '#22c55e' }} />
                    <span style={{ fontWeight: freeCount > 0 ? 700 : 400 }}>Available ({freeCount})</span>
                </div>
                <div style={styles.legendItem}>
                    <div style={{ ...styles.dot, background: '#ef4444' }} />
                    <span style={{ fontWeight: bookedCount > 0 ? 700 : 400 }}>Booked ({bookedCount})</span>
                </div>
                {blockedCount > 0 && (
                    <div style={styles.legendItem}>
                        <div style={{ ...styles.dot, background: '#f97316' }} />
                        <span style={{ fontWeight: 700 }}>Unavailable ({blockedCount})</span>
                    </div>
                )}
                {pastCount > 0 && (
                    <div style={styles.legendItem}>
                        <div style={{ ...styles.dot, background: '#9ca3af' }} />
                        <span>Expired ({pastCount})</span>
                    </div>
                )}
                {!readOnly && (
                    <div style={styles.legendItem}>
                        <div style={{ ...styles.dot, background: '#3b82f6' }} />
                        <span>Selected</span>
                    </div>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {lastRefresh && (
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                            {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    )}
                    <button onClick={() => fetchSlots()} style={styles.refreshBtn} title="Refresh slots">↻</button>
                </div>
            </div>

            {/* Slot Grid */}
            <div style={styles.grid}>
                {slots.map((slot) => {
                    const slotTime  = new Date(slot.time).getTime();
                    const isExpired = slot.isPast || slotTime <= nowMs;
                    const selected  = isSelected(slot);
                    const isBlocked = slot.blocked;

                    const bg = isExpired
                        ? '#f3f4f6'
                        : isBlocked ? '#fff7ed'
                        : slot.booked
                        ? (slot.bookedStatus === 'confirmed'  ? '#fee2e2'
                         : slot.bookedStatus === 'completed'  ? '#f3f4f6' : '#fef3c7')
                        : selected ? '#dbeafe' : '#f0fdf4';
                    const border = isExpired
                        ? '#d1d5db'
                        : isBlocked ? '#f97316'
                        : slot.booked
                        ? (slot.bookedStatus === 'confirmed'  ? '#ef4444'
                         : slot.bookedStatus === 'completed'  ? '#9ca3af' : '#f59e0b')
                        : selected ? '#3b82f6' : '#22c55e';
                    const textColor = isExpired ? '#9ca3af'
                        : isBlocked ? '#9a3412'
                        : slot.booked ? '#7f1d1d' : selected ? '#1e3a8a' : '#14532d';
                    const cursor = (readOnly || slot.booked || isExpired) ? 'not-allowed' : 'pointer';
                    const isHalfHour = slot.minute === 30;

                    return (
                        <div
                            key={`${slot.hour}-${slot.minute}`}
                            id={`slot-${slot.hour}-${slot.minute}`}
                            onClick={() => handleClick(slot)}
                            style={{
                                ...styles.slotCard,
                                background:  bg,
                                border:      `2px solid ${border}`,
                                color:       textColor,
                                cursor,
                                opacity:     isExpired ? 0.55 : (slot.booked && !readOnly ? 0.82 : 1),
                                transform:   selected ? 'scale(1.04)' : 'scale(1)',
                                boxShadow:   selected ? `0 0 0 3px ${border}33` : '0 1px 3px rgba(0,0,0,0.06)',
                                borderLeft:  isHalfHour && !slot.booked && !selected && !isExpired
                                    ? `3px solid ${border}88` : undefined,
                            }}
                            title={isExpired
                                ? '⏰ This slot has expired (past time)'
                                : isBlocked ? `🚫 ${slot.blockReason || 'Unavailable'}`
                                : slot.booked ? `🔒 Locked: ${slot.bookedType} — ${slot.bookedBy}`
                                : '✅ Available — click to select'}
                        >
                            <div style={styles.slotTime}>{formatSlot(slot.hour, slot.minute)}</div>
                            {isExpired ? (
                                <>
                                    <div style={styles.slotIcon}>⏰</div>
                                    <div style={styles.slotMeta}>Expired</div>
                                </>
                            ) : isBlocked ? (
                                <>
                                    <div style={styles.slotIcon}>🚫</div>
                                    <div style={styles.slotMeta}>{slot.blockReason || 'Unavailable'}</div>
                                </>
                            ) : slot.booked ? (
                                <>
                                    <div style={styles.slotIcon}>🔒</div>
                                    <div style={styles.slotMeta}>{slot.bookedType}</div>
                                    <div style={{ ...styles.slotMeta, fontWeight: 600, fontSize: '0.63rem' }}>
                                        {slot.bookedBy?.split(' ')[0]}
                                    </div>
                                </>
                            ) : selected ? (
                                <>
                                    <div style={styles.slotIcon}>✓</div>
                                    <div style={styles.slotMeta}>Selected</div>
                                </>
                            ) : (
                                <>
                                    <div style={styles.slotIcon}>○</div>
                                    <div style={styles.slotMeta}>Free</div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {slots.length === 0 && (
                <div style={styles.placeholder}>
                    <span>No slots available. Please select a date.</span>
                    <button onClick={() => fetchSlots()} style={styles.retryBtn}>Refresh</button>
                </div>
            )}
        </div>
    );
}

const styles = {
    wrapper: { marginTop: '0.75rem' },
    placeholder: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '0.5rem', padding: '1.5rem',
        background: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db',
        color: '#6b7280', fontSize: '0.88rem', textAlign: 'center', minHeight: '80px',
    },
    spinner: {
        width: '24px', height: '24px',
        border: '3px solid #d1fae5', borderTopColor: '#2a7d2e',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
    },
    legend: {
        display: 'flex', alignItems: 'center', gap: '1rem',
        marginBottom: '0.75rem', fontSize: '0.8rem', color: '#555', flexWrap: 'wrap',
    },
    legendItem: { display: 'flex', alignItems: 'center', gap: '0.35rem' },
    dot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
    refreshBtn: {
        background: 'none', border: '1px solid #d1d5db', borderRadius: '6px',
        padding: '2px 8px', cursor: 'pointer', fontSize: '0.9rem', color: '#555',
    },
    retryBtn: {
        padding: '4px 12px', background: '#2a7d2e', color: '#fff',
        border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
        gap: '0.45rem',
    },
    slotCard: {
        borderRadius: '10px', padding: '0.5rem 0.3rem', textAlign: 'center',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        userSelect: 'none', minHeight: '72px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '2px',
    },
    slotTime: { fontWeight: 700, fontSize: '0.75rem', lineHeight: 1.2 },
    slotIcon: { fontSize: '0.95rem', lineHeight: 1 },
    slotMeta: {
        fontSize: '0.64rem', opacity: 0.85,
        overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', maxWidth: '82px',
    },
};
