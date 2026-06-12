import { useRef, useEffect, useState, useMemo, createContext, useContext } from 'react';
import {
  Home, Ticket, List, LayoutDashboard,
  Search, TrendingUp, BookOpen, Monitor, Users, Timer, MessageCircle,
  Plus, X, Move,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { PageId } from '../../types';

type ModuleEntry = { title: string; icon: React.ReactNode; component: React.ComponentType };

interface Props {
  moduleMap: Record<Exclude<PageId, 'desktop'>, ModuleEntry>;
  wallpaperIdx?: number;
  onWallpaperChange?: (idx: number) => void;
  wallpaperCount?: number;
  customWallpaperCount?: number;
  onAddWallpaper?: (file: File) => void;
  onRemoveWallpaper?: (customIdx: number) => void;
  activeCustomIdx?: number;
  onAdjustWallpaper?: (customIdx: number) => void;
  isAdjusting?: boolean;
  isLightBg?: boolean;
}

// Context สำหรับ light/dark theming ทั่วทุก sub-component
const LightBgCtx = createContext(false);
const useLight = () => useContext(LightBgCtx);

const DEFAULT_WALLPAPER_NAMES = [
  'Sakura Bloom', 'Wisteria Garden', 'Spring Morning',
  'Peach Blossom', 'Hydrangea Sky', 'Rose Garden',
];

const moduleOrder: Array<{
  id: Exclude<PageId, 'desktop'>;
  label: string;
  icon: React.ReactNode;
  color: string;
  requiredRole?: 'it_staff' | 'it_manager';
}> = [
  { id: 'home',            label: 'หน้าแรก',       icon: <Home size={22} />,            color: '#0ea5e9' },
  { id: 'submit_ticket',   label: 'แจ้งปัญหา IT',  icon: <Ticket size={22} />,          color: '#6366f1' },
  { id: 'my_tickets',      label: 'Ticket ของฉัน', icon: <List size={22} />,            color: '#06b6d4' },
  { id: 'chat',            label: 'Chat',           icon: <MessageCircle size={22} />,   color: '#22c55e' },
  { id: 'all_tickets',     label: 'All Tickets',    icon: <LayoutDashboard size={22} />, color: '#8b5cf6', requiredRole: 'it_staff' },
  { id: 'ticket_detail',   label: 'รายละเอียด',    icon: <Search size={22} />,          color: '#64748b' },
  { id: 'it_dashboard',    label: 'Dashboard',      icon: <TrendingUp size={22} />,      color: '#f59e0b', requiredRole: 'it_staff' },
  { id: 'knowledge_base',  label: 'คลังความรู้',   icon: <BookOpen size={22} />,        color: '#10b981' },
  { id: 'system_status',   label: 'สถานะระบบ',     icon: <Monitor size={22} />,         color: '#ef4444' },
  { id: 'user_management', label: 'จัดการผู้ใช้',  icon: <Users size={22} />,           color: '#f97316', requiredRole: 'it_staff' },
  { id: 'ot_record',       label: 'บันทึก OT',     icon: <Timer size={22} />,           color: '#f59e0b' },
];

// ── Flower SVG ────────────────────────────────────────────────────────────────
function FlowerBloom({ size, color = 'white' }: { size: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {[0, 72, 144, 216, 288].map(a => (
        <ellipse key={a} cx="50" cy="27" rx="11" ry="23"
          fill={color} transform={`rotate(${a},50,50)`} />
      ))}
      <circle cx="50" cy="50" r="10" fill={color} opacity="0.55" />
      {[0,60,120,180,240,300].map(a => (
        <circle key={a}
          cx={50 + 5 * Math.cos(a * Math.PI / 180)}
          cy={50 + 5 * Math.sin(a * Math.PI / 180)}
          r="1.5" fill={color} opacity="0.4" />
      ))}
    </svg>
  );
}

// ── Floral Corner Decorations ─────────────────────────────────────────────────
function FloralDecor() {
  const isLight = useLight();
  const color = isLight ? 'rgba(120,70,110,0.55)' : 'white';
  const ops   = isLight
    ? [0.10, 0.09, 0.08, 0.07, 0.06]
    : [0.07, 0.065, 0.055, 0.045, 0.04];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div style={{ position: 'absolute', top: -30, right: -30, opacity: ops[0], transform: 'rotate(12deg)' }}>
        <FlowerBloom size={240} color={color} />
      </div>
      <div style={{ position: 'absolute', bottom: 48, left: -20, opacity: ops[1], transform: 'rotate(-8deg)' }}>
        <FlowerBloom size={175} color={color} />
      </div>
      <div style={{ position: 'absolute', top: 18, left: 105, opacity: ops[2], transform: 'rotate(22deg)' }}>
        <FlowerBloom size={90} color={color} />
      </div>
      <div style={{ position: 'absolute', top: '38%', right: 28, opacity: ops[3], transform: 'rotate(-18deg)' }}>
        <FlowerBloom size={72} color={color} />
      </div>
      <div style={{ position: 'absolute', bottom: 70, right: 80, opacity: ops[4], transform: 'rotate(30deg)' }}>
        <FlowerBloom size={55} color={color} />
      </div>
    </div>
  );
}

