import { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import { getMyPatients } from '../../services/userService';
import { DIET_CATEGORIES } from '../../data/mockData';

export default function DietTableTab({ showNotification }) {
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [dietPlan, setDietPlan] = useState(null); // current saved plan from DB
    const [checked, setChecked] = useState({});
    const [customItems, setCustomItems] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notes, setNotes] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ category: Object.keys(DIET_CATEGORIES)[0], name: '' });

    // ── Load assigned patients ─────────────────────────────────────────────
    useEffect(() => {
        getMyPatients()
            .then(pats => setPatients(pats || []))
            .catch(() => showNotification && showNotification('Failed to load patients', 'error'));
    }, []);

    // ── Load diet plan when patient changes ────────────────────────────────
    useEffect(() => {
        if (!selectedPatientId) { setDietPlan(null); setChecked({}); setNotes(''); setCustomItems({}); return; }
        setLoading(true);
        API.get(`/diets?patientId=${selectedPatientId}`)
            .then(res => {
                const plans = res.data.data || [];
                if (plans.length > 0) {
                    const plan = plans[0]; // most recent plan
                    setDietPlan(plan);
                    setNotes(plan.notes || '');
                    // Rebuild checked state from plan items
                    const newChecked = {};
                    (plan.items || []).forEach(it => {
                        if (it.prescribed) newChecked[`${it.category}::${it.foodName}`] = true;
                    });
                    setChecked(newChecked);
                } else {
                    setDietPlan(null);
                    setChecked({});
                    setNotes('');
                }
            })
            .catch(() => showNotification && showNotification('Failed to load diet plan', 'error'))
            .finally(() => setLoading(false));
    }, [selectedPatientId]);

    // ── Combined items (DIET_CATEGORIES + custom additions) ────────────────
    const allItems = useMemo(() => {
        const result = {};
        for (const [cat, items] of Object.entries(DIET_CATEGORIES)) {
            result[cat] = [...items, ...(customItems[cat] || [])];
        }
        return result;
    }, [customItems]);

    const totalItems = Object.values(allItems).reduce((s, arr) => s + arr.length, 0);
    const selectedCount = Object.values(checked).filter(Boolean).length;
    const categories = Object.keys(allItems);
    const maxRows = Math.max(...Object.values(allItems).map(arr => arr.length));

    const toggle = (cat, item) => {
        const key = `${cat}::${item}`;
        setChecked(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const selectAll = () => {
        const all = {};
        for (const [cat, items] of Object.entries(allItems)) {
            items.forEach(item => { all[`${cat}::${item}`] = true; });
        }
        setChecked(all);
    };
    const clearAll = () => setChecked({});

    // ── Save plan to DB ────────────────────────────────────────────────────
    const savePlan = async () => {
        if (!selectedPatientId) { showNotification && showNotification('Please select a patient first', 'error'); return; }
        setSaving(true);
        try {
            // Build items array from all categories + checked state
            const items = [];
            for (const [cat, foodList] of Object.entries(allItems)) {
                foodList.forEach(foodName => {
                    items.push({ foodName, category: cat, prescribed: !!checked[`${cat}::${foodName}`] });
                });
            }
            const selectedPat = patients.find(p => p._id === selectedPatientId);
            const payload = { patientId: selectedPatientId, patientName: selectedPat?.name || '', items, notes };

            if (dietPlan && dietPlan._id) {
                await API.patch(`/diets/${dietPlan._id}`, { items, notes });
                showNotification && showNotification('Diet plan updated!', 'success');
            } else {
                const res = await API.post('/diets', payload);
                setDietPlan(res.data.data);
                showNotification && showNotification('Diet plan saved!', 'success');
            }
        } catch (err) {
            showNotification && showNotification('Failed to save diet plan', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deletePlan = async () => {
        if (!dietPlan || !window.confirm('Delete this diet plan?')) return;
        try {
            await API.delete(`/diets/${dietPlan._id}`);
            setDietPlan(null);
            setChecked({});
            setNotes('');
            showNotification && showNotification('Diet plan deleted', 'success');
        } catch {
            showNotification && showNotification('Failed to delete plan', 'error');
        }
    };

    const handlePrint = () => {
        const selected = Object.entries(checked).filter(([, v]) => v).map(([k]) => k.split('::')[1]);
        const win = window.open('', '_blank');
        const pat = patients.find(p => p._id === selectedPatientId);
        win.document.write(`<html><head><title>Diet Plan</title></head><body>
      <h2>Ayursutra — Prescribed Diet Plan</h2>
      ${pat ? `<p><strong>Patient:</strong> ${pat.name}</p>` : ''}
      ${notes ? `<p><em>Notes: ${notes}</em></p>` : ''}
      <ul>${selected.map(s => `<li>${s}</li>`).join('')}</ul>
      </body></html>`);
        win.print();
        win.close();
    };

    const addItem = (e) => {
        e.preventDefault();
        if (!addForm.name.trim()) return;
        setCustomItems(prev => ({
            ...prev,
            [addForm.category]: [...(prev[addForm.category] || []), addForm.name.trim()]
        }));
        setAddForm({ category: Object.keys(DIET_CATEGORIES)[0], name: '' });
        setShowAddModal(false);
    };

    const selectedPatient = patients.find(p => p._id === selectedPatientId);

    return (
        <div className="tab-content active">
            <div className="diet-container">
                <div className="diet-header-bar">
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌿</div>
                    <h2>આयुर्वेदिक ખোરાક સૂચิ — Ayurvedic Diet List</h2>
                    <p>Prescribe food items for a specific patient according to Ayurvedic principles</p>
                </div>

                {/* Patient Selector */}
                <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <label style={{ fontWeight: 600, minWidth: '120px' }}>Select Patient:</label>
                        <select
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            value={selectedPatientId}
                            onChange={e => setSelectedPatientId(e.target.value)}
                        >
                            <option value="">— Choose a patient —</option>
                            {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        {dietPlan && (
                            <span style={{ padding: '0.3rem 0.75rem', background: '#e8f5e9', borderRadius: '20px', color: '#2a7d2e', fontSize: '0.82rem', fontWeight: 600 }}>
                                ✅ Plan saved {new Date(dietPlan.createdAt).toLocaleDateString('en-IN')}
                            </span>
                        )}
                    </div>
                    {selectedPatient && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#555' }}>
                            Viewing diet plan for <strong>{selectedPatient.name}</strong>
                            {dietPlan ? ' — existing plan loaded' : ' — no plan yet, create one below'}
                        </div>
                    )}
                </div>

                {!selectedPatientId ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
                        <div style={{ fontSize: '3rem' }}>👤</div>
                        <p style={{ marginTop: '0.75rem' }}>Select a patient above to view or create their diet plan</p>
                    </div>
                ) : loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#2a7d2e' }}>
                        <div style={{ fontSize: '2rem' }}>🌿</div><p>Loading diet plan...</p>
                    </div>
                ) : (
                    <>
                        {/* Notes */}
                        <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>📝 Doctor's Notes</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical', boxSizing: 'border-box' }}
                                placeholder="Add dietary notes or restrictions for this patient..."
                            />
                        </div>

                        {/* Controls */}
                        <div className="diet-controls">
                            <div className="diet-stats">
                                <div className="diet-stat-box"><div className="diet-stat-value">{totalItems}</div><div className="diet-stat-label">Total Items</div></div>
                                <div className="diet-stat-box"><div className="diet-stat-value">{selectedCount}</div><div className="diet-stat-label">Prescribed</div></div>
                                <div className="diet-stat-box"><div className="diet-stat-value">{categories.length}</div><div className="diet-stat-label">Categories</div></div>
                            </div>
                            <div className="diet-action-buttons">
                                <button className="dash-btn dash-btn-primary" onClick={() => setShowAddModal(true)}>+ Add Item</button>
                                <button className="dash-btn dash-btn-primary" onClick={selectAll}>✓ Select All</button>
                                <button className="dash-btn dash-btn-secondary" onClick={clearAll}>✕ Clear All</button>
                                <button className="dash-btn dash-btn-secondary" onClick={handlePrint} disabled={selectedCount === 0}>🖨 Print Plan</button>
                                <button className="dash-btn dash-btn-primary" onClick={savePlan} disabled={saving}>
                                    {saving ? '⌛ Saving...' : dietPlan ? '💾 Update Plan' : '✅ Save Plan'}
                                </button>
                                {dietPlan && <button className="dash-btn dash-btn-secondary" style={{ color: '#f44336' }} onClick={deletePlan}>🗑️ Delete Plan</button>}
                            </div>
                        </div>

                        {/* Diet Table */}
                        <div className="diet-table-wrapper">
                            <table className="food-table">
                                <thead>
                                    <tr>
                                        {categories.map(cat => <th key={cat} className="category-header">{cat}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array(maxRows).fill(null).map((_, rowIdx) => (
                                        <tr key={rowIdx}>
                                            {categories.map(cat => {
                                                const item = allItems[cat][rowIdx];
                                                return (
                                                    <td key={cat} className="food-cell">
                                                        {item && (
                                                            <div className="food-item" onClick={() => toggle(cat, item)}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!checked[`${cat}::${item}`]}
                                                                    onChange={() => toggle(cat, item)}
                                                                    onClick={e => e.stopPropagation()}
                                                                />
                                                                <span className="item-name">{item}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="diet-footer">
                            <div className="diet-footer-content">
                                <div className="selected-count">{selectedCount} items prescribed for {selectedPatient?.name}</div>
                                <div style={{ color: '#616161', fontSize: '0.9rem' }}>Ayurvedic Diet List © {new Date().getFullYear()}</div>
                            </div>
                            <div className="ayurvedic-note">
                                ⚠️ <strong>Ayurvedic Note:</strong> This diet list is personalized for the selected patient. Consult regarding individual Prakriti (Vata, Pitta, Kapha).
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="dash-modal open">
                    <div className="dash-modal-content">
                        <div className="modal-header">
                            <h3>Add New Diet Item</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <form onSubmit={addItem}>
                            <div className="dash-form-group">
                                <label>Category</label>
                                <select value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="dash-form-group">
                                <label>Item Name (Gujarati + English)</label>
                                <input type="text" required placeholder="e.g., Mango (કેરી)" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
                            </div>
                            <button type="submit" className="dash-btn dash-btn-primary" style={{ width: '100%' }}>Add Item</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
