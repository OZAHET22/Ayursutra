import { useState, useEffect, useRef, useCallback } from 'react';
import { sendOTP, verifyOTP } from '../services/otpService';

const RESEND_COOLDOWN = 30; // seconds

function OtpInput({ label, target, type, disabled, onVerified, purpose }) {
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [localError, setLocalError] = useState('');
    const [success, setSuccess] = useState(false);
    const [attemptsLeft, setAttemptsLeft] = useState(5);
    const attemptsLeftRef = useRef(5); // ref to avoid stale closure in doVerify
    const [localLoading, setLocalLoading] = useState(false);
    const inputRefs = useRef([]);

    const handleDigitChange = (idx, value) => {
        const cleaned = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[idx] = cleaned;
        setDigits(next);
        setLocalError('');
        if (cleaned && idx < 5) inputRefs.current[idx + 1]?.focus();
    };

    const handleKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setDigits(pasted.split(''));
            inputRefs.current[5]?.focus();
        }
    };

    const doVerify = useCallback(async () => {
        const code = digits.join('');
        if (code.length < 6) return;
        setLocalLoading(true);
        setLocalError('');
        try {
            const data = await verifyOTP(target, type, code, purpose);
            if (data.verified) {
                setSuccess(true);
                onVerified();
            }
        } catch (err) {
            const msg = err.response?.data;
            if (msg?.code === 'EXPIRED') {
                setLocalError('OTP expired. Please click Resend.');
                setDigits(['', '', '', '', '', '']);
            } else if (msg?.code === 'MAX_ATTEMPTS' || msg?.code === 'LOCKED') {
                setLocalError(msg?.message || 'Locked out due to too many attempts.');
                setDigits(['', '', '', '', '', '']);
            } else if (msg?.code === 'INVALID') {
                // Use server-reported remaining or decrement local ref — avoids stale closure
                const left = typeof msg.attemptsRemaining === 'number'
                    ? msg.attemptsRemaining
                    : Math.max(0, attemptsLeftRef.current - 1);
                attemptsLeftRef.current = left;
                setAttemptsLeft(left);
                setLocalError(`Incorrect code. ${left} attempt(s) left.`);
                setDigits(['', '', '', '', '', '']);
                setTimeout(() => inputRefs.current[0]?.focus(), 50);
            } else if (msg?.code === 'NOT_FOUND') {
                setLocalError('OTP not found. Please request a new one.');
                setDigits(['', '', '', '', '', '']);
            } else if (msg?.code === 'ALREADY_USED') {
                setLocalError('This OTP was already used. Please request a new one.');
                setDigits(['', '', '', '', '', '']);
            } else {
                setLocalError(msg?.message || 'Verification failed. Please try again.');
            }
        } finally {
            setLocalLoading(false);
        }
    }, [digits, target, type, purpose, onVerified]);

    // Auto-trigger verify when all 6 digits filled
    useEffect(() => {
        if (digits.join('').length === 6 && !success && !localLoading && !disabled) {
            doVerify();
        }
    }, [digits, success, localLoading, doVerify, disabled]);

    return (
        <div style={{ marginBottom: '1.5rem', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                <strong style={{ color: '#15803d' }}>{label} OTP</strong>
                {success ? (
                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ Verified</span>
                ) : (
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>{target}</span>
                )}
            </div>

            <div
                style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginBottom: '0.5rem' }}
                onPaste={handlePaste}
            >
                {digits.map((d, i) => (
                    <input
                        key={i}
                        ref={el => (inputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={e => handleDigitChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        disabled={localLoading || success || disabled}
                        style={{
                            width: '40px', height: '48px', textAlign: 'center',
                            fontSize: '1.4rem', fontWeight: 700,
                            border: `2px solid ${localError ? '#f87171' : (success || d) ? '#22c55e' : '#d1fae5'}`,
                            borderRadius: '8px', outline: 'none',
                            background: success ? '#f0fdf4' : d ? '#f0fdf4' : '#fafafa',
                            color: '#15803d', transition: 'all 0.2s',
                        }}
                    />
                ))}
            </div>

            {localLoading && (
                <div style={{ fontSize: '0.82rem', color: '#15803d', marginBottom: '0.5rem' }}>
                    ⏳ Verifying...
                </div>
            )}
            {localError && !localLoading && (
                <div style={{ fontSize: '0.85rem', color: '#b91c1c', marginBottom: '0.5rem' }}>
                    ❌ {localError}
                </div>
            )}

            {/* Manual verify button as fallback */}
            {!success && !localLoading && digits.join('').length === 6 && (
                <button
                    type="button"
                    onClick={doVerify}
                    disabled={disabled}
                    style={{
                        width: '100%', padding: '10px', marginTop: '6px',
                        background: '#15803d', color: '#fff', border: 'none',
                        borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
                        fontSize: '0.95rem', letterSpacing: '0.02em',
                    }}
                >
                    Verify OTP →
                </button>
            )}
        </div>
    );
}

export default function OtpVerificationScreen({ email, purpose, onVerified, onBack, devCodeEmail }) {
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
    const [resending, setResending] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [emailVerified, setEmailVerified] = useState(false);
    const successTimerRef = useRef(null); // cleanup on unmount

    const triggerSuccess = useCallback(() => {
        setLoading(true);
        successTimerRef.current = setTimeout(() => onVerified(), 800);
    }, [onVerified]);

    // Cleanup timer on unmount to avoid setState on unmounted component
    useEffect(() => {
        return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current); };
    }, []);

    useEffect(() => {
        if (emailVerified) triggerSuccess();
    }, [emailVerified, triggerSuccess]);

    // Countdown timer for resend cooldown
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    const handleResend = async () => {
        if (resendCooldown > 0 || resending) return;
        setResending(true);
        setGlobalError('');
        try {
            await sendOTP(email, 'email', purpose);
            setResendCooldown(RESEND_COOLDOWN);
        } catch (err) {
            const data = err.response?.data;
            if (data?.code === 'RESEND_COOLDOWN') {
                setResendCooldown(data.waitSeconds || RESEND_COOLDOWN);
                setGlobalError(`Please wait ${data.waitSeconds || 30}s before resending.`);
            } else {
                setGlobalError(data?.message || 'Failed to resend OTP. Please try again.');
            }
        } finally {
            setResending(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
                padding: '1rem',
            }}
        >
            <div
                style={{
                    background: '#fff', borderRadius: '24px', padding: '2.5rem 2rem',
                    width: '100%', maxWidth: '440px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div
                        style={{
                            width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 1rem',
                            background: emailVerified
                                ? 'linear-gradient(135deg,#4ade80,#22c55e)'
                                : 'linear-gradient(135deg,#bbf7d0,#86efac)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.8rem', transition: 'background 0.4s',
                        }}
                    >
                        {emailVerified ? '✅' : '🛡️'}
                    </div>
                    <h2 style={{ color: '#15803d', fontWeight: 800, fontSize: '1.4rem', margin: 0 }}>
                        Email Verification
                    </h2>
                    <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        We sent a 6-digit code to{' '}
                        <strong style={{ color: '#15803d' }}>{email}</strong>.{' '}
                        Enter it below to continue.
                    </p>
                </div>

                {globalError && (
                    <div
                        style={{
                            background: '#fef2f2', border: '1px solid #fca5a5',
                            borderRadius: '8px', padding: '10px', color: '#b91c1c',
                            fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center',
                        }}
                    >
                        ❌ {globalError}
                    </div>
                )}

                {/* Dev-mode hint: show OTP code only when devCodeEmail prop is provided */}
                {devCodeEmail && (
                    <div
                        style={{
                            background: '#fffbeb', border: '1px solid #fcd34d',
                            borderRadius: '8px', padding: '8px 12px',
                            fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center',
                            color: '#92400e',
                        }}
                    >
                        🛠️ <strong>Dev:</strong> OTP code is <strong style={{ letterSpacing: '0.15em', fontFamily: 'monospace' }}>{devCodeEmail}</strong>
                    </div>
                )}

                <OtpInput
                    label="Email"
                    target={email}
                    type="email"
                    purpose={purpose}
                    onVerified={() => setEmailVerified(true)}
                    disabled={emailVerified || loading}
                />

                {loading && (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#16a34a', fontWeight: 'bold' }}>
                        ⏳ {purpose === 'login' ? 'Logging you in...' : 'Finalizing registration...'}
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
                    {resendCooldown > 0 ? (
                        <span style={{ color: '#888' }}>
                            Resend code in{' '}
                            <strong style={{ color: '#15803d' }}>{resendCooldown}s</strong>
                        </span>
                    ) : (
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            style={{
                                background: 'none', border: 'none', color: '#16a34a',
                                fontWeight: 700, cursor: 'pointer', textDecoration: 'underline',
                            }}
                        >
                            {resending ? 'Sending...' : '🔄 Resend Code'}
                        </button>
                    )}
                </div>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'none', border: 'none', color: '#888',
                            cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline',
                        }}
                    >
                        {purpose === 'login' ? '← Back to login' : '← Change contact details'}
                    </button>
                </div>
            </div>
        </div>
    );
}