// ── Falling Petals ────────────────────────────────────────────────────────────
function FallingPetals() {
  const isLight = useLight();
  const petals = [
    { left: '18%',  size: 7,  colorD: 'rgba(255,182,193,0.55)', colorL: 'rgba(200,80,120,0.35)',  dur: '20s', delay: '-4s',  rx: 50, ry: 35 },
    { left: '38%',  size: 5,  colorD: 'rgba(210,185,255,0.50)', colorL: 'rgba(130,80,190,0.32)',  dur: '26s', delay: '-14s', rx: 45, ry: 55 },
    { left: '58%',  size: 8,  colorD: 'rgba(255,205,175,0.50)', colorL: 'rgba(200,100,80,0.30)',  dur: '18s', delay: '-8s',  rx: 55, ry: 40 },
    { left: '74%',  size: 6,  colorD: 'rgba(255,182,193,0.48)', colorL: 'rgba(200,80,120,0.32)',  dur: '23s', delay: '-18s', rx: 40, ry: 55 },
    { left: '88%',  size: 5,  colorD: 'rgba(178,200,255,0.48)', colorL: 'rgba(80,100,200,0.30)',  dur: '28s', delay: '-2s',  rx: 50, ry: 45 },
    { left: '48%',  size: 7,  colorD: 'rgba(255,155,180,0.45)', colorL: 'rgba(200,80,120,0.30)',  dur: '22s', delay: '-11s', rx: 55, ry: 38 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {petals.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: p.left, top: 0,
          animation: `petal-fall ${p.dur} ${p.delay} linear infinite, petal-sway ${parseFloat(p.dur) * 0.6}s ${p.delay} ease-in-out infinite`,
        }}>
          <svg width={p.size * 2} height={p.size * 3} viewBox="0 0 100 150">
            <ellipse cx="50" cy="75" rx={p.rx} ry={p.ry}
              fill={isLight ? p.colorL : p.colorD}
              style={{ filter: 'blur(0.5px)' }} />
          </svg>
        </div>
      ))}
    </div>
  );
}

// ── Particle Network Canvas ────────────────────────────────────────────────────
function NetworkCanvas() {
  const isLight = useLight();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const N = 55;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.4 + 0.5,
    }));

    const MAX_DIST = 155;
    const lineColor  = isLight ? '160,90,130' : '255,200,215';
    const dotColor   = isLight ? '160,90,130' : '255,210,225';
    const lineAlpha  = isLight ? 0.06 : 0.07;
    const dotAlpha   = isLight ? 0.16 : 0.18;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(${lineColor},${(1 - d / MAX_DIST) * lineAlpha})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor},${dotAlpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [isLight]);

  return <canvas ref={ref} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.5 }} />;
}

// ── Desktop Clock ──────────────────────────────────────────────────────────────
function DesktopClock() {
  const isLight = useLight();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const dateStr = now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const cMain  = isLight ? 'rgba(40,20,50,0.07)'  : 'rgba(255,255,255,0.065)';
  const cColon = isLight ? 'rgba(40,20,50,0.045)' : 'rgba(255,255,255,0.04)';
  const cSec   = isLight ? 'rgba(40,20,50,0.035)' : 'rgba(255,255,255,0.03)';
  const cDate  = isLight ? 'rgba(40,20,50,0.05)'  : 'rgba(255,255,255,0.04)';

  return (
    <div className="absolute pointer-events-none select-none"
      style={{ top: '42%', left: 'calc(50% + 44px)', transform: 'translate(-50%, -50%)' }}>
      <div className="text-center">
        <div style={{
          fontSize: 92, fontWeight: 100, letterSpacing: '0.06em',
          color: cMain, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        }}>
          {hh}<span style={{ color: cColon, animation: 'hud-blink 1s ease-in-out infinite' }}>:</span>{mm}
          <span style={{ fontSize: 60, color: cSec }}>:{ss}</span>
        </div>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: cDate, marginTop: 6 }}>
          {dateStr}
        </div>
        <div className="absolute inset-0 -m-8 pointer-events-none" style={{ zIndex: -1 }}>
          <div style={{
            position: 'absolute', inset: 0,
            border: `1px solid ${isLight ? 'rgba(120,70,110,0.06)' : 'rgba(210,195,235,0.06)'}`,
            borderRadius: '50%',
            animation: 'hud-pulse-ring 4s ease-in-out infinite',
          }} />
        </div>
      </div>
    </div>
  );
}

