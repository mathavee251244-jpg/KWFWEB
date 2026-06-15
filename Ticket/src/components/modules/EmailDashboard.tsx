import { useState, useEffect, useCallback, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Mail, HardDrive, ArrowLeft, Shield, Activity, Users, Wifi, Bug, ExternalLink, RefreshCw, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSMConnections, getSMSummary } from '../../api/smartermail';
import type { SMConnections, SMSummaryResponse } from '../../api/smartermail';

const MAIL_ADMIN_URL = 'https://mailstd-01.zth.netdesignhost.com/interface/root#/reports/domain/domain';
const DOMAIN = 'bangkokseafood.co.th';

const fmt   = (n: number) => n.toLocaleString();
const fmtGB = (b: number) => (b / 1e9).toFixed(2);
const fmtMB = (b: number) => (b / 1e6).toFixed(1);

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon, loading }: {
  label: string; value: string | number; sub?: string;
  color?: string; icon: React.ReactNode; loading?: boolean;
}) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-white/35">{icon}</div>
        <span className="text-[10px] text-white/35 uppercase tracking-wider">{label}</span>
      </div>
      {loading
        ? <div className="h-8 w-20 bg-white/08 rounded animate-pulse" />
        : <div className={`text-2xl font-light tabular-nums ${color ?? 'text-white/80'}`}>{value}</div>}
      {sub && !loading && <div className="text-[10px] text-white/30 mt-1">{sub}</div>}
    </div>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div className="text-[11px] text-white/45 w-20 shrink-0 truncate">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-white/06 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[11px] text-white/55 tabular-nums w-16 text-right">{fmt(value)}</div>
    </div>
  );
}

function ChartTip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-[11px] text-white/80 border border-white/10">
      <strong>{payload[0].name}</strong>: {payload[0].value} GB
    </div>
  );
}

