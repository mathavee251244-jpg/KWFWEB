import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Clock, Wrench, ChevronDown, Activity, Plus, Trash2, X, HardDrive, RefreshCw, Layers, Server, Cpu, MemoryStick, Monitor } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ServiceStatus, Maintenance } from '../../types';
import { SERVICE_STATUS_LABELS } from '../../types';
import { getNASStorage } from '../../api/nas';
import type { NASDevice } from '../../api/nas';
import { getSystemResources } from '../../api/system';
import type { SystemResources } from '../../api/system';

const statusConfig: Record<ServiceStatus, { color: string; bg: string; border: string; dot: string; icon: React.ReactNode }> = {
  operational:   { color: 'text-green-300',  bg: 'bg-green-500/10',  border: 'border-green-500/25',  dot: 'bg-green-400',  icon: <CheckCircle2 size={14} className="text-green-400" /> },
  degraded:      { color: 'text-yellow-300', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25', dot: 'bg-yellow-400', icon: <AlertTriangle size={14} className="text-yellow-400" /> },
  partial_outage:{ color: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/25', dot: 'bg-orange-400', icon: <AlertTriangle size={14} className="text-orange-400" /> },
  major_outage:  { color: 'text-red-300',    bg: 'bg-red-500/12',    border: 'border-red-500/30',    dot: 'bg-red-400',    icon: <AlertTriangle size={14} className="text-red-400" /> },
  maintenance:   { color: 'text-blue-300',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25',   dot: 'bg-blue-400',   icon: <Wrench size={14} className="text-blue-400" /> },
};

const MAINT_STATUS_LABELS: Record<Maintenance['status'], string> = {
  scheduled: 'กำหนดการ', in_progress: 'กำลังดำเนินการ', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก',
};
const MAINT_STATUS_COLORS: Record<Maintenance['status'], string> = {
  scheduled:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
  in_progress: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  completed:   'text-green-400 bg-green-500/10 border-green-500/20',
  cancelled:   'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── Add Maintenance Modal ──────────────────────────────────────────────────────
function AddMaintenanceModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (m: Omit<Maintenance, 'id'>) => void;
}) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const localNow = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const localEnd = (() => {
    const e = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return `${e.getFullYear()}-${pad(e.getMonth()+1)}-${pad(e.getDate())}T${pad(e.getHours())}:${pad(e.getMinutes())}`;
  })();

  const [title, setTitle]           = useState('');
  const [description, setDesc]      = useState('');
  const [start, setStart]           = useState(localNow);
  const [end, setEnd]               = useState(localEnd);
  const [status, setStatus]         = useState<Maintenance['status']>('scheduled');
  const [err, setErr]               = useState('');

  const submit = () => {
    if (!title.trim()) { setErr('กรุณาระบุหัวข้อ'); return; }
    if (!start || !end) { setErr('กรุณาระบุเวลา'); return; }
    if (new Date(end) <= new Date(start)) { setErr('เวลาสิ้นสุดต้องหลังเวลาเริ่มต้น'); return; }
    onAdd({ title: title.trim(), description: description.trim(), affectedServices: [], scheduledStart: new Date(start).toISOString(), scheduledEnd: new Date(end).toISOString(), status });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass rounded-2xl p-5 w-full max-w-md shadow-window fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-white/85">เพิ่มกำหนดการบำรุงรักษา</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/08 hover:bg-white/14 flex items-center justify-center transition-colors">
            <X size={14} className="text-white/60" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-white/45 mb-1.5 block">หัวข้อ *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="เช่น อัปเดต Firmware Switch หลัก"
              className="win-input w-full text-[13px]" />
          </div>
          <div>
            <label className="text-[11px] text-white/45 mb-1.5 block">รายละเอียด</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              rows={2}
              className="win-input w-full text-[13px] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/45 mb-1.5 block">เริ่มต้น *</label>
              <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)}
                className="win-input w-full text-[12px]" />
            </div>
            <div>
              <label className="text-[11px] text-white/45 mb-1.5 block">สิ้นสุด *</label>
              <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)}
                className="win-input w-full text-[12px]" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-white/45 mb-1.5 block">สถานะ</label>
            <select value={status} onChange={e => setStatus(e.target.value as Maintenance['status'])}
              className="win-input w-full text-[13px]">
              {(Object.keys(MAINT_STATUS_LABELS) as Maintenance['status'][]).map(s => (
                <option key={s} value={s}>{MAINT_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          {err && <p className="text-red-400 text-[11px]">{err}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="win-btn text-[12px]">ยกเลิก</button>
          <button onClick={submit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            style={{ background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.4)', color: '#93c5fd' }}>
            <Plus size={13} /> เพิ่ม
          </button>
        </div>
      </div>
    </div>,
    document.body
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

// ── Resource Monitor ───────────────────────────────────────────────────────────
function fmtUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} วัน`);
  if (h > 0) parts.push(`${h} ชม.`);
  if (m > 0 || parts.length === 0) parts.push(`${m} นาที`);
  return parts.join(' ');
}

function GaugeBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 bg-white/[0.07] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(pct, 100)}%`, background: color, boxShadow: `0 0 8px ${color}55` }} />
    </div>
  );
}

function ResourceMonitor() {
  const [data, setData]   = useState<SystemResources | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try { setData(await getSystemResources()); setLastFetched(new Date()); }
    catch { /* keep prev */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5_000);
    return () => clearInterval(id);
  }, [load]);

  const cpuColor  = (u: number) => u >= 90 ? '#ef4444' : u >= 70 ? '#f59e0b' : '#22c55e';
  const memColor  = (u: number) => u >= 90 ? '#ef4444' : u >= 75 ? '#f59e0b' : '#3b82f6';
  const diskColor = (u: number) => u >= 90 ? '#ef4444' : u >= 75 ? '#f59e0b' : '#8b5cf6';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Monitor size={12} className="text-violet-400/70" />
          <span className="text-[11px] text-white/40 font-semibold uppercase tracking-wider">Resource Monitor</span>
          {data && <span className="text-[10px] text-white/20 font-mono">{data.hostname}</span>}
        </div>
        {lastFetched && (
          <span className="text-[10px] text-white/20 hidden sm:block">
            อัปเดต {lastFetched.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      <div className="glass-card rounded-xl p-4">
        {loading && !data ? (
          <div className="flex items-center gap-2 text-[12px] text-white/30 py-2">
            <RefreshCw size={12} className="animate-spin" /> กำลังโหลด...
          </div>
        ) : !data ? (
          <div className="text-[12px] text-red-400/70">ไม่สามารถอ่านข้อมูล Resource ได้</div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Row 1: CPU + Memory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CPU */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu size={13} className="text-green-400" />
                    <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">CPU</span>
                  </div>
                  <span className="text-[18px] font-light" style={{ color: cpuColor(data.cpu.usage) }}>
                    {data.cpu.usage}%
                  </span>
                </div>
                <GaugeBar pct={data.cpu.usage} color={cpuColor(data.cpu.usage)} />
                <div className="mt-2 text-[10px] text-white/30 truncate">
                  {data.cpu.model} · {data.cpu.cores} cores
                </div>
              </div>

              {/* Memory */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MemoryStick size={13} className="text-blue-400" />
                    <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">RAM</span>
                  </div>
                  <span className="text-[18px] font-light" style={{ color: memColor(Math.round(data.memory.used / data.memory.total * 100)) }}>
                    {Math.round(data.memory.used / data.memory.total * 100)}%
                  </span>
                </div>
                <GaugeBar
                  pct={Math.round(data.memory.used / data.memory.total * 100)}
                  color={memColor(Math.round(data.memory.used / data.memory.total * 100))}
                />
                <div className="flex justify-between mt-2 text-[10px] text-white/30">
                  <span>ใช้ {fmtBytes(data.memory.used)}</span>
                  <span>ว่าง {fmtBytes(data.memory.free)}</span>
                  <span>รวม {fmtBytes(data.memory.total)}</span>
                </div>
              </div>
            </div>

            {/* Row 2: Disks */}
            {data.disks.length > 0 && (
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive size={13} className="text-violet-400" />
                  <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Storage (Server)</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {data.disks.map(disk => {
                    const pct = disk.total > 0 ? Math.round(disk.used / disk.total * 100) : 0;
                    const c   = diskColor(pct);
                    return (
                      <div key={disk.path}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-mono text-white/60">{disk.path}</span>
                          <div className="flex items-center gap-3 text-[10px] text-white/35">
                            <span>{fmtBytes(disk.used)} / {fmtBytes(disk.total)}</span>
                            <span className="font-semibold" style={{ color: c }}>{pct}%</span>
                          </div>
                        </div>
                        <GaugeBar pct={pct} color={c} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Row 3: Uptime */}
            <div className="flex items-center justify-between text-[11px] text-white/30 px-1">
              <span>Uptime: <span className="text-white/50">{fmtUptime(data.uptime)}</span></span>
              <span className="font-mono">{data.platform}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── NAS Storage Manager (multi-device with tabs) ───────────────────────────────
function NasSection() {
  const [devices, setDevices]   = useState<NASDevice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const [notConfigured, setNotConfigured] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getNASStorage();
      setDevices(d);
      setNotConfigured(d.length === 0);
      if (d.length > 0) setLastFetched(new Date());
    } catch {
      setNotConfigured(true);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const id = setInterval(load, 60_000); return () => clearInterval(id); }, [load]);

  const device = devices[activeTab] ?? devices[0];

  const volStatusStyle = (s: string) => {
    if (s === 'normal')   return { label: 'ปกติ',    cls: 'text-green-400 bg-green-500/10 border-green-500/20' };
    if (s === 'degraded') return { label: 'ผิดปกติ', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (s === 'crashed')  return { label: 'พัง',     cls: 'text-red-400   bg-red-500/10   border-red-500/20' };
    return { label: s, cls: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <HardDrive size={12} className="text-sky-400/70" />
          <span className="text-[11px] text-white/40 font-semibold uppercase tracking-wider">NAS Storage Manager</span>
        </div>
        <div className="flex items-center gap-2">
          {lastFetched && (
            <span className="text-[10px] text-white/20 hidden sm:block">
              อัปเดต {lastFetched.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors disabled:opacity-40">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
          </button>
        </div>
      </div>

      {/* ── Tabs (NAS 1 / NAS 2 / …) ── */}
      {devices.length > 1 && (
        <div className="flex gap-1.5 mb-3">
          {devices.map((d, i) => (
            <button key={d.index}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors border
                ${i === activeTab
                  ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                  : 'bg-white/[0.04] border-white/[0.08] text-white/45 hover:text-white/70 hover:bg-white/[0.07]'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${d.ok ? 'bg-green-400' : 'bg-red-400'}`} />
              {d.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Device content ── */}
      {loading && devices.length === 0 ? (
        <div className="glass-card rounded-xl p-6 flex items-center justify-center gap-2">
          <RefreshCw size={14} className="animate-spin text-white/30" />
          <span className="text-[12px] text-white/30">กำลังเชื่อมต่อ NAS...</span>
        </div>
      ) : notConfigured ? (
        <div className="glass-card rounded-xl p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <HardDrive size={15} className="text-white/25" />
          </div>
          <div>
            <div className="text-[12px] text-white/40 font-medium">ยังไม่ได้ตั้งค่า NAS</div>
            <div className="text-[11px] text-white/25 mt-0.5">
              ตั้งค่า <span className="font-mono text-white/35">NAS1_URL</span>,{' '}
              <span className="font-mono text-white/35">NAS1_USER</span>,{' '}
              <span className="font-mono text-white/35">NAS1_PASS</span> ใน environment variables เพื่อเชื่อมต่อ Synology NAS
            </div>
          </div>
        </div>
      ) : device ? (
        <div className="glass-card rounded-xl p-4">
          {/* Single NAS label when there's only 1 */}
          {devices.length === 1 && (
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
              <div className={`w-2 h-2 rounded-full ${device.ok ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-[12px] font-semibold text-white/70">{device.name}</span>
            </div>
          )}

          {/* Error */}
          {!device.ok && device.error && (
            <div className="flex items-center gap-2 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertTriangle size={14} /> เชื่อมต่อ NAS ไม่ได้: {device.error}
            </div>
          )}

          {device.ok && (
            <>
              {/* Volumes */}
              {device.volumes.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Layers size={10} className="text-white/25" />
                    <span className="text-[10px] text-white/25 uppercase tracking-widest font-medium">Volumes</span>
                    <span className="text-[10px] text-white/15">· {device.volumes.length}</span>
                  </div>
                  <div className={`grid gap-3 ${device.volumes.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                    {device.volumes.map(vol => {
                      const pct      = vol.total > 0 ? Math.round((vol.used / vol.total) * 100) : 0;
                      const barColor = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#22c55e';
                      const vs       = volStatusStyle(vol.status);
                      return (
                        <div key={vol.path} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                          <div className="flex items-start justify-between mb-3 gap-2">
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-white/80 truncate">{vol.name || vol.path}</div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {vol.path && vol.name !== vol.path && (
                                  <span className="text-[9px] text-white/30 font-mono">{vol.path}</span>
                                )}
                                {vol.fsType && (
                                  <span className="text-[9px] text-white/40 bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded font-mono">
                                    {vol.fsType.toUpperCase()}
                                  </span>
                                )}
                                {vol.raidType && (
                                  <span className="text-[9px] text-sky-300/70 bg-sky-500/[0.10] border border-sky-500/20 px-1.5 py-0.5 rounded font-mono">
                                    {vol.raidType}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium shrink-0 ${vs.cls}`}>
                              {vs.label}
                            </span>
                          </div>
                          <div className="h-2.5 bg-white/[0.07] rounded-full overflow-hidden mb-3">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 10px ${barColor}55` }} />
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            {[
                              { label: 'ใช้ไป',   value: fmtBytes(vol.used),  color: barColor },
                              { label: 'ว่าง',    value: fmtBytes(vol.free),  color: '#22c55e' },
                              { label: 'ทั้งหมด', value: fmtBytes(vol.total), color: 'rgba(255,255,255,0.5)' },
                            ].map(({ label, value, color }) => (
                              <div key={label} className="bg-white/[0.04] rounded-lg py-2">
                                <div className="text-[12px] font-semibold" style={{ color }}>{value}</div>
                                <div className="text-[9px] text-white/25 mt-0.5">{label}</div>
                              </div>
                            ))}
                          </div>
                          <div className="text-right mt-1.5 text-[10px] font-semibold" style={{ color: barColor }}>
                            {pct}% ใช้ไปแล้ว
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Drive Bays */}
              {device.disks.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Server size={10} className="text-white/25" />
                    <span className="text-[10px] text-white/25 uppercase tracking-widest font-medium">Drive Bays</span>
                    <span className="text-[10px] text-white/15">· {device.disks.length} drives</span>
                  </div>
                  <div className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${Math.min(device.disks.length, 6)}, minmax(0, 1fr))` }}>
                    {[...device.disks].sort((a, b) => (a.slot || 0) - (b.slot || 0)).map(disk => {
                      const isOk   = disk.status === 'normal';
                      const isWarn = disk.status === 'warning';
                      const dotColor    = isOk ? 'bg-green-400' : isWarn ? 'bg-amber-400' : 'bg-red-400';
                      const statusLabel = isOk ? 'ปกติ' : isWarn ? 'เตือน' : 'ผิดปกติ';
                      const borderColor = isOk ? 'rgba(255,255,255,0.08)' : isWarn ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';
                      const tempColor   = disk.temp >= 55 ? '#ef4444' : disk.temp >= 45 ? '#f59e0b' : '#22c55e';
                      const shortModel  = disk.model ? (disk.model.split('-')[0] || disk.model) : '—';
                      const slotLabel   = disk.slot > 0 ? `Disk ${disk.slot}` : disk.id.toUpperCase();
                      return (
                        <div key={disk.id}
                          className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center"
                          style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${borderColor}` }}>
                          <div className="text-[8px] text-white/25 font-mono uppercase tracking-wider">{slotLabel}</div>
                          <div className="w-9 h-11 rounded-lg flex flex-col items-center justify-center gap-0.5"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <HardDrive size={15} className="text-white/45" />
                            {disk.type !== 'hdd' && (
                              <span className="text-[7px] text-sky-400/60 font-bold uppercase">{disk.type}</span>
                            )}
                          </div>
                          <div className="text-[9px] text-white/60 font-medium leading-tight truncate w-full px-0.5">{shortModel}</div>
                          {disk.size > 0 && <div className="text-[9px] text-white/35">{fmtBytes(disk.size)}</div>}
                          {disk.temp > 0 && (
                            <div className="text-[11px] font-bold" style={{ color: tempColor }}>{disk.temp}°C</div>
                          )}
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                            <span className="text-[8px] text-white/30">{statusLabel}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SystemStatus() {
  const { currentUser, services, maintenances, updateServiceStatus, navigate,
          addMaintenance, deleteMaintenance, updateMaintenanceStatus } = useApp();
  const isIT = currentUser.role !== 'employee' && currentUser.role !== undefined;
  const [showAddModal, setShowAddModal] = useState(false);

  const overallStatus: ServiceStatus = (() => {
    if (services.some(s => s.status === 'major_outage'))   return 'major_outage';
    if (services.some(s => s.status === 'partial_outage')) return 'partial_outage';
    if (services.some(s => s.status === 'degraded'))       return 'degraded';
    if (services.some(s => s.status === 'maintenance'))    return 'maintenance';
    return 'operational';
  })();

  return (
    <div className="module-content fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-semibold text-white/90">สถานะระบบ</h2>
          <p className="text-sm text-white/40 mt-0.5">
            อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`rounded-xl p-4 mb-5 flex items-center gap-3 ${statusConfig[overallStatus].bg} border ${statusConfig[overallStatus].border}`}>
        <Activity size={20} className={statusConfig[overallStatus].color} />
        <div>
          <div className={`text-[15px] font-semibold ${statusConfig[overallStatus].color}`}>
            {overallStatus === 'operational'    ? 'ระบบทุกอย่างปกติ' :
             overallStatus === 'degraded'       ? 'บางระบบทำงานช้ากว่าปกติ' :
             overallStatus === 'partial_outage' ? 'บางระบบขัดข้อง' :
             overallStatus === 'major_outage'   ? 'ระบบหลักขัดข้อง' :
             'อยู่ในช่วงบำรุงรักษา'}
          </div>
          <div className={`text-[12px] opacity-70 ${statusConfig[overallStatus].color}`}>
            {services.filter(s => s.status === 'operational').length}/{services.length} ระบบทำงานปกติ
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Services List */}
        <div className="lg:col-span-2">
          <div className="section-title mb-3">สถานะระบบทั้งหมด</div>
          <div className="flex flex-col gap-2">
            {services.map(svc => {
              const cfg = statusConfig[svc.status];
              const isEmailSvc    = svc.id === 'svc-2' && isIT;
              const isInternetSvc = svc.id === 'svc-1';
              const isClickable   = isEmailSvc || isInternetSvc;
              return (
                <div
                  key={svc.id}
                  onClick={isEmailSvc ? () => navigate('email_dashboard') : isInternetSvc ? () => navigate('speed_test') : undefined}
                  className={`glass-card rounded-xl p-3.5 flex items-center gap-4
                    ${svc.status !== 'operational' ? `border ${cfg.border}` : ''}
                    ${isClickable ? 'cursor-pointer hover:bg-white/[0.04] transition-colors' : ''}`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot} ${svc.status === 'major_outage' ? 'animate-pulse' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-medium text-white/80">{svc.name}</span>
                      <span className="text-[10px] text-white/30">{svc.nameEn}</span>
                      {isEmailSvc && <span className="text-[9px] bg-blue-500/15 border border-blue-500/25 text-blue-300 px-1.5 py-0.5 rounded">Dashboard →</span>}
                      {isInternetSvc && <span className="text-[9px] bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 px-1.5 py-0.5 rounded">ทดสอบ →</span>}
                    </div>
                    <div className="text-[10px] text-white/35 mt-0.5">{svc.description}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      {cfg.icon}
                      <span className={`text-[11px] font-medium ${cfg.color}`}>{SERVICE_STATUS_LABELS[svc.status]}</span>
                    </div>
                    {isIT && (
                      <StatusDropdown
                        current={svc.status}
                        onChange={status => updateServiceStatus(svc.id, status)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Maintenance Schedule */}
        <div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wrench size={13} className="text-blue-400" />
                <span className="section-title mb-0">กำหนดการบำรุงรักษา</span>
              </div>
              {isIT && (
                <button
                  onClick={() => setShowAddModal(true)}
                  title="เพิ่มกำหนดการ"
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ border: '1px dashed rgba(255,255,255,0.25)' }}
                >
                  <Plus size={12} className="text-white/45" />
                </button>
              )}
            </div>

            {maintenances.length === 0 ? (
              <div className="text-center py-6 text-white/25 text-xs">ไม่มีกำหนดการ</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {maintenances.map(m => (
                  <div key={m.id} className="p-3 rounded-xl bg-blue-500/05 border border-blue-500/12 group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-white/35">{m.id}</span>
                      <div className="flex items-center gap-1.5">
                        {isIT ? (
                          <MaintStatusDropdown
                            current={m.status}
                            onChange={s => updateMaintenanceStatus(m.id, s)}
                          />
                        ) : (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${MAINT_STATUS_COLORS[m.status]}`}>
                            {MAINT_STATUS_LABELS[m.status]}
                          </span>
                        )}
                        {isIT && (
                          <button
                            onClick={() => deleteMaintenance(m.id)}
                            title="ลบ"
                            className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                          >
                            <Trash2 size={10} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-[12px] text-white/75 font-medium mb-1.5">{m.title}</div>
                    {m.description && (
                      <div className="text-[10px] text-white/40 mb-1">{m.description}</div>
                    )}
                    <div className="text-[10px] text-white/40">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Clock size={9} /> เริ่ม: {formatDateTime(m.scheduledStart)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={9} /> สิ้นสุด: {formatDateTime(m.scheduledEnd)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resource Monitor + NAS — IT/Manager only */}
      {isIT && (
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-4">
            <Server size={14} className="text-violet-400" />
            <span className="text-[13px] font-semibold text-white/70">เครื่องแม่ข่าย & NAS</span>
          </div>
          <ResourceMonitor />
          <NasSection />
        </div>
      )}

      {showAddModal && (
        <AddMaintenanceModal
          onClose={() => setShowAddModal(false)}
          onAdd={addMaintenance}
        />
      )}
    </div>
  );
}

// ── Service Status Dropdown ────────────────────────────────────────────────────
function StatusDropdown({ current, onChange }: { current: ServiceStatus; onChange: (s: ServiceStatus) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const options: ServiceStatus[] = ['operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance'];

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen(v => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div>
      <button ref={btnRef} onClick={handleOpen}
        className="flex items-center gap-1 text-[10px] bg-white/06 hover:bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white/50 transition-colors">
        <ChevronDown size={10} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>
      {open && createPortal(
        <div ref={menuRef} className="glass rounded-xl p-1 shadow-window fade-in"
          style={{ position: 'fixed', top: pos.top, right: pos.right, width: 152, zIndex: 9999 }}>
          {options.map(s => (
            <button key={s}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onChange(s); setOpen(false); }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-white/08 transition-colors ${current === s ? 'bg-white/06 text-white/80' : 'text-white/55'}`}>
              {SERVICE_STATUS_LABELS[s]}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Maintenance Status Dropdown ────────────────────────────────────────────────
function MaintStatusDropdown({ current, onChange }: { current: Maintenance['status']; onChange: (s: Maintenance['status']) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const options: Maintenance['status'][] = ['scheduled', 'in_progress', 'completed', 'cancelled'];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative">
      <button ref={btnRef}
        onClick={() => {
          if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            setPos({ top: r.bottom + 4, left: r.left });
          }
          setOpen(v => !v);
        }}
        className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 hover:opacity-80 transition-opacity ${MAINT_STATUS_COLORS[current]}`}>
        {MAINT_STATUS_LABELS[current]}
        <ChevronDown size={8} />
      </button>
      {open && createPortal(
        <div className="glass rounded-xl p-1 shadow-window fade-in"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 148, zIndex: 9999 }}>
          {options.map(s => (
            <button key={s}
              onMouseDown={e => e.stopPropagation()}
              onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-white/08 transition-colors ${current === s ? 'bg-white/06' : ''}`}>
              <span className={MAINT_STATUS_COLORS[s].split(' ')[0]}>{MAINT_STATUS_LABELS[s]}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
