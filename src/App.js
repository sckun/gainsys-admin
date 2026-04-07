import { useState, useEffect, useCallback } from 'react';
import * as api from './api';

// ── Helpers ───────────────────────────────────────────────────────────────
const fmt12 = (d) => d ? new Date(d).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--';
const fmtDate = (d) => new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
const currentMonth = () => new Date().toISOString().slice(0, 7);

// ── Shared UI ─────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = { present: ['#4ade80', 'HADIR'], absent: ['#ef4444', 'ABSENT'], leave: ['#60a5fa', 'CUTI'], pending: ['#facc15', 'PENDING'], approved: ['#4ade80', 'LULUS'], rejected: ['#ef4444', 'TOLAK'] };
  const [color, label] = map[status] || ['#888', status?.toUpperCase()];
  return <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 10, letterSpacing: 1, background: color + '22', color, fontFamily: 'monospace' }}>{label}</span>;
};

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: '18px', ...style }}>{children}</div>
);

const SectionTitle = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
    <div style={{ width: 3, height: 18, background: '#4ade80', borderRadius: 2 }} />
    <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: '#e0e0e0' }}>{children}</span>
  </div>
);

const Avatar = ({ name, size = 36 }) => {
  const colors = ['#4ade80', '#60a5fa', '#f472b6', '#facc15', '#a78bfa', '#fb923c'];
  const c = colors[name?.charCodeAt(0) % colors.length] || '#888';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: `radial-gradient(circle at 35% 35%, ${c}, ${c}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#0a0a0a', fontFamily: 'monospace' }}>
      {name?.substring(0, 2).toUpperCase()}
    </div>
  );
};

// ── Login ─────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return setError('Sila isi email dan password.');
    setLoading(true); setError('');
    try {
      const data = await api.login(email.trim(), password);
      if (!['boss', 'partner', 'account'].includes(data.user.role))
        throw new Error('Anda tidak mempunyai akses ke dashboard ini.');
      onLogin(data.user);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inp = { width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #2a2a2a', background: '#111', color: '#e0e0e0', fontFamily: 'monospace', fontSize: 14, boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#555', letterSpacing: 4, marginBottom: 8 }}>GAINSYS SOLUTION</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, color: '#e0e0e0' }}>Admin <span style={{ color: '#4ade80' }}>Dashboard</span></div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#333', marginTop: 6, letterSpacing: 2 }}>BATU PAHAT · JOHOR</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={inp} />
          {error && <div style={{ color: '#ef4444', fontSize: 12, fontFamily: 'monospace' }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading} style={{ padding: '16px', borderRadius: 12, border: 'none', background: loading ? '#166534' : '#4ade80', color: '#0a0a0a', fontFamily: 'monospace', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 }}>
            {loading ? 'Sedang log masuk...' : 'Log Masuk'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────
function DashboardPage({ user }) {
  const [today, setToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setLoading(true);
    api.getAllToday(date).then(setToday).catch(() => {}).finally(() => setLoading(false));
  }, [date]);

  const present = today.filter(e => e.clock_in).length;
  const absent = today.filter(e => !e.clock_in && e.status !== 'leave').length;
  const onLeave = today.filter(e => e.status === 'leave').length;
  const outside = today.filter(e => e.currently_out > 0).length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 4 }}>RINGKASAN</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, color: '#e0e0e0' }}>
          Selamat datang, <span style={{ color: '#4ade80' }}>{user.name}</span>
        </div>
      </div>

      {/* Date picker */}
      <input type="date" value={date} onChange={e => setDate(e.target.value)}
        style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #2a2a2a', background: '#111', color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13, marginBottom: 20, outline: 'none' }} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
        {[
          ['HADIR', present, '#4ade80'],
          ['ABSENT', absent, '#ef4444'],
          ['KELUAR', outside, '#facc15'],
          ['CUTI', onLeave, '#60a5fa'],
        ].map(([label, val, color]) => (
          <Card key={label}>
            <div style={{ fontSize: 9, color: '#555', letterSpacing: 2, marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 32, fontFamily: "'Playfair Display',serif", color }}>{val}</div>
          </Card>
        ))}
      </div>

      {/* Employee list */}
      <SectionTitle>Kehadiran {fmtDate(date)}</SectionTitle>
      {loading ? (
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Memuatkan...</div>
      ) : today.length === 0 ? (
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Tiada data.</div>
      ) : today.map(emp => (
        <Card key={emp.id} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={emp.name} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#ffffff', fontWeight: 600, marginBottom: 4 }}>{emp.name}</div>
              <div style={{ fontSize: 12, color: '#888888', display: 'flex', gap: 12 }}>
                <span>IN: <span style={{ color: emp.is_late ? '#ef4444' : '#4ade80' }}>{fmt12(emp.clock_in)}</span></span>
                <span>OUT: <span style={{ color: '#aaaaaa' }}>{fmt12(emp.clock_out)}</span></span>
                {emp.clock_in_addr && <span>📍 {emp.clock_in_addr}</span>}
              </div>
              {emp.is_late && <div style={{ fontSize: 9, color: '#ef4444', marginTop: 2 }}>LAMBAT {emp.late_minutes} MINIT</div>}
              {emp.currently_out > 0 && <div style={{ fontSize: 9, color: '#facc15', marginTop: 2 }}>↗ SEDANG KELUAR</div>}
            </div>
            <Badge status={emp.status === 'leave' ? 'leave' : emp.clock_in ? 'present' : 'absent'} />
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Approvals Page ────────────────────────────────────────────────────────
function ApprovalsPage() {
  const [tab, setTab] = useState('leave');
  const [leaves, setLeaves] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getPendingLeaves(), api.getPendingOvertime()])
      .then(([l, o]) => { setLeaves(l); setOvertimes(o); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLeave = async (id, action) => {
    try {
      if (action === 'approve') await api.approveLeave(id);
      else await api.rejectLeave(id, '');
      load();
    } catch (err) { alert(err.message); }
  };

  const handleOT = async (id, action) => {
    try {
      if (action === 'approve') await api.approveOvertime(id);
      else await api.rejectOvertime(id);
      load();
    } catch (err) { alert(err.message); }
  };

  const pendingLeaves = leaves.filter(r => r.status === 'pending');
  const pendingOT = overtimes.filter(r => r.status === 'pending');

  const leaveTypeLabel = { annual: 'Tahunan', medical: 'Sakit', emergency: 'Kecemasan', unpaid: 'Tanpa Gaji', public: 'Umum' };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 4 }}>PENGURUSAN</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28 }}>Kelulusan</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['leave', `Cuti (${pendingLeaves.length})`], ['ot', `Lebih Masa (${pendingOT.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '8px 20px', borderRadius: 100, border: 'none', cursor: 'pointer', background: tab === key ? '#4ade80' : '#1a1a1a', color: tab === key ? '#0a0a0a' : '#888', fontFamily: 'monospace', fontSize: 12 }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Memuatkan...</div>
      ) : tab === 'leave' ? (
        pendingLeaves.length === 0 ? (
          <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Tiada permohonan cuti.</div>
        ) : pendingLeaves.map(req => (
          <Card key={req.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar name={req.employee_name} size={40} />
                <div>
                  <div style={{ fontSize: 14, color: '#ffffff', fontWeight: 600 }}>{req.employee_name}</div>
                  <div style={{ fontSize: 12, color: '#888888', marginTop: 2 }}>Cuti {leaveTypeLabel[req.leave_type]} · {req.days} hari</div>
                </div>
              </div>
              <Badge status="pending" />
            </div>
            <div style={{ fontSize: 12, color: '#aaaaaa', marginBottom: 4 }}>📅 {fmtDate(req.start_date)} – {fmtDate(req.end_date)}</div>
            {req.reason && <div style={{ fontSize: 12, color: '#888888', marginBottom: 14, fontStyle: 'italic' }}>"{req.reason}"</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleLeave(req.id, 'approve')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#166534', color: '#4ade80', fontFamily: 'monospace', fontSize: 12, cursor: 'pointer' }}>✓ Luluskan</button>
              <button onClick={() => handleLeave(req.id, 'reject')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#2a0000', color: '#ef4444', fontFamily: 'monospace', fontSize: 12, cursor: 'pointer' }}>✗ Tolak</button>
            </div>
          </Card>
        ))
      ) : (
        pendingOT.length === 0 ? (
          <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Tiada permohonan lebih masa.</div>
        ) : pendingOT.map(req => (
          <Card key={req.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar name={req.employee_name} size={40} />
                <div>
                  <div style={{ fontSize: 14, color: '#ffffff', fontWeight: 600 }}>{req.employee_name}</div>
                  <div style={{ fontSize: 12, color: '#facc15', marginTop: 2 }}>{req.hours}j · {req.rate}×</div>
                </div>
              </div>
              <Badge status="pending" />
            </div>
            <div style={{ fontSize: 12, color: '#aaaaaa', marginBottom: 4 }}>📅 {fmtDate(req.date)}</div>
            <div style={{ fontSize: 12, color: '#aaaaaa', marginBottom: 4 }}>⏱ {fmt12(req.start_time)} – {fmt12(req.end_time)}</div>
            {req.reason && <div style={{ fontSize: 12, color: '#888888', marginBottom: 14, fontStyle: 'italic' }}>"{req.reason}"</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleOT(req.id, 'approve')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#1a1200', color: '#facc15', fontFamily: 'monospace', fontSize: 12, cursor: 'pointer' }}>✓ Luluskan</button>
              <button onClick={() => handleOT(req.id, 'reject')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#2a0000', color: '#ef4444', fontFamily: 'monospace', fontSize: 12, cursor: 'pointer' }}>✗ Tolak</button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

// ── Report Page ───────────────────────────────────────────────────────────
function ReportPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getMonthlyReport(month).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [month]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 4 }}>LAPORAN</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28 }}>Kehadiran Bulanan</div>
      </div>

      <input type="month" value={month} onChange={e => setMonth(e.target.value)}
        style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #2a2a2a', background: '#111', color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13, marginBottom: 20, outline: 'none' }} />

      {loading ? (
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Memuatkan...</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', marginBottom: 28 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 14, minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                  {['NAMA', 'HADIR', 'LAMBAT', 'ABSENT', 'CUTI', 'OT (jam)'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', color: '#888888', letterSpacing: 1, textAlign: h === 'NAMA' ? 'left' : 'center', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '14px 12px', color: '#ffffff', fontWeight: 600 }}>{row.name}</td>
                    <td style={{ padding: '14px 12px', textAlign: 'center', color: '#4ade80' }}>{row.present_days || 0}</td>
                    <td style={{ padding: '14px 12px', textAlign: 'center', color: row.late_days > 0 ? '#facc15' : '#888888' }}>{row.late_days || 0}</td>
                    <td style={{ padding: '14px 12px', textAlign: 'center', color: row.absent_days > 0 ? '#ef4444' : '#888888' }}>{row.absent_days || 0}</td>
                    <td style={{ padding: '14px 12px', textAlign: 'center', color: '#60a5fa' }}>{row.leave_days || 0}</td>
                    <td style={{ padding: '14px 12px', textAlign: 'center', color: '#facc15' }}>{parseFloat(row.ot_hours || 0).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SectionTitle>Peratusan Kehadiran</SectionTitle>
          {data.map((row, i) => {
            const workdays = 22;
            const pct = Math.round(((row.present_days || 0) / workdays) * 100);
            return (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#e0e0e0', fontFamily: 'monospace' }}>{row.name}</span>
                  <span style={{ fontSize: 12, color: pct >= 95 ? '#4ade80' : pct >= 80 ? '#facc15' : '#ef4444', fontFamily: 'monospace' }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: pct >= 95 ? '#4ade80' : pct >= 80 ? '#facc15' : '#ef4444' }} />
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── Payroll Page ──────────────────────────────────────────────────────────
function PayrollPage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getPayrollPreview(month).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [month]);

  const handleExport = async () => {
    setExporting(true);
    try { await api.exportPayrollCSV(month); }
    catch (err) { alert(err.message); }
    finally { setExporting(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 4 }}>SQL PAYROLL</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28 }}>Export Gaji</div>
      </div>

      <input type="month" value={month} onChange={e => setMonth(e.target.value)}
        style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #2a2a2a', background: '#111', color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13, marginBottom: 20, outline: 'none' }} />

      <Card style={{ marginBottom: 20, background: '#0d1a0d', border: '1px solid #1e3a1e' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>ℹ️</span>
          <div style={{ fontSize: 12, color: '#888', lineHeight: 1.8 }}>
            Fail CSV ini diformat untuk import ke <strong style={{ color: '#4ade80' }}>SQL Payroll by SQL Account</strong>.<br />
            Selepas download: SQL Payroll → Payroll → Import → pilih fail ini.
          </div>
        </div>
      </Card>

      {loading ? (
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Memuatkan...</div>
      ) : data?.employees && (
        <>
          <SectionTitle>Pratonton Data</SectionTitle>
          <div style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 11, minWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                  {['NAMA', 'HADIR', 'ABSENT', 'CUTI', 'LAMBAT', 'OT BIASA', 'OT HUJUNG MINGGU'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', color: '#555', letterSpacing: 1, textAlign: h === 'NAMA' ? 'left' : 'center', fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.employees.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px 10px', color: '#e0e0e0' }}>{row.name}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#4ade80' }}>{row.present_days || 0}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: row.absent_days > 0 ? '#ef4444' : '#555' }}>{row.absent_days || 0}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#60a5fa' }}>{row.leave_days || 0}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: row.late_count > 0 ? '#facc15' : '#555' }}>{row.late_count || 0}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#facc15' }}>{parseFloat(row.ot_hours_weekday || 0).toFixed(1)}j</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', color: '#facc15' }}>{parseFloat(row.ot_hours_weekend || 0).toFixed(1)}j</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={handleExport} disabled={exporting} style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', background: exporting ? '#166534' : '#4ade80', color: '#0a0a0a', fontFamily: 'monospace', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            {exporting ? '⏳ Mengeksport...' : '⬇ Download CSV untuk SQL Payroll'}
          </button>
        </>
      )}
    </div>
  );
}

// ── Employees Page ────────────────────────────────────────────────────────
function EmployeesPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'technician', shift_type: 'office', phone: '' });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => { setLoading(true); api.getUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) return setMsg('Sila lengkapkan semua maklumat.');
    setAdding(true); setMsg('');
    try {
      await api.createUser(form);
      setMsg('✓ Pekerja berjaya ditambah');
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', role: 'technician', shift_type: 'office', phone: '' });
      load();
    } catch (err) { setMsg(err.message); }
    finally { setAdding(false); }
  };

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #2a2a2a', background: '#0a0a0a', color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13, boxSizing: 'border-box', outline: 'none' };
  const roleLabel = { boss: 'Boss', partner: 'Partner', technician: 'Technician', account: 'Account' };
  const shiftLabel = { office: '9am–6pm', factory: '8am–5:30pm' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 4 }}>PENGURUSAN</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28 }}>Pekerja</div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#4ade80', color: '#0a0a0a', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          + Tambah
        </button>
      </div>

      {showAdd && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, marginBottom: 16 }}>Tambah Pekerja Baru</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input placeholder="Nama penuh" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
            <input placeholder="Telefon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} />
            <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inp} />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ ...inp }}>
              <option value="technician">Technician</option>
              <option value="partner">Partner</option>
              <option value="account">Account</option>
            </select>
            <select value={form.shift_type} onChange={e => setForm({ ...form, shift_type: e.target.value })} style={{ ...inp }}>
              <option value="office">Syif Pejabat (9am–6pm)</option>
              <option value="factory">Syif Kilang (8am–5:30pm)</option>
            </select>
          </div>
          {msg && <div style={{ fontSize: 11, fontFamily: 'monospace', color: msg.startsWith('✓') ? '#4ade80' : '#ef4444', marginBottom: 10 }}>{msg}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} disabled={adding} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#4ade80', color: '#0a0a0a', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
              {adding ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button onClick={() => setShowAdd(false)} style={{ padding: '12px 20px', borderRadius: 10, border: '1px solid #333', background: 'transparent', color: '#888', fontFamily: 'monospace', cursor: 'pointer' }}>Batal</button>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Memuatkan...</div>
      ) : users.map(u => (
        <Card key={u.id} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={u.name} size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#ffffff', fontWeight: 600, marginBottom: 4 }}>{u.name}</div>
              <div style={{ fontSize: 12, color: '#888888' }}>{u.email}</div>
              <div style={{ fontSize: 12, color: '#888888', marginTop: 2 }}>📞 {u.phone || '-'} · ⏰ {shiftLabel[u.shift_type]}</div>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 10, background: '#1e1e1e', color: '#aaaaaa', fontFamily: 'monospace' }}>
              {roleLabel[u.role]}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Customers Page ────────────────────────────────────────────────────────