function Skeleton({ h = 32 }: { h?: number }) {
  return <div className={`bg-white/06 rounded animate-pulse`} style={{ height: h }} />;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EmailDashboard() {
  const { currentUser, navigate } = useApp();
  const [conn,    setConn]    = useState<SMConnections | null>(null);
  const [sumData, setSumData] = useState<SMSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState(false);
  const [lastAt,  setLastAt]  = useState<Date | null>(null);
  const [errMsg,  setErrMsg]  = useState<string | null>(null);
  const timerConn = useRef<ReturnType<typeof setInterval>>();
  const timerSum  = useRef<ReturnType<typeof setInterval>>();

  const fetchConn = useCallback(async () => {
    try { setConn(await getSMConnections()); setLastAt(new Date()); }
    catch {}
  }, []);

  const fetchSum = useCallback(async () => {
    try {
      setSumData(await getSMSummary());
      setLastAt(new Date());
      setErrMsg(null);
    } catch (e) { setErrMsg(String(e)); }
  }, []);

  const refresh = useCallback(async () => {
    setBusy(true);
    await Promise.all([fetchConn(), fetchSum()]);
    setBusy(false);
  }, [fetchConn, fetchSum]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchConn(), fetchSum()]);
      setLoading(false);
    })();
    timerConn.current = setInterval(fetchConn, 15_000);
    timerSum.current  = setInterval(fetchSum,  60_000);
    return () => { clearInterval(timerConn.current); clearInterval(timerSum.current); };
  }, [fetchConn, fetchSum]);

  const canView = currentUser.role === 'it_staff' || currentUser.role === 'it_manager';
  if (!canView) {
    return (
      <div className="module-content flex items-center justify-center">
        <div className="text-center text-white/30">
          <Shield size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">เฉพาะเจ้าหน้าที่ IT เท่านั้น</p>
        </div>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const sm  = sumData?.summary;
  const dk  = sumData?.diskUsage;

  const totalIn   = sm ? (sm.incoming.TRUSTED ?? 0) + (sm.incoming.STANDARD_DELIVERY ?? 0) + (sm.incoming.MARKED_AS_SPAM ?? 0) : 0;
  const totalOut  = sm?.outgoing.OUTGOING_MESSAGES ?? 0;
  const totalSpam = sm?.incoming.MARKED_AS_SPAM ?? 0;
  const spamPct   = totalIn > 0 ? Math.round((totalSpam / totalIn) * 100) : 0;
  const viruses   = sm?.sessions.VIRUSES_CAUGHT ?? 0;
  const diskPct   = sumData?.diskPct ?? 0;

  const bwData = sm ? [
    { name: 'SMTP In',  gb: +fmtGB(sm.bwOverview.SMTP_IN  ?? 0), color: '#3b82f6' },
    { name: 'SMTP Out', gb: +fmtGB(sm.bwOverview.SMTP_OUT ?? 0), color: '#8b5cf6' },
    { name: 'IMAP',     gb: +fmtGB(sm.bwOverview.IMAP     ?? 0), color: '#06b6d4' },
    { name: 'POP',      gb: +fmtGB(sm.bwOverview.POP      ?? 0), color: '#10b981' },
  ] : [];
  const totalBW = bwData.reduce((s, d) => s + d.gb, 0);

  const inboundData = sm ? [
    { name: 'Trusted',  value: sm.incoming.TRUSTED ?? 0,           color: '#22c55e' },
    { name: 'Standard', value: sm.incoming.STANDARD_DELIVERY ?? 0, color: '#3b82f6' },
    { name: 'Spam',     value: sm.incoming.MARKED_AS_SPAM ?? 0,    color: '#ef4444' },
  ] : [];

  const spamData = sm ? [
    { name: 'Low',    value: sm.spam.LOW    ?? 0, color: '#f59e0b' },
    { name: 'Medium', value: sm.spam.MEDIUM ?? 0, color: '#f97316' },
    { name: 'High',   value: sm.spam.HIGH   ?? 0, color: '#ef4444' },
  ] : [];

  const diskPie = [
    { name: 'Mailbox',  value: dk?.mailboxUsed ?? 1,                         color: '#3b82f6' },
    { name: 'Other',    value: Math.max(0, (dk?.used ?? 0) - (dk?.mailboxUsed ?? 0)), color: '#8b5cf6' },
    { name: 'Free',     value: diskPct > 0 ? Math.round((dk?.used ?? 0) / diskPct * (100 - diskPct)) : 0, color: '#1e293b' },
  ];

  const maxSession = Math.max(
    sm?.sessions.POP_SESSIONS  ?? 0,
    sm?.sessions.SMTP_IN_SESSIONS  ?? 0,
    sm?.sessions.SMTP_OUT_SESSIONS ?? 0,
    sm?.sessions.IMAP_SESSIONS ?? 0,
    1,
  );

  const timeStr = lastAt?.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) ?? '—';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="module-content fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('system_status')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/06 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-blue-400" />
              <h2 className="text-[20px] font-semibold text-white/90">Email Server Dashboard</h2>
            </div>
            <p className="text-[11px] text-white/35 mt-0.5 ml-6">
              {DOMAIN} · 30 วันย้อนหลัง
              {lastAt && (
                <span className="ml-2 inline-flex items-center gap-1 text-white/22">
                  <Clock size={9} /> อัปเดต {timeStr}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${errMsg ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`} />
            <span className={`text-[11px] ${errMsg ? 'text-red-300' : 'text-green-300'}`}>
              {errMsg ? 'Error' : 'Online'}
            </span>
          </div>
          <button onClick={refresh} disabled={busy}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[11px] text-white/50 hover:text-white/70 bg-white/04 hover:bg-white/08 border border-white/08 transition-colors disabled:opacity-40">
            <RefreshCw size={11} className={busy ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
          <button onClick={() => window.open(MAIL_ADMIN_URL, '_blank')}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[11px] text-blue-300 hover:text-blue-200 bg-blue-500/12 hover:bg-blue-500/20 border border-blue-500/25 transition-colors">
            <ExternalLink size={12} /> เปิด Admin Panel
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errMsg && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/08 px-4 py-3 flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-red-300 mb-0.5">Summary API Error</div>
            <div className="text-[10px] text-red-400/70 font-mono break-all">{errMsg}</div>
          </div>
        </div>
      )}

      {/* ── Live Connections ── */}
      <div className="glass-card rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">Active Now</span>
          <span className="text-[10px] text-white/22 ml-1">· รีเฟรชทุก 15 วิ</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {([
            { label: 'Sessions',    value: conn?.allCount     ?? 0, color: 'text-green-300' },
            { label: 'Webmail',     value: conn?.webmailCount ?? 0, color: 'text-blue-300'  },
            { label: 'IMAP',        value: conn?.imapCount    ?? 0, color: 'text-cyan-300'  },
            { label: 'POP',         value: conn?.popCount     ?? 0, color: 'text-purple-300'},
            { label: 'SMTP',        value: conn?.smtpCount    ?? 0, color: 'text-amber-300' },
            { label: 'Total Users', value: conn?.allUsersCount?? 0, color: 'text-white/60'  },
          ] as const).map(item => (
            <div key={item.label} className="text-center">
              {loading
                ? <div className="h-7 w-10 mx-auto bg-white/08 rounded animate-pulse mb-1" />
                : <div className={`text-[22px] font-light tabular-nums ${item.color}`}>{fmt(item.value)}</div>}
              <div className="text-[9px] text-white/30 uppercase tracking-wide mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Inbound Messages"  value={loading ? '—' : fmt(totalIn)}    sub="30 วันย้อนหลัง"        color="text-blue-300"   icon={<Activity size={13} />} loading={loading} />
        <StatCard label="Outbound Messages" value={loading ? '—' : fmt(totalOut)}   sub="30 วันย้อนหลัง"        color="text-purple-300" icon={<Activity size={13} />} loading={loading} />
        <StatCard label="Inbound Spam"      value={loading ? '—' : fmt(totalSpam)}  sub={`${spamPct}% ของขาเข้า`} color="text-red-300"    icon={<Shield size={13} />}   loading={loading} />
        <StatCard label="Viruses Caught"    value={loading ? '—' : fmt(viruses)}    sub="ตรวจพบไวรัส"           color={viruses > 0 ? 'text-orange-300' : 'text-white/45'} icon={<Bug size={13} />} loading={loading} />
      </div>

      {/* ── 3-col Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Disk Usage */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive size={13} className="text-white/40" />
            <span className="section-title mb-0">Disk Usage</span>
          </div>
          {loading ? <Skeleton h={120} /> : (
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <PieChart width={110} height={110}>
                  <Pie data={diskPie} cx={50} cy={50} innerRadius={32} outerRadius={50}
                    dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                    {diskPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-[18px] font-light text-white/85 tabular-nums">{diskPct}%</div>
                  <div className="text-[9px] text-white/35">ใช้แล้ว</div>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-white/70 tabular-nums">
                  {fmtMB(dk?.used ?? 0)} <span className="text-white/35 font-normal">MB</span>
                </div>
                <div className="text-[10px] text-white/35 mb-3">พื้นที่ที่ใช้</div>
                <div className="space-y-1.5">
                  {[
                    { name: 'Mailbox',      color: '#3b82f6', val: fmtMB(dk?.mailboxUsed ?? 0) + ' MB' },
                    { name: 'File Storage', color: '#8b5cf6', val: fmtMB(dk?.fileStorageUsed ?? 0) + ' MB' },
                  ].map(d => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-[10px] text-white/40 flex-1">{d.name}</span>
                      <span className="text-[10px] text-white/55 tabular-nums">{d.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bandwidth */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wifi size={13} className="text-white/40" />
            <span className="section-title mb-0">Bandwidth Overview</span>
          </div>
          {loading ? <Skeleton h={160} /> : (
            <>
              <div className="text-[22px] font-light text-white/80 tabular-nums mb-0.5">{totalBW.toFixed(2)} GB</div>
              <div className="text-[10px] text-white/35 mb-4">รวมทั้งหมด 30 วัน</div>
              <div className="h-[110px] -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bwData} barSize={18} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="gb" radius={[4, 4, 0, 0]}>
                      {bwData.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.85} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {bwData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-[10px] text-white/40">{d.name}</span>
                    <span className="text-[10px] text-white/55 ml-auto tabular-nums">{d.gb} GB</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sessions */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={13} className="text-white/40" />
            <span className="section-title mb-0">Sessions (30 วัน)</span>
          </div>
          {loading ? <Skeleton h={160} /> : (
            <>
              <div className="space-y-3">
                {([
                  { label: 'SMTP In',  value: sm?.sessions.SMTP_IN_SESSIONS  ?? 0, color: '#3b82f6' },
                  { label: 'SMTP Out', value: sm?.sessions.SMTP_OUT_SESSIONS ?? 0, color: '#8b5cf6' },
                  { label: 'POP',      value: sm?.sessions.POP_SESSIONS       ?? 0, color: '#10b981' },
                  { label: 'IMAP',     value: sm?.sessions.IMAP_SESSIONS      ?? 0, color: '#06b6d4' },
                ] as const).map(s => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-white/45">{s.label}</span>
                      <span className="text-[12px] font-medium text-white/70 tabular-nums">{fmt(s.value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/06 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{
                        width: `${Math.max((s.value / maxSession) * 100, s.value > 0 ? 1 : 0)}%`,
                        background: s.color, opacity: 0.8,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-white/06 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white/04 border border-white/06 p-2.5 text-center">
                  <div className="text-[18px] font-light text-amber-300 tabular-nums">
                    {fmt((sm?.greylist.BLOCKED ?? 0) + (sm?.greylist.PASSED ?? 0))}
                  </div>
                  <div className="text-[9px] text-white/30 mt-0.5">Greylisted</div>
                </div>
                <div className="rounded-lg bg-white/04 border border-white/06 p-2.5 text-center">
                  <div className="text-[18px] font-light text-slate-300 tabular-nums">
                    {fmt(sm?.throttled.THROTTLED ?? 0)}
                  </div>
                  <div className="text-[9px] text-white/30 mt-0.5">Throttled</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Inbound Breakdown */}
        <div className="glass-card rounded-xl p-5">
          <div className="section-title">Inbound Messages Breakdown</div>
          {loading ? <Skeleton h={100} /> : (
            <>
              <div className="text-[22px] font-light text-white/80 tabular-nums mb-4">{fmt(totalIn)}</div>
              <div className="space-y-2.5">
                {inboundData.map(d => <MiniBar key={d.name} label={d.name} value={d.value} max={totalIn || 1} color={d.color} />)}
              </div>
              <div className="mt-4 pt-3 border-t border-white/06 grid grid-cols-3 gap-2">
                {inboundData.map(d => (
                  <div key={d.name} className="text-center">
                    <div className="text-[15px] font-light tabular-nums" style={{ color: d.color }}>{fmt(d.value)}</div>
                    <div className="text-[9px] text-white/30 mt-0.5">{d.name}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Spam Breakdown */}
        <div className="glass-card rounded-xl p-5">
          <div className="section-title">Inbound Spam Breakdown</div>
          {loading ? <Skeleton h={100} /> : (
            <>
              <div className="flex items-end gap-3 mb-4">
                <div className="text-[22px] font-light text-red-300 tabular-nums">{fmt(totalSpam)}</div>
                <div className="text-[11px] text-white/35 mb-1">= {spamPct}% ของขาเข้า</div>
              </div>
              <div className="space-y-2.5">
                {spamData.map(d => <MiniBar key={d.name} label={d.name} value={d.value} max={totalSpam || 1} color={d.color} />)}
              </div>
              <div className="mt-4 pt-3 border-t border-white/06 grid grid-cols-3 gap-2">
                {spamData.map(d => (
                  <div key={d.name} className="text-center">
                    <div className="text-[15px] font-light tabular-nums" style={{ color: d.color }}>{fmt(d.value)}</div>
                    <div className="text-[9px] text-white/30 mt-0.5">{d.name}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/06 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug size={12} className="text-orange-400" />
                  <span className="text-[11px] text-white/50">Viruses Caught</span>
                </div>
                <span className={`text-[15px] font-medium tabular-nums ${viruses > 0 ? 'text-orange-300' : 'text-white/40'}`}>
                  {fmt(viruses)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
