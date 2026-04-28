import { useState, useEffect } from 'react';
import API from '../../services/api';

export default function DietPlansTab({ user, showNotification }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        setLoading(true);
        API.get('/diets')
            .then(res => {
                setPlans(res.data.data || []);
            })
            .catch(() => showNotification && showNotification('Failed to load diet plans', 'error'))
            .finally(() => setLoading(false));
    }, []);

    const handlePrint = (plan) => {
        const prescribed = (plan.items || []).filter(i => i.prescribed);
        const avoid = (plan.items || []).filter(i => !i.prescribed);
        const win = window.open('', '_blank');
        win.document.write(`
<html><head><title>Diet Plan</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; padding: 30px; color: #333; }
  h1 { color: #2a7d2e; margin-bottom: 4px; }
  .subtitle { color: #888; font-size: 14px; margin-bottom: 20px; }
  h3 { color: #2a7d2e; border-bottom: 2px solid #c8e6c9; padding-bottom: 6px; margin-top: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { background: #e8f5e9; color: #2a7d2e; padding: 8px 12px; text-align: left; font-size: 13px; }
  td { padding: 7px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
  .badge-prescribed { background: #dcfce7; color: #15803d; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
  .badge-avoid { background: #fee2e2; color: #b91c1c; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
  .footer { margin-top: 30px; color: #aaa; font-size: 12px; border-top: 1px solid #eee; padding-top: 12px; }
</style>
</head><body>
  <h1>🌿 Ayursutra — Prescribed Diet Plan</h1>
  <div class="subtitle">Patient: <strong>${user.name}</strong> &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString('en-IN')}</div>
  ${plan.notes ? `<div style="background:#fff3e0;border:1px solid #ffe0b2;border-radius:8px;padding:12px;margin-bottom:16px"><strong>Doctor's Notes:</strong> ${plan.notes}</div>` : ''}
  ${prescribed.length > 0 ? `
  <h3>✅ Recommended Foods (${prescribed.length})</h3>
  <table><thead><tr><th>Food Item</th><th>Category</th></tr></thead><tbody>
  ${prescribed.map(i => `<tr><td>${i.foodName}</td><td>${i.category}</td></tr>`).join('')}
  </tbody></table>` : ''}
  ${avoid.length > 0 ? `
  <h3>❌ Foods to Avoid (${avoid.length})</h3>
  <table><thead><tr><th>Food Item</th><th>Category</th></tr></thead><tbody>
  ${avoid.map(i => `<tr><td>${i.foodName}</td><td>${i.category}</td></tr>`).join('')}
  </tbody></table>` : ''}
  <div class="footer">This diet plan is prescribed by your Ayursutra doctor. Please consult your doctor before making any changes.</div>
</body></html>`);
        win.print();
        win.close();
    };

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}>
                <div style={{ fontSize: '2rem' }}>🌿</div>
                <p>Loading diet plans...</p>
            </div>
        </div>
    );

    return (
        <div className="tab-content active">
            <div className="tab-header">
                <h2>🥗 My Diet Plans</h2>
                <p style={{ color: '#777', fontSize: '0.85rem', margin: '4px 0 0' }}>
                    Diet plans prescribed by your doctor — read-only
                </p>
            </div>

            {plans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#aaa' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🥗</div>
                    <h3 style={{ color: '#888', fontWeight: 500 }}>No Diet Plans Yet</h3>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Your doctor hasn't prescribed a diet plan for you yet.<br />
                        Please consult with your doctor for personalized dietary guidance.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {plans.map((plan, idx) => {
                        const prescribed = (plan.items || []).filter(i => i.prescribed);
                        const avoided = (plan.items || []).filter(i => !i.prescribed);
                        const isExpanded = expandedId === plan._id;
                        const categories = [...new Set((plan.items || []).map(i => i.category).filter(Boolean))];

                        return (
                            <div key={plan._id} className="card" style={{ overflow: 'hidden' }}>
                                {/* Plan Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                                            <span style={{ fontSize: '1.5rem' }}>🌿</span>
                                            <h3 style={{ margin: 0, color: '#2a7d2e', fontSize: '1.05rem' }}>
                                                Diet Plan #{plans.length - idx}
                                            </h3>
                                            {idx === 0 && (
                                                <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', border: '1px solid #86efac' }}>
                                                    ✓ CURRENT
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.83rem', color: '#777', display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
                                            <span>📅 Created: {new Date(plan.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span>✅ {prescribed.length} foods recommended</span>
                                            <span>❌ {avoided.length} foods to avoid</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="dash-btn dash-btn-secondary dash-btn-sm"
                                            onClick={() => handlePrint(plan)}
                                            title="Print/Download diet plan"
                                        >
                                            🖨 Print
                                        </button>
                                        <button
                                            className="dash-btn dash-btn-secondary dash-btn-sm"
                                            onClick={() => setExpandedId(isExpanded ? null : plan._id)}
                                        >
                                            {isExpanded ? '▲ Hide' : '▼ View Details'}
                                        </button>
                                    </div>
                                </div>

                                {/* Summary pills */}
                                {categories.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                                        {categories.map(cat => (
                                            <span key={cat} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '0.75rem', padding: '2px 10px', borderRadius: '20px' }}>
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Doctor Notes */}
                                {plan.notes && (
                                    <div style={{ marginTop: '0.75rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', color: '#9a3412' }}>
                                        <strong>📝 Doctor's Notes:</strong> {plan.notes}
                                    </div>
                                )}

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div style={{ marginTop: '1rem', borderTop: '1px solid #f0f0f0', paddingTop: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            {/* Recommended */}
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.9rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    ✅ Recommended Foods ({prescribed.length})
                                                </div>
                                                {prescribed.length === 0 ? (
                                                    <p style={{ color: '#aaa', fontSize: '0.82rem' }}>None specified</p>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '300px', overflowY: 'auto' }}>
                                                        {[...new Set(prescribed.map(i => i.category))].map(cat => (
                                                            <div key={cat}>
                                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '6px 0 3px' }}>{cat}</div>
                                                                {prescribed.filter(i => i.category === cat).map(item => (
                                                                    <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '4px 8px', background: '#f0fdf4', borderRadius: '6px', marginBottom: '3px', fontSize: '0.82rem', color: '#1f2937' }}>
                                                                        <span style={{ color: '#15803d' }}>✓</span> {item.foodName}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Avoid */}
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#b91c1c', fontSize: '0.9rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    ❌ Foods to Avoid ({avoided.length})
                                                </div>
                                                {avoided.length === 0 ? (
                                                    <p style={{ color: '#aaa', fontSize: '0.82rem' }}>None specified</p>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '300px', overflowY: 'auto' }}>
                                                        {[...new Set(avoided.map(i => i.category))].map(cat => (
                                                            <div key={cat}>
                                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '6px 0 3px' }}>{cat}</div>
                                                                {avoided.filter(i => i.category === cat).map(item => (
                                                                    <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '4px 8px', background: '#fef2f2', borderRadius: '6px', marginBottom: '3px', fontSize: '0.82rem', color: '#1f2937' }}>
                                                                        <span style={{ color: '#b91c1c' }}>✗</span> {item.foodName}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '1rem', padding: '10px 14px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '0.8rem', color: '#92400e' }}>
                                            ⚠️ <strong>Ayurvedic Note:</strong> This diet plan is personalized for your Prakriti (body constitution). Please consult your doctor before making any changes.
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
