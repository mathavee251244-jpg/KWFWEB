import { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, Shield, ExternalLink, RefreshCw, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSMConnections, getSMSummary } from '../../api/smartermail';
import type { SMConnections, SMSummaryResponse } from '../../api/smartermail';

const MAIL_ADMIN_URL = 'https://mailstd-01.zth.netdesignhost.com/interface/root#/reports/domain/domain';
const DOMAIN = 'bangkokseafood.co.th';

const fmt   = (n: number) => n.toLocaleString();
const fmtGB = (b: number) => (b / 1e9).toFixed(2);
const fmtMB = (b: number) => (b / 1e6).toFixed(1);

// ── Color palette (softer neon) ───────────────────────────────────────────────
const C = {
  cyan:   '#22d3ee',   // softer cyan
  green:  '#34d399',   // emerald green
  blue:   '#60a5fa',   // soft blue
  purple: '#a78bfa',   // soft purple
  amber:  '#fbbf24',   // warm amber
  red:    '#f87171',   // soft red
};

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, dur = 900) {
  const [val, setVal] = useState(0);
  const raf  = useRef(0);
  const from = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const f = from.current, t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(f + (target - f) * e));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, dur]);
  return val;
}

// ── Glowing number ────────────────────────────────────────────────────────────
function GN({ n, color = C.cyan, size = 'text-2xl' }: { n: number; color?: string; size?: string }) {
  const v = useCountUp(n);
  return (
    <span className={`${size} font-bold font-mono tabular-nums leading-none`}
      style={{ color, textShadow: `0 0 14px ${color}55` }}>
      {fmt(v)}
    </span>
  );
}

