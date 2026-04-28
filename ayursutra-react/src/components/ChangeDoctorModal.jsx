import { useState, useEffect } from 'react';
import { getDoctors, getCentres, reassignDoctor } from '../services/userService';

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
            onSuccess(result);
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
        width: '100%', maxWidth: '580px', boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        maxHeight: '90vh', overflowY: 'auto',
    };

    return (
        <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={cardStyle}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1a1a2e', fontWeight: 700 }}>
                            🔄 Change Centre &amp; Doctor
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
                    ⚠️ <strong>Important:</strong> Switching your doctor will <strong>cancel all pending &amp; upcoming appointments</strong> with your current doctor. Completed sessions are preserved.
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
                                    setSelectedDoctorId('');
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '2px' }}>
                                    {filteredDoctors.map(d => {
                                        const isCurrent = user.preferredDoctor === d._id;
                                        const isSelected = selectedDoctorId === d._id;
                                        const avgR = d.avgRating || 0;
                                        const fullS = Math.floor(avgR);
                                        const halfS = avgR - fullS >= 0.5;
                                        return (
                                            <div key={d._id}
                                                onClick={() => setSelectedDoctorId(isSelected ? '' : d._id)}
                                                style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
                                                    padding: '0.85rem 1rem', borderRadius: '12px', cursor: 'pointer',
                                                    border: `2px solid ${isSelected ? '#2a7d2e' : isCurrent ? '#ffb74d' : '#e8e8e8'}`,
                                                    background: isSelected ? 'linear-gradient(135deg,#e8f5e9,#f0fdf4)' : isCurrent ? '#fff8e1' : '#fafafa',
                                                    transition: 'all 0.2s',
                                                    boxShadow: isSelected ? '0 4px 12px rgba(42,125,46,0.12)' : 'none',
                                                }}
                                            >
                                                {/* Avatar */}
                                                <div style={{
                                                    width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                                                    background: isSelected ? '#a5d6a7' : isCurrent ? '#ffe082' : '#e0e0e0',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.4rem', border: '2px solid',
                                                    borderColor: isSelected ? '#4ade80' : isCurrent ? '#f59e0b' : '#d1d5db',
                                                }}>
                                                    {d.avatar || '👨‍⚕️'}
                                                </div>

                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {/* Name + badges */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.93rem', color: isSelected ? '#2a7d2e' : '#222' }}>
                                                            Dr. {d.name}
                                                        </span>
                                                        {isCurrent && (
                                                            <span style={{ fontSize: '0.68rem', background: '#fff3e0', color: '#e65100', padding: '2px 7px', borderRadius: '10px', fontWeight: 600 }}>
                                                                Current
                                                            </span>
                                                        )}
                                                        {isSelected && !isCurrent && (
                                                            <span style={{ fontSize: '0.68rem', background: '#e8f5e9', color: '#2a7d2e', padding: '2px 7px', borderRadius: '10px', fontWeight: 700 }}>
                                                                ✓ Selected
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Speciality */}
                                                    <div style={{ fontSize: '0.78rem', color: '#2a7d2e', fontWeight: 600, marginTop: '2px' }}>
                                                        🌿 {d.speciality || 'Ayurveda'}{d.centre ? ` · ${d.centre}` : ''}
                                                    </div>

                                                    {/* Hospital */}
                                                    {d.hospitalName && (
                                                        <div style={{ fontSize: '0.73rem', color: '#555', marginTop: '2px' }}>
                                                            🏥 {d.hospitalName}
                                                        </div>
                                                    )}

                                                    {/* Experience */}
                                                    {d.experience && (
                                                        <div style={{ fontSize: '0.73rem', color: '#777', marginTop: '2px' }}>
                                                            💼 {d.experience} yr{parseInt(d.experience) !== 1 ? 's' : ''} experience
                                                        </div>
                                                    )}

                                                    {/* Rating + fee row */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                                                        {(d.reviewCount || 0) > 0 ? (
                                                            <>
                                                                <span style={{ display: 'inline-flex', gap: '1px' }}>
                                                                    {[1,2,3,4,5].map(i => (
                                                                        <span key={i} style={{
                                                                            fontSize: '0.8rem',
                                                                            color: i <= fullS ? '#f59e0b' : (i === fullS + 1 && halfS) ? '#f59e0b' : '#d1d5db',
                                                                            opacity: (i === fullS + 1 && halfS) ? 0.55 : 1,
                                                                        }}>★</span>
                                                                    ))}
                                                                </span>
                                                                <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#92400e' }}>
                                                                    {avgR.toFixed(1)}
                                                                </span>
                                                                <span style={{ fontSize: '0.68rem', color: '#aaa' }}>
                                                                    ({d.reviewCount} review{d.reviewCount !== 1 ? 's' : ''})
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span style={{ fontSize: '0.68rem', color: '#bbb', fontStyle: 'italic' }}>
                                                                No reviews yet
                                                            </span>
                                                        )}
                                                        {(d.consultationFee || 0) > 0 && (
                                                            <span style={{
                                                                fontSize: '0.68rem', fontWeight: 700,
                                                                color: '#15803d', background: '#f0fdf4',
                                                                borderRadius: '8px', padding: '1px 6px',
                                                                border: '1px solid #bbf7d0',
                                                            }}>
                                                                ₹{d.consultationFee}/session
                                                            </span>
                                                        )}
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
                                Review &amp; Confirm →
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
                            {selectedDoctor?.hospitalName && (
                                <div style={{ fontSize: '0.82rem', color: '#555', marginBottom: '2px' }}>
                                    🏥 {selectedDoctor.hospitalName}
                                </div>
                            )}
                            <div style={{ color: '#666', fontSize: '0.85rem' }}>
                                {selectedCentreName && <span>🏛️ {selectedCentreName} · </span>}
                                {selectedDoctor?.speciality || 'Ayurveda'}
                                {selectedDoctor?.experience && <span> · {selectedDoctor.experience} yrs exp</span>}
                            </div>
                            {/* Rating in confirm step */}
                            {(selectedDoctor?.reviewCount || 0) > 0 && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '8px', background: '#fffbeb', borderRadius: '20px', padding: '4px 12px', border: '1px solid #fde68a' }}>
                                    <span style={{ display: 'inline-flex', gap: '1px' }}>
                                        {[1,2,3,4,5].map(i => {
                                            const fullS = Math.floor(selectedDoctor.avgRating || 0);
                                            const halfS = (selectedDoctor.avgRating || 0) - fullS >= 0.5;
                                            return (
                                                <span key={i} style={{
                                                    fontSize: '0.85rem',
                                                    color: i <= fullS ? '#f59e0b' : (i === fullS + 1 && halfS) ? '#f59e0b' : '#d1d5db',
                                                    opacity: (i === fullS + 1 && halfS) ? 0.55 : 1,
                                                }}>★</span>
                                            );
                                        })}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e' }}>
                                        {(selectedDoctor.avgRating || 0).toFixed(1)}
                                    </span>
                                    <span style={{ fontSize: '0.73rem', color: '#a16207' }}>
                                        ({selectedDoctor.reviewCount} review{selectedDoctor.reviewCount !== 1 ? 's' : ''})
                                    </span>
                                </div>
                            )}
                        </div>

                        <div style={{ background: '#fff8e1', borderRadius: '10px', padding: '0.9rem 1.1rem', marginBottom: '1.5rem', fontSize: '0.84rem', color: '#e65100', border: '1px solid #ffcc80' }}>
                            <strong>This will:</strong>
                            <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0 }}>
                                <li>Assign you to <strong>Dr. {selectedDoctor?.name}</strong></li>
                                {selectedCentreName && <li>Move your centre to <strong>{selectedCentreName}</strong></li>}
                                <li>Cancel all <strong>pending &amp; upcoming</strong> appointments with your previous doctor</li>
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
