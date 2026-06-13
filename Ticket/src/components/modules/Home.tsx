import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import PriorityBadge from '../shared/PriorityBadge';
import {
  Ticket, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  ChevronRight, Plus, BookOpen, Monitor, LayoutDashboard,
  Wifi, HardDrive, RefreshCw, Thermometer,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { getNASStorage } from '../../api/nas';
import type { NASDevice } from '../../api/nas';

function fmtBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0; let val = bytes;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

function NasHomeCard() {
  const [devices, setDevices] = useState<NASDevice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setDevices(await getNASStorage()); }
    catch { /* keep prev */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const id = setInterval(load, 60_000); return () => clearInterval(id); }, [load]);

  if (!loading && devices.length === 0) return null;

  // Aggregate across all configured NAS
  const allVolumes = devices.flatMap(d => d.ok ? d.volumes : []);
  const totalAll = allVolumes.reduce((s, v) => s + v.total, 0);
  const usedAll  = allVolumes.reduce((s, v) => s + v.used, 0);
  const freeAll  = totalAll - usedAll;
  const pctAll   = totalAll > 0 ? Math.round((usedAll / totalAll) * 100) : 0;
  const barColor = pctAll >= 90 ? '#ef4444' : pctAll >= 75 ? '#f59e0b' : '#22c55e';

  if (!loading && allVolumes.length === 0 && devices.every(d => !d.ok)) return null;

  return (
    <div className="glass-card rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HardDrive size={14} className="text-sky-400" />
          <span className="text-[12px] font-semibold text-white/60 uppercase tracking-wider">Synology NAS</span>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1 text-[11px] text-white/35 hover:text-white/60 transition-colors disabled:opacity-40">
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
        </button>
      </div>

      {loading && allVolumes.length === 0 ? (
        <div className="text-[11px] text-white/30">กำลังโหลด...</div>
      ) : allVolumes.length === 0 ? (
        <div className="text-[11px] text-red-400/70">เชื่อมต่อ NAS ไม่ได้</div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Aggregate progress */}
          <div className="flex-1 min-w-[180px]">
            <div className="flex justify-between text-[11px] text-white/50 mb-1.5">
              <span>ใช้ไป <span className="text-white/70 font-medium">{fmtBytes(usedAll)}</span> / {fmtBytes(totalAll)}</span>
              <span style={{ color: barColor }} className="font-semibold">{pctAll}%</span>
            </div>
            <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pctAll}%`, background: barColor, boxShadow: `0 0 8px ${barColor}55` }} />
            </div>
            <div className="text-[10px] text-white/30 mt-1">
              ว่าง: <span className="text-green-400 font-medium">{fmtBytes(freeAll)}</span>
              {devices.length > 1 && <span className="ml-2">{devices.length} NAS</span>}
            </div>
          </div>

          {/* Volume pills per device */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {devices.map(d => d.ok && d.volumes.map(vol => {
              const pct = vol.total > 0 ? Math.round((vol.used / vol.total) * 100) : 0;
              const c   = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#22c55e';
              return (
                <div key={`${d.index}-${vol.path}`}
                  className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.09] rounded-xl px-3 py-1.5">
                  <HardDrive size={11} className="text-white/40" />
                  <span className="text-[11px] text-white/55">{d.name}</span>
                  <span className="text-[11px] text-white/70">{vol.name || vol.path}</span>
                  <span className="text-[11px] font-bold" style={{ color: c }}>{pct}%</span>
                </div>
              );
            }))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

export default function Home() {
  const { currentUser, tickets, navigate, services } = useApp();

  const myTickets = tickets.filter(t =>
    currentUser.role === 'employee'
      ? t.requesterId === currentUser.id
      : true
  );

  const openCount = myTickets.filter(t => !['resolved', 'closed'].includes(t.status)).length;
  const resolvedCount = myTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const criticalCount = myTickets.filter(t => t.priority === 'critical' && !['resolved', 'closed'].includes(t.status)).length;

  const now = new Date();
  const overdueTickets = myTickets.filter(t => {
    if (['resolved', 'closed'].includes(t.status)) return false;
    return new Date(t.slaDueTime) < now;
  });

  const recentTickets = [...myTickets]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const operationalServices = services.filter(s => s.status === 'operational').length;
  const totalServices = services.length;
  const issueServices = services.filter(s => s.status !== 'operational' && s.status !== 'maintenance').length;

  const isIT = currentUser.role !== 'employee';

  return (
    <div className="module-content fade-in">
      {/* Welcome Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold text-white/90">
            สวัสดี, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-white/45 mt-1">
            {currentUser.department}
            {' · '}
            {currentUser.role === 'employee' ? 'พนักงาน' : currentUser.role === 'it_staff' ? 'เจ้าหน้าที่ IT' : 'ผู้จัดการ IT'}
            {' · '}
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {!isIT && (
          <button
            onClick={() => navigate('submit_ticket')}
            className="win-btn flex items-center gap-2 px-5 py-2.5 text-[13px]"
            style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.35),rgba(99,102,241,0.18))', border: '1px solid rgba(99,102,241,0.45)' }}
          >
            <Plus size={15} />
            แจ้งปัญหา IT
          </button>
        )}
      </div>

      {/* Employee CTA hero — shown only when employee has no open tickets */}
      {!isIT && openCount === 0 && (
        <div
          className="glass-card rounded-2xl p-6 mb-5 flex items-center gap-5 border border-indigo-500/20"
          style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.10),rgba(6,182,212,0.06))' }}
        >
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)' }}>
            <Ticket size={28} className="text-indigo-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-white/85 mb-1">มีปัญหา IT ให้ช่วยไหม?</div>
            <div className="text-[12px] text-white/45 leading-relaxed">
              แจ้งปัญหาคอมพิวเตอร์ อินเทอร์เน็ต เครื่องพิมพ์ หรือซอฟต์แวร์ — ทีม IT พร้อมช่วยเหลือ
            </div>
          </div>
          <button
            onClick={() => navigate('submit_ticket')}
            className="shrink-0 px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all"
            style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.40)', color: '#a5b4fc' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.38)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.25)')}
          >
            แจ้งปัญหาเลย
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white/40 uppercase tracking-wider">Ticket เปิด</span>
            <Clock size={14} className="text-blue-400/60" />
          </div>
          <div className="text-3xl font-light text-white/90">{openCount}</div>
          <div className="text-[11px] text-white/35 mt-1">รายการที่ยังดำเนินการ</div>
        </div>
        <div className="stat-card rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white/40 uppercase tracking-wider">แก้ไขแล้ว</span>
            <CheckCircle2 size={14} className="text-green-400/60" />
          </div>
          <div className="text-3xl font-light text-green-400/90">{resolvedCount}</div>
          <div className="text-[11px] text-white/35 mt-1">รายการทั้งหมด</div>
        </div>
        <div className="stat-card rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white/40 uppercase tracking-wider">วิกฤต</span>
            <AlertTriangle size={14} className="text-red-400/60" />
          </div>
          <div className="text-3xl font-light text-red-400/90">{criticalCount}</div>
          <div className="text-[11px] text-white/35 mt-1">ต้องดำเนินการด่วน</div>
        </div>
        <div className="stat-card rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white/40 uppercase tracking-wider">สถานะระบบ</span>
            <TrendingUp size={14} className="text-emerald-400/60" />
          </div>
          <div className="text-3xl font-light text-emerald-400/90">{operationalServices}/{totalServices}</div>
          <div className={`text-[11px] mt-1 ${issueServices > 0 ? 'text-orange-400/70' : 'text-white/35'}`}>
            {issueServices > 0 ? `${issueServices} ระบบมีปัญหา` : 'ทุกระบบปกติ'}
          </div>
        </div>
      </div>

      {/* NAS Storage — IT staff only */}
      {isIT && <NasHomeCard />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Tickets */}
        <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/06">
            <span className="text-[12px] font-semibold text-white/60 uppercase tracking-wider">
              {isIT ? 'Ticket ล่าสุด' : 'Ticket ของฉัน'}
            </span>
            <button
              onClick={() => navigate(isIT ? 'all_tickets' : 'my_tickets')}
              className="text-[11px] text-blue-400/70 hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
              ดูทั้งหมด <ChevronRight size={12} />
            </button>
          </div>
          {recentTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/30">
              <Ticket size={32} className="mb-3 opacity-40" />
              <p className="text-sm">ยังไม่มี Ticket</p>
              <button
                onClick={() => navigate('submit_ticket')}
                className="mt-3 win-btn text-xs"
              >
                แจ้งปัญหาแรก
              </button>
            </div>
          ) : (
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>หัวข้อ</th>
                  <th>สถานะ</th>
                  <th>ความสำคัญ</th>
                  <th>อัปเดต</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map(t => (
                  <tr
                    key={t.id}
                    className="ticket-row"
                    onClick={() => navigate('ticket_detail', t.id)}
                  >
                    <td className="text-blue-400/80 font-mono text-xs">{t.id}</td>
                    <td className="max-w-[200px] truncate font-medium text-white/80" title={t.title}>
                      {t.title}
                    </td>
                    <td><StatusBadge status={t.status} size="sm" /></td>
                    <td><PriorityBadge priority={t.priority} size="sm" /></td>
                    <td className="text-white/40 text-xs">{formatDate(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Actions + SLA Overdue */}
        <div className="flex flex-col gap-4">
          <div className="glass-card rounded-xl p-4">
            <div className="section-title">Quick Actions</div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('submit_ticket')}
                className="win-btn w-full flex items-center gap-2 justify-start"
              >
                <Plus size={14} />
                แจ้งปัญหาใหม่
              </button>
              <button
                onClick={() => navigate('my_tickets')}
                className="win-btn-ghost w-full flex items-center gap-2 justify-start"
              >
                <Ticket size={14} />
                Ticket ของฉัน
              </button>
              <button
                onClick={() => navigate('knowledge_base')}
                className="win-btn-ghost w-full flex items-center gap-2 justify-start"
              >
                <BookOpen size={14} />
                คลังความรู้
              </button>
              <button
                onClick={() => navigate('system_status')}
                className="win-btn-ghost w-full flex items-center gap-2 justify-start"
              >
                <Monitor size={14} />
                สถานะระบบ
              </button>
              {isIT && (
                <button
                  onClick={() => navigate('it_dashboard')}
                  className="win-btn-ghost w-full flex items-center gap-2 justify-start"
                >
                  <LayoutDashboard size={14} />
                  IT Dashboard
                </button>
              )}
              {!isIT && (
                <button
                  onClick={() => navigate('system_status')}
                  className="win-btn-ghost w-full flex items-center gap-2 justify-start"
                >
                  <Wifi size={14} />
                  ตรวจสอบ Wi-Fi / อินเทอร์เน็ต
                </button>
              )}
            </div>
          </div>

          {overdueTickets.length > 0 && (
            <div className="glass-card rounded-xl p-4 border border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
                  SLA เกินกำหนด ({overdueTickets.length})
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {overdueTickets.slice(0, 3).map(t => (
                  <button
                    key={t.id}
                    onClick={() => navigate('ticket_detail', t.id)}
                    className="text-left p-2 rounded-lg bg-red-500/08 hover:bg-red-500/14 border border-red-500/15 transition-colors"
                  >
                    <div className="text-[11px] font-medium text-red-300 truncate">{t.title}</div>
                    <div className="text-[10px] text-red-400/60 mt-0.5">{t.id} · {t.requesterName}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
