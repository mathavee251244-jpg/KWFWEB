import { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, Shield, ExternalLink, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSMConnections, getSMSummary } from '../../api/smartermail';
import type { SMConnections, SMSummaryResponse } from '../../api/smartermail';

const MAIL_ADMIN_URL = 'https://mailstd-01.zth.netdesignhost.com/interface/root#/reports/domain/domain';
const DOMAIN = 'bangkokseafood.co.th';

const fmt    = (n: number) => n.toLocaleString();
const fmtGB  = (b: number) => (b / 1e9).toFixed(2);
const fmtMB  = (b: number) => (b / 1e6).toFixed(1);

// ── Neon palette ──────────────────────────────────────────────────────────────
const N = {
  cyan:   '#00d4ff',
  green:  '#00e887',
  blue:   '#4488ff',
  purple: '#9966ff',
  amber:  '#ffaa00',
  red:    '#ff3355',
  pink:   '#ff44aa',
};

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, dur = 900) {
  const [val, setVal]   = useState(0);
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

// ── Glow number ───────────────────────────────────────────────────────────────
function GN({ n, color = N.cyan, size = 'text-2xl', mono = true }: {
  n: number; color?: string; size?: string; mono?: boolean;
}) {
  const v = useCountUp(n);
  return (
    <span className={`${size} font-bold tabular-nums ${mono ? 'font-mono' : ''}`}
      style={{ color, textShadow: `0 0 10px ${color}99, 0 0 22px ${color}44` }}>
      {fmt(v)}
    </span>
  );
}

// ── HUD Card ──────────────────────────────────────────────────────────────────
function HudCard({ children, accent = N.cyan, scan = true, delay = 0, className = '', extraStyle }: {
  children: React.ReactNode; accent?: string; scan?: boolean; delay?: number; className?: string; extraStyle?: React.CSSProperties;
}) {
  const br = `1.5px solid ${accent}`;
  return (
    <div className={`relative overflow-hidden p-4 ${className}`}
      style={{
        background: 'linear-gradient(135deg,rgba(0,10,18,.97) 0%,rgba(0,6,12,.99) 100%)',
        border: `1px solid ${accent}20`,
        boxShadow: `0 0 28px ${accent}08, inset 0 1px 0 ${accent}12`,
        animation: `section-enter .5s ease-out ${delay}s both`,
        ...extraStyle,
      }}>
      {/* corner brackets */}
      <div className="absolute top-0 left-0   w-3 h-3" style={{ borderTop: br, borderLeft: br }} />
      <div className="absolute top-0 right-0  w-3 h-3" style={{ borderTop: br, borderRight: br }} />
      <div className="absolute bottom-0 left-0  w-3 h-3" style={{ borderBottom: br, borderLeft: br }} />
      <div className="absolute bottom-0 right-0 w-3 h-3" style={{ borderBottom: br, borderRight: br }} />
      {/* scan line */}
      {scan && (
        <div className="absolute inset-x-0 h-px pointer-events-none" style={{
          background: `linear-gradient(90deg,transparent,${accent}70,transparent)`,
          animation: 'card-scan 5s ease-in-out infinite',
        }} />
      )}
      {children}
    </div>
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────
function HudLabel({ children, color = 'rgba(255,255,255,.28)' }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="text-[9px] font-mono tracking-[0.2em] uppercase mb-1.5" style={{ color }}>
      {children}
    </div>
  );
}

// ── SVG arc gauge (disk) ──────────────────────────────────────────────────────
function ArcGauge({ pct, color, size = 120 }: { pct: number; color: string; size?: number }) {
  const r   = size * 0.37;
  const cx  = size / 2;
  const cy  = size / 2;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.75;
  const fill = Math.max(0, Math.min(pct, 100)) / 100 * arc;
  const rot  = -225;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {/* outer decoration ring */}
      <circle cx={cx} cy={cy} r={r + 8} fill="none"
        stroke={`${color}12`} strokeWidth={1}
        strokeDasharray="3 5"
        style={{ animation: 'hud-spin 20s linear infinite', transformOrigin: `${cx}px ${cy}px` }} />
      {/* track */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(255,255,255,.05)" strokeWidth={7} strokeLinecap="round"
        strokeDasharray={`${arc} ${circ}`}
        style={{ transform: `rotate(${rot}deg)`, transformOrigin: `${cx}px ${cy}px` }} />
      {/* value arc */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={7} strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        style={{
          transform: `rotate(${rot}deg)`, transformOrigin: `${cx}px ${cy}px`,
          filter: `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 12px ${color}66)`,
          transition: 'stroke-dasharray 1.2s ease-out',
        }} />
      {/* tick marks */}
      {[0,25,50,75,100].map(t => {
        const angle = (rot + (t / 100) * 270) * (Math.PI / 180);
        const r2 = r + 14;
        return (
          <line key={t}
            x1={cx + (r + 11) * Math.cos(angle)} y1={cy + (r + 11) * Math.sin(angle)}
            x2={cx + r2 * Math.cos(angle)}        y2={cy + r2 * Math.sin(angle)}
            stroke={`${color}50`} strokeWidth={1} />
        );
      })}
      {/* center */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={size * .18}
        fill="white" fontFamily="monospace" fontWeight="bold"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
        {pct}%
      </text>
      <text x={cx} y={cy + size * .14} textAnchor="middle" fontSize={size * .07}
        fill="rgba(255,255,255,.3)" fontFamily="monospace" letterSpacing="2">
        DISK
      </text>
    </svg>
  );
}

// ── Floating particles ────────────────────────────────────────────────────────
type Particle = { id: number; x: number; delay: number; ch: string };
function Particles({ items }: { items: Particle[] }) {
  if (!items.length) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map(p => (
        <span key={p.id} className="absolute font-mono text-[11px]"
          style={{
            left: `${p.x}%`, bottom: 4, color: N.cyan,
            textShadow: `0 0 6px ${N.cyan}`,
            opacity: 0,
            animation: `particle-rise 2s ease-out ${p.delay}s forwards`,
          }}>
          {p.ch}
        </span>
      ))}
    </div>
  );
}

// ── NeonBar ───────────────────────────────────────────────────────────────────
function NeonBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const v   = useCountUp(value);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 shrink-0 text-[9px] font-mono tracking-wider text-right" style={{ color: 'rgba(255,255,255,.35)' }}>
        {label}
      </div>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.04)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <div className="w-14 text-right text-[10px] font-mono tabular-nums" style={{ color, textShadow: `0 0 6px ${color}66` }}>
        {fmt(v)}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ h = 32 }: { h?: number }) {
  return (
    <div className="rounded overflow-hidden" style={{ height: h, background: 'rgba(0,212,255,.04)' }}>
      <div className="h-full w-full" style={{
        background: 'linear-gradient(90deg,transparent,rgba(0,212,255,.08),transparent)',
        animation: 'card-scan 2s ease-in-out infinite',
      }} />
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function HudTip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-1.5 text-[10px] font-mono" style={{
      background: 'rgba(0,10,18,.95)',
      border: `1px solid ${N.cyan}30`,
      color: N.cyan,
      boxShadow: `0 0 12px ${N.cyan}20`,
    }}>
      {payload[0].name}: <strong>{payload[0].value}</strong> GB
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EmailDashboard() {
  const { currentUser, navigate } = useApp();
  const [conn,      setConn]      = useState<SMConnections | null>(null);
  const [sumData,   setSumData]   = useState<SMSummaryResponse | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [busy,      setBusy]      = useState(false);
  const [lastAt,    setLastAt]    = useState<Date | null>(null);
  const [errMsg,    setErrMsg]    = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flash,     setFlash]     = useState(false);
  const pid   = useRef(0);
  const first = useRef(true);
  const timerC = useRef<ReturnType<typeof setInterval>>();
  const timerS = useRef<ReturnType<typeof setInterval>>();

  const HEX = '0123456789ABCDEF✉⬡⬢◈';
  const spawn = useCallback(() => {
    const items: Particle[] = Array.from({ length: 6 }, () => ({
      id: ++pid.current,
      x: 2 + Math.random() * 96,
      delay: Math.random() * .7,
      ch: HEX[Math.floor(Math.random() * HEX.length)],
    }));
    setParticles(p => [...p, ...items]);
    setTimeout(() => setParticles(p => p.filter(x => !items.find(i => i.id === x.id))), 2800);
  }, []);

  const fetchConn = useCallback(async () => {
    try {
      setConn(await getSMConnections());
      setLastAt(new Date());
      if (!first.current) { spawn(); setFlash(true); setTimeout(() => setFlash(false), 600); }
    } catch {}
  }, [spawn]);

  const fetchSum = useCallback(async () => {
    try { setSumData(await getSMSummary()); setLastAt(new Date()); setErrMsg(null); }
    catch (e) { setErrMsg(String(e)); }
  }, []);

  const refresh = useCallback(async () => {
    setBusy(true); await Promise.all([fetchConn(), fetchSum()]); setBusy(false);
  }, [fetchConn, fetchSum]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchConn(), fetchSum()]);
      first.current = false; setLoading(false); spawn();
    })();
    timerC.current = setInterval(fetchConn, 15_000);
    timerS.current = setInterval(fetchSum,  60_000);
    return () => { clearInterval(timerC.current); clearInterval(timerS.current); };
  }, [fetchConn, fetchSum, spawn]);

  if (currentUser.role !== 'it_staff' && currentUser.role !== 'it_manager') {
    return (
      <div className="module-content flex items-center justify-center">
        <div className="text-center" style={{ color: 'rgba(255,255,255,.25)' }}>
          <Shield size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-mono">// ACCESS DENIED</p>
        </div>
      </div>
    );
  }

  // derived
  const sm = sumData?.summary;
  const dk = sumData?.diskUsage;
  const totalIn   = sm ? (sm.incoming.TRUSTED ?? 0) + (sm.incoming.STANDARD_DELIVERY ?? 0) + (sm.incoming.MARKED_AS_SPAM ?? 0) : 0;
  const totalOut  = sm?.outgoing.OUTGOING_MESSAGES ?? 0;
  const totalSpam = sm?.incoming.MARKED_AS_SPAM ?? 0;
  const spamPct   = totalIn > 0 ? Math.round((totalSpam / totalIn) * 100) : 0;
  const viruses   = sm?.sessions.VIRUSES_CAUGHT ?? 0;
  const diskPct   = sumData?.diskPct ?? 0;

  const bwData = sm ? [
    { name: 'SMTP·IN',  gb: +fmtGB(sm.bwOverview.SMTP_IN  ?? 0), color: N.cyan   },
    { name: 'SMTP·OUT', gb: +fmtGB(sm.bwOverview.SMTP_OUT ?? 0), color: N.purple  },
    { name: 'IMAP',     gb: +fmtGB(sm.bwOverview.IMAP     ?? 0), color: N.blue    },
    { name: 'POP',      gb: +fmtGB(sm.bwOverview.POP      ?? 0), color: N.green   },
  ] : [];

  const maxSess = Math.max(sm?.sessions.POP_SESSIONS ?? 0, sm?.sessions.SMTP_IN_SESSIONS ?? 0, sm?.sessions.SMTP_OUT_SESSIONS ?? 0, sm?.sessions.IMAP_SESSIONS ?? 0, 1);
  const timeStr = lastAt?.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) ?? '--:--:--';

  const connItems = [
    { label: 'SESSIONS',  value: conn?.allCount      ?? 0, color: N.green  },
    { label: 'WEBMAIL',   value: conn?.webmailCount  ?? 0, color: N.cyan   },
    { label: 'IMAP',      value: conn?.imapCount     ?? 0, color: N.blue   },
    { label: 'POP',       value: conn?.popCount      ?? 0, color: N.purple  },
    { label: 'SMTP',      value: conn?.smtpCount     ?? 0, color: N.amber  },
    { label: 'USERS',     value: conn?.allUsersCount ?? 0, color: 'rgba(255,255,255,.5)' },
  ] as const;

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="module-content fade-in" style={{ fontFamily: 'inherit' }}>

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2"
        style={{ animation: 'section-enter .4s ease-out both' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('system_status')}
            className="w-8 h-8 rounded flex items-center justify-center transition-colors"
            style={{ border: `1px solid ${N.cyan}30`, color: N.cyan }}
            onMouseEnter={e => (e.currentTarget.style.background = `${N.cyan}15`)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm" style={{
                background: N.cyan,
                boxShadow: `0 0 8px ${N.cyan}`,
                animation: 'blink-led 2s ease-in-out infinite',
              }} />
              <h2 className="text-[16px] font-mono font-bold tracking-[.15em] uppercase"
                style={{ color: N.cyan, textShadow: `0 0 12px ${N.cyan}60` }}>
                MAIL·SERVER·DASHBOARD
              </h2>
            </div>
            <div className="flex items-center gap-3 mt-0.5 ml-4">
              <span className="text-[9px] font-mono tracking-[.2em]" style={{ color: 'rgba(255,255,255,.25)' }}>
                SYS: {DOMAIN}
              </span>
              <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,.2)' }}>|</span>
              <span className="text-[9px] font-mono tracking-[.15em]" style={{ color: 'rgba(255,255,255,.25)' }}>
                UTC+7 {timeStr}
              </span>
              <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,.2)' }}>|</span>
              <span className="text-[9px] font-mono tracking-[.15em]" style={{ color: N.green, textShadow: `0 0 6px ${N.green}` }}>
                ■ CHANNEL SECURE
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* status */}
          <div className="px-2 h-7 flex items-center gap-1.5 rounded font-mono text-[10px]"
            style={{ border: `1px solid ${errMsg ? N.red : N.green}35`, color: errMsg ? N.red : N.green }}>
            <div className="w-1.5 h-1.5 rounded-full"
              style={{ background: errMsg ? N.red : N.green, animation: errMsg ? 'none' : 'blink-led 1.4s ease-in-out infinite' }} />
            {errMsg ? 'ERR' : 'LIVE'}
          </div>
          <button onClick={refresh} disabled={busy}
            className="h-7 px-3 rounded font-mono text-[10px] transition-all flex items-center gap-1.5 disabled:opacity-40"
            style={{ border: `1px solid ${N.cyan}30`, color: N.cyan }}>
            <RefreshCw size={10} className={busy ? 'animate-spin' : ''} />
            SYNC
          </button>
          <button onClick={() => window.open(MAIL_ADMIN_URL, '_blank')}
            className="h-7 px-3 rounded font-mono text-[10px] flex items-center gap-1.5 transition-all"
            style={{ border: `1px solid ${N.blue}40`, color: N.blue }}>
            <ExternalLink size={10} /> ADMIN
          </button>
        </div>
      </div>

      {/* ── ERROR ── */}
      {errMsg && (
        <div className="mb-3 px-3 py-2 rounded font-mono text-[10px]" style={{
          border: `1px solid ${N.red}35`, background: `${N.red}08`, color: N.red,
        }}>
          <span style={{ opacity: .6 }}>// ERROR: </span>{errMsg}
        </div>
      )}

      {/* ── ACTIVE NOW ── */}
      <HudCard accent={N.green} delay={0.05} scan className="mb-4 rounded-none">
        <Particles items={particles} />
        {/* grid bg */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(${N.green}06 1px, transparent 1px), linear-gradient(90deg, ${N.green}06 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          animation: 'grid-pulse 4s ease-in-out infinite',
        }} />
        <div className="relative">
          <HudLabel color={N.green}>// LIVE CONNECTION MATRIX · REFRESH: 15s</HudLabel>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {connItems.map(item => (
              <div key={item.label} className="text-center">
                {loading
                  ? <Skel h={28} />
                  : <GN n={item.value} color={item.color} size="text-[28px]" />}
                <div className="text-[8px] font-mono tracking-[.18em] mt-1"
                  style={{ color: 'rgba(255,255,255,.3)' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </HudCard>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {([
          { label: 'INBOUND·MSG',  value: totalIn,   color: N.cyan,   icon: '▲', sub: '30D' },
          { label: 'OUTBOUND·MSG', value: totalOut,  color: N.blue,   icon: '▼', sub: '30D' },
          { label: 'SPAM·BLOCKED', value: totalSpam, color: N.amber,  icon: '⚠', sub: `${spamPct}% OF IN` },
          { label: 'VIRUSES',      value: viruses,   color: viruses > 0 ? N.red : 'rgba(255,255,255,.3)', icon: '⬡', sub: 'DETECTED' },
        ] as const).map((card, i) => (
          <HudCard key={card.label} accent={card.color} delay={0.08 + i * 0.04} scan={false}
            className="rounded-none"
            extraStyle={flash ? { animation: `data-flash .6s ease-out, section-enter .5s ease-out ${(0.08 + i * 0.04)}s both` } : undefined}>
            <HudLabel color={`${card.color}80`}>{card.icon} {card.label}</HudLabel>
            {loading
              ? <Skel h={36} />
              : <GN n={card.value} color={card.color} size="text-[26px]" />}
            <div className="text-[8px] font-mono tracking-[.15em] mt-1" style={{ color: 'rgba(255,255,255,.2)' }}>
              {card.sub}
            </div>
          </HudCard>
        ))}
      </div>

      {/* ── 3 COL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">

        {/* DISK */}
        <HudCard accent={N.purple} delay={0.2} className="rounded-none">
          <HudLabel color={`${N.purple}90`}>◈ DISK·USAGE·MONITOR</HudLabel>
          {loading ? <Skel h={140} /> : (
            <div className="flex items-center gap-3">
              <ArcGauge pct={diskPct} color={N.purple} size={116} />
              <div className="flex-1">
                <div className="text-[11px] font-mono mb-3"
                  style={{ color: N.purple, textShadow: `0 0 8px ${N.purple}66` }}>
                  {fmtMB(dk?.used ?? 0)} MB
                </div>
                {[
                  { name: 'MAILBOX',  color: N.blue,   val: fmtMB(dk?.mailboxUsed ?? 0) },
                  { name: 'FILES',    color: N.purple,  val: fmtMB(dk?.fileStorageUsed ?? 0) },
                ].map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-sm" style={{ background: d.color, boxShadow: `0 0 4px ${d.color}` }} />
                    <span className="text-[9px] font-mono tracking-wider flex-1" style={{ color: 'rgba(255,255,255,.35)' }}>{d.name}</span>
                    <span className="text-[9px] font-mono" style={{ color: d.color }}>{d.val} MB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </HudCard>

        {/* BANDWIDTH */}
        <HudCard accent={N.cyan} delay={0.23} className="rounded-none">
          <HudLabel color={`${N.cyan}90`}>⬡ BANDWIDTH·OVERVIEW</HudLabel>
          {loading ? <Skel h={160} /> : (
            <>
              <GN n={Math.round(bwData.reduce((s, d) => s + d.gb, 0) * 100) / 100} color={N.cyan} size="text-[22px]" />
              <div className="text-[8px] font-mono tracking-[.15em] mb-3" style={{ color: 'rgba(255,255,255,.25)' }}>
                TOTAL·GB · 30D
              </div>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bwData} barSize={16} margin={{ top: 0, right: 4, left: -24, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 7, fill: 'rgba(255,255,255,.3)', fontFamily: 'monospace' }}
                      axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 7, fill: 'rgba(255,255,255,.2)', fontFamily: 'monospace' }}
                      axisLine={false} tickLine={false} />
                    <Tooltip content={<HudTip />} cursor={{ fill: 'rgba(255,255,255,.03)' }} />
                    <Bar dataKey="gb" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out">
                      {bwData.map((e, i) => (
                        <Cell key={i} fill={e.color} fillOpacity={0.85}
                          style={{ filter: `drop-shadow(0 0 4px ${e.color})` }} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
                {bwData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ background: d.color, boxShadow: `0 0 4px ${d.color}` }} />
                    <span className="text-[8px] font-mono flex-1" style={{ color: 'rgba(255,255,255,.3)' }}>{d.name}</span>
                    <span className="text-[8px] font-mono" style={{ color: d.color }}>{d.gb}G</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </HudCard>

        {/* SESSIONS */}
        <HudCard accent={N.blue} delay={0.26} className="rounded-none">
          <HudLabel color={`${N.blue}90`}>◈ SESSION·MATRIX · 30D</HudLabel>
          {loading ? <Skel h={160} /> : (
            <>
              <div className="space-y-3 mb-4">
                {([
                  { label: 'SMTP·IN',  value: sm?.sessions.SMTP_IN_SESSIONS  ?? 0, color: N.cyan   },
                  { label: 'SMTP·OUT', value: sm?.sessions.SMTP_OUT_SESSIONS ?? 0, color: N.purple  },
                  { label: 'POP',      value: sm?.sessions.POP_SESSIONS      ?? 0, color: N.green   },
                  { label: 'IMAP',     value: sm?.sessions.IMAP_SESSIONS     ?? 0, color: N.blue    },
                ] as const).map((s, i) => (
                  <div key={s.label} style={{ animation: `section-enter .4s ease-out ${i * .07}s both` }}>
                    <NeonBar label={s.label} value={s.value} max={maxSess} color={s.color} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3"
                style={{ borderTop: `1px solid rgba(255,255,255,.06)` }}>
                {[
                  { label: 'GREYLISTED', value: (sm?.greylist.BLOCKED ?? 0) + (sm?.greylist.PASSED ?? 0), color: N.amber },
                  { label: 'THROTTLED',  value: sm?.throttled.THROTTLED ?? 0, color: 'rgba(255,255,255,.4)' },
                ].map(g => (
                  <div key={g.label} className="text-center p-2" style={{ border: `1px solid rgba(255,255,255,.06)` }}>
                    <GN n={g.value} color={g.color} size="text-[18px]" />
                    <div className="text-[7px] font-mono tracking-[.15em] mt-1" style={{ color: 'rgba(255,255,255,.25)' }}>
                      {g.label}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </HudCard>
      </div>

      {/* ── BOTTOM ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* INBOUND */}
        <HudCard accent={N.blue} delay={0.3} className="rounded-none">
          <HudLabel color={`${N.blue}90`}>▲ INBOUND·BREAKDOWN</HudLabel>
          {loading ? <Skel h={110} /> : (
            <>
              <GN n={totalIn} color={N.blue} size="text-[22px]" />
              <div className="text-[8px] font-mono tracking-[.15em] mb-4" style={{ color: 'rgba(255,255,255,.25)' }}>
                TOTAL·INBOUND · 30D
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'TRUSTED',   value: sm?.incoming.TRUSTED ?? 0,           color: N.green  },
                  { label: 'STANDARD',  value: sm?.incoming.STANDARD_DELIVERY ?? 0, color: N.blue   },
                  { label: 'SPAM·RECV', value: sm?.incoming.MARKED_AS_SPAM ?? 0,    color: N.red    },
                ].map((d, i) => (
                  <div key={d.label} style={{ animation: `section-enter .4s ease-out ${i * .08}s both` }}>
                    <NeonBar label={d.label} value={d.value} max={totalIn || 1} color={d.color} />
                  </div>
                ))}
              </div>
            </>
          )}
        </HudCard>

        {/* SPAM */}
        <HudCard accent={N.red} delay={0.33} className="rounded-none">
          <HudLabel color={`${N.red}90`}>⚠ THREAT·ANALYSIS</HudLabel>
          {loading ? <Skel h={110} /> : (
            <>
              <div className="flex items-end gap-3 mb-4">
                <GN n={totalSpam} color={N.red} size="text-[22px]" />
                <div className="text-[9px] font-mono mb-1" style={{ color: 'rgba(255,255,255,.3)' }}>
                  = {spamPct}% OF INBOUND
                </div>
              </div>
              <div className="space-y-2.5 mb-4">
                {[
                  { label: 'LOW',    value: sm?.spam.LOW    ?? 0, color: N.amber },
                  { label: 'MEDIUM', value: sm?.spam.MEDIUM ?? 0, color: '#ff6633' },
                  { label: 'HIGH',   value: sm?.spam.HIGH   ?? 0, color: N.red },
                ].map((d, i) => (
                  <div key={d.label} style={{ animation: `section-enter .4s ease-out ${i * .08}s both` }}>
                    <NeonBar label={d.label} value={d.value} max={totalSpam || 1} color={d.color} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3"
                style={{ borderTop: `1px solid rgba(255,255,255,.06)` }}>
                <span className="text-[9px] font-mono tracking-[.15em]" style={{ color: 'rgba(255,255,255,.35)' }}>
                  ⬡ VIRUSES·DETECTED
                </span>
                <GN n={viruses} color={viruses > 0 ? N.red : 'rgba(255,255,255,.3)'} size="text-[16px]" />
              </div>
            </>
          )}
        </HudCard>
      </div>
    </div>
  );
}
