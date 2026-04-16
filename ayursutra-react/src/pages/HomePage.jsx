import { useEffect, useState } from 'react';
import API from '../services/api';

// ─── Help Center FAQ Modal ─────────────────────────────────────────────────
function HelpModal({ onClose }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: 580, width: '92%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h2 style={{ color: '#2a7d2e', margin: 0 }}>❓ Help Center</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#777' }}>×</button>
                </div>
                {[
                    { q: 'How do I book an appointment?', a: 'Go to your patient dashboard → Appointments tab → Click "Book New Appointment" and select your doctor, date, and therapy type.' },
                    { q: 'How do I view my therapy progress?', a: 'In your Patient Dashboard, click the "Progress" tab to see therapy completion %, milestones, and practitioner notes in real time.' },
                    { q: 'How do I receive notifications?', a: 'Doctors can send you In-App, Email, WhatsApp, or SMS notifications. Configure your preferences in the Notification Preferences tab.' },
                    { q: 'How does the invoice system work?', a: 'Doctors create invoices for each consultation or therapy session. You will receive a copy in your email and can download the PDF.' },
                    { q: 'Can I upload my medical documents?', a: 'Yes — go to the Documents tab in your patient dashboard. Upload PDFs or images, and your doctor will be able to review them.' },
                    { q: 'I forgot my password. What do I do?', a: 'On the login page, click "Forgot Password" to receive a reset link via your registered email.' },
                ].map(({ q, a }) => (
                    <div key={q} style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ fontWeight: 700, color: '#2a7d2e', marginBottom: '0.4rem' }}>Q: {q}</div>
                        <div style={{ color: '#555', fontSize: '0.9rem' }}>A: {a}</div>
                    </div>
                ))}
                <button onClick={onClose} style={{ width: '100%', padding: '0.75rem', background: '#2a7d2e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
        </div>
    );
}

