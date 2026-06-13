import { useState, useRef, useEffect, useCallback } from 'react';
import { AlertTriangle, TrendingUp, Clock, CheckCircle2, Users, Zap, Plus, Trash2, X, ChevronDown, HardDrive, RefreshCw, Thermometer } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import PriorityBadge from '../shared/PriorityBadge';
import type { TicketStatus, TicketPriority, Incident } from '../../types';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../types';
import { getNASStorage } from '../../api/nas';
import type { NASStorageResult } from '../../api/nas';

const STATUS_COLORS: Record<TicketStatus, string> = {
  new: '#3b82f6',
  assigned: '#8b5cf6',
  in_progress: '#f59e0b',
  waiting_user: '#f97316',
  resolved: '#22c55e',
  closed: '#6b7280',
  reopened: '#ef4444',
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: '#22c55e',
  medium: '#3b82f6',
  high: '#f97316',
  critical: '#ef4444',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl px-3 py-2 text-xs border border-white/10">
        <div className="text-white/70 mb-1">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.fill }} className="font-medium">{p.value} รายการ</div>
        ))}
      </div>
    );
  }
  return null;
};

// ── Add Incident Modal ─────────────────────────────────────────────────────────
function AddIncidentModal({ onClose, onAdd, currentUserName }: {
  onClose: () => void;
  onAdd: (i: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>) => void;
  currentUserName: string;
}) {
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [severity, setSeverity] = useState<Incident['severity']>('medium');
  const [status, setStatus]     = useState<Incident['status']>('investigating');
  const [err, setErr]           = useState('');

  const submit = () => {
    if (!title.trim()) { setErr('กรุณาระบุหัวข้อ'); return; }
    onAdd({ title: title.trim(), description: description.trim(), severity, status, affectedServices: [], createdBy: currentUserName, resolvedAt: undefined });
    onClose();
  };

  const severityColors: Record<Incident['severity'], string> = {
    low: 'text-green-300', medium: 'text-blue-300', high: 'text-orange-300', critical: 'text-red-300',
  };
  const severityLabels: Record<Incident['severity'], string> = {
    low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง', critical: 'วิกฤต',
  };
  const statusLabels: Record<Incident['status'], string> = {
    investigating: 'กำลังตรวจสอบ', identified: 'ระบุสาเหตุแล้ว', monitoring: 'กำลังติดตาม', resolved: 'แก้ไขแล้ว',
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass rounded-2xl p-5 w-full max-w-md shadow-window fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-white/85">เพิ่ม Incident</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/08 hover:bg-white/14 flex items-center justify-center transition-colors">
            <X size={14} className="text-white/60" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-white/45 mb-1.5 block">หัวข้อ *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="เช่น ระบบ ERP ช้าผิดปกติ"
              className="win-input w-full text-[13px]" />
          </div>
          <div>
            <label className="text-[11px] text-white/45 mb-1.5 block">รายละเอียด</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)}
              placeholder="อธิบายปัญหาโดยย่อ"
              rows={2}
              className="win-input w-full text-[13px] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/45 mb-1.5 block">ความรุนแรง</label>
              <select value={severity} onChange={e => setSeverity(e.target.value as Incident['severity'])}
                className="win-input w-full text-[13px]">
                {(Object.keys(severityLabels) as Incident['severity'][]).map(s => (
                  <option key={s} value={s}>{severityLabels[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-white/45 mb-1.5 block">สถานะ</label>
              <select value={status} onChange={e => setStatus(e.target.value as Incident['status'])}
                className="win-input w-full text-[13px]">
                {(Object.keys(statusLabels) as Incident['status'][]).map(s => (
                  <option key={s} value={s}>{statusLabels[s]}</option>
                ))}
              </select>
            </div>
          </div>
          {err && <p className="text-red-400 text-[11px]">{err}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="win-btn text-[12px]">ยกเลิก</button>
          <button onClick={submit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            style={{ background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.4)', color: '#fb923c' }}>
            <Plus size={13} /> เพิ่ม
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Incident Status Dropdown ───────────────────────────────────────────────────
function IncidentStatusDrop({ current, onChange }: { current: Incident['status']; onChange: (s: Incident['status']) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const btnRef          = useRef<HTMLButtonElement>(null);
  const statusColors: Record<Incident['status'], string> = {
    investigating: 'text-red-400 bg-red-500/10 border-red-500/20',
    identified:    'text-orange-400 bg-orange-500/10 border-orange-500/20',
    monitoring:    'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    resolved:      'text-green-400 bg-green-500/10 border-green-500/20',
  };
  const statusLabels: Record<Incident['status'], string> = {
    investigating: 'กำลังตรวจสอบ', identified: 'ระบุสาเหตุแล้ว', monitoring: 'กำลังติดตาม', resolved: 'แก้ไขแล้ว',
  };
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!btnRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <>
      <button ref={btnRef}
        onClick={e => {
          e.stopPropagation();
          if (btnRef.current) { const r = btnRef.current.getBoundingClientRect(); setPos({ top: r.bottom + 4, left: r.left }); }
          setOpen(v => !v);
        }}
        className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 hover:opacity-80 transition-opacity ${statusColors[current]}`}>
        {statusLabels[current]}<ChevronDown size={8} />
      </button>
      {open && createPortal(
        <div className="glass rounded-xl p-1 shadow-window fade-in"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 152, zIndex: 9999 }}>
          {(Object.keys(statusLabels) as Incident['status'][]).map(s => (
            <button key={s} onMouseDown={e => e.stopPropagation()}
              onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-white/08 transition-colors ${current === s ? 'bg-white/06' : ''}`}>
              <span className={statusColors[s].split(' ')[0]}>{statusLabels[s]}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0; let val = bytes;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

// ── NAS Storage Card ───────────────────────────────────────────────────────────
function NasCard() {
  const [data, setData]     = useState<NASStorageResult | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getNASStorage()); }
    catch { setData({ configured: true, ok: false, error: 'เชื่อมต่อไม่ได้' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  if (!data || !data.configured) return null;

  const volumes  = data.volumes ?? [];
  const totalAll = volumes.reduce((s, v) => s + v.total, 0);
  const usedAll  = volumes.reduce((s, v) => s + v.used, 0);
  const freeAll  = totalAll - usedAll;
  const pctAll   = totalAll > 0 ? Math.round((usedAll / totalAll) * 100) : 0;
  const barColor = pctAll >= 90 ? '#ef4444' : pctAll >= 75 ? '#f59e0b' : '#22c55e';

  return (
    <div className="glass-card rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HardDrive size={14} className="text-sky-400" />
          <span className="section-title mb-0">Synology NAS</span>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors disabled:opacity-40">
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
        </button>
      </div>

      {!data.ok ? (
        <div className="flex items-center gap-2 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle size={13} /> เชื่อมต่อ NAS ไม่ได้: {data.error}
        </div>
      ) : volumes.length === 0 ? (
        <div className="text-white/30 text-[12px] py-2">ไม่พบข้อมูล Volume</div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Aggregate progress */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-[11px] text-white/50 mb-1.5">
              <span>ใช้ไป <span className="text-white/70 font-medium">{fmtBytes(usedAll)}</span> จาก {fmtBytes(totalAll)}</span>
              <span style={{ color: barColor }} className="font-semibold">{pctAll}%</span>
            </div>
            <div className="h-2.5 bg-white/[0.08] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pctAll}%`, background: barColor, boxShadow: `0 0 10px ${barColor}55` }} />
            </div>
            <div className="flex justify-between text-[10px] text-white/30 mt-1.5">
              <span>ว่าง: <span className="text-green-400 font-medium">{fmtBytes(freeAll)}</span></span>
              <span>{volumes.length} Volume{volumes.length > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Per-volume pills */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {volumes.map(vol => {
              const pct = vol.total > 0 ? Math.round((vol.used / vol.total) * 100) : 0;
              const c   = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#22c55e';
              return (
                <div key={vol.path}
                  className="flex items-center gap-2.5 bg-white/[0.05] border border-white/[0.09] rounded-xl px-3 py-2">
                  <HardDrive size={11} className="text-white/40" />
                  <div>
                    <div className="text-[11px] text-white/75 font-medium leading-tight">{vol.name || vol.path}</div>
                    <div className="text-[10px] text-white/40 leading-tight">{fmtBytes(vol.free)} ว่าง</div>
                  </div>
                  <span className="text-[12px] font-bold ml-1" style={{ color: c }}>{pct}%</span>
                </div>
              );
            })}

            {/* Disk temps */}
            {(data.disks ?? []).length > 0 && (
              <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2">
                <Thermometer size={11} className="text-white/35" />
                <div className="flex flex-wrap gap-2">
                  {(data.disks ?? []).map(d => {
                    const tc = d.temp >= 55 ? 'text-red-400' : d.temp >= 45 ? 'text-amber-400' : 'text-green-400';
                    return (
                      <span key={d.id} className="text-[10px] text-white/50">
                        {d.name} <span className={`font-semibold ${tc}`}>{d.temp}°C</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ITDashboard() {
  const { currentUser, tickets, users, incidents, navigate, addIncident, updateIncidentStatus, deleteIncident } = useApp();
  const [showAddIncident, setShowAddIncident] = useState(false);

  if (currentUser.role === 'employee') {
    return (
      <div className="module-content flex items-center justify-center">
        <div className="text-center text-white/30">
          <AlertTriangle size={40} className="mx-auto mb-3 opacity-40" />
          <p>ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const openTickets = tickets.filter(t => !['resolved', 'closed'].includes(t.status));
  const overdueTickets = openTickets.filter(t => new Date(t.slaDueTime) < now);
  const criticalOpen = openTickets.filter(t => t.priority === 'critical');
  const resolvedToday = tickets.filter(t => {
    const d = new Date(t.updatedAt);
    return (t.status === 'resolved' || t.status === 'closed') &&
      d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  });

  // Status chart data
  const statusData = (['new', 'assigned', 'in_progress', 'waiting_user', 'resolved', 'closed', 'reopened'] as TicketStatus[])
    .map(s => ({
      name: STATUS_LABELS[s],
      value: tickets.filter(t => t.status === s).length,
      fill: STATUS_COLORS[s],
    })).filter(d => d.value > 0);

  // Priority pie data
  const priorityData = (['critical', 'high', 'medium', 'low'] as TicketPriority[])
    .map(p => ({
      name: PRIORITY_LABELS[p],
      value: tickets.filter(t => t.priority === p).length,
      fill: PRIORITY_COLORS[p],
    })).filter(d => d.value > 0);

  // Staff workload
  const itStaff = users.filter(u => u.role === 'it_staff' || u.role === 'it_manager');
  const staffWorkload = itStaff.map(u => ({
    user: u,
    assigned: openTickets.filter(t => t.assigneeId === u.id).length,
    total: tickets.filter(t => t.assigneeId === u.id).length,
  })).sort((a, b) => b.assigned - a.assigned);

  const recentCritical = [...tickets]
    .filter(t => t.priority === 'critical')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="module-content fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-semibold text-white/90">Dashboard ทีม IT</h2>
          <p className="text-sm text-white/40 mt-0.5">
            ภาพรวมระบบ · {now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => navigate('all_tickets')} className="win-btn flex items-center gap-2">
          <Zap size={14} />
          จัดการ Ticket ทั้งหมด
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Ticket เปิดทั้งหมด', value: openTickets.length, icon: <Clock size={16} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
          { label: 'แก้ไขแล้ววันนี้', value: resolvedToday.length, icon: <CheckCircle2 size={16} />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
          { label: 'เกิน SLA', value: overdueTickets.length, icon: <AlertTriangle size={16} />, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', urgent: true },
          { label: 'วิกฤตที่เปิดอยู่', value: criticalOpen.length, icon: <TrendingUp size={16} />, color: '#f97316', bg: 'rgba(249,115,22,0.08)', urgent: criticalOpen.length > 0 },
        ].map(s => (
          <div
            key={s.label}
            className="stat-card rounded-xl"
            style={s.urgent && (s.value as number) > 0 ? { borderColor: `${s.color}40` } : {}}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/40 uppercase tracking-wider leading-tight">{s.label}</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: s.bg, color: s.color }}
              >
                {s.icon}
              </div>
            </div>
            <div className="text-3xl font-light" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Status Bar Chart */}
        <div className="lg:col-span-2 glass-card rounded-xl p-4">
          <div className="section-title">Ticket ตามสถานะ</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Pie Chart */}
        <div className="glass-card rounded-xl p-4">
          <div className="section-title">Ticket ตามความสำคัญ</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                strokeWidth={0}
              >
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Pie>
              <Legend
                wrapperStyle={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}
                formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>{value}</span>}
              />
              <Tooltip
                formatter={(value) => [`${value} รายการ`]}
                contentStyle={{ background: 'rgba(10,18,40,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NAS Storage */}
      <NasCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Staff Workload */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} className="text-white/40" />
            <span className="section-title mb-0">ภาระงาน IT Staff</span>
          </div>
          <div className="flex flex-col gap-3">
            {staffWorkload.map(({ user, assigned, total }) => {
              const pct = total > 0 ? Math.min((assigned / Math.max(...staffWorkload.map(s => s.assigned || 1))) * 100, 100) : 0;
              const statusColor = assigned > 5 ? '#ef4444' : assigned > 3 ? '#f59e0b' : '#22c55e';
              return (
                <div key={user.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-[10px] font-bold text-amber-300">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-[12px] font-medium text-white/75">{user.name}</div>
                        <div className="text-[10px] text-white/35">{user.role === 'it_manager' ? 'ผู้จัดการ IT' : 'เจ้าหน้าที่ IT'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] font-semibold" style={{ color: statusColor }}>{assigned}</span>
                      <span className="text-[10px] text-white/30"> เปิด / {total} ทั้งหมด</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-white/06 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: statusColor }}
                    />
                  </div>
                </div>
              );
            })}
            {staffWorkload.length === 0 && (
              <div className="text-center text-white/25 text-sm py-4">ไม่มีข้อมูล IT Staff</div>
            )}
          </div>
        </div>

        {/* Recent Critical + Incidents */}
        <div className="flex flex-col gap-4">
          {/* Critical Tickets */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={13} className="text-red-400" />
              <span className="section-title mb-0">Ticket วิกฤต</span>
            </div>
            {recentCritical.length === 0 ? (
              <div className="text-center text-white/25 text-xs py-3">ไม่มี Ticket วิกฤต</div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentCritical.map(t => (
                  <button
                    key={t.id}
                    onClick={() => navigate('ticket_detail', t.id)}
                    className="text-left p-2.5 rounded-lg bg-red-500/06 hover:bg-red-500/12 border border-red-500/15 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-mono text-blue-400/70">{t.id}</span>
                      <StatusBadge status={t.status} size="sm" />
                    </div>
                    <div className="text-[12px] text-white/75 truncate">{t.title}</div>
                    <div className="text-[10px] text-white/35 mt-0.5">{t.requesterName} · {t.department}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Incidents */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={13} className="text-orange-400" />
                <span className="section-title mb-0">Incident ล่าสุด</span>
              </div>
              <button
                onClick={() => setShowAddIncident(true)}
                title="เพิ่ม Incident"
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ border: '1px dashed rgba(255,255,255,0.25)' }}
              >
                <Plus size={12} className="text-white/45" />
              </button>
            </div>
            {incidents.length === 0 ? (
              <div className="text-center text-white/25 text-xs py-3">ไม่มี Incident</div>
            ) : (
              <div className="flex flex-col gap-2">
                {incidents.slice(0, 5).map(inc => (
                  <div key={inc.id}
                    className="p-2.5 rounded-lg bg-white/03 border border-white/07 group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono text-white/40">{inc.id}</span>
                      <div className="flex items-center gap-1.5">
                        <IncidentStatusDrop
                          current={inc.status}
                          onChange={s => updateIncidentStatus(inc.id, s)}
                        />
                        <button
                          onClick={() => deleteIncident(inc.id)}
                          title="ลบ"
                          className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                        >
                          <Trash2 size={10} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[12px] text-white/75 truncate">{inc.title}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{inc.createdBy}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddIncident && (
        <AddIncidentModal
          onClose={() => setShowAddIncident(false)}
          onAdd={addIncident}
          currentUserName={currentUser.name}
        />
      )}
    </div>
  );
}