// ── Dashboard Card ────────────────────────────────────────────────────────────
function DashCard({ children, accent = C.cyan, scan = false, delay = 0, className = '', extraStyle }: {
  children: React.ReactNode;
  accent?: string;
  scan?: boolean;
  delay?: number;
  className?: string;
  extraStyle?: React.CSSProperties;
}) {
  const br = `2px solid ${accent}`;
  return (
    <div className={`relative overflow-hidden rounded-xl p-5 ${className}`}
      style={{
        background: 'linear-gradient(145deg, rgba(8,15,28,.98) 0%, rgba(5,10,20,.99) 100%)',
        border: `1px solid ${accent}22`,
        boxShadow: `0 4px 24px rgba(0,0,0,.4), 0 0 0 0.5px ${accent}18, inset 0 1px 0 ${accent}10`,
        animation: `section-enter .45s ease-out ${delay}s both`,
        ...extraStyle,
      }}>
      {/* corner brackets */}
      <div className="absolute top-0 left-0  w-4 h-4" style={{ borderTop: br, borderLeft: br, borderRadius: '4px 0 0 0' }} />
      <div className="absolute top-0 right-0 w-4 h-4" style={{ borderTop: br, borderRight: br, borderRadius: '0 4px 0 0' }} />
      <div className="absolute bottom-0 left-0  w-4 h-4" style={{ borderBottom: br, borderLeft: br, borderRadius: '0 0 0 4px' }} />
      <div className="absolute bottom-0 right-0 w-4 h-4" style={{ borderBottom: br, borderRight: br, borderRadius: '0 0 4px 0' }} />
      {/* scan shimmer */}
      {scan && (
        <div className="absolute inset-x-0 h-0.5 pointer-events-none" style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent}50 40%, ${accent}80 50%, ${accent}50 60%, transparent 100%)`,
          animation: 'card-scan 7s ease-in-out infinite',
        }} />
      )}
      {children}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="text-xs font-semibold tracking-wider uppercase mb-3 flex items-center gap-1.5"
      style={{ color: `${color}cc` }}>
      {children}
    </div>
  );
}

// ── SVG arc gauge ─────────────────────────────────────────────────────────────
function ArcGauge({ pct, color, size = 130 }: { pct: number; color: string; size?: number }) {
  const r    = size * 0.36;
  const cx   = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.75;
  const fill = (Math.max(0, Math.min(pct, 100)) / 100) * arc;
  const rot  = -225;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {/* slow-spinning dashed ring */}
      <circle cx={cx} cy={cy} r={r + 10} fill="none"
        stroke={`${color}18`} strokeWidth={1} strokeDasharray="2 6"
        style={{ animation: 'hud-spin 25s linear infinite', transformOrigin: `${cx}px ${cy}px` }} />
      {/* track */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(255,255,255,.06)" strokeWidth={8} strokeLinecap="round"
        strokeDasharray={`${arc} ${circ}`}
        style={{ transform: `rotate(${rot}deg)`, transformOrigin: `${cx}px ${cy}px` }} />
      {/* filled arc */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={8} strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        style={{
          transform: `rotate(${rot}deg)`, transformOrigin: `${cx}px ${cy}px`,
          filter: `drop-shadow(0 0 6px ${color}88)`,
          transition: 'stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)',
        }} />
      {/* tick marks at 0/25/50/75/100 */}
      {[0, 25, 50, 75, 100].map(t => {
        const ang = (rot + (t / 100) * 270) * (Math.PI / 180);
        return (
          <line key={t}
            x1={cx + (r + 12) * Math.cos(ang)} y1={cy + (r + 12) * Math.sin(ang)}
            x2={cx + (r + 16) * Math.cos(ang)} y2={cy + (r + 16) * Math.sin(ang)}
            stroke={`${color}45`} strokeWidth={1.5} strokeLinecap="round" />
        );
      })}
      {/* center text */}
      <text x={cx} y={cy + 5} textAnchor="middle"
        fontSize={size * 0.19} fontFamily="monospace" fontWeight="700" fill="white"
        style={{ filter: `drop-shadow(0 0 8px ${color}77)` }}>
        {pct}%
      </text>
      <text x={cx} y={cy + size * 0.17} textAnchor="middle"
        fontSize={size * 0.085} fontFamily="monospace" fill="rgba(255,255,255,.35)" letterSpacing="3">
        DISK
      </text>
    </svg>
  );
}

// ── Floating mail particles ───────────────────────────────────────────────────
const MAIL_CHARS = ['✉', '✦', '★', '·', '✧', '◉'];
type Particle = { id: number; x: number; delay: number; ch: string };

function Particles({ items }: { items: Particle[] }) {
  if (!items.length) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map(p => (
        <span key={p.id} className="absolute text-sm"
          style={{
            left: `${p.x}%`, bottom: 8,
            color: C.cyan,
            textShadow: `0 0 8px ${C.cyan}`,
            opacity: 0,
            animation: `particle-rise 2.2s ease-out ${p.delay}s forwards`,
          }}>
          {p.ch}
        </span>
      ))}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const v   = useCountUp(value);
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 shrink-0 text-xs font-mono text-right" style={{ color: 'rgba(255,255,255,.45)' }}>
        {label}
      </div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})`, boxShadow: `0 0 8px ${color}55` }} />
      </div>
      <div className="w-16 text-right text-xs font-mono tabular-nums font-semibold" style={{ color }}>
        {fmt(v)}
      </div>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skel({ h = 36 }: { h?: number }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ height: h, background: 'rgba(255,255,255,.03)' }}>
      <div className="h-full" style={{
        background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.05),transparent)',
        animation: 'card-scan 2s ease-in-out infinite',
      }} />
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-sm font-mono" style={{
      background: 'rgba(8,14,28,.96)',
      border: `1px solid rgba(255,255,255,.12)`,
      color: 'rgba(255,255,255,.85)',
      boxShadow: '0 8px 24px rgba(0,0,0,.4)',
    }}>
      {payload[0].name}: <strong style={{ color: C.cyan }}>{payload[0].value} GB</strong>
    </div>
  );
}

