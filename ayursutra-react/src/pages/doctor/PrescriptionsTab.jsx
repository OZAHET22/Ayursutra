import { useState, useEffect, useCallback } from 'react';
import { getMyPatients } from '../../services/userService';
import {
    getDoctorPrescriptions, createPrescription,
    updatePrescription, updatePrescriptionStatus, deletePrescription
} from '../../services/prescriptionService';

const EMPTY_MED = { medicineName:'', medicineType:'Tablet', dose:'', frequency:'', timing:'After Food', duration:'', quantity:'', specialInstructions:'' };
const MED_TYPES = ['Tablet','Capsule','Syrup','Injection','Drops','Cream','Powder','Other'];
const TIMINGS   = ['Before Food','After Food','With Food','At Bedtime','Empty Stomach','As Directed'];
const FREQS     = ['Once a day','Twice a day','Thrice a day','Every 4 hours','Every 6 hours','Every 8 hours','As needed','Weekly'];

function printPrescription(rx) {
    const w = window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Prescription</title>
<style>
body{font-family:'Segoe UI',sans-serif;padding:32px;color:#222;max-width:780px;margin:auto}
h1{color:#2a7d2e;font-size:1.5rem;margin-bottom:2px}
.sub{color:#888;font-size:13px;margin-bottom:18px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:18px;font-size:13px}
.label{color:#6b7280;font-size:11px;text-transform:uppercase;font-weight:700;margin-bottom:2px}
table{width:100%;border-collapse:collapse;font-size:13px;margin-top:16px}
th{background:#e8f5e9;color:#2a7d2e;padding:9px 12px;text-align:left;font-size:12px;border:1px solid #d1fae5}
td{padding:8px 12px;border:1px solid #f0f0f0;vertical-align:top}
tr:nth-child(even) td{background:#fafafa}
.badge-a{background:#dcfce7;color:#15803d;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700}
.badge-c{background:#f3f4f6;color:#6b7280;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700}
.notes{background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px;margin-top:14px;font-size:13px;color:#9a3412}
.footer{margin-top:30px;padding-top:14px;border-top:1px solid #eee;font-size:12px;color:#aaa;display:flex;justify-content:space-between}
.sig{margin-top:40px;border-top:1px dashed #ccc;padding-top:10px;text-align:right;font-size:13px;color:#555}
@media print{body{padding:16px}}
</style></head><body>
<h1>🌿 Ayursutra — Medical Prescription</h1>
<div class="sub">Prescription Date: ${new Date(rx.prescriptionDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
<div class="info-grid">
  <div><div class="label">Patient Name</div><strong>${rx.patientName}</strong></div>
  <div><div class="label">Prescribing Doctor</div><strong>Dr. ${rx.doctorName}</strong></div>
  <div><div class="label">Diagnosis / Condition</div>${rx.diagnosis}</div>
  <div><div class="label">Status</div><span class="${rx.status==='active'?'badge-a':'badge-c'}">${rx.status.toUpperCase()}</span></div>
  ${rx.followUpDate?`<div><div class="label">Follow-up Date</div>${new Date(rx.followUpDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>`:''}
</div>
<table>
<thead><tr><th>#</th><th>Medicine</th><th>Type</th><th>Dose</th><th>Frequency</th><th>Timing</th><th>Duration</th><th>Qty</th><th>Instructions</th></tr></thead>
<tbody>${(rx.medicines||[]).map((m,i)=>`<tr><td>${i+1}</td><td><strong>${m.medicineName}</strong></td><td>${m.medicineType}</td><td>${m.dose||'-'}</td><td>${m.frequency||'-'}</td><td>${m.timing||'-'}</td><td>${m.duration||'-'}</td><td>${m.quantity||'-'}</td><td>${m.specialInstructions||'-'}</td></tr>`).join('')}</tbody>
</table>
${rx.doctorNotes?`<div class="notes"><strong>📝 Doctor's Notes:</strong> ${rx.doctorNotes}</div>`:''}
<div class="sig">Signature: _________________________ &nbsp;&nbsp; Dr. ${rx.doctorName}</div>
<div class="footer"><span>Ayursutra Wellness Platform</span><span>Generated: ${new Date().toLocaleDateString('en-IN')}</span></div>
</body></html>`);
    w.document.close(); w.focus(); w.print();
}

const statusBadge = (s) => ({
    active:    { bg:'#dcfce7', color:'#15803d', label:'Active' },
    completed: { bg:'#f3f4f6', color:'#6b7280', label:'Completed' },
}[s] || { bg:'#f3f4f6', color:'#6b7280', label:s });

export default function PrescriptionsTab({ user, showNotification }) {
    const [prescriptions, setPrescriptions] = useState([]);
    const [patients, setPatients]           = useState([]);
    const [loading, setLoading]             = useState(true);
    const [showForm, setShowForm]           = useState(false);
    const [editRx, setEditRx]               = useState(null);   // null = create mode
    const [viewRx, setViewRx]               = useState(null);
    const [filterStatus, setFilterStatus]   = useState('');
    const [filterPatient, setFilterPatient] = useState('');
    const [saving, setSaving]               = useState(false);

    const [form, setForm] = useState({
        patientId:'', diagnosis:'', followUpDate:'', doctorNotes:'',
        medicines:[{ ...EMPTY_MED }],
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [rxs, pats] = await Promise.all([getDoctorPrescriptions(), getMyPatients()]);
            setPrescriptions(rxs); setPatients(pats||[]);
        } catch { showNotification('Failed to load prescriptions','error'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => {
        setEditRx(null);
        setForm({ patientId:'', diagnosis:'', followUpDate:'', doctorNotes:'', medicines:[{...EMPTY_MED}] });
        setShowForm(true);
    };

    const openEdit = (rx) => {
        setEditRx(rx);
        setForm({
            patientId: rx.patientId, diagnosis: rx.diagnosis,
            followUpDate: rx.followUpDate ? rx.followUpDate.split('T')[0] : '',
            doctorNotes: rx.doctorNotes,
            medicines: rx.medicines.length ? rx.medicines.map(m=>({...m})) : [{...EMPTY_MED}],
        });
        setShowForm(true);
    };

    const addMed   = () => setForm(f=>({...f, medicines:[...f.medicines,{...EMPTY_MED}]}));
    const removeMed = (i) => setForm(f=>({...f, medicines:f.medicines.filter((_,idx)=>idx!==i)}));
    const setMed   = (i, field, val) => setForm(f=>{
        const m=[...f.medicines]; m[i]={...m[i],[field]:val}; return {...f,medicines:m};
    });

    const submit = async (e) => {
        e.preventDefault();
        if (!form.patientId) { showNotification('Select a patient','error'); return; }
        if (!form.diagnosis.trim()) { showNotification('Enter a diagnosis','error'); return; }
        if (!form.medicines[0].medicineName.trim()) { showNotification('Add at least one medicine','error'); return; }
        setSaving(true);
        try {
            const payload = { ...form, medicines: form.medicines.filter(m=>m.medicineName.trim()) };
            if (editRx) {
                const updated = await updatePrescription(editRx._id, payload);
                setPrescriptions(p=>p.map(r=>r._id===updated._id?updated:r));
                showNotification('Prescription updated!','success');
            } else {
                const created = await createPrescription(payload);
                setPrescriptions(p=>[created,...p]);
                showNotification('Prescription created & patient notified!','success');
            }
            setShowForm(false);
        } catch(err) {
            showNotification(err?.response?.data?.message||'Save failed','error');
        } finally { setSaving(false); }
    };

    const toggleStatus = async (rx) => {
        const next = rx.status==='active' ? 'completed' : 'active';
        try {
            const updated = await updatePrescriptionStatus(rx._id, next);
            setPrescriptions(p=>p.map(r=>r._id===updated._id?updated:r));
            showNotification(`Marked as ${next}`,'success');
        } catch { showNotification('Status update failed','error'); }
    };

    const deleteRx = async (rx) => {
        if (!window.confirm(`Delete prescription for ${rx.patientName}?`)) return;
        try {
            await deletePrescription(rx._id);
            setPrescriptions(p=>p.filter(r=>r._id!==rx._id));
            showNotification('Prescription deleted','success');
        } catch { showNotification('Delete failed','error'); }
    };

    const filtered = prescriptions.filter(r=>{
        if (filterStatus && r.status!==filterStatus) return false;
        if (filterPatient && !r.patientName.toLowerCase().includes(filterPatient.toLowerCase())) return false;
        return true;
    });

    const s = { card:{background:'#fff',borderRadius:'12px',border:'1px solid #e8f5e9',padding:'1.25rem',boxShadow:'0 2px 8px rgba(42,125,46,.06)'}, label:{fontWeight:700,fontSize:'0.78rem',color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'4px',display:'block'}, input:{width:'100%',padding:'0.55rem 0.8rem',borderRadius:'8px',border:'1px solid #d1fae5',fontSize:'0.9rem',boxSizing:'border-box',outline:'none'}, select:{width:'100%',padding:'0.55rem 0.8rem',borderRadius:'8px',border:'1px solid #d1fae5',fontSize:'0.9rem',boxSizing:'border-box'} };

    return (
        <div className="tab-content active">
            <div className="tab-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'0.75rem'}}>
                <div>
                    <h2>💊 Prescriptions</h2>
                    <p style={{color:'#777',fontSize:'0.85rem',margin:'4px 0 0'}}>Create, manage and track all prescriptions you have issued</p>
                </div>
                <button className="dash-btn dash-btn-primary" onClick={openCreate}>+ New Prescription</button>
            </div>

            {/* Filters */}
            <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap',margin:'1rem 0'}}>
                <input placeholder="Search patient..." style={{...s.input,maxWidth:220}} value={filterPatient} onChange={e=>setFilterPatient(e.target.value)}/>
                <select style={{...s.select,maxWidth:160}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>
                <span style={{marginLeft:'auto',alignSelf:'center',fontSize:'0.83rem',color:'#888'}}>{filtered.length} prescription{filtered.length!==1?'s':''}</span>
            </div>

            {loading ? (
                <div style={{textAlign:'center',padding:'3rem',color:'#2a7d2e'}}><div style={{fontSize:'2rem'}}>🌿</div><p>Loading prescriptions...</p></div>
            ) : filtered.length===0 ? (
                <div style={{textAlign:'center',padding:'4rem',color:'#aaa'}}>
                    <div style={{fontSize:'3.5rem'}}>💊</div>
                    <h3 style={{color:'#888',fontWeight:500,marginTop:'0.75rem'}}>No Prescriptions Found</h3>
                    <p style={{fontSize:'0.88rem'}}>Click "+ New Prescription" to issue one for a patient.</p>
                </div>
            ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'0.85rem'}}>
                    {filtered.map(rx=>{
                        const b=statusBadge(rx.status);
                        return (
                            <div key={rx._id} style={s.card}>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'0.5rem'}}>
                                    <div style={{flex:1,minWidth:0}}>
                                        <div style={{display:'flex',alignItems:'center',gap:'0.6rem',flexWrap:'wrap',marginBottom:'4px'}}>
                                            <span style={{fontWeight:700,fontSize:'1rem',color:'#1a1a1a'}}>{rx.patientName}</span>
                                            <span style={{background:b.bg,color:b.color,fontSize:'0.7rem',fontWeight:700,padding:'2px 10px',borderRadius:'20px'}}>{b.label}</span>
                                        </div>
                                        <div style={{fontSize:'0.83rem',color:'#555',display:'flex',gap:'1.2rem',flexWrap:'wrap'}}>
                                            <span>📋 {rx.diagnosis}</span>
                                            <span>💊 {rx.medicines.length} medicine{rx.medicines.length!==1?'s':''}</span>
                                            <span>📅 {new Date(rx.prescriptionDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                                            {rx.followUpDate && <span>🔁 Follow-up: {new Date(rx.followUpDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>}
                                        </div>
                                    </div>
                                    <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                                        <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={()=>setViewRx(rx)}>👁 View</button>
                                        <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={()=>openEdit(rx)}>✏️ Edit</button>
                                        <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={()=>printPrescription(rx)}>🖨 Print</button>
                                        <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={()=>toggleStatus(rx)}
                                            style={{color:rx.status==='active'?'#6b7280':'#15803d'}}>
                                            {rx.status==='active'?'✓ Complete':'↺ Re-activate'}
                                        </button>
                                        <button className="dash-btn dash-btn-secondary dash-btn-sm" style={{color:'#ef4444'}} onClick={()=>deleteRx(rx)}>🗑</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Create / Edit Modal ── */}
            {showForm && (
                <div className="dash-modal open" style={{zIndex:1000}}>
                    <div className="dash-modal-content" style={{maxWidth:820,width:'95vw',maxHeight:'92vh',overflowY:'auto'}}>
                        <div className="modal-header">
                            <h3>{editRx?'✏️ Edit Prescription':'💊 New Prescription'}</h3>
                            <button className="modal-close" onClick={()=>setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={submit}>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                                {!editRx && (
                                    <div className="dash-form-group" style={{gridColumn:'1/3'}}>
                                        <label style={s.label}>Patient *</label>
                                        <select style={s.select} value={form.patientId} onChange={e=>setForm(f=>({...f,patientId:e.target.value}))} required>
                                            <option value="">— Select patient —</option>
                                            {patients.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {editRx && (
                                    <div className="dash-form-group" style={{gridColumn:'1/3'}}>
                                        <label style={s.label}>Patient</label>
                                        <input style={{...s.input,background:'#f9f9f9'}} value={editRx.patientName} readOnly/>
                                    </div>
                                )}
                                <div className="dash-form-group" style={{gridColumn:'1/3'}}>
                                    <label style={s.label}>Diagnosis / Condition *</label>
                                    <input style={s.input} value={form.diagnosis} onChange={e=>setForm(f=>({...f,diagnosis:e.target.value}))} placeholder="e.g. Vata Imbalance, Chronic Arthritis" required/>
                                </div>
                                <div className="dash-form-group">
                                    <label style={s.label}>Follow-up Date (optional)</label>
                                    <input type="date" style={s.input} value={form.followUpDate} onChange={e=>setForm(f=>({...f,followUpDate:e.target.value}))}/>
                                </div>
                                <div className="dash-form-group">
                                    <label style={s.label}>Doctor's Notes</label>
                                    <input style={s.input} value={form.doctorNotes} onChange={e=>setForm(f=>({...f,doctorNotes:e.target.value}))} placeholder="Clinical notes, special instructions..."/>
                                </div>
                            </div>

                            {/* Medicines */}
                            <div style={{background:'#f0fdf4',borderRadius:'10px',padding:'1rem',marginBottom:'1rem'}}>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
                                    <strong style={{color:'#15803d'}}>💊 Medicines ({form.medicines.length})</strong>
                                    <button type="button" className="dash-btn dash-btn-primary dash-btn-sm" onClick={addMed}>+ Add Medicine</button>
                                </div>
                                {form.medicines.map((m,i)=>(
                                    <div key={i} style={{background:'#fff',border:'1px solid #d1fae5',borderRadius:'8px',padding:'0.85rem',marginBottom:'0.6rem'}}>
                                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.6rem'}}>
                                            <span style={{fontWeight:600,fontSize:'0.85rem',color:'#2a7d2e'}}>Medicine #{i+1}</span>
                                            {form.medicines.length>1 && <button type="button" onClick={()=>removeMed(i)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:'1rem'}}>✕</button>}
                                        </div>
                                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.6rem'}}>
                                            <div><label style={s.label}>Medicine Name *</label><input style={s.input} value={m.medicineName} onChange={e=>setMed(i,'medicineName',e.target.value)} placeholder="e.g. Ashwagandha" required={i===0}/></div>
                                            <div><label style={s.label}>Type</label><select style={s.select} value={m.medicineType} onChange={e=>setMed(i,'medicineType',e.target.value)}>{MED_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                                            <div><label style={s.label}>Dose / Strength</label><input style={s.input} value={m.dose} onChange={e=>setMed(i,'dose',e.target.value)} placeholder="e.g. 500mg"/></div>
                                            <div><label style={s.label}>Frequency</label><select style={s.select} value={m.frequency} onChange={e=>setMed(i,'frequency',e.target.value)}><option value="">—</option>{FREQS.map(f=><option key={f}>{f}</option>)}</select></div>
                                            <div><label style={s.label}>Timing</label><select style={s.select} value={m.timing} onChange={e=>setMed(i,'timing',e.target.value)}>{TIMINGS.map(t=><option key={t}>{t}</option>)}</select></div>
                                            <div><label style={s.label}>Duration</label><input style={s.input} value={m.duration} onChange={e=>setMed(i,'duration',e.target.value)} placeholder="e.g. 7 Days"/></div>
                                            <div><label style={s.label}>Quantity</label><input style={s.input} value={m.quantity} onChange={e=>setMed(i,'quantity',e.target.value)} placeholder="e.g. 14 tablets"/></div>
                                            <div><label style={s.label}>Special Instructions</label><input style={s.input} value={m.specialInstructions} onChange={e=>setMed(i,'specialInstructions',e.target.value)} placeholder="e.g. Avoid alcohol"/></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end'}}>
                                <button type="button" className="dash-btn dash-btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
                                <button type="submit" className="dash-btn dash-btn-primary" disabled={saving}>{saving?'⌛ Saving...':editRx?'💾 Update':'✅ Issue Prescription'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Detail View Modal ── */}
            {viewRx && (
                <div className="dash-modal open" style={{zIndex:1000}}>
                    <div className="dash-modal-content" style={{maxWidth:760,width:'95vw',maxHeight:'90vh',overflowY:'auto'}}>
                        <div className="modal-header">
                            <h3>📋 Prescription Detail</h3>
                            <button className="modal-close" onClick={()=>setViewRx(null)}>×</button>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem',background:'#f9fafb',borderRadius:'10px',padding:'1rem',fontSize:'0.87rem'}}>
                            {[['👤 Patient',viewRx.patientName],['📋 Diagnosis',viewRx.diagnosis],['📅 Date',new Date(viewRx.prescriptionDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})],['🔖 Status',viewRx.status.toUpperCase()],viewRx.followUpDate&&['🔁 Follow-up',new Date(viewRx.followUpDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})],viewRx.doctorNotes&&['📝 Notes',viewRx.doctorNotes]].filter(Boolean).map(([l,v])=>(
                                <div key={l}><div style={{fontWeight:700,fontSize:'0.72rem',color:'#6b7280',textTransform:'uppercase'}}>{l}</div><div style={{marginTop:2}}>{v}</div></div>
                            ))}
                        </div>
                        <strong style={{color:'#15803d',fontSize:'0.9rem'}}>💊 Medicines ({viewRx.medicines.length})</strong>
                        <div style={{overflowX:'auto',marginTop:'0.5rem'}}>
                            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.82rem'}}>
                                <thead><tr style={{background:'#e8f5e9'}}>{['#','Name','Type','Dose','Frequency','Timing','Duration','Qty','Instructions'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',color:'#2a7d2e',border:'1px solid #d1fae5'}}>{h}</th>)}</tr></thead>
                                <tbody>{viewRx.medicines.map((m,i)=>(
                                    <tr key={i} style={{background:i%2?'#fafafa':'#fff'}}>
                                        {[i+1,m.medicineName,m.medicineType,m.dose||'-',m.frequency||'-',m.timing||'-',m.duration||'-',m.quantity||'-',m.specialInstructions||'-'].map((v,j)=>(
                                            <td key={j} style={{padding:'7px 10px',border:'1px solid #f0f0f0'}}>{j===1?<strong>{v}</strong>:v}</td>
                                        ))}
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                        <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
                            <button className="dash-btn dash-btn-secondary" onClick={()=>setViewRx(null)}>Close</button>
                            <button className="dash-btn dash-btn-primary" onClick={()=>printPrescription(viewRx)}>🖨 Print / Download PDF</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