// ── Desktop Quick Stats ────────────────────────────────────────────────────────
function DesktopStats() {
  const isLight = useLight();
  const { tickets, incidents, services, navigate } = useApp();
  const open = tickets.filter(t => !['resolved','closed'].includes(t.status)).length;
  const overdue = tickets.filter(t => !['resolved','closed'].includes(t.status) && new Date(t.slaDueTime) < new Date()).length;
  const activeInc = incidents.filter(i => i.status !== 'resolved').length;
  const allOk = services.length > 0 && services.every(s => s.status === 'operational');

  const labelColor = isLight ? 'rgba(40,20,50,0.42)' : 'rgba(255,255,255,0.22)';
  const lineColor  = isLight
    ? 'linear-gradient(to bottom, rgba(120,70,110,0.20), transparent)'
    : 'linear-gradient(to bottom, rgba(210,195,235,0.22), transparent)';

  const stats = [
    { label: 'OPEN TICKETS', value: open,   color: '#3b82f6', onClick: () => navigate('all_tickets') },
    ...(overdue > 0   ? [{ label: 'SLA OVERDUE', value: overdue,    color: '#ef4444', onClick: () => navigate('all_tickets') }]  : []),
    ...(activeInc > 0 ? [{ label: 'INCIDENTS',   value: activeInc,  color: '#f97316', onClick: () => navigate('system_status') }] : []),
    { label: 'SYSTEMS', value: allOk ? 'OK' : 'ALERT', color: allOk ? '#22c55e' : '#f59e0b', onClick: () => navigate('system_status') },
  ];

  return (
    <div className="absolute pointer-events-auto select-none flex flex-col gap-3 items-end"
      style={{ bottom: '22%', right: 20 }}>
      {stats.map(s => (
        <button key={s.label} onClick={s.onClick} className="flex flex-col items-end group" style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: 9, letterSpacing: '0.2em', color: labelColor, transition: 'color 0.2s' }}>
            {s.label}
          </span>
          <span style={{
            fontSize: 22, fontWeight: 200, letterSpacing: '0.05em',
            color: s.color + (isLight ? 'cc' : '60'),
            lineHeight: 1.1, transition: 'color 0.2s',
          }}
            className="group-hover:!opacity-100"
          >
            {s.value}
          </span>
        </button>
      ))}
      <div style={{ width: 1, height: 40, background: lineColor, marginTop: 4 }} />
    </div>
  );
}

