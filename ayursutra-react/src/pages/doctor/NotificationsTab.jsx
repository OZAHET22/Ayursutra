import { useState, useEffect, useCallback } from 'react';
import { getNotifications, sendManualNotification } from '../../services/notificationService';
import { getMyPatients } from '../../services/userService';

const THERAPY_TYPES = ['Panchakarma', 'Abhyanga', 'Shirodhara', 'Basti', 'Nasya', 'Virechana', 'Vamana', 'Consultation'];
const NOTIF_TYPES = [
    { value: 'pre_24h', label: '24h Before Reminder', icon: '⏰' },
    { value: 'pre_1h', label: '1h Before Reminder', icon: '⚡' },
    { value: 'post_session', label: 'Post-Session Care', icon: '🌿' },
    { value: 'medication', label: 'Medication Reminder', icon: '💊' },
    { value: 'followup', label: 'Follow-Up Prompt', icon: '📋' },
    { value: 'general', label: 'General Message', icon: '🔔' },
];
const CHANNELS = ['in_app', 'email', 'whatsapp', 'sms'];
const CHANNEL_LABEL = { in_app: '📱 In-App', email: '📧 Email', whatsapp: '💬 WhatsApp', sms: '📲 SMS' };

const PRE_TEMPLATES = {
    Panchakarma: 'Please avoid heavy meals 2 hours before your Panchakarma session. Wear comfortable, loose-fitting clothing. Stay hydrated.',
    Abhyanga: 'Avoid eating for 1 hour before your Abhyanga session. A warm shower beforehand is recommended.',
    Shirodhara: 'Do not eat a heavy meal before your Shirodhara session. Avoid caffeine today.',
    Basti: 'Follow prescribed dietary guidelines today. Stay well hydrated.',
    Nasya: 'Avoid cold exposure. Clear nasal passages gently before arriving.',
    Virechana: 'Only liquid diet today. Plan to stay at home — this is a cleansing therapy.',
    Vamana: 'Pre-treatment oleation required. Follow prescribed dietary preparation.',
    Consultation: 'Prepare a list of current symptoms and medications. Bring previous reports.',
};
const POST_TEMPLATES = {
    Panchakarma: 'Rest for at least 1 hour. Avoid cold water and raw foods for 24 hours. Follow the prescribed diet chart.',
    Abhyanga: 'Do not shower for 2 hours to allow oil absorption. Rest and avoid direct sunlight.',
    Shirodhara: 'Rest in a quiet, warm room. Avoid screen time for 2 hours. Protect head from cold wind.',
    Basti: 'Light diet for 24 hours. Avoid cold and gas-forming foods.',
    Nasya: 'Keep head covered for 1 hour. Avoid speaking loudly and cold foods.',
    Virechana: 'Rest completely. Gruel (peya) recommended. Report any excessive discomfort.',
    Vamana: 'Complete rest. Gradual diet re-introduction as per samsarjana krama schedule.',
    Consultation: 'Follow the prescribed diet and lifestyle recommendations diligently.',
};

