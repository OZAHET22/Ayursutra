import { useState, useEffect } from 'react';
import { getDoctors, getCentres, reassignDoctor } from '../services/userService';

const SLOT_COLORS = {
    active: { bg: '#e8f5e9', border: '#66bb6a', text: '#2a7d2e' },
    warning: { bg: '#fff3e0', border: '#ffb74d', text: '#e65100' },
};

export default function ChangeDoctorModal({ user, onClose, onSuccess, showNotification }) {
    const [step, setStep] = useState(1); // 1=select, 2=confirm
    const [centres, setCentres] = useState([]);
    const [allDoctors, setAllDoctors] = useState([]);
    const [selectedCentreId, setSelectedCentreId] = useState('');
    const [selectedCentreName, setSelectedCentreName] = useState('');
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [c, d] = await Promise.all([getCentres(), getDoctors()]);
                setCentres(c || []);
                setAllDoctors(d || []);
                // Pre-select current centre if any
                if (user.centreId) setSelectedCentreId(user.centreId);
            } catch (e) {
                setError('Failed to load centres/doctors.');
            } finally { setLoading(false); }
        };
        load();
    }, []);

    // Doctors filtered by selected centre (or all if no centre selected)
    const filteredDoctors = selectedCentreId
        ? allDoctors.filter(d => d.centreId === selectedCentreId || d.centreId === '')
        : allDoctors;

    const selectedDoctor = allDoctors.find(d => d._id === selectedDoctorId);
    const isSameDoctor = user.preferredDoctor && user.preferredDoctor === selectedDoctorId;

    const handleConfirm = async () => {
        if (!selectedDoctorId) { setError('Please select a doctor.'); return; }
        setSubmitting(true);
        setError('');
        try {
            const result = await reassignDoctor({
                newDoctorId: selectedDoctorId,
                newCentreId: selectedCentreId,
                newCentreName: selectedCentreName,
                reason: reason || 'Patient requested a change of doctor/centre.',
            });
            showNotification(result.message || 'Doctor changed successfully!', 'success');
            onSuccess(result); // parent updates user context
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change doctor. Please try again.');
            setSubmitting(false);
        }
    };

    const overlayStyle = {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, backdropFilter: 'blur(4px)',
    };
    const cardStyle = {
        background: '#fff', borderRadius: '20px', padding: '2rem',
        width: '100%', maxWidth: '560px', boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        maxHeight: '90vh', overflowY: 'auto',
    };

    return (
        <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={cardStyle}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1a1a2e', fontWeight: 700 }}>
                            🔄 Change Centre & Doctor
                        </h3>
                        <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85rem' }}>
                            You can switch your assigned centre and doctor at any time.
                        </p>
                    </div>
                    <button onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#aaa', lineHeight: 1 }}>
                        ×
                    </button>
                </div>

                {/* Current assignment info */}
                <div style={{ background: '#f0f9f0', borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '1.5rem', border: '1px solid #c8e6c9' }}>
                    <div style={{ fontSize: '0.8rem', color: '#2a7d2e', fontWeight: 700, marginBottom: '4px' }}>CURRENT ASSIGNMENT</div>
                    <div style={{ fontSize: '0.9rem', color: '#333' }}>
                        🏥 Centre: <strong>{user.centre || user.centreId || 'Not set'}</strong>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#333', marginTop: '2px' }}>
                        👨‍⚕️ Doctor: <strong>{user.preferredDoctorName || (user.preferredDoctor ? 'Assigned' : 'Not assigned')}</strong>
                    </div>
                </div>

                {/* Warning */}
                <div style={{ background: '#fff8e1', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem', border: '1px solid #ffe082', fontSize: '0.83rem', color: '#e65100' }}>
                    ⚠️ <strong>Important:</strong> Switching your doctor will <strong>cancel all pending & upcoming appointments</strong> with your current doctor. Completed sessions are preserved.
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>Loading doctors and centres…</div>
                ) : step === 1 ? (
                    <>
                        {error && (
                            <div style={{ background: '#ffebee', color: '#c62828', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                {error}
                            </div>
                        )}

                        {/* Step 1 — Select Centre */}
                        <div style={{ marginBottom: '1.2rem' }}>
                            <label style={{ fontWeight: 700, fontSize: '0.9rem', color: '#333', display: 'block', marginBottom: '6px' }}>
                                🏥 Select Centre *
                            </label>
                            <select
                                value={selectedCentreId}
                                onChange={e => {
                                    const c = centres.find(c => c._id === e.target.value);
                                    setSelectedCentreId(e.target.value);
                                    setSelectedCentreName(c?.name || '');
                                    setSelectedDoctorId(''); // reset doctor on centre change
                                }}
                                style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1.5px solid #ddd', fontSize: '0.9rem', outline: 'none' }}
                            >
                                <option value="">— Any Centre (show all doctors) —</option>
                                {centres.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Step 1 — Select Doctor */}
                        <div style={{ marginBottom: '1.2rem' }}>
                            <label style={{ fontWeight: 700, fontSize: '0.9rem', color: '#333', display: 'block', marginBottom: '6px' }}>
                                👨‍⚕️ Select New Doctor *
                            </label>
                            {filteredDoctors.length === 0 ? (
                                <div style={{ padding: '1rem', color: '#aaa', fontSize: '0.85rem', background: '#fafafa', borderRadius: '10px', textAlign: 'center' }}>
                                    No approved doctors found for this centre.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '240px', overflowY: 'auto' }}>
                                    {filteredDoctors.map(d => {
                                        const isCurrent = user.preferredDoctor === d._id;
                                        const isSelected = selectedDoctorId === d._id;
                                        return (
                                            <div key={d._id}
                                                onClick={() => setSelectedDoctorId(isSelected ? '' : d._id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                                    padding: '0.75rem 1rem', borderRadius: '12px', cursor: 'pointer',
                                                    border: `2px solid ${isSelected ? '#2a7d2e' : isCurrent ? '#ffb74d' : '#e8e8e8'}`,
                                                    background: isSelected ? '#e8f5e9' : isCurrent ? '#fff8e1' : '#fafafa',
                                                    transition: 'all 0.2s',
                                                    boxShadow: isSelected ? '0 0 0 3px #c8e6c920' : 'none',
                                                }}
                                            >
                                                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: isSelected ? '#a5d6a7' : '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                                                    👨‍⚕️
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isSelected ? '#2a7d2e' : '#222' }}>
                                                        Dr. {d.name}
                                                        {isCurrent && <span style={{ marginLeft: '6px', fontSize: '0.72rem', background: '#fff3e0', color: '#e65100', padding: '2px 7px', borderRadius: '10px' }}>Current</span>}
                                                        {isSelected && !isCurrent && <span style={{ marginLeft: '6px', fontSize: '0.72rem', background: '#e8f5e9', color: '#2a7d2e', padding: '2px 7px', borderRadius: '10px' }}>Selected ✓</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#777', marginTop: '2px' }}>
                                                        {d.speciality || 'Ayurveda'} {d.centre ? `· ${d.centre}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Reason */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontWeight: 700, fontSize: '0.9rem', color: '#333', display: 'block', marginBottom: '6px' }}>
                                📝 Reason for change (optional)
                            </label>
                            <select value={reason} onChange={e => setReason(e.target.value)}
                                style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: '1.5px solid #ddd', fontSize: '0.9rem' }}>
                                <option value="">Select a reason</option>
                                <option value="Misunderstanding during initial registration">Misunderstanding during initial registration</option>
                                <option value="Preferred doctor not available">Preferred doctor not available</option>
                                <option value="Location / centre change">Location / centre change</option>
                                <option value="Better speciality match required">Better speciality match required</option>
                                <option value="Personal preference">Personal preference</option>
                                <option value="Recommended by another doctor">Recommended by another doctor</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={onClose}
                                style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: '1.5px solid #ddd', background: '#fff', color: '#555', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (!selectedDoctorId) { setError('Please select a doctor first.'); return; }
                                    if (isSameDoctor) { setError('You are already assigned to this doctor.'); return; }
                                    setError('');
                                    setStep(2);
                                }}
                                disabled={!selectedDoctorId}
                                style={{
                                    flex: 2, padding: '0.8rem', borderRadius: '10px', border: 'none',
                                    background: selectedDoctorId ? 'linear-gradient(135deg, #2a7d2e, #43a047)' : '#e0e0e0',
                                    color: selectedDoctorId ? '#fff' : '#aaa',
                                    fontWeight: 700, cursor: selectedDoctorId ? 'pointer' : 'not-allowed',
                                    fontSize: '0.9rem', transition: 'all 0.2s',
                                }}
                            >
                                Review & Confirm →
                            </button>
                        </div>
                    </>
                ) : (
                    /* Step 2 — Confirmation */
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1.5rem', background: '#f0f9f0', borderRadius: '16px', border: '1.5px solid #a5d6a7' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔄</div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#2a7d2e', marginBottom: '0.4rem' }}>
                                Switch to Dr. {selectedDoctor?.name}?
                            </div>
                            <div style={{ color: '#666', fontSize: '0.85rem' }}>
                                {selectedCentreName && <span>🏥 {selectedCentreName} · </span>}
                                {selectedDoctor?.speciality || 'Ayurveda'}
                            </div>
                        </div>

                        <div style={{ background: '#fff8e1', borderRadius: '10px', padding: '0.9rem 1.1rem', marginBottom: '1.5rem', fontSize: '0.84rem', color: '#e65100', border: '1px solid #ffcc80' }}>
                            <strong>This will:</strong>
                            <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0 }}>
                                <li>Assign you to <strong>Dr. {selectedDoctor?.name}</strong></li>
                                {selectedCentreName && <li>Move your centre to <strong>{selectedCentreName}</strong></li>}
                                <li>Cancel all <strong>pending & upcoming</strong> appointments with your previous doctor</li>
                                <li>Preserve all your completed sessions and therapy history</li>
                            </ul>
                        </div>

                        {error && (
                            <div style={{ background: '#ffebee', color: '#c62828', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setStep(1)} disabled={submitting}
                                style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: '1.5px solid #ddd', background: '#fff', color: '#555', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                                ← Go Back
                            </button>
                            <button onClick={handleConfirm} disabled={submitting}
                                style={{
                                    flex: 2, padding: '0.8rem', borderRadius: '10px', border: 'none',
                                    background: submitting ? '#e0e0e0' : 'linear-gradient(135deg, #2a7d2e, #43a047)',
                                    color: submitting ? '#aaa' : '#fff',
                                    fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                }}
                            >
                                {submitting ? '⏳ Processing…' : '✅ Confirm Change'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