function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '' });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => { setLoading(true); api.getCustomers().then(setCustomers).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name) return setMsg('Sila isi Nama Syarikat.');
    setAdding(true); setMsg('');
    try {
      await api.createCustomer(form);
      setMsg('✓ Pelanggan berjaya ditambah');
      setShowAdd(false);
      setForm({ name: '', contact_person: '', phone: '', email: '' });
      load();
    } catch (err) { setMsg(err.message); }
    finally { setAdding(false); }
  };

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #2a2a2a', background: '#0a0a0a', color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13, boxSizing: 'border-box', outline: 'none' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 4 }}>SERVIS</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, color: '#ffffff' }}>Pelanggan</div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#4ade80', color: '#0a0a0a', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          + Tambah Pelanggan
        </button>
      </div>

      {showAdd && (
        <Card style={{ marginBottom: 20, background: '#1a1a1a', borderColor: '#2a2a2a' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: '#e0e0e0', marginBottom: 16 }}>Tambah Pelanggan Baru</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input placeholder="Nama Syarikat *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
            <input placeholder="Nama Kontak" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} style={inp} />
            <input placeholder="Telefon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} />
            <input placeholder="Emel" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} />
          </div>
          {msg && <div style={{ fontSize: 11, fontFamily: 'monospace', color: msg.startsWith('✓') ? '#4ade80' : '#ef4444', marginBottom: 10 }}>{msg}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} disabled={adding} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#4ade80', color: '#0a0a0a', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
              {adding ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button onClick={() => { setShowAdd(false); setMsg(''); }} style={{ padding: '12px 20px', borderRadius: 10, border: '1px solid #333', background: 'transparent', color: '#888', fontFamily: 'monospace', cursor: 'pointer' }}>Batal</button>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Memuatkan...</div>
      ) : customers.length === 0 ? (
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Tiada data.</div>
      ) : customers.map(c => (
        <Card key={c.id} style={{ marginBottom: 10, background: '#1a1a1a', borderColor: '#2a2a2a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={c.name} size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#ffffff', fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: '#aaaaaa', marginBottom: 2 }}>👤 {c.contact_person || '-'}</div>
              <div style={{ fontSize: 12, color: '#888888', display: 'flex', gap: 16 }}>
                <span>📞 {c.phone || '-'}</span>
                <span>✉ {c.email || '-'}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Contracts Page ────────────────────────────────────────────────────────
function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ contract_no: '', customer_id: '', contract_type: '', service_scope: '', start_date: '', end_date: '', amount: '' });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => { setLoading(true); api.getContracts().then(setContracts).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => {
    load();
    api.getCustomers().then(setCustomers).catch(() => {});
  }, []);

  const handleAdd = async () => {
    if (!form.contract_no) return setMsg('Sila isi No. Kontrak.');
    setAdding(true); setMsg('');
    try {
      await api.createContract({ ...form, amount: form.amount ? parseFloat(form.amount) : undefined });
      setMsg('✓ Kontrak berjaya ditambah');
      setShowAdd(false);
      setForm({ contract_no: '', customer_id: '', contract_type: '', service_scope: '', start_date: '', end_date: '', amount: '' });
      load();
    } catch (err) { setMsg(err.message); }
    finally { setAdding(false); }
  };

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #2a2a2a', background: '#0a0a0a', color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13, boxSizing: 'border-box', outline: 'none' };

  const statusStyle = {
    active:     { bg: '#166534', color: '#4ade80' },
    expired:    { bg: '#7f1d1d', color: '#f87171' },
    pending:    { bg: '#713f12', color: '#fbbf24' },
    terminated: { bg: '#1f2937', color: '#9ca3af' },
  };
  const statusLabel = { active: 'AKTIF', expired: 'TAMAT', pending: 'PENDING', terminated: 'TAMAT AWAL' };

  const isExpiringSoon = (endDate) => {
    if (!endDate) return false;
    const diff = (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 60;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 4 }}>SERVIS</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, color: '#ffffff' }}>Kontrak</div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#4ade80', color: '#0a0a0a', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          + Tambah Kontrak
        </button>
      </div>

      {showAdd && (
        <Card style={{ marginBottom: 20, background: '#1a1a1a', borderColor: '#2a2a2a' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: '#e0e0e0', marginBottom: 16 }}>Tambah Kontrak Baru</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input placeholder="No. Kontrak *" value={form.contract_no} onChange={e => setForm({ ...form, contract_no: e.target.value })} style={inp} />
            <select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} style={inp}>
              <option value="">Pilih Pelanggan</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Jenis Kontrak" value={form.contract_type} onChange={e => setForm({ ...form, contract_type: e.target.value })} style={inp} />
            <input type="number" placeholder="Jumlah (RM)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inp} />
            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inp} />
            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inp} />
            <textarea placeholder="Skop Servis" value={form.service_scope} onChange={e => setForm({ ...form, service_scope: e.target.value })} style={{ ...inp, gridColumn: '1 / -1', resize: 'vertical', minHeight: 80 }} />
          </div>
          {msg && <div style={{ fontSize: 11, fontFamily: 'monospace', color: msg.startsWith('✓') ? '#4ade80' : '#ef4444', marginBottom: 10 }}>{msg}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} disabled={adding} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#4ade80', color: '#0a0a0a', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
              {adding ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button onClick={() => { setShowAdd(false); setMsg(''); }} style={{ padding: '12px 20px', borderRadius: 10, border: '1px solid #333', background: 'transparent', color: '#888', fontFamily: 'monospace', cursor: 'pointer' }}>Batal</button>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Memuatkan...</div>
      ) : contracts.length === 0 ? (
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Tiada data.</div>
      ) : contracts.map(c => {
        const ss = statusStyle[c.status] || { bg: '#1f2937', color: '#9ca3af' };
        const expiring = isExpiringSoon(c.end_date);
        return (
          <Card key={c.id} style={{ marginBottom: 10, background: '#1a1a1a', borderColor: expiring ? '#fbbf2466' : '#2a2a2a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: '#ffffff', fontWeight: 600, fontFamily: 'monospace' }}>{c.contract_no}</span>
                  {expiring && <span style={{ fontSize: 9, color: '#fbbf24', background: '#fbbf2420', padding: '2px 8px', borderRadius: 100, letterSpacing: 1 }}>⚠ HAMPIR TAMAT</span>}
                </div>
                <div style={{ fontSize: 12, color: '#aaaaaa' }}>{c.customer_name || c.customer?.name || '-'}</div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, letterSpacing: 1, background: ss.bg, color: ss.color, fontFamily: 'monospace' }}>
                {statusLabel[c.status] || c.status?.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#888888', display: 'flex', gap: 20 }}>
              <span>📅 {fmtDate(c.start_date)} – {fmtDate(c.end_date)}</span>
              {c.amount != null && <span style={{ color: '#4ade80' }}>RM {parseFloat(c.amount).toFixed(2)}</span>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── Cases Page ────────────────────────────────────────────────────────────
function CasesPage() {
  const [cases, setCases] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', customer_id: '', case_type: 'maintenance', priority: 'normal', scheduled_date: '', problem_desc: '', assigned_to: '', contract_id: '' });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');

  // Detail view state
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetail, setCaseDetail] = useState(null);
  const [reports, setReports] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => { setLoading(true); api.getCases().then(setCases).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => {
    load();
    api.getCustomers().then(setCustomers).catch(() => {});
    api.getUsers().then(all => setTechnicians(all.filter(u => u.role === 'technician'))).catch(() => {});
    api.getContracts().then(setContracts).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCase) { setCaseDetail(null); setReports([]); return; }
    setDetailLoading(true);
    Promise.all([api.getCaseById(selectedCase.id), api.getCaseReports(selectedCase.id)])
      .then(([detail, reps]) => { setCaseDetail(detail); setReports(reps); setNewStatus(detail.status); })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, [selectedCase]);

  const handleAdd = async () => {
    if (!form.title) return setMsg('Sila isi Tajuk kes.');
    setAdding(true); setMsg('');
    try {
      await api.createCase({ ...form, contract_id: form.contract_id || undefined, assigned_to: form.assigned_to || undefined });
      setMsg('✓ Kes berjaya ditambah');
      setShowAdd(false);
      setForm({ title: '', customer_id: '', case_type: 'maintenance', priority: 'normal', scheduled_date: '', problem_desc: '', assigned_to: '', contract_id: '' });
      load();
    } catch (err) { setMsg(err.message); }
    finally { setAdding(false); }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === caseDetail.status) return;
    setUpdating(true);
    try {
      const updated = await api.updateCase(selectedCase.id, { status: newStatus });
      setCaseDetail(updated);
      load();
    } catch (err) { alert(err.message); }
    finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Padam kes "${caseDetail?.title}"? Tindakan ini tidak boleh dibatalkan.`)) return;
    setDeleting(true);
    try {
      await api.deleteCase(selectedCase.id);
      setSelectedCase(null);
      load();
    } catch (err) { alert(err.message); }
    finally { setDeleting(false); }
  };

  const inp = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #2a2a2a', background: '#0a0a0a', color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13, boxSizing: 'border-box', outline: 'none' };

  const statusStyle = {
    open:        { bg: '#1e3a5f', color: '#60a5fa' },
    in_progress: { bg: '#713f12', color: '#fbbf24' },
    completed:   { bg: '#166534', color: '#4ade80' },
    cancelled:   { bg: '#1f2937', color: '#9ca3af' },
  };
  const statusLabel = { open: 'BUKA', in_progress: 'DALAM PROSES', completed: 'SELESAI', cancelled: 'BATAL' };
  const caseTypeLabel = { maintenance: 'PENYELENGGARAAN', repair: 'PEMBAIKAN', emergency: 'KECEMASAN', inspection: 'PEMERIKSAAN' };
  const priorityStyle = { low: { color: '#888' }, normal: { color: '#60a5fa' }, high: { color: '#fbbf24' }, urgent: { color: '#f87171' } };
  const priorityLabel = { low: 'RENDAH', normal: 'NORMAL', high: 'TINGGI', urgent: 'URGENT' };
  const isUuid = (s) => typeof s === 'string' && s.length === 36 && s[8] === '-';

  // ── Detail View ──────────────────────────────────────────────────────────
  if (selectedCase) {
    const d = caseDetail;
    const ss = d ? (statusStyle[d.status] || { bg: '#1f2937', color: '#9ca3af' }) : null;
    const ps = d ? (priorityStyle[d.priority] || { color: '#888' }) : null;

    return (
      <div>
        <button onClick={() => setSelectedCase(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #2a2a2a', background: 'transparent', color: '#888', fontFamily: 'monospace', fontSize: 12, cursor: 'pointer', marginBottom: 24 }}>
          ← Kembali
        </button>

        {detailLoading ? (
          <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Memuatkan...</div>
        ) : !d ? (
          <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Tiada data.</div>
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 4 }}>KES SERVIS</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: '#ffffff', marginBottom: 10 }}>{d.title}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, letterSpacing: 1, background: ss.bg, color: ss.color, fontFamily: 'monospace' }}>
                  {statusLabel[d.status] || d.status?.toUpperCase()}
                </span>
                {d.case_type && (
                  <span style={{ fontSize: 9, color: '#60a5fa', background: '#1e3a5f', padding: '3px 10px', borderRadius: 4, letterSpacing: 1, fontFamily: 'monospace' }}>
                    {caseTypeLabel[d.case_type] || d.case_type.toUpperCase()}
                  </span>
                )}
                {d.priority && (
                  <span style={{ fontSize: 9, color: ps.color, background: ps.color + '20', padding: '3px 10px', borderRadius: 4, letterSpacing: 1, fontFamily: 'monospace' }}>
                    {priorityLabel[d.priority] || d.priority.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <SectionTitle>Maklumat Kes</SectionTitle>
            <Card style={{ marginBottom: 20, background: '#1a1a1a', borderColor: '#2a2a2a' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  ['No. Kes', d.case_no],
                  ['Pelanggan', d.customer_name || d.customer?.name || '-'],
                  ['Lokasi', d.location || '-'],
                  ['No. Kontrak', d.contract_no || d.contract?.contract_no || '-'],
                  ['Teknisyen', d.assigned_to_name || (isUuid(d.assigned_to) ? d.assigned_to?.slice(0, 8) + '…' : d.assigned_to) || '-'],
                  ['Tarikh Dijadual', d.scheduled_date ? fmtDate(d.scheduled_date) : '-'],
                  ['Dicipta', d.created_at ? fmtDate(d.created_at) : '-'],
                  ['Dikemaskini', d.updated_at ? fmtDate(d.updated_at) : '-'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 9, color: '#888888', letterSpacing: 2, marginBottom: 4 }}>{label.toUpperCase()}</div>
                    <div style={{ fontSize: 14, color: '#e5e5e5', fontFamily: 'monospace' }}>{val}</div>
                  </div>
                ))}
              </div>
              {d.problem_desc && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #2a2a2a' }}>
                  <div style={{ fontSize: 9, color: '#888888', letterSpacing: 2, marginBottom: 6 }}>PENERANGAN MASALAH</div>
                  <div style={{ fontSize: 14, color: '#aaaaaa', lineHeight: 1.7 }}>{d.problem_desc}</div>
                </div>
              )}
            </Card>

            {/* Reports */}
            <SectionTitle>Laporan Kerja ({reports.length})</SectionTitle>
            {reports.length === 0 ? (
              <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 24, marginBottom: 20 }}>Tiada laporan kerja.</div>
            ) : reports.map((r, i) => (
              <Card key={r.id || i} style={{ marginBottom: 12, background: '#1a1a1a', borderColor: '#2a2a2a' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: r.work_done ? 12 : 0 }}>
                  <div>
                    <div style={{ fontSize: 9, color: '#888888', letterSpacing: 2, marginBottom: 4 }}>TIBA</div>
                    <div style={{ fontSize: 14, color: '#e5e5e5', fontFamily: 'monospace' }}>{r.arrived_at ? fmt12(r.arrived_at) : '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: '#888888', letterSpacing: 2, marginBottom: 4 }}>SELESAI</div>
                    <div style={{ fontSize: 14, color: '#e5e5e5', fontFamily: 'monospace' }}>{r.completed_at ? fmt12(r.completed_at) : '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: '#888888', letterSpacing: 2, marginBottom: 4 }}>TANDATANGAN PELANGGAN</div>
                    <div style={{ fontSize: 14, fontFamily: 'monospace', color: r.customer_signed ? '#4ade80' : '#ef4444' }}>{r.customer_signed ? '✓ Ya' : '✗ Belum'}</div>
                  </div>
                </div>
                {r.work_done && (
                  <div style={{ paddingTop: 12, borderTop: '1px solid #2a2a2a', marginBottom: r.parts?.length ? 12 : 0 }}>
                    <div style={{ fontSize: 9, color: '#888888', letterSpacing: 2, marginBottom: 6 }}>KERJA DILAKUKAN</div>
                    <div style={{ fontSize: 14, color: '#aaaaaa', lineHeight: 1.7 }}>{r.work_done}</div>
                  </div>
                )}
                {r.parts?.length > 0 && (
                  <div style={{ paddingTop: 12, borderTop: '1px solid #2a2a2a' }}>
                    <div style={{ fontSize: 9, color: '#888888', letterSpacing: 2, marginBottom: 8 }}>ALAT GANTI</div>
                    {r.parts.map((p, j) => (
                      <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: 'monospace', color: '#aaaaaa', marginBottom: 4 }}>
                        <span>{p.part_name}</span>
                        <span>{p.quantity}× <span style={{ color: '#4ade80' }}>RM {parseFloat(p.unit_cost || 0).toFixed(2)}</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}

            {/* Actions */}
            <SectionTitle>Tindakan</SectionTitle>
            <Card style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, color: '#888888', letterSpacing: 2, marginBottom: 8 }}>TUKAR STATUS</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ ...inp, flex: 1 }}>
                    <option value="open">Buka</option>
                    <option value="in_progress">Dalam Proses</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Batal</option>
                  </select>
                  <button onClick={handleUpdateStatus} disabled={updating || newStatus === d.status} style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: newStatus === d.status ? '#1a1a1a' : '#4ade80', color: newStatus === d.status ? '#555' : '#0a0a0a', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, cursor: newStatus === d.status ? 'default' : 'pointer' }}>
                    {updating ? 'Menyimpan...' : 'Kemaskini'}
                  </button>
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: '1px solid #2a2a2a' }}>
                <div style={{ fontSize: 9, color: '#888888', letterSpacing: 2, marginBottom: 8 }}>ZON BAHAYA</div>
                <button onClick={handleDelete} disabled={deleting} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #7f1d1d', background: 'transparent', color: '#f87171', fontFamily: 'monospace', fontSize: 12, cursor: 'pointer' }}>
                  {deleting ? 'Memadamkan...' : '✕ Padam Kes'}
                </button>
              </div>
            </Card>
          </>
        )}
      </div>
    );
  }

  // ── List View ─────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 4 }}>SERVIS</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, color: '#ffffff' }}>Kes Servis</div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#4ade80', color: '#0a0a0a', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          + Tambah Kes
        </button>
      </div>

      {showAdd && (
        <Card style={{ marginBottom: 20, background: '#1a1a1a', borderColor: '#2a2a2a' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: '#e0e0e0', marginBottom: 16 }}>Tambah Kes Servis Baru</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input placeholder="Tajuk *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ ...inp, gridColumn: '1 / -1' }} />
            <select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} style={inp}>
              <option value="">Pilih Pelanggan</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={form.contract_id} onChange={e => setForm({ ...form, contract_id: e.target.value })} style={inp}>
              <option value="">Kontrak (Pilihan)</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{c.contract_no}</option>)}
            </select>
            <select value={form.case_type} onChange={e => setForm({ ...form, case_type: e.target.value })} style={inp}>
              <option value="maintenance">Penyelenggaraan</option>
              <option value="repair">Pembaikan</option>
              <option value="emergency">Kecemasan</option>
              <option value="inspection">Pemeriksaan</option>
            </select>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={inp}>
              <option value="low">Rendah</option>
              <option value="normal">Normal</option>
              <option value="high">Tinggi</option>
              <option value="urgent">Urgent</option>
            </select>
            <input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} style={inp} />
            <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} style={inp}>
              <option value="">Assign Kepada (Pilihan)</option>
              {technicians.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <textarea placeholder="Penerangan Masalah" value={form.problem_desc} onChange={e => setForm({ ...form, problem_desc: e.target.value })} style={{ ...inp, gridColumn: '1 / -1', resize: 'vertical', minHeight: 80 }} />
          </div>
          {msg && <div style={{ fontSize: 11, fontFamily: 'monospace', color: msg.startsWith('✓') ? '#4ade80' : '#ef4444', marginBottom: 10 }}>{msg}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} disabled={adding} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#4ade80', color: '#0a0a0a', fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}>
              {adding ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button onClick={() => { setShowAdd(false); setMsg(''); }} style={{ padding: '12px 20px', borderRadius: 10, border: '1px solid #333', background: 'transparent', color: '#888', fontFamily: 'monospace', cursor: 'pointer' }}>Batal</button>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Memuatkan...</div>
      ) : cases.length === 0 ? (
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 40 }}>Tiada data.</div>
      ) : cases.map(c => {
        const ss = statusStyle[c.status] || { bg: '#1f2937', color: '#9ca3af' };
        const assignedLabel = c.assigned_to_name || (isUuid(c.assigned_to) ? c.assigned_to.slice(0, 8) + '…' : c.assigned_to);
        return (
          <Card key={c.id} onClick={() => setSelectedCase(c)} style={{ marginBottom: 10, background: '#1a1a1a', borderColor: '#2a2a2a', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#555', fontFamily: 'monospace' }}>{c.case_no}</span>
                  <span style={{ fontSize: 14, color: '#ffffff', fontWeight: 600 }}>{c.title}</span>
                </div>
                <div style={{ fontSize: 12, color: '#aaaaaa', marginBottom: 8 }}>{c.customer_name || c.customer?.name || '-'}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {c.case_type && (
                    <span style={{ fontSize: 9, color: '#60a5fa', background: '#1e3a5f', padding: '2px 8px', borderRadius: 4, letterSpacing: 1, fontFamily: 'monospace' }}>
                      {caseTypeLabel[c.case_type] || c.case_type.toUpperCase()}
                    </span>
                  )}
                  {assignedLabel && (
                    <span style={{ fontSize: 12, color: '#aaaaaa', fontFamily: 'monospace' }}>👤 {assignedLabel}</span>
                  )}
                  {c.scheduled_date && (
                    <span style={{ fontSize: 12, color: '#888888', fontFamily: 'monospace' }}>📅 {fmtDate(c.scheduled_date)}</span>
                  )}
                </div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, letterSpacing: 1, background: ss.bg, color: ss.color, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                {statusLabel[c.status] || c.status?.toUpperCase()}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [user, setUser] = useState(api.getUser());
  const [page, setPage] = useState('dashboard');

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => { api.logout(); setUser(null); };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const canApprove = ['boss', 'partner'].includes(user.role);
  const canExport = ['boss', 'account'].includes(user.role);
  const canManage = user.role === 'boss';

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '⊙' },
    ...(canApprove ? [{ key: 'approvals', label: 'Kelulusan', icon: '✓' }] : []),
    { key: 'report', label: 'Laporan', icon: '≡' },
    ...(canExport ? [{ key: 'payroll', label: 'Gaji', icon: '₿' }] : []),
    ...(canManage ? [{ key: 'employees', label: 'Pekerja', icon: '◎' }] : []),
    { key: 'customers', label: 'Pelanggan', icon: '◈' },
    { key: 'contracts', label: 'Kontrak', icon: '📋' },
    { key: 'cases', label: 'Kes Servis', icon: '⚙' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a', color: '#e0e0e0', fontFamily: "'DM Mono',monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=month]::-webkit-calendar-picker-indicator { filter: invert(1); }
        button:hover { opacity: 0.85; }
        select option { background: #111; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 220, background: '#0d0d0d', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', padding: '28px 0', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <div style={{ padding: '0 22px 24px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: 9, color: '#555', letterSpacing: 3, marginBottom: 4 }}>GAINSYS</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: '#4ade80' }}>Solution</div>
          <div style={{ fontSize: 9, color: '#333', marginTop: 2, letterSpacing: 1 }}>Admin Dashboard</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setPage(item.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: page === item.key ? '#4ade8015' : 'transparent', color: page === item.key ? '#ffffff' : '#cccccc', fontWeight: page === item.key ? 700 : 500, fontFamily: "'DM Mono',monospace", fontSize: 13, marginBottom: 2, textAlign: 'left' }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 22px', borderTop: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar name={user.name} size={32} />
            <div>
              <div style={{ fontSize: 11, color: '#e0e0e0' }}>{user.name}</div>
              <div style={{ fontSize: 9, color: '#555' }}>{user.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #2a0000', background: 'transparent', color: '#ef4444', fontFamily: 'monospace', fontSize: 11, cursor: 'pointer' }}>Log Keluar</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '36px 40px', overflowY: 'auto', maxHeight: '100vh' }}>
        {page === 'dashboard'  && <DashboardPage user={user} />}
        {page === 'approvals'  && <ApprovalsPage />}
        {page === 'report'     && <ReportPage />}
        {page === 'payroll'    && <PayrollPage />}
        {page === 'employees'  && <EmployeesPage />}
        {page === 'customers'  && <CustomersPage />}
        {page === 'contracts'  && <ContractsPage />}
        {page === 'cases'      && <CasesPage />}
      </div>
    </div>
  );
}
