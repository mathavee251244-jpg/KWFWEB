import { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ArrowLeft, Shield, ExternalLink, RefreshCw, Mail, TrendingDown, TrendingUp, AlertTriangle, Bug, Wifi } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSMConnections, getSMSummary } from '../../api/smartermail';
import type { SMConnections, SMSummaryResponse } from '../../api/smartermail';

const MAIL_ADMIN_URL = 'https://mailstd-01.zth.netdesignhost.com/interface/root#/reports/domain/domain';
const DOMAIN = 'bangkokseafood.co.th';

const fmt   = (n: number) => n.toLocaleString();
const fmtGB = (b: number) => (b / 1e9).toFixed(2);
const fmtMB = (b: number) => (b / 1e6).toFixed(1);

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, dur = 1100, enabled = true) {
  const [val, setVal] = useState(0);
  const raf  = useRef(0);
  const prev = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    cancelAnimationFrame(raf.current);
    const from = prev.current;
    const t0   = performance.now();
    const tick = (now: number) => {
      const p    = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * ease));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, dur, enabled]);
  return val;
}

// ── Metric number with pop-on-change ─────────────────────────────────────────
function Metric({ value, color, size = 'text-3xl', ready }: {
  value: number; color?: string; size?: string; ready: boolean;
}) {
  const v       = useCountUp(value, 1100, ready);
  const [pop, setPop]   = useState(0);
  const prevRef = useRef(value);

  useEffect(() => {
    if (ready && prevRef.current !== value && prevRef.current !== 0) {
      setPop(k => k + 1);
    }
    prevRef.current = value;
  }, [value, ready]);

  if (!ready) {
    return (
      <div className="rounded-lg overflow-hidden" style={{ height: 36, width: 96, background: 'rgba(255,255,255,.05)' }}>
        <div className="h-full" style={{
          background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.09),transparent)',
          animation: 'card-scan 1.6s ease-in-out infinite',
        }} />
      </div>
    );
  }
  return (
    <span key={pop} className={`${size} font-bold font-mono tabular-nums leading-none inline-block`}
      style={{
        color: color ?? 'rgba(255,255,255,.92)',
        animation: pop > 0 ? 'num-pop .45s cubic-bezier(.34,1.56,.64,1)' : 'none',
      }}>
      {fmt(v)}
    </span>
  );
}

// ── Live pulse dot ────────────────────────────────────────────────────────────
function PulseDot({ color = '#22c55e' }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="absolute inset-0 rounded-full opacity-60"
        style={{ background: color, animation: 'hud-pulse-ring 1.8s ease-in-out infinite' }} />
      <span className="relative h-2.5 w-2.5 rounded-full"
        style={{ background: color }} />
    </span>
  );
}

// ── Progress bar with shimmer ─────────────────────────────────────────────────
function ProgBar({ label, value, max, color, ready }: {
  label: string; value: number; max: number; color: string; ready: boolean;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const v   = useCountUp(value, 1100, ready);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm" style={{ color: 'rgba(255,255,255,.55)' }}>{label}</span>
        <span className="text-sm font-mono font-semibold tabular-nums" style={{ color }}>
          {ready ? fmt(v) : '—'}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.07)' }}>
        <div className="h-full rounded-full relative overflow-hidden transition-all duration-1000 ease-out"
          style={{ width: ready ? `${pct}%` : '0%', background: `linear-gradient(90deg,${color}aa,${color})` }}>
          {ready && pct > 0 && (
            <span className="absolute inset-y-0 w-1/2 pointer-events-none" style={{
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent)',
              animation: 'bar-shimmer 2.2s ease-in-out 1.3s infinite',
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton row ─────────────────────────────────────────────────────────────
function Skel({ h = 32, w = '100%' }: { h?: number; w?: string }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ height: h, width: w, background: 'rgba(255,255,255,.05)' }}>
      <div className="h-full" style={{
        background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent)',
        animation: 'card-scan 1.6s ease-in-out infinite',
      }} />
    </div>
  );
}

