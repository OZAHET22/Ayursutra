import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDoctors } from '../services/userService';
import { getCentres } from '../services/centreService';
import { sendOTP, isDisposableEmail } from '../services/otpService';
import { checkEmail } from '../services/authService';
import OtpVerificationScreen from '../components/OtpVerificationScreen';
import { SPECIALIZATIONS } from '../data/specializations';

export default function SignupPage({ showPage, showNotification }) {
    const { register } = useAuth();
    const [step, setStep] = useState(1); // 1=role, 2=centre, 3=specialization(patient)/details(doctor), 4=doctor(patient)/form(doctor), 5=form(patient)
    const [userType, setUserType] = useState('');
    const [selectedCentre, setSelectedCentre] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedSpecialization, setSelectedSpecialization] = useState('');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        fullName: '', email: '', phone: '', password: '', confirmPassword: '',
        // doctor specific
        speciality: '', licenseNumber: '', experience: '', hospitalName: '',
        // patient specific
        dob: '', gender: '', address: ''
    });
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [availableDoctors, setAvailableDoctors] = useState([]);
    const [centres, setCentres] = useState([]);
    const [registered, setRegistered] = useState(false);
    // OTP flow
    const [stage, setStage] = useState('form'); // 'form' | 'otp'
    const [pendingFormData, setPendingFormData] = useState(null);
    const otpDevCodeRef = useRef(null); // useRef so it's synchronous (not batched by React)
    // Email uniqueness check
    const [emailCheckState, setEmailCheckState] = useState(null); // null | 'checking' | 'available' | 'taken'
    const [emailCheckMsg, setEmailCheckMsg] = useState('');

    useEffect(() => {
        getDoctors().then(d => setAvailableDoctors(d || [])).catch(() => {});
        getCentres().then(c => setCentres(c || [])).catch(() => {});
    }, []);

    // Filter doctors by centre AND specialization for patient matching (Feature 4)
    const centreDoctors = availableDoctors.filter(d =>
        (d.centreId === selectedCentre || d.centre === selectedCentre) &&
        (!selectedSpecialization || d.speciality === selectedSpecialization)
    );

    const calcStrength = (pass) => {
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score;
    };

    const handlePasswordChange = (e) => {
        setForm({ ...form, password: e.target.value });
        setPasswordStrength(calcStrength(e.target.value));
    };

    // Real-time email uniqueness check on blur
    const handleEmailBlur = useCallback(async () => {
        const email = form.email.trim();
        if (!email || !email.includes('@')) return;
        if (isDisposableEmail(email)) {
            setEmailCheckState('taken');
            setEmailCheckMsg('❌ Disposable/temporary email addresses are not allowed.');
            return;
        }
        setEmailCheckState('checking');
        setEmailCheckMsg('');
        const result = await checkEmail(email);
        if (result.available === false) {
            const roleLabel = result.role === 'doctor' ? 'Doctor' : result.role === 'admin' ? 'Admin' : 'Patient';
            setEmailCheckState('taken');
            setEmailCheckMsg(`❌ This email is already registered as a ${roleLabel}. Each email can only be linked to one account. Please use a different email or log in.`);
        } else if (result.available === true) {
            setEmailCheckState('available');
            setEmailCheckMsg('✅ Email is available.');
        } else {
            // Network error — don't block user, server will catch it
            setEmailCheckState(null);
            setEmailCheckMsg('');
        }
    }, [form.email]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            showNotification('Passwords do not match.', 'error'); return;
        }

        // Block disposable/temp emails
        if (isDisposableEmail(form.email)) {
            showNotification(
                '❌ Temporary or disposable email addresses are not allowed. Please use a valid email (Gmail, Outlook, Yahoo, etc.)',
                'error'
            );
            return;
        }

        // ── Hard email-uniqueness gate (cross-role) ──────────────────────────
        // This runs even if the blur-check already flagged it, as a final server-confirmed guard.
        const emailAvailResult = await checkEmail(form.email.trim());
        if (emailAvailResult.available === false) {
            const roleLabel = emailAvailResult.role === 'doctor' ? 'Doctor'
                : emailAvailResult.role === 'admin' ? 'Admin' : 'Patient';
            setEmailCheckState('taken');
            setEmailCheckMsg(`❌ This email is already registered as a ${roleLabel}. Each email can only be linked to one account. Please use a different email or log in.`);
            showNotification(
                `❌ Email already registered as a ${roleLabel}. Use a different email or log in.`,
                'error'
            );
            return;
        }

        // Frontend Phone Check
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(form.phone)) {
            showNotification('❌ Please enter a valid 10-digit Indian mobile number.', 'error');
            return;
        }

        setLoading(true);
        // Send OTP to Email only
        try {
            await sendOTP(form.email.trim(), 'email', 'register');

            // Compute age from dob if provided
            let computedAge = null;
            if (form.dob) {
                const dob = new Date(form.dob);
                const today = new Date();
                computedAge = today.getFullYear() - dob.getFullYear();
                const m = today.getMonth() - dob.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) computedAge--;
            }

            setPendingFormData({
                name: form.fullName,
                email: form.email.trim().toLowerCase(),
                phone: `+91${form.phone}`,
                password: form.password,
                role: userType,
                userType,
                centre: selectedCentre,
                centreId: selectedCentre,
                speciality: userType === 'doctor' ? (form.speciality || '') : (selectedSpecialization || ''),
                licenseNumber: form.licenseNumber || '',
                experience: form.experience || '',
                hospitalName: form.hospitalName || '',
                age: computedAge,
                gender: form.gender || '',
                condition: form.address || '',
                preferredDoctor: selectedDoctor || null,
            });

            setStage('otp');
        } catch (err) {
            const errData = err.response?.data;
            if (errData?.code === 'RESEND_COOLDOWN') {
                // OTP was already sent for this email — compute pending data and go to OTP screen
                let computedAge = null;
                if (form.dob) {
                    const dob = new Date(form.dob);
                    const today = new Date();
                    computedAge = today.getFullYear() - dob.getFullYear();
                    const m = today.getMonth() - dob.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) computedAge--;
                }
                setPendingFormData({
                    name: form.fullName,
                    email: form.email.trim().toLowerCase(),
                    phone: `+91${form.phone}`,
                    password: form.password,
                    role: userType,
                    userType,
                    centre: selectedCentre,
                    centreId: selectedCentre,
                    // ✅ Match the success-path logic: patients use selectedSpecialization
                    speciality: userType === 'doctor' ? (form.speciality || '') : (selectedSpecialization || ''),
                    licenseNumber: form.licenseNumber || '',
                    experience: form.experience || '',
                    hospitalName: form.hospitalName || '',
                    age: computedAge,
                    gender: form.gender || '',
                    condition: form.address || '',
                    preferredDoctor: selectedDoctor || null,
                });
                setStage('otp');
                showNotification(
                    `A code was already sent to your email. ${errData.message || 'Please enter it below.'}`,
                    'info'
                );
            } else if (errData?.code === 'EMAIL_TAKEN') {
                const roleLabel = errData.existingRole === 'doctor' ? 'Doctor'
                    : errData.existingRole === 'admin' ? 'Admin' : 'Patient';
                setEmailCheckState('taken');
                setEmailCheckMsg(`❌ This email is already registered as a ${roleLabel}. Please use a different email.`);
                showNotification(`❌ Email already registered as a ${roleLabel}.`, 'error');
            } else {
                const msg = err.message === 'DISPOSABLE_EMAIL'
                    ? '❌ Temporary or disposable email addresses are not allowed.'
                    : errData?.message || 'Failed to send OTP. Please try again.';
                showNotification(msg, 'error');
            }
        }
        setLoading(false);
    };

    // Called after OTP is verified — now create the account
    const handleOtpVerified = async () => {
        setLoading(true);
        const result = await register(pendingFormData);
        setLoading(false);
        if (result.success) {
            if (result.needsApproval || userType === 'doctor') {
                // Doctor registered but needs approval — show pending screen
                setStage('form');
                setRegistered(true);
            } else {
                // Patient registered and auto-logged-in — dashboard rendered by App.jsx
                showNotification('Registration successful! Welcome to Ayursutra.', 'success');
            }
        } else {
            // Surface specific backend error codes with clear, actionable messages
            const code = result.code;
            if (code === 'EMAIL_NOT_VERIFIED') {
                showNotification(
                    '⚠️ Session expired. Please go back and verify your email again.',
                    'error'
                );
                // Go back to OTP screen to allow re-send
                setStage('form');
            } else if (code === 'EMAIL_TAKEN') {
                showNotification(
                    '❌ This email is already registered. Please log in instead.',
                    'error'
                );
                setStage('form');
            } else {
                showNotification(result.message || 'Registration failed. Please try again.', 'error');
                setStage('form');
            }
        }
    };

    const strengthColors = ['#ddd', '#f44336', '#ff9800', '#fdd835', '#4caf50'];
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    // ── Show OTP screen in place of SignupPage ────────────────────────────────
    if (stage === 'otp' && pendingFormData) {
        return (
            <OtpVerificationScreen
                email={pendingFormData.email}
                purpose="register"
                onVerified={handleOtpVerified}
                onBack={() => { setStage('form'); setPendingFormData(null); }}
            />
        );
    }

    // ── Doctor pending approval — render INSTEAD of the step form ─────────────
    if (registered && userType === 'doctor') {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card">
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
                            <h2 style={{ color: '#2a7d2e', marginBottom: '0.75rem' }}>Application Submitted!</h2>
                            <p style={{ color: '#555', marginBottom: '1rem', lineHeight: '1.6' }}>
                                Your doctor account has been created and is <strong>awaiting admin approval</strong>.
                            </p>
                            <div style={{ background: '#fff3e0', border: '1px solid #ff9800', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                                <div style={{ fontWeight: 700, color: '#e65100', marginBottom: '0.5rem' }}>What happens next?</div>
                                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#555', fontSize: '0.9rem', lineHeight: '1.8' }}>
                                    <li>The admin will review your credentials</li>
                                    <li>You'll be approved to accept patients</li>
                                    <li>Once approved, log in to access your dashboard</li>
                                </ul>
                            </div>
                            <button className="auth-btn" onClick={() => showPage('login')}>Go to Doctor Login</button>
                            <button className="auth-btn-outline" style={{ marginTop: '0.75rem', width: '100%' }} onClick={() => showPage('home')}>Back to Home</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card" style={{ maxWidth: step >= 3 ? '600px' : '480px' }}>

                    {/* Logo + progress — always visible for step selection */}
                    <div className="auth-header">
                        <div className="auth-logo" onClick={() => showPage('home')} style={{ cursor: 'pointer' }}>
                            <span className="auth-logo-icon">🌿</span>
                            <span className="auth-logo-text">Ayursutra</span>
                        </div>
                        <div className="signup-progress">
                            {(userType === 'patient' ? [1,2,3,4,5] : [1,2,3,4]).map(s => (
                                <div key={s} className={`progress-step ${step >= s ? 'done' : ''} ${step === s ? 'active' : ''}`}>{s}</div>
                            ))}
                        </div>
                    </div>

                    {/* Step 1: Choose Role */}
                    {step === 1 && (
                        <div>
                            <h2>Join Ayursutra</h2>
                            <p style={{ color: '#777', marginBottom: '1.5rem' }}>Select your role to begin registration</p>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                <button
                                    className={`role-select-card ${userType === 'patient' ? 'selected' : ''}`}
                                    onClick={() => setUserType('patient')}
                                >
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏥</div>
                                    <div style={{ fontWeight: 600 }}>Patient</div>
                                    <div style={{ fontSize: '0.85rem', color: '#777' }}>Book therapies & track recovery</div>
                                </button>
                                <button
                                    className={`role-select-card ${userType === 'doctor' ? 'selected' : ''}`}
                                    onClick={() => setUserType('doctor')}
                                >
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👨‍⚕️</div>
                                    <div style={{ fontWeight: 600 }}>Doctor</div>
                                    <div style={{ fontSize: '0.85rem', color: '#777' }}>Manage patients & therapies</div>
                                </button>
                            </div>
                            <button className="auth-btn" disabled={!userType} onClick={() => setStep(2)}>
                                Continue as {userType || '...'}
                            </button>
                            <div className="auth-footer">
                                <p>Already have an account? <button className="text-link" onClick={() => showPage('login')}>Sign In</button></p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Choose Centre */}
                    {step === 2 && (
                        <div>
                            <h2>Select Your Centre</h2>
                            <p style={{ color: '#777', marginBottom: '1.5rem' }}>
                                {userType === 'patient' ? 'Choose the Ayursutra centre nearest to you' : 'Choose the centre you will be working at'}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
                                {centres.length === 0 && (
                                    <p style={{ color: '#aaa', gridColumn: '1/-1', textAlign: 'center', padding: '1rem' }}>Loading centres...</p>
                                )}
                                {centres.map(c => (
                                    <button
                                        key={c._id}
                                        className={`centre-option ${selectedCentre === (c.slug || c._id) ? 'selected' : ''}`}
                                        onClick={() => setSelectedCentre(c.slug || c._id)}
                                    >
                                        🏛️ {c.name}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="auth-btn-outline" onClick={() => setStep(1)}>← Back</button>
                                <button className="auth-btn" disabled={!selectedCentre} onClick={() => setStep(3)}>Continue</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Patient → Choose Specialization (Feature 4) */}
                    {step === 3 && userType === 'patient' && (
                        <div>
                            <h2>Select Specialization</h2>
                            <p style={{ color: '#777', marginBottom: '1.5rem' }}>Choose the type of care you need — only matching doctors will be shown</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1.5rem' }}>
                                {SPECIALIZATIONS.map(sp => (
                                    <button
                                        key={sp.id}
                                        className={`centre-option ${selectedSpecialization === sp.label ? 'selected' : ''}`}
                                        onClick={() => { setSelectedSpecialization(sp.label); setSelectedDoctor(''); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left', padding: '0.6rem 0.9rem' }}
                                    >
                                        <span style={{ fontSize: '1.4rem' }}>{sp.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{sp.label}</div>
                                            <div style={{ fontSize: '0.72rem', color: '#888' }}>{sp.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="auth-btn-outline" onClick={() => setStep(2)}>← Back</button>
                                <button className="auth-btn" disabled={!selectedSpecialization} onClick={() => setStep(4)}>Continue</button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Patient → Choose Doctor (filtered by specialization) */}
                    {step === 4 && userType === 'patient' && (
                        <div>
                            <h2>Choose Your Doctor</h2>
                            <p style={{ color: '#777', marginBottom: '1.5rem' }}>
                                {selectedSpecialization} doctors at <strong>{centres.find(c => (c.slug || c._id) === selectedCentre)?.name || selectedCentre}</strong>
                            </p>
                            {centreDoctors.length === 0 ? (
                                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', color: '#92400e', marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                                    <strong>No {selectedSpecialization} doctors available</strong> at this centre yet.
                                    <br /><small style={{ color: '#a16207' }}>Try a different specialization or centre.</small>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                                    {centreDoctors.map(doc => {
                                        const isSelected = selectedDoctor === doc._id;
                                        const stars = doc.avgRating || 0;
                                        const fullStars = Math.floor(stars);
                                        const halfStar = stars - fullStars >= 0.5;
                                        return (
                                            <button
                                                key={doc._id}
                                                onClick={() => setSelectedDoctor(doc._id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '0.9rem',
                                                    padding: '1rem 1.1rem',
                                                    borderRadius: '14px',
                                                    border: isSelected ? '2px solid #2a7d2e' : '2px solid #e8f5e9',
                                                    background: isSelected ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : '#fff',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: isSelected ? '0 4px 12px rgba(42,125,46,0.15)' : '0 2px 6px rgba(0,0,0,0.05)',
                                                    width: '100%',
                                                    position: 'relative',
                                                }}
                                            >
                                                {/* Avatar */}
                                                <div style={{
                                                    fontSize: '2.2rem',
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '50%',
                                                    background: isSelected ? '#bbf7d0' : '#f0f9f0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    border: '2px solid',
                                                    borderColor: isSelected ? '#4ade80' : '#d1fae5',
                                                }}>
                                                    {doc.avatar || '👨‍⚕️'}
                                                </div>

                                                {/* Info block */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#14532d' }}>
                                                            Dr. {doc.name}
                                                        </span>
                                                        {isSelected && (
                                                            <span style={{
                                                                fontSize: '0.7rem', background: '#16a34a', color: '#fff',
                                                                borderRadius: '20px', padding: '2px 8px', fontWeight: 700
                                                            }}>✓ Selected</span>
                                                        )}
                                                    </div>

                                                    {/* Speciality badge */}
                                                    <div style={{ fontSize: '0.8rem', color: '#2a7d2e', fontWeight: 600, marginTop: '2px' }}>
                                                        🌿 {doc.speciality || 'Ayurveda'}
                                                    </div>

                                                    {/* Hospital name */}
                                                    {doc.hospitalName && (
                                                        <div style={{ fontSize: '0.78rem', color: '#555', marginTop: '3px' }}>
                                                            🏥 {doc.hospitalName}
                                                        </div>
                                                    )}

                                                    {/* Experience */}
                                                    {doc.experience && (
                                                        <div style={{ fontSize: '0.78rem', color: '#777', marginTop: '2px' }}>
                                                            💼 {doc.experience} yr{parseInt(doc.experience) !== 1 ? 's' : ''} experience
                                                        </div>
                                                    )}

                                                    {/* Rating row */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '6px' }}>
                                                        {doc.reviewCount > 0 ? (
                                                            <>
                                                                <div style={{ display: 'flex', gap: '1px' }}>
                                                                    {[1,2,3,4,5].map(i => (
                                                                        <span key={i} style={{
                                                                            fontSize: '0.85rem',
                                                                            color: i <= fullStars ? '#f59e0b'
                                                                                : (i === fullStars + 1 && halfStar) ? '#f59e0b'
                                                                                : '#d1d5db',
                                                                            opacity: (i === fullStars + 1 && halfStar) ? 0.6 : 1
                                                                        }}>★</span>
                                                                    ))}
                                                                </div>
                                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e' }}>
                                                                    {stars.toFixed(1)}
                                                                </span>
                                                                <span style={{ fontSize: '0.72rem', color: '#999' }}>
                                                                    ({doc.reviewCount} review{doc.reviewCount !== 1 ? 's' : ''})
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span style={{ fontSize: '0.72rem', color: '#bbb', fontStyle: 'italic' }}>
                                                                No reviews yet
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Fee + availability row */}
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '5px', flexWrap: 'wrap' }}>
                                                        {doc.consultationFee > 0 && (
                                                            <span style={{
                                                                fontSize: '0.75rem', fontWeight: 700,
                                                                color: '#15803d', background: '#f0fdf4',
                                                                borderRadius: '8px', padding: '2px 7px',
                                                                border: '1px solid #bbf7d0'
                                                            }}>
                                                                ₹{doc.consultationFee} / session
                                                            </span>
                                                        )}
                                                        <span style={{
                                                            fontSize: '0.75rem', fontWeight: 600,
                                                            color: '#16a34a', background: '#f0fdf4',
                                                            borderRadius: '8px', padding: '2px 7px',
                                                            border: '1px solid #bbf7d0'
                                                        }}>
                                                            ● Available
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="auth-btn-outline" onClick={() => setStep(3)}>← Back</button>
                                <button className="auth-btn" onClick={() => setStep(5)}>
                                    {selectedDoctor ? 'Continue' : 'Skip & Continue'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && userType === 'doctor' && (
                        <div>
                            <h2>Professional Details</h2>
                            <p style={{ color: '#777', marginBottom: '1rem' }}>You are registering at <strong>{centres.find(c => (c.slug || c._id) === selectedCentre)?.name || selectedCentre}</strong></p>
                            <div className="form-group">
                                <label>Specialization *</label>
                                <select required value={form.speciality} onChange={e => setForm({ ...form, speciality: e.target.value })}>
                                    <option value="">Select Specialization</option>
                                    {SPECIALIZATIONS.map(sp => (
                                        <option key={sp.id} value={sp.label}>{sp.icon} {sp.label}</option>
                                    ))}
                                </select>
                                {form.speciality && (
                                    <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#2a7d2e', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 10px' }}>
                                        ✅ Patients searching for <strong>{form.speciality}</strong> will be matched with you.
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Hospital / Clinic Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Apollo Hospital, City Ayurveda Clinic"
                                    required
                                    value={form.hospitalName}
                                    onChange={e => setForm({ ...form, hospitalName: e.target.value })}
                                />
                                <small style={{ color: '#888', fontSize: '0.78rem' }}>
                                    🏥 This is displayed to patients when they choose a doctor.
                                </small>
                            </div>
                            <div className="form-group">
                                <label>BAMS License Number</label>
                                <input type="text" placeholder="e.g. BAMS-MH-2015-12345" value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Years of Experience</label>
                                <input type="number" min="0" max="50" placeholder="e.g. 8" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="auth-btn-outline" onClick={() => setStep(2)}>← Back</button>
                                <button className="auth-btn" disabled={!form.speciality || !form.hospitalName} onClick={() => setStep(4)}>Continue to Registration</button>
                            </div>
                        </div>
                    )}

                    {/* Step 4 (Doctor) / Step 5 (Patient): Registration Form */}
                    {((step === 4 && userType === 'doctor') || (step === 5 && userType === 'patient')) && (
                        <div>
                            <h2>{userType === 'patient' ? 'Patient' : 'Doctor'} Registration</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" placeholder="Enter full name" required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                                </div>
                                <div className="form-row-two">
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            placeholder="Enter email"
                                            required
                                            value={form.email}
                                            onChange={e => {
                                                setForm({ ...form, email: e.target.value });
                                                // Reset check state when user edits
                                                setEmailCheckState(null);
                                                setEmailCheckMsg('');
                                            }}
                                            onBlur={handleEmailBlur}
                                            style={{
                                                borderColor: emailCheckState === 'taken' ? '#ef4444'
                                                    : emailCheckState === 'available' ? '#22c55e'
                                                    : undefined
                                            }}
                                        />
                                        {emailCheckState === 'checking' && (
                                            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>🔍 Checking email availability...</div>
                                        )}
                                        {emailCheckMsg && emailCheckState !== 'checking' && (
                                            <div style={{
                                                fontSize: '0.8rem',
                                                marginTop: '4px',
                                                padding: '6px 10px',
                                                borderRadius: '6px',
                                                background: emailCheckState === 'taken' ? '#fef2f2' : '#f0fdf4',
                                                color: emailCheckState === 'taken' ? '#b91c1c' : '#15803d',
                                                border: `1px solid ${emailCheckState === 'taken' ? '#fca5a5' : '#86efac'}`,
                                            }}>{emailCheckMsg}</div>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <div style={{ display: 'flex' }}>
                                            <div style={{ background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px 0 0 4px', padding: '0.675rem', fontWeight: 'bold' }}>+91</div>
                                            <input type="tel" maxLength="10" placeholder="10-digit number" value={form.phone} onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setForm({ ...form, phone: val });
                                            }} style={{ borderRadius: '0 4px 4px 0', flex: 1, borderLeft: 'none' }} required />
                                        </div>
                                    </div>
                                </div>
                                {userType === 'patient' && (
                                    <div className="form-row-two">
                                        <div className="form-group">
                                            <label>Date of Birth</label>
                                            <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Gender</label>
                                            <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                                <option value="">Select</option>
                                                <option>Male</option><option>Female</option><option>Other</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Password</label>
                                    <input type="password" placeholder="Create a strong password" required value={form.password} onChange={handlePasswordChange} />
                                    {form.password && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                                {[1, 2, 3, 4].map(i => (<div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= passwordStrength ? strengthColors[passwordStrength] : '#eee' }} />))}
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: strengthColors[passwordStrength] }}>{strengthLabels[passwordStrength]}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <input type="password" placeholder="Repeat your password" required value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="auth-btn-outline" onClick={() => setStep(userType === 'patient' ? 4 : 3)}>← Back</button>
                                    <button type="submit" className="auth-btn" disabled={loading}>
                                        {loading ? 'Registering...' : '✅ Create Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