export default function DoctorNotificationsTab({ user, showNotification }) {
    const [notifications, setNotifications] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [sendResult, setSendResult] = useState(null); // per-channel delivery result
    const [templateTherapy, setTemplateTherapy] = useState('Panchakarma');
    const [activeTemplate, setActiveTemplate] = useState('pre');
    const [sendForm, setSendForm] = useState({
        patientId: '', type: 'general', title: '', message: '',
        therapyType: 'Consultation', channels: ['in_app'],
    });

    const loadData = useCallback(async () => {
        try {
            const [n, p] = await Promise.all([getNotifications(), getMyPatients()]);
            setNotifications(n.data || []);
            setPatients(p || []);
        } catch { }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleTemplateApply = () => {
        const msg = activeTemplate === 'pre' ? PRE_TEMPLATES[templateTherapy] : POST_TEMPLATES[templateTherapy];
        const title = activeTemplate === 'pre' ? `Pre-Procedure: ${templateTherapy}` : `Post-Procedure Care: ${templateTherapy}`;
        setSendForm(f => ({ ...f, message: msg, title, therapyType: templateTherapy, type: activeTemplate === 'pre' ? 'pre_24h' : 'post_session' }));
    };

    const toggleChannel = (ch) => {
        setSendForm(f => ({
            ...f,
            channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch]
        }));
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!sendForm.patientId || !sendForm.title || !sendForm.message) return;
        setSubmitting(true);
        setSendResult(null);
        try {
            const res = await sendManualNotification({
                patientId: sendForm.patientId,
                type: sendForm.type,
                title: sendForm.title,
                message: sendForm.message,
                therapyType: sendForm.therapyType,
                channels: sendForm.channels,
            });
            // res is the full API response object: { data: { results, message, success } }
            const results = res?.data?.results || res?.results || [];
            const successCount = results.filter(r => r.success).length;
            const totalCount = results.length;
            setSendResult(results);
            if (successCount === totalCount && totalCount > 0) {
                showNotification(`✅ All ${totalCount} channel(s) sent successfully!`, 'success');
            } else if (successCount > 0) {
                showNotification(`⚠️ ${successCount}/${totalCount} channels sent. Some failed — see details below.`, 'warning');
            } else {
                showNotification(`❌ All channels failed to deliver. Check configuration.`, 'error');
            }
            setSendForm({ patientId: '', type: 'general', title: '', message: '', therapyType: 'Consultation', channels: ['in_app'] });
            loadData();
        } catch (err) {
            showNotification('Failed to send notification. Network error.', 'error');
        } finally { setSubmitting(false); }
    };

    const typeIcon = { pre_24h: '⏰', pre_1h: '⚡', post_session: '🌿', medication: '💊', followup: '📋', general: '🔔' };

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}><div style={{ fontSize: '2rem' }}>🔔</div><p>Loading...</p></div>
        </div>
    );

    return (
        <div className="tab-content active">
            <div className="tab-header"><h2>🔔 Notification Management</h2></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Template Builder */}
                <div className="card">
                    <h3 style={{ color: '#2a7d2e', marginBottom: '1rem' }}>📋 Notification Templates</h3>
                    <div className="dash-form-group">
                        <label>Therapy Type</label>
                        <select value={templateTherapy} onChange={e => setTemplateTherapy(e.target.value)}>
                            {THERAPY_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        {['pre', 'post'].map(tp => (
                            <button key={tp} onClick={() => setActiveTemplate(tp)} className={`filter-btn ${activeTemplate === tp ? 'active' : ''}`}>
                                {tp === 'pre' ? '⏮ Pre-Procedure' : '⏭ Post-Procedure'}
                            </button>
                        ))}
                    </div>
                    <div style={{ background: '#f9fbe7', borderRadius: '10px', padding: '1rem', fontSize: '0.85rem', color: '#555', lineHeight: 1.6, minHeight: '80px', border: '1px solid #e8f5e9' }}>
                        {activeTemplate === 'pre' ? PRE_TEMPLATES[templateTherapy] : POST_TEMPLATES[templateTherapy]}
                    </div>
                    <button className="dash-btn dash-btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={handleTemplateApply}>
                        Use This Template →
                    </button>
                </div>

                {/* Send Notification Form */}
                <div className="card">
                    <h3 style={{ color: '#2a7d2e', marginBottom: '1rem' }}>📤 Send Notification</h3>
                    <form onSubmit={handleSend}>
                        <div className="dash-form-group">
                            <label>Patient</label>
                            <select required value={sendForm.patientId} onChange={e => setSendForm(f => ({ ...f, patientId: e.target.value }))}>
                                <option value="">Select Patient</option>
                                {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="dash-form-group">
                                <label>Type</label>
                                <select value={sendForm.type} onChange={e => setSendForm(f => ({ ...f, type: e.target.value }))}>
                                    {NOTIF_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                                </select>
                            </div>
                            <div className="dash-form-group">
                                <label>Channels</label>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '4px' }}>
                                    {CHANNELS.map(ch => (
                                        <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={sendForm.channels.includes(ch)} onChange={() => toggleChannel(ch)} />
                                            {CHANNEL_LABEL[ch]}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="dash-form-group">
                            <label>Title</label>
                            <input required value={sendForm.title} onChange={e => setSendForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title..." />
                        </div>
                        <div className="dash-form-group">
                            <label>Message</label>
                            <textarea required rows={4} value={sendForm.message} onChange={e => setSendForm(f => ({ ...f, message: e.target.value }))} placeholder="Notification body..." />
                        </div>
                        <button type="submit" className="dash-btn dash-btn-primary" style={{ width: '100%' }} disabled={submitting}>
                            {submitting ? '⌛ Sending...' : '🚀 Send Notification'}
                        </button>
                    </form>

                    {/* Per-channel delivery results */}
                    {sendResult && sendResult.length > 0 && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '10px', border: '1px solid #e0e0e0' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>📊 Delivery Report</div>
                            {sendResult.map(r => (
                                <div key={r.channel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.85rem' }}>
                                    <span style={{ fontSize: '1rem' }}>{r.success ? '✅' : '❌'}</span>
                                    <span style={{ fontWeight: 600, minWidth: 80, textTransform: 'capitalize' }}>{CHANNEL_LABEL[r.channel] || r.channel}</span>
                                    {r.success
                                        ? <span style={{ color: '#4caf50' }}>Delivered</span>
                                        : <span style={{ color: '#f44336' }}>Failed: {r.reason || 'Unknown error'}</span>
                                    }
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* History */}
            <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#2a7d2e' }}>📜 Notification History (your patients)</h3>
                {notifications.length === 0 && <p style={{ color: '#777' }}>No notifications sent yet.</p>}
                {notifications.slice(0, 20).map(n => (
                    <div key={n._id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.75rem 1rem', background: '#fafafa', borderRadius: '10px', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.3rem' }}>{typeIcon[n.type] || '🔔'}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.title}</div>
                            <div style={{ color: '#777', fontSize: '0.8rem' }}>{n.message?.substring(0, 100)}...</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#aaa' }}>
                            <div>{n.channel}</div>
                            <div>{new Date(n.createdAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