// ── Floating Orbs (ambient glow) ───────────────────────────────────────────────
function FloatingOrbs() {
  const isLight = useLight();
  const orbs = useMemo(() => isLight ? [
    { x: 65, y: 25, size: 420, color: 'rgba(255,190,210,0.18)', dur: '28s', delay: '0s' },
    { x: 22, y: 62, size: 340, color: 'rgba(210,185,255,0.15)', dur: '35s', delay: '-12s' },
    { x: 82, y: 72, size: 280, color: 'rgba(255,215,180,0.14)', dur: '42s', delay: '-8s' },
  ] : [
    { x: 65, y: 25, size: 420, color: 'rgba(255,190,210,0.12)', dur: '28s', delay: '0s' },
    { x: 22, y: 62, size: 340, color: 'rgba(210,185,255,0.10)', dur: '35s', delay: '-12s' },
    { x: 82, y: 72, size: 280, color: 'rgba(255,215,180,0.09)', dur: '42s', delay: '-8s' },
  ], [isLight]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {orbs.map((o, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${o.x}%`, top: `${o.y}%`,
          width: o.size, height: o.size,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${o.color} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          animation: `float-up ${o.dur} ${o.delay} ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ── Main Desktop Component ─────────────────────────────────────────────────────
export default function Desktop({
  wallpaperIdx = 0,
  onWallpaperChange,
  wallpaperCount = 6,
  customWallpaperCount = 0,
  onAddWallpaper,
  onRemoveWallpaper,
  activeCustomIdx = -1,
  onAdjustWallpaper,
  isAdjusting = false,
  isLightBg = false,
}: Props) {
  const { navigate, currentPage, currentUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalWallpapers = wallpaperCount + customWallpaperCount;

  const getWallpaperName = (i: number) => {
    if (i < wallpaperCount) return DEFAULT_WALLPAPER_NAMES[i] ?? `Theme ${i + 1}`;
    return `ภาพของฉัน ${i - wallpaperCount + 1}`;
  };

  const canAccess = (requiredRole?: 'it_staff' | 'it_manager') => {
    if (!requiredRole) return true;
    if (requiredRole === 'it_staff') return currentUser.role === 'it_staff' || currentUser.role === 'it_manager';
    return currentUser.role === 'it_manager';
  };

  const visibleModules = moduleOrder.filter(m => canAccess(m.requiredRole));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAddWallpaper) onAddWallpaper(file);
    e.target.value = '';
  };

  // Text / UI colors based on theme
  const orgPrimary   = isLightBg ? 'rgba(40,20,50,0.45)'  : 'rgba(255,255,255,0.18)';
  const orgSecondary = isLightBg ? 'rgba(40,20,50,0.30)'  : 'rgba(255,255,255,0.10)';
  const iconLabelActive   = isLightBg ? 'rgba(40,20,50,0.88)'  : 'rgba(255,255,255,0.92)';
  const iconLabelInactive = isLightBg ? 'rgba(40,20,50,0.62)'  : 'rgba(255,255,255,0.65)';
  const iconLabelShadow   = isLightBg ? 'none'                 : '0 1px 4px rgba(0,0,0,0.8)';
  const iconBtnActive     = isLightBg ? 'rgba(0,0,0,0.07) border border-black/10' : 'bg-white/15 border border-white/20';
  const iconBtnHover      = isLightBg ? 'hover:bg-black/5 hover:border-black/8'   : 'hover:bg-white/10 hover:border-white/12';
  const iconBoxShadowBase = isLightBg ? '0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)' : '0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)';
  const wpNameColor       = isLightBg ? 'rgba(40,20,50,0.38)'  : 'rgba(255,255,255,0.28)';
  const wpNameShadow      = isLightBg ? 'none'                 : '0 1px 4px rgba(0,0,0,0.9)';
  const dotActive         = isLightBg ? 'rgba(40,20,50,0.72)'  : 'rgba(255,255,255,0.80)';
  const dotInactive       = isLightBg ? 'rgba(40,20,50,0.22)'  : 'rgba(255,255,255,0.28)';
  const dotCustom         = isLightBg ? 'rgba(120,70,110,0.50)': 'rgba(210,195,235,0.55)';
  const dotActiveShadow   = isLightBg ? '0 0 6px rgba(40,20,50,0.20)' : '0 0 8px rgba(255,255,255,0.45)';
  const addBtnBg          = isLightBg ? 'rgba(0,0,0,0.06)'     : 'rgba(255,255,255,0.10)';
  const addBtnBorder      = isLightBg ? 'rgba(0,0,0,0.18)'     : 'rgba(255,255,255,0.30)';
  const addBtnBgHover     = isLightBg ? 'rgba(0,0,0,0.10)'     : 'rgba(255,255,255,0.20)';
  const addBtnBorderHover = isLightBg ? 'rgba(0,0,0,0.30)'     : 'rgba(255,255,255,0.55)';
  const addIconColor      = isLightBg ? 'rgba(40,20,50,0.45)'  : 'rgba(255,255,255,0.60)';
  const glowBg            = isLightBg
    ? 'radial-gradient(ellipse at bottom right, rgba(200,130,160,0.12) 0%, transparent 70%)'
    : 'radial-gradient(ellipse at bottom right, rgba(255,190,210,0.14) 0%, transparent 70%)';

  return (
    <LightBgCtx.Provider value={isLightBg}>
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{ bottom: 'calc(52px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* ── Background effects ── */}
        <FloatingOrbs />
        <FloralDecor />
        <FallingPetals />
        <NetworkCanvas />

        {/* ── Clock ── */}
        <DesktopClock />

        {/* ── Org label ── */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none z-0">
          <div className="text-[10px] sm:text-[11px] font-semibold tracking-[0.22em] uppercase"
            style={{ color: orgPrimary }}>
            Bangkok Seafood Co., Ltd.
          </div>
          <div className="text-[12px] sm:text-[13px] font-light mt-0.5 tracking-widest"
            style={{ color: orgSecondary }}>
            IT Helpdesk Portal
          </div>
        </div>

        {/* ── Stats ── */}
        <DesktopStats />

        {/* ── Icons column ── */}
        <div
          className="absolute top-6 left-4 bottom-0 overflow-y-auto pointer-events-auto"
          style={{ WebkitOverflowScrolling: 'touch', width: '88px' }}
        >
          <div className="flex flex-col gap-1.5 py-2">
            {visibleModules.map((mod) => {
              const isActive = currentPage === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => navigate(mod.id)}
                  title={mod.label}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer outline-none transition-all duration-150 group ${
                    isActive
                      ? isLightBg ? 'bg-black/7 border border-black/10' : 'bg-white/15 border border-white/20'
                      : isLightBg ? 'bg-transparent hover:bg-black/5 border border-transparent hover:border-black/8'
                                  : 'bg-transparent hover:bg-white/10 border border-transparent hover:border-white/12'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105"
                    style={{
                      background: `linear-gradient(145deg, ${mod.color}44, ${mod.color}22)`,
                      border: `1px solid ${mod.color}55`,
                      boxShadow: isActive
                        ? `0 0 0 2px ${mod.color}55, 0 6px 20px ${mod.color}33`
                        : iconBoxShadowBase,
                      color: mod.color,
                    }}
                  >
                    {mod.icon}
                  </div>
                  <span
                    className="text-[10px] font-medium text-center leading-tight w-full"
                    style={{
                      color: isActive ? iconLabelActive : iconLabelInactive,
                      textShadow: iconLabelShadow,
                    }}
                  >
                    {mod.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Wallpaper selector ── */}
        <div className="absolute bottom-5 right-4 pointer-events-auto flex flex-col items-end gap-2">
          <div className="text-[9px] uppercase tracking-widest select-none"
            style={{ color: wpNameColor, textShadow: wpNameShadow }}>
            {getWallpaperName(wallpaperIdx)}
          </div>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalWallpapers }).map((_, i) => {
              const isActive = i === wallpaperIdx;
              const isCustom = i >= wallpaperCount;
              const customIdx = i - wallpaperCount;
              return (
                <div key={i} className="relative group/dot">
                  <button
                    onClick={() => onWallpaperChange?.(i)}
                    title={getWallpaperName(i)}
                    className="transition-all duration-300 block"
                    style={{
                      width: isActive ? 20 : 7,
                      height: 7,
                      borderRadius: 99,
                      background: isActive ? dotActive : isCustom ? dotCustom : dotInactive,
                      boxShadow: isActive ? dotActiveShadow : 'none',
                    }}
                  />
                  {isCustom && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col gap-0.5 items-center opacity-0 group-hover/dot:opacity-100 transition-opacity">
                      {onAdjustWallpaper && !isAdjusting && (
                        <button
                          onClick={e => { e.stopPropagation(); onAdjustWallpaper(customIdx); }}
                          title="ปรับตำแหน่งภาพ"
                          className="w-4 h-4 rounded-full bg-sky-500/80 flex items-center justify-center hover:bg-sky-500"
                        >
                          <Move size={7} className="text-white" />
                        </button>
                      )}
                      {onRemoveWallpaper && (
                        <button
                          onClick={e => { e.stopPropagation(); onRemoveWallpaper(customIdx); }}
                          title="ลบภาพนี้"
                          className="w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500"
                        >
                          <X size={8} className="text-white" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {onAddWallpaper && (
              <button
                onClick={() => fileInputRef.current?.click()}
                title="เพิ่มภาพพื้นหลังจากเครื่อง"
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ml-0.5"
                style={{
                  background: addBtnBg,
                  border: `1px dashed ${addBtnBorder}`,
                  boxShadow: isLightBg ? 'none' : '0 1px 4px rgba(0,0,0,0.4)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = addBtnBgHover;
                  (e.currentTarget as HTMLElement).style.borderColor = addBtnBorderHover;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = addBtnBg;
                  (e.currentTarget as HTMLElement).style.borderColor = addBtnBorder;
                }}
              >
                <Plus size={12} style={{ color: addIconColor }} />
              </button>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Bottom ambient glow */}
        <div className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none opacity-20"
          style={{ background: glowBg }} />
      </div>
    </LightBgCtx.Provider>
  );
}
