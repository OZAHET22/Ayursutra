import { useState, useEffect, useCallback } from 'react';
import { getMySchedule, saveMySchedule } from '../../services/doctorScheduleService';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_DURATIONS = [
    { value: 15, label: '15 min' }, { value: 20, label: '20 min' },
    { value: 30, label: '30 min' }, { value: 45, label: '45 min' },
    { value: 60, label: '1 hour' }, { value: 90, label: '1.5 hrs' },
    { value: 120, label: '2 hrs' },
];
const BREAK_OPTIONS = [
    { value: 0, label: 'No break' }, { value: 5, label: '5 min' },
    { value: 10, label: '10 min' }, { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

const defaultWorkingDays = () => [
    { dayOfWeek: 0, enabled: false, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
    { dayOfWeek: 1, enabled: true,  startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
    { dayOfWeek: 2, enabled: true,  startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
    { dayOfWeek: 3, enabled: true,  startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
    { dayOfWeek: 4, enabled: true,  startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
    { dayOfWeek: 5, enabled: true,  startHour: 9, startMinute: 0, endHour: 17, endMinute: 0 },
    { dayOfWeek: 6, enabled: false, startHour: 9, startMinute: 0, endHour: 14, endMinute: 0 },
];

function fmt12(h, m) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function countSlots(day, slotDuration, breakBetween) {
    if (!day.enabled) return 0;
    const startMins = day.startHour * 60 + day.startMinute;
    const endMins   = day.endHour * 60 + day.endMinute;
    const step = slotDuration + breakBetween;
    return Math.max(0, Math.floor((endMins - startMins) / step));
}

export default function TimeManagementTab({ user, showNotification }) {
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [config, setConfig]     = useState({
        slotDuration: 30,
        breakBetweenSlots: 0,
        maxAppointmentsPerSlot: 1,
        consultationFee: 0,
        feeCurrency: 'INR',
        qualifications: '',
        bio: '',
        languages: ['English'],
        profileVisible: true,
        workingDays: defaultWorkingDays(),
    });

    const loadSchedule = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMySchedule();
            if (data) {
                setConfig(prev => ({
                    ...prev,
                    ...data,
                    workingDays: data.workingDays?.length ? data.workingDays : defaultWorkingDays(),
                }));
            }
        } catch (err) {
            console.error('Failed to load schedule:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadSchedule(); }, [loadSchedule]);

    const updateDay = (dayOfWeek, field, value) => {
        setConfig(prev => ({
            ...prev,
            workingDays: prev.workingDays.map(d =>
                d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d
            ),
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveMySchedule(config);
            showNotification('⏰ Time management settings saved!', 'success');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save settings.';
            showNotification(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const totalWeeklySlots = config.workingDays.reduce(
        (sum, d) => sum + countSlots(d, config.slotDuration, config.breakBetweenSlots), 0
    );

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}>
                <div style={{ fontSize: '2rem' }}>⏰</div>
                <p>Loading time management settings...</p>
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '900px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#14532d', fontSize: '1.4rem' }}>⚙️ Custom Time Management</h2>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.88rem' }}>
                        Configure your working hours, slot duration, and availability settings
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ padding: '0.6rem 1.4rem', background: saving ? '#9ca3af' : '#2a7d2e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
                >
                    {saving ? '💾 Saving…' : '💾 Save All Settings'}
                </button>
            </div>

            {/* Summary Card */}
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {[
                    { icon: '⏱️', label: 'Slot Duration', value: `${config.slotDuration} min` },
                    { icon: '☕', label: 'Break Between Slots', value: config.breakBetweenSlots ? `${config.breakBetweenSlots} min` : 'None' },
                    { icon: '📅', label: 'Total Weekly Slots', value: totalWeeklySlots },
                    { icon: '👥', label: 'Max per Slot', value: config.maxAppointmentsPerSlot },
                    { icon: '💰', label: 'Consultation Fee', value: `${config.feeCurrency} ${config.consultationFee}` },
                ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', minWidth: '100px' }}>
                        <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#14532d' }}>{s.value}</div>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Section 1: Slot Configuration */}
            <div style={cardStyle}>
                <h3 style={sectionTitle}>⏱️ Slot Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Slot Duration</label>
                        <select style={selectStyle} value={config.slotDuration}
                            onChange={e => setConfig(p => ({ ...p, slotDuration: Number(e.target.value) }))}>
                            {SLOT_DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                        <p style={helpText}>Duration of each appointment slot</p>
                    </div>
                    <div>
                        <label style={labelStyle}>Break Between Slots</label>
                        <select style={selectStyle} value={config.breakBetweenSlots}
                            onChange={e => setConfig(p => ({ ...p, breakBetweenSlots: Number(e.target.value) }))}>
                            {BREAK_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                        </select>
                        <p style={helpText}>Gap between consecutive appointments</p>
                    </div>
                    <div>
                        <label style={labelStyle}>Max Appointments per Slot</label>
                        <input type="number" min={1} max={10} style={selectStyle}
                            value={config.maxAppointmentsPerSlot}
                            onChange={e => setConfig(p => ({ ...p, maxAppointmentsPerSlot: Number(e.target.value) }))} />
                        <p style={helpText}>Patients allowed in the same slot</p>
                    </div>
                </div>
                <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: '#eff6ff', borderRadius: '8px', fontSize: '0.82rem', color: '#1d4ed8' }}>
                    💡 With current settings: each session is <strong>{config.slotDuration} min</strong>
                    {config.breakBetweenSlots > 0 && <> + <strong>{config.breakBetweenSlots} min break</strong></>}
                    {' '}= <strong>{config.slotDuration + config.breakBetweenSlots} min</strong> total cycle
                </div>
            </div>

            {/* Section 2: Working Hours Per Day */}
            <div style={cardStyle}>
                <h3 style={sectionTitle}>📅 Working Hours Per Day</h3>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '1rem', marginTop: 0 }}>
                    Toggle days on/off and set your start/end times. Disabled days show no slots to patients.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {config.workingDays.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map(day => {
                        const slots = countSlots(day, config.slotDuration, config.breakBetweenSlots);
                        return (
                            <div key={day.dayOfWeek} style={{
                                display: 'grid', gridTemplateColumns: '130px 1fr auto',
                                alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem',
                                background: day.enabled ? '#f0fdf4' : '#f9fafb',
                                borderRadius: '10px', border: `1px solid ${day.enabled ? '#bbf7d0' : '#e5e7eb'}`,
                                opacity: day.enabled ? 1 : 0.65,
                            }}>
                                {/* Day toggle */}
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: day.enabled ? '#14532d' : '#9ca3af' }}>
                                    <input type="checkbox" checked={day.enabled}
                                        onChange={e => updateDay(day.dayOfWeek, 'enabled', e.target.checked)}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                    {DAYS[day.dayOfWeek]}
                                </label>

                                {/* Time pickers */}
                                {day.enabled ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#555' }}>From</span>
                                        <select style={timeSelectStyle} value={day.startHour}
                                            onChange={e => updateDay(day.dayOfWeek, 'startHour', Number(e.target.value))}>
                                            {HOURS.map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}</option>)}
                                        </select>
                                        <span>:</span>
                                        <select style={timeSelectStyle} value={day.startMinute}
                                            onChange={e => updateDay(day.dayOfWeek, 'startMinute', Number(e.target.value))}>
                                            {MINUTES.map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
                                        </select>
                                        <span style={{ fontSize: '0.8rem', color: '#555', margin: '0 0.25rem' }}>To</span>
                                        <select style={timeSelectStyle} value={day.endHour}
                                            onChange={e => updateDay(day.dayOfWeek, 'endHour', Number(e.target.value))}>
                                            {HOURS.map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}</option>)}
                                        </select>
                                        <span>:</span>
                                        <select style={timeSelectStyle} value={day.endMinute}
                                            onChange={e => updateDay(day.dayOfWeek, 'endMinute', Number(e.target.value))}>
                                            {MINUTES.map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
                                        </select>
                                        <span style={{ fontSize: '0.78rem', color: '#2a7d2e', marginLeft: '0.5rem' }}>
                                            ({fmt12(day.startHour, day.startMinute)} – {fmt12(day.endHour, day.endMinute)})
                                        </span>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>Day off — no appointments</div>
                                )}

                                {/* Slot count badge */}
                                <div style={{ textAlign: 'right', minWidth: '70px' }}>
                                    {day.enabled ? (
                                        <span style={{ background: '#dcfce7', color: '#14532d', borderRadius: '20px', padding: '2px 10px', fontSize: '0.76rem', fontWeight: 700 }}>
                                            {slots} slots
                                        </span>
                                    ) : (
                                        <span style={{ background: '#f3f4f6', color: '#9ca3af', borderRadius: '20px', padding: '2px 10px', fontSize: '0.76rem' }}>Off</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick presets */}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', alignSelf: 'center' }}>Quick presets:</span>
                    {[
                        { label: 'Mon–Fri', days: [1,2,3,4,5], start: {h:9,m:0}, end: {h:17,m:0} },
                        { label: 'Mon–Sat', days: [1,2,3,4,5,6], start: {h:9,m:0}, end: {h:17,m:0} },
                        { label: 'Tue–Sat', days: [2,3,4,5,6], start: {h:10,m:0}, end: {h:18,m:0} },
                        { label: 'All Week', days: [0,1,2,3,4,5,6], start: {h:9,m:0}, end: {h:17,m:0} },
                    ].map(preset => (
                        <button key={preset.label}
                            onClick={() => setConfig(prev => ({
                                ...prev,
                                workingDays: prev.workingDays.map(d => ({
                                    ...d,
                                    enabled: preset.days.includes(d.dayOfWeek),
                                    startHour: preset.start.h, startMinute: preset.start.m,
                                    endHour: preset.end.h, endMinute: preset.end.m,
                                }))
                            }))}
                            style={{ padding: '4px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', color: '#374151', fontWeight: 600 }}>
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Section 3: Profile & Consultation Fee */}
            <div style={cardStyle}>
                <h3 style={sectionTitle}>👁️ Doctor Profile Settings</h3>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '1rem', marginTop: 0 }}>
                    This information is shown to patients when browsing or booking.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Consultation Fee (₹)</label>
                        <input type="number" min={0} style={selectStyle} placeholder="e.g. 500"
                            value={config.consultationFee}
                            onChange={e => setConfig(p => ({ ...p, consultationFee: Number(e.target.value) }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>Currency</label>
                        <select style={selectStyle} value={config.feeCurrency}
                            onChange={e => setConfig(p => ({ ...p, feeCurrency: e.target.value }))}>
                            {['INR', 'USD', 'EUR', 'GBP', 'AED'].map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Profile Visible to Patients</label>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem' }}>
                            {[true, false].map(v => (
                                <label key={String(v)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                                    <input type="radio" name="profileVisible" checked={config.profileVisible === v}
                                        onChange={() => setConfig(p => ({ ...p, profileVisible: v }))} />
                                    {v ? '✅ Visible' : '🔒 Hidden'}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Qualifications</label>
                    <input type="text" style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}
                        placeholder="e.g. BAMS, MD (Ayurveda), 10+ years experience"
                        value={config.qualifications}
                        onChange={e => setConfig(p => ({ ...p, qualifications: e.target.value }))} />
                </div>
                <div>
                    <label style={labelStyle}>Professional Bio</label>
                    <textarea rows={3} style={{ ...selectStyle, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                        placeholder="Brief description about your expertise, specialisation and approach..."
                        value={config.bio}
                        onChange={e => setConfig(p => ({ ...p, bio: e.target.value }))} />
                </div>
            </div>

            {/* Save button at bottom */}
            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                <button onClick={handleSave} disabled={saving}
                    style={{ padding: '0.75rem 2rem', background: saving ? '#9ca3af' : '#2a7d2e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.95rem' }}>
                    {saving ? '💾 Saving…' : '💾 Save All Settings'}
                </button>
            </div>
        </div>
    );
}

// Styles
const cardStyle = {
    background: '#fff',
    borderRadius: '14px',
    padding: '1.25rem 1.5rem',
    marginBottom: '1.25rem',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
};
const sectionTitle = {
    margin: '0 0 1rem',
    color: '#14532d',
    fontSize: '1rem',
    fontWeight: 700,
};
const labelStyle = {
    display: 'block',
    fontWeight: 600,
    fontSize: '0.82rem',
    color: '#374151',
    marginBottom: '0.35rem',
};
const helpText = {
    fontSize: '0.72rem',
    color: '#9ca3af',
    margin: '0.25rem 0 0',
};
const selectStyle = {
    padding: '0.45rem 0.65rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.88rem',
    color: '#1f2937',
    background: '#fff',
    width: '100%',
};
const timeSelectStyle = {
    padding: '3px 6px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.82rem',
    color: '#1f2937',
    background: '#fff',
};