// ── Generic card ──────────────────────────────────────────────────────────────
function Card({ children, className = '', delay = 0, accent }: {
  children: React.ReactNode; className?: string; delay?: number; accent?: string;
}) {
  return (
    <div className={`glass-card rounded-2xl p-5 transition-all duration-200 ${className}`}
      style={{ animation: `card-enter .55s cubic-bezier(.16,1,.3,1) ${delay}s both` }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = accent
          ? `0 16px 40px ${accent}18, 0 4px 16px rgba(0,0,0,.35)`
          : '0 12px 32px rgba(0,0,0,.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}>
      {children}
    </div>
  );
}

// ── Stat card (with accent top bar) ──────────────────────────────────────────
function StatCard({ label, value, color, icon, sub, delay, ready }: {
  label: string; value: number; color: string; icon: React.ReactNode;
  sub?: string; delay: number; ready: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden transition-all duration-200"
      style={{ animation: `card-enter .55s cubic-bezier(.16,1,.3,1) ${delay}s both` }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 18px 42px ${color}20, 0 4px 16px rgba(0,0,0,.4)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}>
      {/* colored accent line */}
      <div style={{ height: 2, background: `linear-gradient(90deg,${color},${color}00)` }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <span className="text-sm" style={{ color: 'rgba(255,255,255,.5)' }}>{label}</span>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${color}14`, color, border: `1px solid ${color}22` }}>
            {icon}
          </div>
        </div>
        <Metric value={value} color={color} size="text-[2.1rem]" ready={ready} />
        {sub && <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,.28)' }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Mini stat tile ────────────────────────────────────────────────────────────
function MiniTile({ label, value, color, delay, ready }: {
  label: string; value: number; color: string; delay: number; ready: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 text-center transition-all duration-200"
      style={{ animation: `card-enter .55s cubic-bezier(.16,1,.3,1) ${delay}s both` }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 12px 28px ${color}16, 0 4px 12px rgba(0,0,0,.3)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}>
      <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,.38)' }}>{label}</p>
      <Metric value={value} color={color} size="text-2xl" ready={ready} />
    </div>
  );
}

// ── Card section label ────────────────────────────────────────────────────────
function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,.82)' }}>{title}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,.32)' }}>{sub}</p>}
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-3 py-2 rounded-xl text-sm shadow-2xl"
      style={{ border: '1px solid rgba(255,255,255,.1)' }}>
      <span style={{ color: 'rgba(255,255,255,.45)' }}>{payload[0].name}: </span>
      <strong style={{ color: 'rgba(255,255,255,.9)' }}>{payload[0].value} GB</strong>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
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
    try { setConn(await getSMConnections()); setLastAt(new Date()); } catch { /* silent */ }
  }, []);

  const fetchSum = useCallback(async () => {
    try { setSumData(await getSMSummary()); setLastAt(new Date()); setErrMsg(null); }
    catch (e) { setErrMsg(String(e)); }
  }, []);

  const refresh = useCallback(async () => {
    setBusy(true); await Promise.all([fetchConn(), fetchSum()]); setBusy(false);
  }, [fetchConn, fetchSum]);

  useEffect(() => {
    (async () => { await Promise.all([fetchConn(), fetchSum()]); setReady(true); })();
    timerC.current = setInterval(fetchConn, 15_000);
    timerS.current = setInterval(fetchSum,  60_000);
    return () => { clearInterval(timerC.current); clearInterval(timerS.current); };
  }, [fetchConn, fetchSum]);

  if (currentUser.role !== 'it_staff' && currentUser.role !== 'it_manager') {
    return (
      <div className="module-content flex items-center justify-center">
        <div className="text-center opacity-30">
          <Shield size={44} className="mx-auto mb-3" />
          <p className="text-sm">ไม่มีสิทธิ์เข้าถึงส่วนนี้</p>
        </div>
      </div>
    );
  }

  // ── Derived ───────────────────────────────────────────────────────────────
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

  const bwData = sm ? [
    { name: 'SMTP In',  gb: +fmtGB(sm.bwOverview.SMTP_IN  ?? 0), color: '#38bdf8' },
    { name: 'SMTP Out', gb: +fmtGB(sm.bwOverview.SMTP_OUT ?? 0), color: '#818cf8' },
    { name: 'IMAP',     gb: +fmtGB(sm.bwOverview.IMAP     ?? 0), color: '#34d399' },
    { name: 'POP',      gb: +fmtGB(sm.bwOverview.POP      ?? 0), color: '#fb923c' },
  ] : [];

  const diskPieData = dk
    ? [
        { name: 'Mailbox', value: dk.mailboxUsed,      color: '#38bdf8' },
        { name: 'Files',   value: dk.fileStorageUsed,  color: '#818cf8' },
        { name: 'Free',    value: Math.max(0, (dk.allowed || dk.used * 2) - dk.used), color: 'rgba(255,255,255,.05)' },
      ]
    : [];

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
        style={{ animation: 'card-enter .4s ease-out both' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('system_status')}
            className="w-9 h-9 rounded-xl flex items-center justify-center glass-card transition-all"
            style={{ color: 'rgba(255,255,255,.5)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.5)'; e.currentTarget.style.transform = ''; }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Mail size={17} style={{ color: '#38bdf8' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,.9)' }}>
                Email Server Monitor
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-0.5 pl-0.5">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,.32)' }}>{DOMAIN}</span>
              <span style={{ color: 'rgba(255,255,255,.15)' }}>·</span>
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,.32)' }}>{timeStr}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {errMsg
            ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(248,113,113,.12)', border: '1px solid rgba(248,113,113,.25)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-xs font-medium text-red-400">Error</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.22)' }}>
                <PulseDot color="#22c55e" />
                <span className="text-xs font-medium" style={{ color: '#22c55e' }}>Live</span>
              </div>
            )
          }

          <button onClick={refresh} disabled={busy}
            className="h-9 px-4 rounded-xl text-sm font-medium flex items-center gap-2 glass-card transition-all disabled:opacity-40"
            style={{ color: 'rgba(255,255,255,.65)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.65)'; e.currentTarget.style.transform = ''; }}>
            <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button onClick={() => window.open(MAIL_ADMIN_URL, '_blank')}
            className="h-9 px-4 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
            style={{ background: 'rgba(56,189,248,.11)', border: '1px solid rgba(56,189,248,.24)', color: '#38bdf8' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56,189,248,.11)'; e.currentTarget.style.transform = ''; }}>
            <ExternalLink size={13} /> Admin Panel
          </button>
        </div>
      </div>

      {/* ── Error alert ── */}
      {errMsg && (
        <div className="mb-4 px-4 py-3 rounded-2xl flex items-start gap-3 text-sm"
          style={{ background: 'rgba(248,113,113,.07)', border: '1px solid rgba(248,113,113,.18)',
            color: 'rgba(248,113,113,.85)', animation: 'card-enter .35s ease-out both' }}>
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{errMsg}</span>
        </div>
      )}

      {/* ── Row 1: 4 key stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <StatCard label="Active Sessions" value={conn?.allCount ?? 0}  color="#22c55e" icon={<Wifi size={15} />}              sub="Live connections"      delay={0.04} ready={ready} />
        <StatCard label="Inbound"         value={totalIn}              color="#38bdf8" icon={<TrendingDown size={15} />}       sub="30-day messages"       delay={0.08} ready={ready} />
        <StatCard label="Outbound"        value={totalOut}             color="#818cf8" icon={<TrendingUp size={15} />}         sub="30-day messages"       delay={0.12} ready={ready} />
        <StatCard label="Spam Blocked"    value={totalSpam}            color="#fb923c" icon={<AlertTriangle size={15} />}      sub={`${spamPct}% of total`} delay={0.16} ready={ready} />
      </div>

      {/* ── Row 2: connection breakdown tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
        {([
          { label: 'Webmail', value: conn?.webmailCount  ?? 0, color: '#38bdf8' },
          { label: 'IMAP',    value: conn?.imapCount     ?? 0, color: '#34d399' },
          { label: 'POP',     value: conn?.popCount      ?? 0, color: '#818cf8' },
          { label: 'SMTP',    value: conn?.smtpCount     ?? 0, color: '#fb923c' },
          { label: 'Users',   value: conn?.allUsersCount ?? 0, color: 'rgba(255,255,255,.7)' },
        ] as const).map((item, i) => (
          <MiniTile key={item.label} {...item} delay={0.2 + i * 0.04} ready={ready} />
        ))}
      </div>

      {/* ── Row 3: Disk / Bandwidth / Sessions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">

        {/* Disk */}
        <Card delay={0.32} accent="#818cf8">
          <SectionHead title="Disk Usage" sub="Storage allocation" />
          {!ready ? (
            <div className="space-y-3">
              <Skel h={112} /> <Skel h={18} /> <Skel h={18} />
            </div>
          ) : (
            <div className="flex items-center gap-5">
              {/* Donut + center label */}
              <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
                <PieChart width={120} height={120}>
                  <Pie data={diskPieData} cx={58} cy={58} innerRadius={36} outerRadius={54}
                    paddingAngle={2} dataKey="value" strokeWidth={0}
                    isAnimationActive animationDuration={1300} animationEasing="ease-out">
                    {diskPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold font-mono" style={{ color: 'rgba(255,255,255,.9)' }}>{diskPct}%</span>
                  <span className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,.35)' }}>used</span>
                </div>
              </div>
              <div className="flex-1 space-y-2.5">
                {[
                  { name: 'Mailbox', color: '#38bdf8', val: fmtMB(dk?.mailboxUsed ?? 0) },
                  { name: 'Files',   color: '#818cf8', val: fmtMB(dk?.fileStorageUsed ?? 0) },
                  { name: 'Total',   color: 'rgba(255,255,255,.5)', val: fmtMB(dk?.used ?? 0) },
                ].map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-xs flex-1" style={{ color: 'rgba(255,255,255,.42)' }}>{d.name}</span>
                    <span className="text-xs font-mono font-semibold" style={{ color: d.color }}>{d.val} MB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Bandwidth */}
        <Card delay={0.36} accent="#38bdf8">
          <SectionHead title="Bandwidth" sub="30-day transfer by protocol" />
          {!ready
            ? <Skel h={152} />
            : (
              <div className="h-[152px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bwData} barSize={22} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <XAxis dataKey="name"
                      tick={{ fontSize: 11, fill: 'rgba(255,255,255,.38)', fontFamily: 'inherit' }}
                      axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'rgba(255,255,255,.22)', fontFamily: 'inherit' }}
                      axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,.04)', radius: 8 }} />
                    <Bar dataKey="gb" radius={[7, 7, 0, 0]}
                      isAnimationActive animationDuration={1100} animationEasing="ease-out">
                      {bwData.map((e, i) => (
                        <Cell key={i} fill={e.color} fillOpacity={0.78} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )
          }
        </Card>

        {/* Sessions */}
        <Card delay={0.4} accent="#34d399">
          <SectionHead title="Session Counts" sub="30-day totals by protocol" />
          {!ready
            ? <div className="space-y-4">{[1,2,3,4].map(i => <Skel key={i} h={36} />)}</div>
            : (
              <div className="space-y-4">
                {([
                  { label: 'SMTP In',  value: sm?.sessions.SMTP_IN_SESSIONS  ?? 0, color: '#38bdf8' },
                  { label: 'SMTP Out', value: sm?.sessions.SMTP_OUT_SESSIONS ?? 0, color: '#818cf8' },
                  { label: 'POP',      value: sm?.sessions.POP_SESSIONS      ?? 0, color: '#34d399' },
                  { label: 'IMAP',     value: sm?.sessions.IMAP_SESSIONS     ?? 0, color: '#fb923c' },
                ] as const).map((s, i) => (
                  <div key={s.label} style={{ animation: `card-enter .4s cubic-bezier(.16,1,.3,1) ${i * .06}s both` }}>
                    <ProgBar label={s.label} value={s.value} max={maxSess} color={s.color} ready={ready} />
                  </div>
                ))}
              </div>
            )
          }
        </Card>
      </div>

      {/* ── Row 4: Inbound / Spam / Other ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

        {/* Inbound breakdown */}
        <Card delay={0.44} accent="#38bdf8">
          <SectionHead title="Inbound Breakdown" sub="30-day delivery categories" />
          {!ready
            ? <div className="space-y-4">{[1,2,3].map(i => <Skel key={i} h={36} />)}</div>
            : (
              <div className="space-y-4">
                {[
                  { label: 'Trusted',  value: sm?.incoming.TRUSTED           ?? 0, color: '#34d399' },
                  { label: 'Standard', value: sm?.incoming.STANDARD_DELIVERY ?? 0, color: '#38bdf8' },
                  { label: 'Spam in',  value: sm?.incoming.MARKED_AS_SPAM    ?? 0, color: '#f87171' },
                ].map((d, i) => (
                  <div key={d.label} style={{ animation: `card-enter .4s cubic-bezier(.16,1,.3,1) ${i * .07}s both` }}>
                    <ProgBar label={d.label} value={d.value} max={totalIn || 1} color={d.color} ready={ready} />
                  </div>
                ))}
              </div>
            )
          }
        </Card>

        {/* Spam levels */}
        <Card delay={0.48} accent="#fb923c">
          <SectionHead title="Spam Analysis" sub="30-day threat severity" />
          {!ready
            ? <div className="space-y-4">{[1,2,3].map(i => <Skel key={i} h={36} />)}</div>
            : (
              <div className="space-y-4">
                {[
                  { label: 'Low risk',    value: sm?.spam.LOW    ?? 0, color: '#facc15' },
                  { label: 'Medium risk', value: sm?.spam.MEDIUM ?? 0, color: '#fb923c' },
                  { label: 'High risk',   value: sm?.spam.HIGH   ?? 0, color: '#f87171' },
                ].map((d, i) => (
                  <div key={d.label} style={{ animation: `card-enter .4s cubic-bezier(.16,1,.3,1) ${i * .07}s both` }}>
                    <ProgBar label={d.label} value={d.value} max={totalSpam || 1} color={d.color} ready={ready} />
                  </div>
                ))}
              </div>
            )
          }
        </Card>

        {/* Other metrics */}
        <Card delay={0.52} accent="#f87171">
          <SectionHead title="Other Metrics" sub="Greylisting · throttle · viruses" />
          {!ready
            ? <div className="space-y-3">{[1,2,3].map(i => <Skel key={i} h={48} />)}</div>
            : (
              <div className="space-y-2.5">
                {([
                  { label: 'Greylisted', value: (sm?.greylist.BLOCKED ?? 0) + (sm?.greylist.PASSED ?? 0), color: '#94a3b8', icon: <span className="text-sm">◎</span> },
                  { label: 'Throttled',  value: sm?.throttled.THROTTLED ?? 0, color: '#fb923c', icon: <span className="text-sm">⏱</span> },
                  { label: 'Viruses',    value: viruses, color: viruses > 0 ? '#f87171' : '#64748b', icon: <Bug size={13} /> },
                ] as const).map((item, i) => (
                  <div key={item.label}
                    className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors duration-150"
                    style={{
                      background: 'rgba(255,255,255,.04)',
                      animation: `card-enter .4s cubic-bezier(.16,1,.3,1) ${i * .07}s both`,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.07)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.04)')}>
                    <div className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,.52)' }}>
                      <span style={{ color: item.color, opacity: 0.75 }}>{item.icon}</span>
                      {item.label}
                    </div>
                    <Metric value={item.value} color={item.color} size="text-xl" ready={ready} />
                  </div>
                ))}
              </div>
            )
          }
        </Card>
      </div>
    </div>
  );
}
