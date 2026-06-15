import { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ArrowLeft, Shield, ExternalLink, RefreshCw, Mail, TrendingDown, TrendingUp, AlertTriangle, Bug } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSMConnections, getSMSummary } from '../../api/smartermail';
import type { SMConnections, SMSummaryResponse } from '../../api/smartermail';

const MAIL_ADMIN_URL = 'https://mailstd-01.zth.netdesignhost.com/interface/root#/reports/domain/domain';
const DOMAIN = 'bangkokseafood.co.th';

const fmt   = (n: number) => n.toLocaleString();
const fmtGB = (b: number) => (b / 1e9).toFixed(2);
const fmtMB = (b: number) => (b / 1e6).toFixed(1);

// ─── Count-up animation hook ──────────────────────────────────────────────────
function useCountUp(target: number, dur = 1100, enabled = true) {
  const [val, setVal] = useState(0);
  const raf  = useRef(0);
  const prev = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    cancelAnimationFrame(raf.current);
    const from = prev.current;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * ease);
      setVal(v);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, dur, enabled]);
  return val;
}

// ─── Animated metric number ───────────────────────────────────────────────────
function Metric({ value, color, size = 'text-3xl', ready }: {
  value: number; color?: string; size?: string; ready: boolean;
}) {
  const v = useCountUp(value, 1100, ready);
  if (!ready) {
    return <div className="h-9 w-24 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,.06)' }} />;
  }
  return (
    <span className={`${size} font-bold font-mono tabular-nums leading-none`}
      style={{ color: color ?? 'rgba(255,255,255,.92)' }}>
      {fmt(v)}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

// ─── Live pulse dot ───────────────────────────────────────────────────────────
function PulseDot({ color = '#22c55e' }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ background: color, animation: 'hud-pulse-ring 2s ease-in-out infinite' }} />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full"
        style={{ background: color }} />
    </span>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ label, value, max, color, icon, ready }: {
  label: string; value: number; max: number; color: string; icon?: React.ReactNode; ready: boolean;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const v   = useCountUp(value, 1100, ready);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,.6)' }}>
          {icon && <span className="opacity-60">{icon}</span>}
          {label}
        </div>
        <span className="text-sm font-mono font-semibold tabular-nums" style={{ color }}>
          {ready ? fmt(v) : '—'}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.07)' }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: ready ? `${pct}%` : '0%', background: color, opacity: 0.8 }} />
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Card({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  return (
    <div className={`glass-card rounded-2xl p-5 ${className}`}
      style={{ animation: `section-enter .4s ease-out ${delay}s both` }}>
      {children}
    </div>
  );
}

// ─── Card header ──────────────────────────────────────────────────────────────
function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,.85)' }}>{title}</p>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,.35)' }}>{subtitle}</p>}
    </div>
  );
}