// ─── Contact Us Modal ──────────────────────────────────────────────────────
function ContactModal({ onClose }) {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [sent, setSent] = useState(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        // In real deployment, POST to /api/contact or use mailto
        window.location.href = `mailto:support@ayursutra.in?subject=Contact from ${form.name}&body=${form.message}`;
        setSent(true);
    };
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: 480, width: '92%' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h2 style={{ color: '#2a7d2e', margin: 0 }}>📬 Contact Us</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#777' }}>×</button>
                </div>
                {sent ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ fontSize: '3rem' }}>✅</div>
                        <p style={{ marginTop: '1rem', fontWeight: 600, color: '#2a7d2e' }}>Message sent! We'll respond within 24 hours.</p>
                        <button onClick={onClose} style={{ marginTop: '1rem', padding: '0.75rem 2rem', background: '#2a7d2e', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {[['Name', 'name', 'text', 'Your full name'], ['Email', 'email', 'email', 'your@email.com']].map(([label, key, type, ph]) => (
                            <div key={key} style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>{label}</label>
                                <input required type={type} placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }} />
                            </div>
                        ))}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>Message</label>
                            <textarea required rows={4} placeholder="How can we help you?" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                style={{ width: '100%', padding: '0.65rem', border: '1px solid #ddd', borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box' }} />
                        </div>
                        <button type="submit" style={{ width: '100%', padding: '0.75rem', background: '#2a7d2e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                            📤 Send Message
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

// ─── Documentation Modal ───────────────────────────────────────────────────
function DocsModal({ onClose }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: 600, width: '92%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h2 style={{ color: '#2a7d2e', margin: 0 }}>📖 Documentation</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#777' }}>×</button>
                </div>
                {[
                    { title: '🏥 For Doctors', items: ['Access your dashboard after login', 'Manage appointments in the Appointments tab', 'Track patient therapy with live status updates', 'Send notifications via In-App, Email, WhatsApp, or SMS', 'Create professional invoices with PDF download', 'Prescribe personalized diet plans for each patient', 'View real-time analytics of your practice'] },
                    { title: '👤 For Patients', items: ['Register and log in to your patient account', 'Book appointments with your assigned doctor', 'Track your therapy progress with visual milestones', 'Upload medical documents for doctor review', 'Configure notification preferences (Email, SMS, WhatsApp)', 'View your invoices and payment history', 'Provide feedback on therapies'] },
                    { title: '🔧 System Requirements', items: ['Modern browser (Chrome, Firefox, Safari, Edge)', 'Internet connection for real-time features', 'Email address for notifications', 'Phone number for SMS/WhatsApp alerts'] },
                ].map(({ title, items }) => (
                    <div key={title} style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9f9f9', borderRadius: '10px' }}>
                        <h3 style={{ margin: '0 0 0.75rem', color: '#2a7d2e' }}>{title}</h3>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                            {items.map(item => <li key={item} style={{ color: '#555', fontSize: '0.9rem', marginBottom: '0.3rem' }}>{item}</li>)}
                        </ul>
                    </div>
                ))}
                <button onClick={onClose} style={{ width: '100%', padding: '0.75rem', background: '#2a7d2e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
        </div>
    );
}

// ─── Main HomePage ─────────────────────────────────────────────────────────
function HomePage({ showPage }) {
    const [stats, setStats] = useState({ totalPatients: null, totalDoctors: null, totalAppointments: null, totalTherapies: null });
    const [statsLoading, setStatsLoading] = useState(true);
    const [modal, setModal] = useState(null); // 'help' | 'contact' | 'docs'

    useEffect(() => {
        // Smooth scroll for anchor links
        const handleAnchorClick = (e) => {
            const href = e.currentTarget.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            }
        };
        const anchors = document.querySelectorAll('a[href^="#"]');
        anchors.forEach(a => a.addEventListener('click', handleAnchorClick));
        return () => anchors.forEach(a => a.removeEventListener('click', handleAnchorClick));
    }, []);

    useEffect(() => {
        API.get('/stats/public')
            .then(res => setStats(res.data.data || {}))
            .catch(() => {}) // silently fail — show '—' placeholders
            .finally(() => setStatsLoading(false));
    }, []);

    const fmt = (n) => {
        if (statsLoading) return '…';
        if (n === null || n === undefined) return '—';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'k+';
        return n.toString() + (n > 0 ? '+' : '');
    };

    return (
        <>
            {modal === 'help' && <HelpModal onClose={() => setModal(null)} />}
            {modal === 'contact' && <ContactModal onClose={() => setModal(null)} />}
            {modal === 'docs' && <DocsModal onClose={() => setModal(null)} />}

            {/* Hero */}
            <section className="hero">
                <div className="hero-container">
                    <div className="hero-content">
                        <div className="badge">🌱 Traditional Healing, Modern Management</div>
                        <h1 className="hero-title">Streamline Your Panchakarma Therapy Management</h1>
                        <p className="hero-description">
                            Comprehensive platform for therapy scheduling, patient tracking, and holistic care
                            management with real-time updates and automated notifications.
                        </p>
                        <div className="hero-stats">
                            <div className="stat">
                                <strong>{fmt(stats.totalPatients)}</strong>
                                <span>Patients Registered</span>
                            </div>
                            <div className="stat">
                                <strong>{fmt(stats.totalDoctors)}</strong>
                                <span>Active Doctors</span>
                            </div>
                            <div className="stat">
                                <strong>{fmt(stats.totalAppointments)}</strong>
                                <span>Appointments Managed</span>
                            </div>
                        </div>
                        <div className="hero-buttons">
                            <button className="btn btn-primary" onClick={() => showPage('signup')}>
                                Get Started Free
                            </button>
                            <a href="#features" className="btn btn-secondary">Learn More</a>
                        </div>
                    </div>
                    <div className="hero-visual"></div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="features">
                <div className="container">
                    <h2 className="section-title">Powerful Features for Modern Ayurvedic Practice</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📅</div>
                            <h3>Automated Scheduling</h3>
                            <p>Smart appointment booking with conflict detection and automated reminders</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🔔</div>
                            <h3>Smart Notifications</h3>
                            <p>Pre &amp; post therapy alerts via SMS, email, WhatsApp, and in-app notifications</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3>Progress Tracking</h3>
                            <p>Visual therapy progress with recovery milestones and live analytics</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">💾</div>
                            <h3>Digital Records</h3>
                            <p>Secure patient documentation and therapy history storage</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Therapies */}
            <section id="therapy" className="therapy">
                <div className="container">
                    <h2 className="section-title">Comprehensive Panchakarma Therapies</h2>
                    <div className="therapy-grid">
                        {[
                            { name: 'Vamana', desc: 'Therapeutic emesis for Kapha imbalance', items: ['Respiratory conditions', 'Metabolic disorders', 'Detoxification'] },
                            { name: 'Virechana', desc: 'Purgation therapy for Pitta disorders', items: ['Skin diseases', 'Digestive issues', 'Liver conditions'] },
                            { name: 'Basti', desc: 'Medicated enema for Vata imbalance', items: ['Neurological disorders', 'Arthritis', 'Constipation'] },
                            { name: 'Nasya', desc: 'Nasal administration for head & neck disorders', items: ['Sinusitis & allergies', 'Migraine & headaches', 'Hair and eye problems'] },
                            { name: 'Raktamokshana', desc: 'Blood purification therapy for blood disorders', items: ['Skin diseases', 'Inflammatory conditions', 'Toxin elimination'] },
                        ].map(({ name, desc, items }) => (
                            <div key={name} className="therapy-card">
                                <h3>{name}</h3>
                                <p>{desc}</p>
                                <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta">
                <div className="container">
                    <h2>Ready to Transform Your Practice?</h2>
                    <p>Join Ayurvedic practitioners managing their therapies efficiently with Ayursutra</p>
                    <div className="cta-buttons">
                        <button className="btn btn-large" onClick={() => showPage('signup')}>Start Your Journey</button>
                        <button className="btn btn-secondary" onClick={() => showPage('login')}>Existing User</button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-section">
                            <div className="logo">
                                <div className="logo-icon">🌿</div>
                                <span className="logo-text">Ayursutra</span>
                            </div>
                            <p>Modern management for traditional healing</p>
                        </div>
                        <div className="footer-section">
                            <h4>Platform</h4>
                            <a onClick={() => showPage('admin-login')} style={{ cursor: 'pointer' }}>Admin Login</a>
                            <a onClick={() => showPage('signup')} style={{ cursor: 'pointer' }}>Sign Up</a>
                        </div>
                        <div className="footer-section">
                            <h4>Support</h4>
                            <a onClick={() => setModal('help')} style={{ cursor: 'pointer' }}>Help Center</a>
                            <a onClick={() => setModal('contact')} style={{ cursor: 'pointer' }}>Contact Us</a>
                            <a onClick={() => setModal('docs')} style={{ cursor: 'pointer' }}>Documentation</a>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}

export default HomePage;
