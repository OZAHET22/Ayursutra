import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage({ showPage, showNotification }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await login(email, password);
        if (result.success && result.role === 'admin') {
            showNotification('Welcome, Admin! Loading dashboard...', 'success');
        } else if (result.success && result.role !== 'admin') {
            // Non-admin credentials — clear the session that login() just saved
            import('../services/authService').then(({ logout }) => logout());
            showNotification('This portal is for Admin only. Use the main login for patient/doctor access.', 'error');
        } else {
            showNotification(result.message || 'Invalid admin credentials.', 'error');
        }
        setLoading(false);
    };


    const fillDemo = () => {
        setEmail('admin@demo.com');
        setPassword('demo123');
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo" onClick={() => showPage('home')} style={{ cursor: 'pointer' }}>
                            <span className="auth-logo-icon">🌿</span>
                            <span className="auth-logo-text">Ayursutra</span>
                        </div>
                        <h2>Admin Panel Login</h2>
                        <p>Access the administration dashboard</p>
                    </div>

                    {/* Admin badge */}
                    <div style={{
                        display: 'flex', justifyContent: 'center', marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #1a5c1f, #2a7d2e)',
                            color: '#fff',
                            padding: '0.6rem 2rem',
                            borderRadius: '30px',
                            fontWeight: 700,
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 12px rgba(42,125,46,0.3)'
                        }}>
                            🔑 Admin Access
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Admin Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter admin email"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter admin password"
                                required
                            />
                        </div>
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Signing In...' : '🔑 Sign In as Admin'}
                        </button>
                    </form>

                    {/* Demo credentials */}
                    <div className="demo-credentials">
                        <p><strong>Quick Demo Login:</strong></p>
                        <div className="demo-buttons">
                            <button onClick={fillDemo} className="demo-btn">Admin Demo</button>
                        </div>
                    </div>

                    <div className="auth-footer">
                        <p><button className="text-link" onClick={() => showPage('home')}>← Back to Home</button></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