// ── Sonar live indicator ──────────────────────────────────────────────────────
function LiveDot({ color, active }: { color: string; active: boolean }) {
  return (
    <div className="relative w-3 h-3 flex items-center justify-center shrink-0">
      {active && <>
        <div className="absolute w-3 h-3 rounded-full" style={{
          border: `1px solid ${color}`,
          animation: 'sonar-ring 2s ease-out infinite',
        }} />
        <div className="absolute w-3 h-3 rounded-full" style={{
          border: `1px solid ${color}`,
          animation: 'sonar-ring 2s ease-out 0.75s infinite',
        }} />
      </>}
      <div className="w-2 h-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EmailDashboard() {
  const { currentUser, navigate } = useApp();
  const [conn,    setConn]    = useState<SMConnections | null>(null);
  const [sumData, setSumData] = useState<SMSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState(false);
  const [lastAt,  setLastAt]  = useState<Date | null>(null);
  const [errMsg,  setErrMsg]  = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flash,   setFlash]   = useState(false);

  const pid    = useRef(0);
  const first  = useRef(true);
  const timerC = useRef<ReturnType<typeof setInterval>>();
  const timerS = useRef<ReturnType<typeof setInterval>>();

  const spawn = useCallback(() => {
    const items: Particle[] = Array.from({ length: 5 }, () => ({
      id: ++pid.current,
      x: 3 + Math.random() * 94,
      delay: Math.random() * 0.6,
      ch: MAIL_CHARS[Math.floor(Math.random() * MAIL_CHARS.length)],
    }));
    setParticles(p => [...p, ...items]);
    setTimeout(() => setParticles(p => p.filter(x => !items.find(i => i.id === x.id))), 3000);
  }, []);

  const fetchConn = useCallback(async () => {
    try {
      setConn(await getSMConnections());
      setLastAt(new Date());
      if (!first.current) { spawn(); setFlash(true); setTimeout(() => setFlash(false), 700); }
    } catch { /* silent */ }
  }, [spawn]);

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
      setLoading(true);
      await Promise.all([fetchConn(), fetchSum()]);
      first.current = false;
      setLoading(false);
      spawn();
    })();
    timerC.current = setInterval(fetchConn, 15_000);
    timerS.current = setInterval(fetchSum,  60_000);
    return () => { clearInterval(timerC.current); clearInterval(timerS.current); };
  }, [fetchConn, fetchSum, spawn]);

  // ── Access guard ────────────────────────────────────────────────────────────
  if (currentUser.role !== 'it_staff' && currentUser.role !== 'it_manager') {
    return (
      <div className="module-content flex items-center justify-center">
        <div className="text-center opacity-40">
          <Shield size={44} className="mx-auto mb-3" />
          <p className="text-sm font-mono">Access restricted</p>
        </div>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────
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

  const bwData = sm ? [
    { name: 'SMTP IN',  gb: +fmtGB(sm.bwOverview.SMTP_IN  ?? 0), color: C.cyan   },
    { name: 'SMTP OUT', gb: +fmtGB(sm.bwOverview.SMTP_OUT ?? 0), color: C.purple },
    { name: 'IMAP',     gb: +fmtGB(sm.bwOverview.IMAP     ?? 0), color: C.blue   },
    { name: 'POP',      gb: +fmtGB(sm.bwOverview.POP      ?? 0), color: C.green  },
  ] : [];

  const maxSess = Math.max(
    sm?.sessions.POP_SESSIONS      ?? 0,
    sm?.sessions.SMTP_IN_SESSIONS  ?? 0,
    sm?.sessions.SMTP_OUT_SESSIONS ?? 0,
    sm?.sessions.IMAP_SESSIONS     ?? 0,
    1,
  );

  const timeStr = lastAt?.toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }) ?? '--:--:--';

  const connItems = [
    { label: 'All Sessions', value: conn?.allCount      ?? 0, color: C.green  },
    { label: 'Webmail',      value: conn?.webmailCount  ?? 0, color: C.cyan   },
    { label: 'IMAP',         value: conn?.imapCount     ?? 0, color: C.blue   },
    { label: 'POP',          value: conn?.popCount      ?? 0, color: C.purple },
    { label: 'SMTP',         value: conn?.smtpCount     ?? 0, color: C.amber  },
    { label: 'Active Users', value: conn?.allUsersCount ?? 0, color: 'rgba(255,255,255,.55)' },
  ] as const;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="module-content fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2"
        style={{ animation: 'section-enter .35s ease-out both' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('system_status')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ border: `1px solid rgba(255,255,255,.1)`, color: 'rgba(255,255,255,.55)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.07)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.55)'; }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <Mail size={18} style={{ color: C.cyan }} />
              <h2 className="text-xl font-bold tracking-wide" style={{ color: 'rgba(255,255,255,.92)' }}>
                Email Server Monitor
              </h2>
            </div>
            <div className="flex items-center gap-3 mt-1 pl-1">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,.35)' }}>{DOMAIN}</span>
              <span style={{ color: 'rgba(255,255,255,.18)' }}>·</span>
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,.35)' }}>{timeStr}</span>
              <span style={{ color: 'rgba(255,255,255,.18)' }}>·</span>
              <div className="flex items-center gap-1.5">
                <LiveDot color={errMsg ? C.red : C.green} active={!errMsg} />
                <span className="text-xs" style={{ color: errMsg ? C.red : C.green }}>
                  {errMsg ? 'Error' : 'Live'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={busy}
            className="h-9 px-4 rounded-xl text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)', color: 'rgba(255,255,255,.75)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.06)')}>
            <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={() => window.open(MAIL_ADMIN_URL, '_blank')}
            className="h-9 px-4 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
            style={{ background: `${C.cyan}15`, border: `1px solid ${C.cyan}35`, color: C.cyan }}
            onMouseEnter={e => (e.currentTarget.style.background = `${C.cyan}25`)}
            onMouseLeave={e => (e.currentTarget.style.background = `${C.cyan}15`)}>
            <ExternalLink size={13} /> Admin Panel
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {errMsg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-sm" style={{
          border: `1px solid ${C.red}35`, background: `${C.red}10`, color: C.red,
        }}>
          <strong>Error:</strong> {errMsg}
        </div>
      )}

      {/* ── Live Connections ── */}
      <DashCard accent={C.green} scan delay={0.05} className="mb-4">
        <Particles items={particles} />
        <SLabel color={C.green}>
          <LiveDot color={C.green} active /> Live Connections
          <span className="text-xs font-normal normal-case ml-auto" style={{ color: 'rgba(255,255,255,.3)' }}>
            Auto-refresh every 15s
          </span>
        </SLabel>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 relative">
          {connItems.map((item, i) => (
            <div key={item.label} className="text-center"
              style={{ animation: `section-enter .4s ease-out ${i * 0.05}s both` }}>
              {loading
                ? <Skel h={44} />
                : <GN n={item.value} color={item.color} size="text-4xl" />}
              <div className="text-xs mt-2" style={{ color: 'rgba(255,255,255,.4)' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </DashCard>

      {/* ── 4 stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {([
          { label: 'Inbound',      value: totalIn,   color: C.cyan,   icon: '↓', sub: '30 days' },
          { label: 'Outbound',     value: totalOut,  color: C.blue,   icon: '↑', sub: '30 days' },
          { label: 'Spam Blocked', value: totalSpam, color: C.amber,  icon: '⚠', sub: `${spamPct}% of inbound` },
          { label: 'Viruses',      value: viruses,   color: viruses > 0 ? C.red : 'rgba(255,255,255,.3)', icon: '⬡', sub: 'detected' },
        ] as const).map((card, i) => (
          <DashCard key={card.label} accent={card.color} delay={0.1 + i * 0.04}
            extraStyle={flash ? { animation: `data-flash .7s ease-out, section-enter .45s ease-out ${0.1 + i * 0.04}s both` } : undefined}>
            <div className="text-xs font-semibold mb-1" style={{ color: `${card.color}cc` }}>
              {card.icon}  {card.label}
            </div>
            {loading
              ? <Skel h={48} />
              : <GN n={card.value} color={card.color} size="text-3xl" />}
            <div className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,.3)' }}>{card.sub}</div>
          </DashCard>
        ))}
      </div>

      {/* ── Middle row: Disk / Bandwidth / Sessions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">

        {/* Disk */}
        <DashCard accent={C.purple} delay={0.2}>
          <SLabel color={C.purple}>Disk Usage</SLabel>
          {loading ? <Skel h={150} /> : (
            <div className="flex items-center gap-4">
              <ArcGauge pct={diskPct} color={C.purple} size={130} />
              <div className="flex-1 space-y-3">
                <div>
                  <div className="text-sm font-mono font-bold" style={{ color: C.purple }}>
                    {fmtMB(dk?.used ?? 0)} MB
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,.35)' }}>Total used</div>
                </div>
                {[
                  { name: 'Mailbox',  color: C.blue,   val: fmtMB(dk?.mailboxUsed ?? 0) },
                  { name: 'Files',    color: C.purple, val: fmtMB(dk?.fileStorageUsed ?? 0) },
                ].map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color, boxShadow: `0 0 5px ${d.color}` }} />
                    <span className="text-xs flex-1" style={{ color: 'rgba(255,255,255,.45)' }}>{d.name}</span>
                    <span className="text-xs font-mono font-semibold" style={{ color: d.color }}>{d.val} MB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DashCard>

        {/* Bandwidth */}
        <DashCard accent={C.cyan} delay={0.23}>
          <SLabel color={C.cyan}>Bandwidth Overview</SLabel>
          {loading ? <Skel h={180} /> : (
            <>
              <div className="mb-1">
                <GN n={Math.round(bwData.reduce((s, d) => s + d.gb, 0) * 100) / 100} color={C.cyan} size="text-2xl" />
                <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,.35)' }}>GB total · 30 days</span>
              </div>
              <div className="h-[110px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bwData} barSize={18} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,.35)' }}
                      axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,.25)' }}
                      axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,.03)' }} />
                    <Bar dataKey="gb" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out">
                      {bwData.map((e, i) => (
                        <Cell key={i} fill={e.color} fillOpacity={0.8}
                          style={{ filter: `drop-shadow(0 0 5px ${e.color}66)` }} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 pt-2"
                style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>
                {bwData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-xs flex-1" style={{ color: 'rgba(255,255,255,.4)' }}>{d.name}</span>
                    <span className="text-xs font-mono font-semibold" style={{ color: d.color }}>{d.gb} G</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </DashCard>

        {/* Sessions */}
        <DashCard accent={C.blue} delay={0.26}>
          <SLabel color={C.blue}>Session Counts (30 days)</SLabel>
          {loading ? <Skel h={180} /> : (
            <>
              <div className="space-y-3.5 mb-4">
                {([
                  { label: 'SMTP In',  value: sm?.sessions.SMTP_IN_SESSIONS  ?? 0, color: C.cyan   },
                  { label: 'SMTP Out', value: sm?.sessions.SMTP_OUT_SESSIONS ?? 0, color: C.purple },
                  { label: 'POP',      value: sm?.sessions.POP_SESSIONS      ?? 0, color: C.green  },
                  { label: 'IMAP',     value: sm?.sessions.IMAP_SESSIONS     ?? 0, color: C.blue   },
                ] as const).map((s, i) => (
                  <div key={s.label} style={{ animation: `section-enter .4s ease-out ${i * .07}s both` }}>
                    <ProgBar label={s.label} value={s.value} max={maxSess} color={s.color} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>
                {[
                  { label: 'Greylisted', value: (sm?.greylist.BLOCKED ?? 0) + (sm?.greylist.PASSED ?? 0), color: C.amber },
                  { label: 'Throttled',  value: sm?.throttled.THROTTLED ?? 0, color: 'rgba(255,255,255,.45)' },
                ].map(g => (
                  <div key={g.label} className="text-center py-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,.03)' }}>
                    <GN n={g.value} color={g.color} size="text-xl" />
                    <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,.35)' }}>{g.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DashCard>
      </div>

      {/* ── Bottom row: Inbound / Threat ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Inbound breakdown */}
        <DashCard accent={C.blue} delay={0.3}>
          <SLabel color={C.blue}>Inbound Breakdown</SLabel>
          {loading ? <Skel h={120} /> : (
            <>
              <div className="mb-4">
                <GN n={totalIn} color={C.blue} size="text-3xl" />
                <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,.35)' }}>total inbound · 30 days</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Trusted',  value: sm?.incoming.TRUSTED           ?? 0, color: C.green },
                  { label: 'Standard', value: sm?.incoming.STANDARD_DELIVERY ?? 0, color: C.blue  },
                  { label: 'Spam',     value: sm?.incoming.MARKED_AS_SPAM    ?? 0, color: C.red   },
                ].map((d, i) => (
                  <div key={d.label} style={{ animation: `section-enter .4s ease-out ${i * .08}s both` }}>
                    <ProgBar label={d.label} value={d.value} max={totalIn || 1} color={d.color} />
                  </div>
                ))}
              </div>
            </>
          )}
        </DashCard>

        {/* Threat analysis */}
        <DashCard accent={C.red} delay={0.33}>
          <SLabel color={C.red}>Threat Analysis</SLabel>
          {loading ? <Skel h={120} /> : (
            <>
              <div className="flex items-baseline gap-3 mb-4">
                <GN n={totalSpam} color={C.red} size="text-3xl" />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,.4)' }}>
                  spam = {spamPct}% of inbound
                </span>
              </div>
              <div className="space-y-3 mb-4">
                {[
                  { label: 'Low',    value: sm?.spam.LOW    ?? 0, color: C.amber },
                  { label: 'Medium', value: sm?.spam.MEDIUM ?? 0, color: '#fb923c' },
                  { label: 'High',   value: sm?.spam.HIGH   ?? 0, color: C.red   },
                ].map((d, i) => (
                  <div key={d.label} style={{ animation: `section-enter .4s ease-out ${i * .08}s both` }}>
                    <ProgBar label={d.label} value={d.value} max={totalSpam || 1} color={d.color} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,.45)' }}>Viruses detected</span>
                <GN n={viruses} color={viruses > 0 ? C.red : 'rgba(255,255,255,.35)'} size="text-xl" />
              </div>
            </>
          )}
        </DashCard>
      </div>
    </div>
  );
}