// ─── Stat card (big number) ───────────────────────────────────────────────────
function StatCard({ label, value, color, icon, sub, delay, ready }: {
  label: string; value: number; color: string; icon: React.ReactNode;
  sub?: string; delay: number; ready: boolean;
}) {
  return (
    <Card delay={delay}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm" style={{ color: 'rgba(255,255,255,.5)' }}>{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, color }}>
          {icon}
        </div>
      </div>
      <Metric value={value} color={color} size="text-[2rem]" ready={ready} />
      {sub && <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,.3)' }}>{sub}</p>}
    </Card>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload?: { unit?: string } }> }) {
  if (!active || !payload?.length) return null;
  const unit = payload[0].payload?.unit ?? '';
  return (
    <div className="glass px-3 py-2 rounded-xl text-sm shadow-xl">
      <span style={{ color: 'rgba(255,255,255,.5)' }}>{payload[0].name}: </span>
      <strong style={{ color: 'rgba(255,255,255,.9)' }}>{payload[0].value} {unit}</strong>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function EmailDashboard() {
  const { currentUser, navigate } = useApp();

  const [conn,    setConn]    = useState<SMConnections | null>(null);
  const [sumData, setSumData] = useState<SMSummaryResponse | null>(null);
  const [ready,   setReady]   = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [lastAt,  setLastAt]  = useState<Date | null>(null);
  const [errMsg,  setErrMsg]  = useState<string | null>(null);

  const timerC = useRef<ReturnType<typeof setInterval>>();
  const timerS = useRef<ReturnType<typeof setInterval>>();

  const fetchConn = useCallback(async () => {
    try { setConn(await getSMConnections()); setLastAt(new Date()); }
    catch { /* silent */ }
  }, []);

  const fetchSum = useCallback(async () => {
    try { setSumData(await getSMSummary()); setLastAt(new Date()); setErrMsg(null); }
    catch (e) { setErrMsg(String(e)); }
  }, []);

  const refresh = useCallback(async () => {
    setBusy(true);
    await Promise.all([fetchConn(), fetchSum()]);
    setBusy(false);
  }, [fetchConn, fetchSum]);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchConn(), fetchSum()]);
      setReady(true);
    })();
    timerC.current = setInterval(fetchConn, 15_000);
    timerS.current = setInterval(fetchSum,  60_000);
    return () => { clearInterval(timerC.current); clearInterval(timerS.current); };
  }, [fetchConn, fetchSum]);

  // ── Access guard ──────────────────────────────────────────────────────────
  if (currentUser.role !== 'it_staff' && currentUser.role !== 'it_manager') {
    return (
      <div className="module-content flex items-center justify-center">
        <div className="text-center" style={{ color: 'rgba(255,255,255,.3)' }}>
          <Shield size={44} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">ไม่มีสิทธิ์เข้าถึงส่วนนี้</p>
        </div>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const sm = sumData?.summary;
  const dk = sumData?.diskUsage;

  const totalIn   = sm
    ? (sm.incoming.TRUSTED ?? 0) + (sm.incoming.STANDARD_DELIVERY ?? 0) + (sm.incoming.MARKED_AS_SPAM ?? 0)
    : 0;
  const totalOut  = sm?.outgoing.OUTGOING_MESSAGES ?? 0;
  const totalSpam = sm?.incoming.MARKED_AS_SPAM ?? 0;
  const spamPct   = totalIn > 0 ? Math.round((totalSpam / totalIn) * 100) : 0;
  const viruses   = sm?.sessions.VIRUSES_CAUGHT ?? 0;
  const diskPct   = sumData?.diskPct ?? 0;

  const timeStr = lastAt?.toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }) ?? '--:--:--';

  // bandwidth chart
  const bwData = sm ? [
    { name: 'SMTP In',  gb: +fmtGB(sm.bwOverview.SMTP_IN  ?? 0), color: '#38bdf8', unit: 'GB' },
    { name: 'SMTP Out', gb: +fmtGB(sm.bwOverview.SMTP_OUT ?? 0), color: '#818cf8', unit: 'GB' },
    { name: 'IMAP',     gb: +fmtGB(sm.bwOverview.IMAP     ?? 0), color: '#34d399', unit: 'GB' },
    { name: 'POP',      gb: +fmtGB(sm.bwOverview.POP      ?? 0), color: '#fb923c', unit: 'GB' },
  ] : [];

  // disk pie
  const diskPieData = dk ? [
    { name: 'Mailbox', value: dk.mailboxUsed, color: '#38bdf8' },
    { name: 'Files',   value: dk.fileStorageUsed, color: '#818cf8' },
    { name: 'Free',    value: Math.max(0, (dk.allowed || dk.used * 2) - dk.used), color: 'rgba(255,255,255,.06)' },
  ] : [];

  const maxSess = Math.max(
    sm?.sessions.SMTP_IN_SESSIONS  ?? 0,
    sm?.sessions.SMTP_OUT_SESSIONS ?? 0,
    sm?.sessions.POP_SESSIONS      ?? 0,
    sm?.sessions.IMAP_SESSIONS     ?? 0,
    1,
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="module-content fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3"
        style={{ animation: 'section-enter .3s ease-out both' }}>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('system_status')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all glass-card"
            style={{ color: 'rgba(255,255,255,.55)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.55)')}>
            <ArrowLeft size={16} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <Mail size={18} style={{ color: 'rgba(255,255,255,.7)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,.9)' }}>
                Email Server Monitor
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-1 pl-0.5">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,.35)' }}>{DOMAIN}</span>
              <span style={{ color: 'rgba(255,255,255,.2)' }}>·</span>
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,.35)' }}>{timeStr}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* status badge */}
          {errMsg
            ? <Badge color="#f87171">Error</Badge>
            : (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.25)' }}>
                <PulseDot color="#22c55e" />
                <span className="text-xs font-medium" style={{ color: '#22c55e' }}>Live</span>
              </div>
            )
          }

          <button onClick={refresh} disabled={busy}
            className="h-9 px-4 rounded-xl text-sm font-medium flex items-center gap-2 transition-all glass-card disabled:opacity-40"
            style={{ color: 'rgba(255,255,255,.7)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.7)')}>
            <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button onClick={() => window.open(MAIL_ADMIN_URL, '_blank')}
            className="h-9 px-4 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
            style={{ background: 'rgba(56,189,248,.12)', border: '1px solid rgba(56,189,248,.25)', color: '#38bdf8' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(56,189,248,.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(56,189,248,.12)')}>
            <ExternalLink size={13} /> Admin Panel
          </button>
        </div>
      </div>

      {/* ── Error alert ── */}
      {errMsg && (
        <div className="mb-4 px-4 py-3 rounded-2xl flex items-start gap-3 text-sm"
          style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', color: 'rgba(248,113,113,.9)',
            animation: 'section-enter .3s ease-out both' }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{errMsg}</span>
        </div>
      )}

      {/* ── Row 1: 4 stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <StatCard label="Active Sessions" value={conn?.allCount ?? 0}      color="#22c55e"  icon={<span className="text-xs font-bold">●</span>} sub="Live connections" delay={0.05} ready={ready} />
        <StatCard label="Inbound"         value={totalIn}                  color="#38bdf8"  icon={<TrendingDown size={14} />}                    sub="30-day messages" delay={0.08} ready={ready} />
        <StatCard label="Outbound"        value={totalOut}                 color="#818cf8"  icon={<TrendingUp size={14} />}                      sub="30-day messages" delay={0.11} ready={ready} />
        <StatCard label="Spam Blocked"    value={totalSpam}                color="#fb923c"  icon={<AlertTriangle size={14} />}                   sub={`${spamPct}% of inbound`} delay={0.14} ready={ready} />
      </div>

      {/* ── Row 2: sub-connection stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
        {([
          { label: 'Webmail',   value: conn?.webmailCount  ?? 0, color: '#38bdf8' },
          { label: 'IMAP',      value: conn?.imapCount     ?? 0, color: '#34d399' },
          { label: 'POP',       value: conn?.popCount      ?? 0, color: '#818cf8' },
          { label: 'SMTP',      value: conn?.smtpCount     ?? 0, color: '#fb923c' },
          { label: 'Users',     value: conn?.allUsersCount ?? 0, color: 'rgba(255,255,255,.7)' },
        ] as const).map((item, i) => (
          <Card key={item.label} delay={0.17 + i * 0.03} className="text-center">
            <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,.4)' }}>{item.label}</p>
            <Metric value={item.value} color={item.color} size="text-2xl" ready={ready} />
          </Card>
        ))}
      </div>

      {/* ── Row 3: Disk / Bandwidth / Sessions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">

        {/* Disk usage */}
        <Card delay={0.3}>
          <CardHeader title="Disk Usage" subtitle="Storage allocation" />
          {!ready ? (
            <div className="h-36 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,.04)' }} />
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4">
                {/* Pie chart */}
                <div className="w-28 h-28 shrink-0">
                  <PieChart width={112} height={112}>
                    <Pie data={diskPieData} cx={52} cy={52} innerRadius={32} outerRadius={50}
                      paddingAngle={2} dataKey="value" strokeWidth={0}
                      isAnimationActive animationDuration={1200} animationEasing="ease-out">
                      {diskPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold font-mono mb-1" style={{ color: 'rgba(255,255,255,.9)' }}>
                    {diskPct}%
                  </div>
                  <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,.35)' }}>
                    {fmtMB(dk?.used ?? 0)} MB used
                  </p>
                  {[
                    { name: 'Mailbox', color: '#38bdf8', val: fmtMB(dk?.mailboxUsed ?? 0) },
                    { name: 'Files',   color: '#818cf8', val: fmtMB(dk?.fileStorageUsed ?? 0) },
                  ].map(d => (
                    <div key={d.name} className="flex items-center gap-2 mb-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-xs flex-1" style={{ color: 'rgba(255,255,255,.45)' }}>{d.name}</span>
                      <span className="text-xs font-mono font-semibold" style={{ color: d.color }}>{d.val} MB</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Bandwidth */}
        <Card delay={0.33}>
          <CardHeader title="Bandwidth" subtitle="30-day transfer by protocol" />
          {!ready ? (
            <div className="h-36 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,.04)' }} />
          ) : (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bwData} barSize={20} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name"
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,.4)', fontFamily: 'inherit' }}
                    axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,.25)', fontFamily: 'inherit' }}
                    axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,.03)', radius: 6 }} />
                  <Bar dataKey="gb" radius={[6, 6, 0, 0]}
                    isAnimationActive animationDuration={1000} animationEasing="ease-out">
                    {bwData.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.75} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Sessions */}
        <Card delay={0.36}>
          <CardHeader title="Session Counts" subtitle="30-day totals by protocol" />
          {!ready ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,.04)' }} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {([
                { label: 'SMTP In',  value: sm?.sessions.SMTP_IN_SESSIONS  ?? 0, color: '#38bdf8' },
                { label: 'SMTP Out', value: sm?.sessions.SMTP_OUT_SESSIONS ?? 0, color: '#818cf8' },
                { label: 'POP',      value: sm?.sessions.POP_SESSIONS      ?? 0, color: '#34d399' },
                { label: 'IMAP',     value: sm?.sessions.IMAP_SESSIONS     ?? 0, color: '#fb923c' },
              ] as const).map((s, i) => (
                <div key={s.label} style={{ animation: `section-enter .35s ease-out ${i * .06}s both` }}>
                  <ProgressBar label={s.label} value={s.value} max={maxSess} color={s.color} ready={ready} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 4: Inbound / Spam + extras ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

        {/* Inbound breakdown */}
        <Card delay={0.42}>
          <CardHeader title="Inbound Breakdown" subtitle="30-day delivery categories" />
          {!ready ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,.04)' }} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Trusted',  value: sm?.incoming.TRUSTED           ?? 0, color: '#34d399' },
                { label: 'Standard', value: sm?.incoming.STANDARD_DELIVERY ?? 0, color: '#38bdf8' },
                { label: 'Spam',     value: sm?.incoming.MARKED_AS_SPAM    ?? 0, color: '#f87171' },
              ].map((d, i) => (
                <div key={d.label} style={{ animation: `section-enter .35s ease-out ${i * .07}s both` }}>
                  <ProgressBar label={d.label} value={d.value} max={totalIn || 1} color={d.color} ready={ready} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Spam analysis */}
        <Card delay={0.45}>
          <CardHeader title="Spam Analysis" subtitle="30-day threat breakdown" />
          {!ready ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,.04)' }} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Low risk',    value: sm?.spam.LOW    ?? 0, color: '#facc15' },
                { label: 'Medium risk', value: sm?.spam.MEDIUM ?? 0, color: '#fb923c' },
                { label: 'High risk',   value: sm?.spam.HIGH   ?? 0, color: '#f87171' },
              ].map((d, i) => (
                <div key={d.label} style={{ animation: `section-enter .35s ease-out ${i * .07}s both` }}>
                  <ProgressBar label={d.label} value={d.value} max={totalSpam || 1} color={d.color} ready={ready} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Misc stats */}
        <Card delay={0.48}>
          <CardHeader title="Other Metrics" subtitle="Greylisting · throttle · threats" />
          {!ready ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,.04)' }} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {([
                { label: 'Greylisted', value: (sm?.greylist.BLOCKED ?? 0) + (sm?.greylist.PASSED ?? 0), color: '#a3a3a3', icon: <span>🔘</span> },
                { label: 'Throttled',  value: sm?.throttled.THROTTLED ?? 0, color: '#fb923c', icon: <span>⏱</span> },
                { label: 'Viruses',    value: viruses, color: viruses > 0 ? '#f87171' : '#a3a3a3', icon: <Bug size={13} /> },
              ] as const).map((item, i) => (
                <div key={item.label} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,.04)', animation: `section-enter .35s ease-out ${i * .07}s both` }}>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,.55)' }}>
                    <span className="opacity-70">{item.icon}</span>
                    {item.label}
                  </div>
                  <Metric value={item.value} color={item.color} size="text-xl" ready={ready} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
