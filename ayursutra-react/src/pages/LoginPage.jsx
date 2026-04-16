import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendOTP, checkOTP, isDisposableEmail } from '../services/otpService';
import { forgotPassword, resetPassword } from '../services/passwordResetService';
import OtpVerificationScreen from '../components/OtpVerificationScreen';

// Demo accounts: skip OTP (use full login so they go straight to dashboard)
const DEMO_EMAILS = new Set(['patient@demo.com', 'doctor@demo.com', 'admin@demo.com']);

export default function LoginPage({ showPage, showNotification }) {
    const { login, verifyCredentials, completeLogin } = useAuth();

    const [role, setRole]         = useState('patient');
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);

    // Pending session data held BETWEEN step-1 (credentials) and step-2 (OTP)
    const [pendingSession, setPendingSession] = useState(null);
    const [stage, setStage]       = useState('credentials'); // 'credentials' | 'otp' | 'forgot_email' | 'forgot_otp' | 'forgot_newpw'
    const otpDevCodeRef = useRef(null);

    // ── Forgot password state ──────────────────────────────────────────────────
    const [fpEmail, setFpEmail]       = useState('');
    const [fpOtp, setFpOtp]           = useState('');
    const [fpNewPw, setFpNewPw]       = useState('');
    const [fpConfirmPw, setFpConfirmPw] = useState('');
    const [fpLoading, setFpLoading]   = useState(false);
    const [fpError, setFpError]       = useState('');
    const [fpSuccess, setFpSuccess]   = useState('');
    const [fpCooldown, setFpCooldown] = useState(0);
    const fpCooldownRef               = useRef(null);
    const [showPw, setShowPw]         = useState(false);

    // One-click demo login — no OTP needed
    const quickDemoLogin = async (r) => {
        const demoEmail    = r === 'patient' ? 'patient@demo.com' : 'doctor@demo.com';
        const demoPassword = 'demo123';
        setRole(r);
        setEmail(demoEmail);
        setPassword(demoPassword);
        setLoading(true);
        const result = await login(demoEmail, demoPassword);
        if (result.success) {
            showNotification(`Welcome back! Demo ${r} logged in.`, 'success');
        } else {
            showNotification(result.message || 'Demo login failed. Please run the seed first.', 'error');
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const normalEmail = email.trim().toLowerCase();

        // ── 1. Block disposable emails ────────────────────────────────────────
        if (isDisposableEmail(normalEmail)) {
            showNotification(
                '❌ Temporary or disposable email addresses are not allowed. Please use Gmail, Outlook, Yahoo, etc.',
                'error'
            );
            setLoading(false);
            return;
        }

        // ── 2. Demo accounts — full login, no OTP ────────────────────────────
        if (DEMO_EMAILS.has(normalEmail)) {
            const result = await login(email, password);
            if (result.success) {
                showNotification(`Welcome back! Logged in as ${result.role}.`, 'success');
            } else {
                showNotification(result.message || 'Invalid demo credentials.', 'error');
            }
            setLoading(false);
            return;
        }

        // ── 3. Real accounts: verify credentials WITHOUT logging in yet ───────
        const result = await verifyCredentials(email, password);
        if (!result.success) {
            showNotification(result.message || 'Invalid email or password.', 'error');
            setLoading(false);
            return;
        }

        // ── 4. Credentials OK — send OTP ──────────────────────────────────────────────────────
        try {
            const otpRes = await sendOTP(normalEmail, 'email', 'login');
            setPendingSession({ user: result.user, token: result.token, role: result.role });
            otpDevCodeRef.current = otpRes?.devCode || null;
            setStage('otp');
        } catch (err) {
            const data = err.response?.data;
            if (data?.code === 'RESEND_COOLDOWN') {
                // An OTP was already sent within the last 30s — the user has a valid code
                // in their inbox. Just open the OTP screen so they can enter it.
                setPendingSession({ user: result.user, token: result.token, role: result.role });
                setStage('otp');
                showNotification(
                    `A code was already sent to your email. ${data.message || 'Please enter it below.'}`,
                    'info'
                );
            } else {
                const msg = data?.message || 'Failed to send OTP. Please try again.';
                showNotification(msg, 'error');
            }
        }

        setLoading(false);
    };

    // Called by OtpVerificationScreen when OTP is successfully verified
    const handleOtpVerified = () => {
        // NOW persist session and set user → App.jsx renders dashboard
        completeLogin(pendingSession.user, pendingSession.token);
        showNotification(`Welcome back! Logged in as ${pendingSession.role}.`, 'success');
    };

    // ── Forgot Password Handlers ──────────────────────────────────────────────

    function startCooldown(secs) {
        setFpCooldown(secs);
        if (fpCooldownRef.current) clearInterval(fpCooldownRef.current);
        fpCooldownRef.current = setInterval(() => {
            setFpCooldown(prev => {
                if (prev <= 1) { clearInterval(fpCooldownRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
    }

    const handleFpSendOtp = async (e) => {
        e.preventDefault();
        if (!fpEmail.trim()) { setFpError('Please enter your email address.'); return; }
        if (isDisposableEmail(fpEmail.trim().toLowerCase())) {
            setFpError('Disposable emails are not allowed.');
            return;
        }
        setFpLoading(true);
        setFpError('');
        setFpSuccess('');
        try {
            await forgotPassword(fpEmail.trim());
            setFpSuccess('✅ If that email is registered, an OTP has been sent. Check your inbox.');
            setStage('forgot_otp');
            startCooldown(30);
        } catch (err) {
            const data = err.response?.data;
            if (data?.code === 'RESEND_COOLDOWN') {
                startCooldown(data.waitSeconds || 30);
                setFpError(`Please wait ${data.waitSeconds || 30}s before requesting a new OTP.`);
            } else {
                setFpError(data?.message || 'Failed to send OTP. Please try again.');
            }
        } finally {
            setFpLoading(false);
        }
    };

    const handleFpVerifyOtp = async (e) => {
        e.preventDefault();
        if (!fpOtp.trim()) { setFpError('Please enter the OTP from your email.'); return; }
        if (!/^\d{6}$/.test(fpOtp.trim())) {
            setFpError('OTP must be a 6-digit number.');
            return;
        }
        setFpLoading(true);
        setFpError('');
        try {
            // Use checkOTP (non-consuming) so the OTP stays valid for /auth/reset-password
            await checkOTP(fpEmail.trim().toLowerCase(), 'email', fpOtp.trim(), 'reset');
            // OTP is valid — move to new-password stage
            setStage('forgot_newpw');
            setFpError('');
        } catch (err) {
            const data = err.response?.data;
            if (data?.code === 'EXPIRED') {
                setFpError('OTP has expired. Please request a new one.');
                setStage('forgot_otp');
            } else if (data?.code === 'LOCKED') {
                setFpError('Too many wrong attempts. Please request a new OTP.');
                setStage('forgot_email');
            } else {
                setFpError(data?.message || 'Invalid OTP. Please try again.');
            }
        } finally {
            setFpLoading(false);
        }
    };

    const handleFpResetPassword = async (e) => {
        e.preventDefault();
        if (fpNewPw.length < 6) { setFpError('Password must be at least 6 characters.'); return; }
        if (fpNewPw !== fpConfirmPw) { setFpError('Passwords do not match.'); return; }
        setFpLoading(true);
        setFpError('');
        try {
            await resetPassword(fpEmail.trim(), fpOtp.trim(), fpNewPw);
            setFpSuccess('🎉 Password reset successfully! You can now log in with your new password.');
            // After 2s, go back to login
            setTimeout(() => {
                setStage('credentials');
                setFpEmail(''); setFpOtp(''); setFpNewPw(''); setFpConfirmPw('');
                setFpSuccess(''); setFpError('');
                showNotification('Password reset! Please sign in.', 'success');
            }, 2500);
        } catch (err) {
            const data = err.response?.data;
            setFpError(data?.message || 'Failed to reset password. Please try again.');
            // If OTP expired/wrong go back to OTP stage
            if (data?.code === 'EXPIRED' || data?.code === 'NOT_FOUND') setStage('forgot_otp');
        } finally {
            setFpLoading(false);
        }
    };

    const resetForgotFlow = () => {
        setStage('credentials');
        setFpEmail(''); setFpOtp(''); setFpNewPw(''); setFpConfirmPw('');
        setFpError(''); setFpSuccess('');
        if (fpCooldownRef.current) clearInterval(fpCooldownRef.current);
        setFpCooldown(0);
    };

    // ── OTP screen (login verification) ──────────────────────────────────────
    if (stage === 'otp' && pendingSession) {
        return (
            <OtpVerificationScreen
                email={pendingSession.user.email}
                purpose="login"
                onVerified={handleOtpVerified}
                onBack={() => {
                    setStage('credentials');
                    setPendingSession(null);
                    otpDevCodeRef.current = null;
                }}
                devCodeEmail={otpDevCodeRef.current}
            />
        );
    }

    // ── Forgot Password Sub-Stages ─────────────────────────────────────────────
    if (stage === 'forgot_email' || stage === 'forgot_otp' || stage === 'forgot_newpw') {
        const stepNum = stage === 'forgot_email' ? 1 : stage === 'forgot_otp' ? 2 : 3;
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-header">
                            <div className="auth-logo" style={{ cursor: 'pointer' }} onClick={() => showPage('home')}>
                                <span className="auth-logo-icon">🌿</span>
                                <span className="auth-logo-text">Ayursutra</span>
                            </div>
                            <h2>Reset Your Password</h2>
                            <p>Step {stepNum} of 3 — {stepNum === 1 ? 'Enter your email' : stepNum === 2 ? 'Enter OTP' : 'Set new password'}</p>
                        </div>

                        {/* Step indicator */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', justifyContent: 'center' }}>
                            {[1, 2, 3].map(s => (
                                <div key={s} style={{
                                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem',
                                    background: s <= stepNum ? '#2a7d2e' : '#e5e7eb',
                                    color: s <= stepNum ? '#fff' : '#9ca3af',
                                    transition: 'all 0.3s',
                                }}>
                                    {s < stepNum ? '✓' : s}
                                </div>
                            ))}
                        </div>

                        {fpError && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.88rem' }}>
                                ⚠️ {fpError}
                            </div>
                        )}
                        {fpSuccess && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#16a34a', fontSize: '0.88rem' }}>
                                {fpSuccess}
                            </div>
                        )}

                        {/* Step 1: Email */}
                        {stage === 'forgot_email' && (
                            <form onSubmit={handleFpSendOtp}>
                                <div className="form-group">
                                    <label>Registered Email Address</label>
                                    <input
                                        type="email" required autoFocus
                                        placeholder="Enter your account email"
                                        value={fpEmail}
                                        onChange={e => { setFpEmail(e.target.value); setFpError(''); }}
                                    />
                                </div>
                                <button type="submit" className="auth-btn" disabled={fpLoading || fpCooldown > 0}>
                                    {fpLoading ? '⏳ Sending...' : fpCooldown > 0 ? `Resend in ${fpCooldown}s` : '📧 Send Reset OTP'}
                                </button>
                            </form>
                        )}

                        {/* Step 2: OTP */}
                        {stage === 'forgot_otp' && (
                            <form onSubmit={handleFpVerifyOtp}>
                                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#15803d' }}>
                                    📬 A 6-digit OTP was sent to <strong>{fpEmail}</strong>. It expires in 10 minutes.
                                </div>
                                <div className="form-group">
                                    <label>Enter OTP</label>
                                    <input
                                        type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                                        required autoFocus placeholder="6-digit code"
                                        value={fpOtp}
                                        onChange={e => { setFpOtp(e.target.value.replace(/\D/g, '')); setFpError(''); }}
                                        style={{ letterSpacing: '0.4em', fontSize: '1.4rem', textAlign: 'center', fontFamily: 'monospace' }}
                                    />
                                </div>
                                <button type="submit" className="auth-btn" disabled={fpLoading}>
                                    {fpLoading ? '⏳ Verifying...' : 'Verify OTP →'}
                                </button>
                                <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                                    <button type="button" className="text-link" onClick={handleFpSendOtp} disabled={fpCooldown > 0 || fpLoading}>
                                        {fpCooldown > 0 ? `Resend OTP in ${fpCooldown}s` : '🔄 Resend OTP'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 3: New Password */}
                        {stage === 'forgot_newpw' && (
                            <form onSubmit={handleFpResetPassword}>
                                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#15803d' }}>
                                    ✅ OTP verified. Set your new password below.
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPw ? 'text' : 'password'} required autoFocus
                                            placeholder="At least 6 characters"
                                            value={fpNewPw}
                                            onChange={e => { setFpNewPw(e.target.value); setFpError(''); }}
                                            style={{ paddingRight: '2.5rem' }}
                                        />
                                        <button type="button" onClick={() => setShowPw(p => !p)}
                                            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6b7280' }}>
                                            {showPw ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input
                                        type={showPw ? 'text' : 'password'} required
                                        placeholder="Re-enter password"
                                        value={fpConfirmPw}
                                        onChange={e => { setFpConfirmPw(e.target.value); setFpError(''); }}
                                    />
                                    {fpConfirmPw && fpNewPw !== fpConfirmPw && (
                                        <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px' }}>⚠️ Passwords don't match</p>
                                    )}
                                </div>

                                {/* Strength meter */}
                                {fpNewPw && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ height: 4, borderRadius: 2, background: '#e5e7eb', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: 2, transition: 'width 0.3s, background 0.3s',
                                                width: fpNewPw.length < 6 ? '20%' : fpNewPw.length < 10 ? '55%' : '100%',
                                                background: fpNewPw.length < 6 ? '#ef4444' : fpNewPw.length < 10 ? '#f59e0b' : '#22c55e',
                                            }} />
                                        </div>
                                        <p style={{ fontSize: '0.73rem', color: '#6b7280', marginTop: '3px' }}>
                                            {fpNewPw.length < 6 ? 'Weak — too short' : fpNewPw.length < 10 ? 'Fair' : 'Strong ✓'}
                                        </p>
                                    </div>
                                )}

                                <button type="submit" className="auth-btn" disabled={fpLoading || fpNewPw !== fpConfirmPw || fpNewPw.length < 6}>
                                    {fpLoading ? '⏳ Resetting...' : '🔐 Reset Password'}
                                </button>
                            </form>
                        )}

                        <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
                            <p><button className="text-link" onClick={resetForgotFlow}>← Back to Login</button></p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Credentials form ──────────────────────────────────────────────────────
    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo" onClick={() => showPage('home')} style={{ cursor: 'pointer' }}>
                            <span className="auth-logo-icon">🌿</span>
                            <span className="auth-logo-text">Ayursutra</span>
                        </div>
                        <h2>Sign In to Your Account</h2>
                        <p>Access your personalized Ayurvedic care dashboard</p>
                    </div>

                    {/* Role Tabs */}
                    <div className="role-tabs">
                        {['patient', 'doctor'].map(r => (
                            <button
                                key={r}
                                className={`role-tab ${role === r ? 'active' : ''}`}
                                onClick={() => setRole(r)}
                            >
                                {r === 'patient' ? '🏥 Patient' : '👨‍⚕️ Doctor'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder={`Enter your ${role} email`}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Password</span>
                                <button
                                    type="button"
                                    className="text-link"
                                    style={{ fontSize: '0.8rem', fontWeight: 500 }}
                                    onClick={() => { setFpEmail(email); setStage('forgot_email'); setFpError(''); setFpSuccess(''); }}
                                >
                                    Forgot password?
                                </button>
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? '⏳ Verifying...' : `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                        </button>
                    </form>

                    {/* OTP info banner */}
                    <div style={{
                        background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px',
                        padding: '10px 14px', marginTop: '1rem', fontSize: '0.82rem', color: '#15803d',
                        display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                        🔐 A one-time code will be sent to your email for secure verification.
                    </div>

                    {/* Demo Credentials */}
                    <div className="demo-credentials">
                        <p><strong>Quick Demo Login:</strong></p>
                        <div className="demo-buttons">
                            <button
                                onClick={() => quickDemoLogin('patient')}
                                className="demo-btn"
                                disabled={loading}
                                style={{ opacity: loading ? 0.6 : 1 }}
                            >
                                🏥 Patient Demo
                            </button>
                            <button
                                onClick={() => quickDemoLogin('doctor')}
                                className="demo-btn"
                                disabled={loading}
                                style={{ opacity: loading ? 0.6 : 1 }}
                            >
                                👨‍⚕️ Doctor Demo
                            </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
                            ⚡ One click — no OTP required for demo accounts.
                        </p>
                    </div>


                    <div className="auth-footer">
                        <p>Don't have an account? <button className="text-link" onClick={() => showPage('signup')}>Sign Up</button></p>
                        <p><button className="text-link" onClick={() => showPage('home')}>← Back to Home</button></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
