import { useState, useEffect } from 'react';
import { getMyPrescriptions } from '../../services/prescriptionService';

function printPrescription(rx, userName) {
    const w = window.open('', '_blank');
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
.notes{background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px;margin-top:14px;font-size:13px;color:#9a3412}
.footer{margin-top:30px;padding-top:14px;border-top:1px solid #eee;font-size:12px;color:#aaa;display:flex;justify-content:space-between}
.sig{margin-top:40px;border-top:1px dashed #ccc;padding-top:10px;text-align:right;font-size:13px;color:#555}
.badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700}
.badge-a{background:#dcfce7;color:#15803d}
.badge-c{background:#f3f4f6;color:#6b7280}
@media print{body{padding:16px}}
</style></head><body>
<h1>🌿 Ayursutra — Medical Prescription</h1>
<div class="sub">Prescription Date: ${new Date(rx.prescriptionDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
<div class="info-grid">
  <div><div class="label">Patient Name</div><strong>${userName}</strong></div>
  <div><div class="label">Prescribing Doctor</div><strong>Dr. ${rx.doctorName}</strong></div>
  <div><div class="label">Diagnosis / Condition</div>${rx.diagnosis}</div>
  <div><div class="label">Status</div><span class="badge ${rx.status==='active'?'badge-a':'badge-c'}">${rx.status.toUpperCase()}</span></div>
  ${rx.followUpDate ? `<div><div class="label">Follow-up Date</div>${new Date(rx.followUpDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>` : ''}
</div>
<table>
<thead><tr><th>#</th><th>Medicine</th><th>Type</th><th>Dose</th><th>Frequency</th><th>Timing</th><th>Duration</th><th>Qty</th><th>Instructions</th></tr></thead>
<tbody>${(rx.medicines||[]).map((m,i)=>`<tr><td>${i+1}</td><td><strong>${m.medicineName}</strong></td><td>${m.medicineType}</td><td>${m.dose||'-'}</td><td>${m.frequency||'-'}</td><td>${m.timing||'-'}</td><td>${m.duration||'-'}</td><td>${m.quantity||'-'}</td><td>${m.specialInstructions||'-'}</td></tr>`).join('')}</tbody>
</table>
${rx.doctorNotes?`<div class="notes"><strong>📝 Doctor's Notes:</strong> ${rx.doctorNotes}</div>`:''}
<div class="sig">Doctor's Signature: _________________________ &nbsp;&nbsp; Dr. ${rx.doctorName}</div>
<div class="footer"><span>Ayursutra Wellness Platform</span><span>Generated: ${new Date().toLocaleDateString('en-IN')}</span></div>
</body></html>`);
    w.document.close(); w.focus(); w.print();
}

const statusBadge = (s) => ({
    active:    { bg:'#dcfce7', color:'#15803d', label:'Active' },
    completed: { bg:'#f3f4f6', color:'#6b7280', label:'Completed' },
}[s] || { bg:'#f3f4f6', color:'#6b7280', label:s });

export default function PatientPrescriptionsTab({ user, showNotification, socketRef }) {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [viewRx, setViewRx]               = useState(null);
    const [filterStatus, setFilterStatus]   = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const data = await getMyPrescriptions();
            setPrescriptions(data);
        } catch { showNotification && showNotification('Failed to load prescriptions', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    // Real-time socket: reload when doctor issues/updates a prescription
    useEffect(() => {
        const socket = socketRef?.current;
        if (!socket) return;
        const handler = () => load();
        socket.on('prescription_updated', handler);
        return () => socket.off('prescription_updated', handler);
    }, [socketRef]);

    const filtered = filterStatus ? prescriptions.filter(r => r.status === filterStatus) : prescriptions;

    const s = {
        card: { background:'#fff', borderRadius:'12px', border:'1px solid #e8f5e9', padding:'1.25rem', boxShadow:'0 2px 8px rgba(42,125,46,.06)' },
        label: { fontWeight:700, fontSize:'0.72rem', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px' },
        input: { padding:'0.5rem 0.8rem', borderRadius:'8px', border:'1px solid #d1fae5', fontSize:'0.88rem' },
    };

    if (loading) return (
        <div className="tab-content active" style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:300}}>
            <div style={{textAlign:'center',color:'#2a7d2e'}}>
                <div style={{fontSize:'2rem'}}>🌿</div><p>Loading prescriptions...</p>
            </div>
        </div>
    );

    return (
        <div className="tab-content active">
            <div className="tab-header">
                <h2>💊 My Prescriptions</h2>
                <p style={{color:'#777',fontSize:'0.85rem',margin:'4px 0 0'}}>Prescriptions issued by your doctor — read-only</p>
            </div>

            {/* Filter */}
            <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap',margin:'1rem 0',alignItems:'center'}}>
                <select style={s.input} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>
                <span style={{marginLeft:'auto',fontSize:'0.82rem',color:'#888'}}>{filtered.length} prescription{filtered.length!==1?'s':''}</span>
            </div>

            {filtered.length === 0 ? (
                <div style={{textAlign:'center',padding:'4rem 2rem',color:'#aaa'}}>
                    <div style={{fontSize:'4rem',marginBottom:'1rem'}}>💊</div>
                    <h3 style={{color:'#888',fontWeight:500}}>No Prescriptions Yet</h3>
                    <p style={{fontSize:'0.88rem',marginTop:'0.5rem'}}>Your doctor hasn't issued a prescription yet.</p>
                </div>
            ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'0.85rem'}}>
                    {filtered.map((rx, idx) => {
                        const b = statusBadge(rx.status);
                        return (
                            <div key={rx._id} style={s.card}>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'0.5rem'}}>
                                    <div style={{flex:1,minWidth:0}}>
                                        <div style={{display:'flex',alignItems:'center',gap:'0.6rem',flexWrap:'wrap',marginBottom:'5px'}}>
                                            <span style={{fontWeight:700,fontSize:'1rem',color:'#1a1a1a'}}>
                                                Prescription #{prescriptions.length - idx}
                                            </span>
                                            {idx === 0 && (
                                                <span style={{background:'#dcfce7',color:'#15803d',fontSize:'0.7rem',fontWeight:700,padding:'2px 10px',borderRadius:'20px',border:'1px solid #86efac'}}>
                                                    ✓ LATEST
                                                </span>
                                            )}
                                            <span style={{background:b.bg,color:b.color,fontSize:'0.7rem',fontWeight:700,padding:'2px 10px',borderRadius:'20px'}}>
                                                {b.label}
                                            </span>
                                        </div>
                                        <div style={{fontSize:'0.83rem',color:'#555',display:'flex',gap:'1.2rem',flexWrap:'wrap'}}>
                                            <span>👨‍⚕️ Dr. {rx.doctorName}</span>
                                            <span>📋 {rx.diagnosis}</span>
                                            <span>💊 {rx.medicines.length} medicine{rx.medicines.length!==1?'s':''}</span>
                                            <span>📅 {new Date(rx.prescriptionDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                                            {rx.followUpDate && (
                                                <span style={{color:'#d97706',fontWeight:600}}>
                                                    🔁 Follow-up: {new Date(rx.followUpDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{display:'flex',gap:'0.4rem'}}>
                                        <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={()=>setViewRx(rx)}>👁 View</button>
                                        <button className="dash-btn dash-btn-primary dash-btn-sm" onClick={()=>printPrescription(rx, user.name)}>🖨 Print</button>
                                    </div>
                                </div>

                                {/* Medicine pills */}
                                <div style={{display:'flex',flexWrap:'wrap',gap:'0.4rem',marginTop:'0.75rem'}}>
                                    {rx.medicines.slice(0,5).map((m,i)=>(
                                        <span key={i} style={{background:'#f0fdf4',border:'1px solid #bbf7d0',color:'#15803d',fontSize:'0.75rem',padding:'3px 10px',borderRadius:'20px'}}>
                                            {m.medicineName} {m.dose && `· ${m.dose}`}
                                        </span>
                                    ))}
                                    {rx.medicines.length > 5 && (
                                        <span style={{background:'#f3f4f6',color:'#6b7280',fontSize:'0.75rem',padding:'3px 10px',borderRadius:'20px'}}>
                                            +{rx.medicines.length-5} more
                                        </span>
                                    )}
                                </div>

                                {rx.doctorNotes && (
                                    <div style={{marginTop:'0.65rem',background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:'8px',padding:'8px 12px',fontSize:'0.82rem',color:'#9a3412'}}>
                                        📝 {rx.doctorNotes}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            {viewRx && (
                <div className="dash-modal open" style={{zIndex:1000}}>
                    <div className="dash-modal-content" style={{maxWidth:760,width:'95vw',maxHeight:'90vh',overflowY:'auto'}}>
                        <div className="modal-header">
                            <h3>📋 Prescription Details</h3>
                            <button className="modal-close" onClick={()=>setViewRx(null)}>×</button>
                        </div>

                        {/* Info grid */}
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',background:'#f9fafb',borderRadius:'10px',padding:'1rem',marginBottom:'1rem',fontSize:'0.87rem'}}>
                            {[
                                ['👨‍⚕️ Doctor', `Dr. ${viewRx.doctorName}`],
                                ['📅 Date', new Date(viewRx.prescriptionDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})],
                                ['📋 Diagnosis', viewRx.diagnosis],
                                ['🔖 Status', viewRx.status.toUpperCase()],
                                ...(viewRx.followUpDate ? [['🔁 Follow-up Date', new Date(viewRx.followUpDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})]] : []),
                            ].map(([label, value])=>(
                                <div key={label}>
                                    <div style={s.label}>{label}</div>
                                    <div style={{marginTop:2,fontWeight:label.includes('Diagnosis')||label.includes('Doctor')?600:400}}>{value}</div>
                                </div>
                            ))}
                        </div>

                        {viewRx.doctorNotes && (
                            <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:'8px',padding:'12px',marginBottom:'1rem',fontSize:'0.85rem',color:'#9a3412'}}>
                                <strong>📝 Doctor's Notes:</strong> {viewRx.doctorNotes}
                            </div>
                        )}

                        <strong style={{color:'#15803d',fontSize:'0.9rem'}}>💊 Medicines ({viewRx.medicines.length})</strong>
                        <div style={{overflowX:'auto',marginTop:'0.5rem',marginBottom:'1rem'}}>
                            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.82rem'}}>
                                <thead>
                                    <tr style={{background:'#e8f5e9'}}>
                                        {['#','Medicine','Type','Dose','Frequency','Timing','Duration','Qty','Instructions'].map(h=>(
                                            <th key={h} style={{padding:'8px 10px',textAlign:'left',color:'#2a7d2e',border:'1px solid #d1fae5',whiteSpace:'nowrap'}}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewRx.medicines.map((m,i)=>(
                                        <tr key={i} style={{background:i%2?'#fafafa':'#fff'}}>
                                            <td style={{padding:'7px 10px',border:'1px solid #f0f0f0'}}>{i+1}</td>
                                            <td style={{padding:'7px 10px',border:'1px solid #f0f0f0',fontWeight:600}}>{m.medicineName}</td>
                                            <td style={{padding:'7px 10px',border:'1px solid #f0f0f0'}}>{m.medicineType}</td>
                                            <td style={{padding:'7px 10px',border:'1px solid #f0f0f0'}}>{m.dose||'-'}</td>
                                            <td style={{padding:'7px 10px',border:'1px solid #f0f0f0'}}>{m.frequency||'-'}</td>
                                            <td style={{padding:'7px 10px',border:'1px solid #f0f0f0'}}>{m.timing||'-'}</td>
                                            <td style={{padding:'7px 10px',border:'1px solid #f0f0f0'}}>{m.duration||'-'}</td>
                                            <td style={{padding:'7px 10px',border:'1px solid #f0f0f0'}}>{m.quantity||'-'}</td>
                                            <td style={{padding:'7px 10px',border:'1px solid #f0f0f0',fontSize:'0.78rem'}}>{m.specialInstructions||'-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{background:'#fef9c3',border:'1px solid #fde68a',borderRadius:'8px',padding:'10px 14px',marginBottom:'1rem',fontSize:'0.8rem',color:'#92400e'}}>
                            ⚠️ <strong>Note:</strong> This prescription is read-only. Contact your doctor for any changes or queries.
                        </div>

                        <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end'}}>
                            <button className="dash-btn dash-btn-secondary" onClick={()=>setViewRx(null)}>Close</button>
                            <button className="dash-btn dash-btn-primary" onClick={()=>printPrescription(viewRx, user.name)}>🖨 Print / Download PDF</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
