import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDoctors } from '../services/userService';
import { getCentres } from '../services/centreService';
import { sendOTP, isDisposableEmail } from '../services/otpService';
import { checkEmail } from '../services/authService';
import OtpVerificationScreen from '../components/OtpVerificationScreen';

export default function SignupPage({ showPage, showNotification }) {
    const { register } = useAuth();
    const [step, setStep] = useState(1); // 1=role, 2=centre, 3=patient:doctors/doctor:details, 4=form
    const [userType, setUserType] = useState('');
    const [selectedCentre, setSelectedCentre] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        fullName: '', email: '', phone: '', password: '', confirmPassword: '',
        // doctor specific
        speciality: '', licenseNumber: '', experience: '',
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

    const centreDoctors = availableDoctors.filter(d => d.centreId === selectedCentre || d.centre === selectedCentre);

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
                speciality: form.speciality || '',
                licenseNumber: form.licenseNumber || '',
                experience: form.experience || '',
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
                    speciality: form.speciality || '',
                    licenseNumber: form.licenseNumber || '',
                    experience: form.experience || '',
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
            showNotification(result.message || 'Registration failed. Please try again.', 'error');
            setStage('form');
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
                            {[1, 2, 3, 4].map(s => (
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

                    {/* Step 3: Patient → Choose Doctor / Doctor → Speciality */}
                    {step === 3 && userType === 'patient' && (
                        <div>
                            <h2>Choose Your Doctor</h2>
                            <p style={{ color: '#777', marginBottom: '1.5rem' }}>
                                Select a doctor at <strong>{centres.find(c => (c.slug || c._id) === selectedCentre)?.name || selectedCentre}</strong>
                            </p>
                            {centreDoctors.length === 0 ? (
                                <p style={{ color: '#777', textAlign: 'center', padding: '2rem' }}>No approved doctors available at this centre yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    {centreDoctors.map(doc => (
                                        <button
                                            key={doc._id}
                                            className={`doctor-option ${selectedDoctor === doc._id ? 'selected' : ''}`}
                                            onClick={() => setSelectedDoctor(doc._id)}
                                        >
                                            <div style={{ fontSize: '2rem' }}>{doc.avatar || '👨‍⚕️'}</div>
                                            <div style={{ flex: 1, textAlign: 'left' }}>
                                                <div style={{ fontWeight: 600 }}>{doc.name}</div>
                                                <div style={{ fontSize: '0.9rem', color: '#777' }}>{doc.speciality || 'Ayurveda'}</div>
                                            </div>
                                            <div style={{ color: '#4caf50', fontSize: '0.8rem', fontWeight: 600 }}>Available</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="auth-btn-outline" onClick={() => setStep(2)}>← Back</button>
                                <button className="auth-btn" onClick={() => setStep(4)}>
                                    {selectedDoctor ? 'Book & Register' : 'Skip & Register'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && userType === 'doctor' && (
                        <div>
                            <h2>Professional Details</h2>
                            <p style={{ color: '#777', marginBottom: '1rem' }}>You are registering at <strong>{centres.find(c => (c.slug || c._id) === selectedCentre)?.name || selectedCentre}</strong></p>
                            <div className="form-group">
                                <label>Speciality</label>
                                <select value={form.speciality} onChange={e => setForm({ ...form, speciality: e.target.value })}>
                                    <option value="">Select Speciality</option>
                                    <option>Panchakarma Specialist</option>
                                    <option>Ayurvedic Physician</option>
                                    <option>Detox Specialist</option>
                                    <option>Stress Management</option>
                                    <option>Joint Pain Specialist</option>
                                    <option>Digestive Health</option>
                                    <option>Ayurvedic Dermatology</option>
                                    <option>Respiratory Health</option>
                                    <option>Pain Management</option>
                                </select>
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
                                <button className="auth-btn" disabled={!form.speciality} onClick={() => setStep(4)}>Continue to Registration</button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Fill Registration Form */}
                    {step === 4 && (
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
                                    <button type="button" className="auth-btn-outline" onClick={() => setStep(3)}>← Back</button>
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

