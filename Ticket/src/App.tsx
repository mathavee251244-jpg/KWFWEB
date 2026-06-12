import React, { useState, useEffect } from 'react';

const WALLPAPERS = [
  // 1. Sakura Bloom — pink cherry blossom (default)
  `radial-gradient(ellipse 130% 75% at 50% 20%, rgba(255,192,203,0.55) 0%, rgba(255,170,185,0.30) 40%, transparent 65%),
   radial-gradient(ellipse 90% 70% at 18% 78%, rgba(255,160,180,0.32) 0%, transparent 55%),
   radial-gradient(ellipse 80% 65% at 88% 72%, rgba(255,210,225,0.28) 0%, transparent 52%),
   linear-gradient(160deg, #1e1018 0%, #2a1420 28%, #221018 58%, #1c0e16 82%, #180c14 100%)`,
  // 2. Wisteria Garden — soft purple lavender
  `radial-gradient(ellipse 125% 72% at 48% 22%, rgba(210,185,255,0.55) 0%, rgba(190,160,248,0.30) 42%, transparent 65%),
   radial-gradient(ellipse 88% 70% at 16% 76%, rgba(185,158,248,0.32) 0%, transparent 55%),
   radial-gradient(ellipse 78% 65% at 88% 68%, rgba(228,215,255,0.28) 0%, transparent 52%),
   linear-gradient(165deg, #130e20 0%, #1c1430 28%, #160e24 58%, #120c1c 82%, #100a18 100%)`,
  // 3. Spring Morning — fresh lime & warm gold
  `radial-gradient(ellipse 125% 72% at 45% 24%, rgba(188,235,168,0.52) 0%, rgba(168,225,148,0.28) 42%, transparent 65%),
   radial-gradient(ellipse 88% 68% at 82% 78%, rgba(255,235,148,0.35) 0%, transparent 55%),
   radial-gradient(ellipse 78% 65% at 14% 72%, rgba(155,225,188,0.28) 0%, transparent 52%),
   linear-gradient(165deg, #0e1610 0%, #14200e 28%, #101a0c 58%, #0c1608 82%, #0a1208 100%)`,
  // 4. Peach Blossom — warm apricot peach
  `radial-gradient(ellipse 128% 74% at 50% 22%, rgba(255,205,175,0.55) 0%, rgba(255,180,148,0.30) 42%, transparent 65%),
   radial-gradient(ellipse 90% 70% at 16% 78%, rgba(255,175,148,0.32) 0%, transparent 55%),
   radial-gradient(ellipse 80% 65% at 86% 70%, rgba(255,225,188,0.28) 0%, transparent 52%),
   linear-gradient(162deg, #201208 0%, #2c180c 28%, #221208 58%, #1c1008 82%, #180e08 100%)`,
  // 5. Hydrangea Sky — all white with soft periwinkle-blue tint
  `radial-gradient(ellipse 140% 90% at 50% 15%, rgba(210,225,255,0.70) 0%, rgba(190,210,255,0.35) 45%, transparent 72%),
   radial-gradient(ellipse 100% 80% at 88% 80%, rgba(200,215,255,0.45) 0%, transparent 60%),
   radial-gradient(ellipse 90% 70% at 12% 75%, rgba(215,225,255,0.38) 0%, transparent 58%),
   linear-gradient(160deg, #ffffff 0%, #f4f6ff 35%, #f0f4ff 65%, #f5f7ff 100%)`,
  // 6. Rose Garden — all white with soft rose-pink tint
  `radial-gradient(ellipse 140% 90% at 50% 15%, rgba(255,215,220,0.70) 0%, rgba(255,195,205,0.35) 45%, transparent 72%),
   radial-gradient(ellipse 100% 80% at 88% 80%, rgba(255,210,220,0.45) 0%, transparent 60%),
   radial-gradient(ellipse 90% 70% at 12% 75%, rgba(255,218,224,0.38) 0%, transparent 58%),
   linear-gradient(160deg, #ffffff 0%, #fff5f7 35%, #fff2f4 65%, #fff6f8 100%)`,
];
import {
  Home as HomeIcon, Ticket as TicketIcon, List, LayoutDashboard,
  Search, TrendingUp, BookOpen, Monitor, Users, Timer, Mail, Zap, MessageCircle,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginScreen from './components/layout/LoginScreen';
import Desktop from './components/layout/Desktop';
import Taskbar from './components/layout/Taskbar';
import AppWindow from './components/layout/AppWindow';
import Home from './components/modules/Home';
import SubmitTicket from './components/modules/SubmitTicket';
import MyTickets from './components/modules/MyTickets';
import AllTickets from './components/modules/AllTickets';
import TicketDetail from './components/modules/TicketDetail';
import ITDashboard from './components/modules/ITDashboard';
import KnowledgeBase from './components/modules/KnowledgeBase';
import SystemStatus from './components/modules/SystemStatus';
import UserManagement from './components/modules/UserManagement';
import OTRecord from './components/modules/OTRecord';
import EmailDashboard from './components/modules/EmailDashboard';
import SpeedTest from './components/modules/SpeedTest';
import Chat from './components/modules/Chat';
import type { PageId } from './types';

type ModuleConfig = {
  title: string;
  icon: React.ReactNode;
  component: React.ComponentType;
};

const moduleMap: Record<Exclude<PageId, 'desktop'>, ModuleConfig> = {
  home:             { title: 'หน้าแรก',                    icon: <HomeIcon size={15} />,         component: Home },
  submit_ticket:    { title: 'แจ้งปัญหา IT',               icon: <TicketIcon size={15} />,       component: SubmitTicket },
  my_tickets:       { title: 'Ticket ของฉัน',              icon: <List size={15} />,             component: MyTickets },
  all_tickets:      { title: 'Ticket ทั้งหมด',             icon: <LayoutDashboard size={15} />,  component: AllTickets },
  ticket_detail:    { title: 'รายละเอียด Ticket',          icon: <Search size={15} />,           component: TicketDetail },
  it_dashboard:     { title: 'Dashboard ทีม IT',           icon: <TrendingUp size={15} />,       component: ITDashboard },
  knowledge_base:   { title: 'คลังความรู้ IT',             icon: <BookOpen size={15} />,         component: KnowledgeBase },
  system_status:    { title: 'สถานะระบบ',                  icon: <Monitor size={15} />,          component: SystemStatus },
  user_management:  { title: 'จัดการผู้ใช้',               icon: <Users size={15} />,            component: UserManagement },
  ot_record:        { title: 'บันทึก OT',                  icon: <Timer size={15} />,            component: OTRecord },
  email_dashboard:  { title: 'Email Server Dashboard',     icon: <Mail size={15} />,             component: EmailDashboard },
  speed_test:       { title: 'ทดสอบความเร็วอินเทอร์เน็ต', icon: <Zap size={15} />,              component: SpeedTest },
  chat:             { title: 'Chat',                        icon: <MessageCircle size={15} />,    component: Chat },
};

type CustomWallpaper = { url: string; pos: string };

function parseCustomWallpapers(raw: unknown): CustomWallpaper[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(item =>
    typeof item === 'string' ? { url: item, pos: '50% 50%' } : item as CustomWallpaper
  );
}

const LOGIN_BG_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_101827_abebfeec-f243-466b-b494-7f6814c0fbbf.mp4';

// ── Login → Desktop Transition (matches login theme) ─────────────────────────
function LoginTransition({ userName, onDone }: { userName: string; onDone: () => void }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true),  320);
    const t2 = setTimeout(() => setExiting(true), 1700);
    const t3 = setTimeout(onDone,                 2450);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[999] pointer-events-none overflow-hidden"
      style={{
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'scale(1.04)' : 'scale(1)',
        transition: exiting ? 'opacity 0.72s ease, transform 0.72s ease' : 'none',
      }}
    >
      {/* Same video as login */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={LOGIN_BG_VIDEO}
      />

      {/* Match login's vignette exactly */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.04) 100%)',
        }}
      />

      {/* Soft radial glow behind card */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 1s ease',
        }}
      >
        <div style={{
          width: 480, height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(200,180,240,0.18) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }} />
      </div>

      {/* Content — same visual language as login */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center select-none"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(22px)',
          transition: 'opacity 0.65s ease, transform 0.65s ease',
        }}
      >
        {/* Icon circle — same style as login card icon */}
        <div
          style={{
            width: 68, height: 68,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.28)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 22,
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          }}
        >
          {/* Checkmark */}
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.80)" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        {/* Sub label — same style as login */}
        <p style={{
          fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.50)', marginBottom: 10,
        }}>
          Welcome Back
        </p>

        {/* Name — same weight/tracking as "IT Helpdesk" */}
        <h1 style={{
          fontSize: 'clamp(26px, 4.5vw, 46px)', fontWeight: 300,
          letterSpacing: '0.12em', color: 'rgba(255,255,255,0.90)',
          textShadow: '0 2px 16px rgba(0,0,0,0.35)', lineHeight: 1,
        }}>
          {userName}
        </h1>

        {/* Divider — same as login brand section */}
        <div style={{
          width: 40, height: 1, borderRadius: 99,
          background: 'rgba(255,255,255,0.30)',
          margin: '14px auto 0',
        }} />

        {/* Subtle hint */}
        <p
          style={{
            marginTop: 18, fontSize: 9, letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.28)',
            animation: visible ? 'tap-hint 2s ease-in-out infinite' : 'none',
          }}
        >
          กำลังเข้าสู่ระบบ
        </p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
function AppContent() {
  const { isAuthenticated, isLoading, apiError, currentPage, currentUser } = useApp();
  const [showTransition, setShowTransition] = useState(false);
  const prevAuth = React.useRef(false);
  const [wallpaperIdx, setWallpaperIdx] = useState(0);
  const [customWallpapers, setCustomWallpapers] = useState<CustomWallpaper[]>(() => {
    try {
      const s = localStorage.getItem('helpdesk_custom_wallpapers');
      return s ? parseCustomWallpapers(JSON.parse(s)) : [];
    } catch { return []; }
  });
  const [adjustingCustomIdx, setAdjustingCustomIdx] = useState<number | null>(null);
  const adjustDragRef = React.useRef<{ x: number; y: number } | null>(null);

  const totalWallpapers = WALLPAPERS.length + customWallpapers.length;
  const safeIdx = Math.min(wallpaperIdx, totalWallpapers - 1);

  // Detect first login → show transition
  useEffect(() => {
    if (isAuthenticated && !prevAuth.current) {
      setShowTransition(true);
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => {
      setWallpaperIdx(prev => (prev + 1) % totalWallpapers);
    }, 35000);
    return () => clearInterval(timer);
  }, [isAuthenticated, totalWallpapers]);

  const handleAddWallpaper = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setCustomWallpapers(prev => {
        const next = [...prev, { url, pos: '50% 50%' }];
        try { localStorage.setItem('helpdesk_custom_wallpapers', JSON.stringify(next)); } catch {}
        return next;
      });
      setWallpaperIdx(WALLPAPERS.length + customWallpapers.length);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveWallpaper = (customIdx: number) => {
    setCustomWallpapers(prev => {
      const next = prev.filter((_, i) => i !== customIdx);
      try { localStorage.setItem('helpdesk_custom_wallpapers', JSON.stringify(next)); } catch {}
      return next;
    });
    setWallpaperIdx(0);
    setAdjustingCustomIdx(null);
  };

  // Hydrangea Sky (idx 4) และ Rose Garden (idx 5) เป็น white background
  const isLightBg = safeIdx >= WALLPAPERS.length - 2 && safeIdx < WALLPAPERS.length;

  const handleUpdateWallpaperPosition = (customIdx: number, pos: string) => {
    setCustomWallpapers(prev => {
      const next = prev.map((w, i) => i === customIdx ? { ...w, pos } : w);
      try { localStorage.setItem('helpdesk_custom_wallpapers', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: '#02040e' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-sky-400/25 border-t-sky-400 rounded-full animate-spin mx-auto mb-4" />
          <div className="text-white/40 text-sm tracking-wider">กำลังโหลด IT Helpdesk...</div>
        </div>
      </div>
    );
  }

  if (apiError && !isAuthenticated) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: '#02040e' }}>
        <div className="text-center glass-card rounded-2xl p-8 max-w-sm mx-4">
          <div className="text-red-400 text-sm mb-4">{apiError}</div>
          <div className="text-white/40 text-[12px]">กรุณาตรวจสอบว่า server รันอยู่:<br /><code className="text-sky-400/70">npm run dev:server</code></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;

  const currentModule =
    currentPage !== 'desktop'
      ? moduleMap[currentPage as Exclude<PageId, 'desktop'>]
      : null;

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      {/* Layered wallpapers with crossfade transition */}
      <div className="absolute inset-0">
        {Array.from({ length: totalWallpapers }).map((_, i) => {
          const isCustom = i >= WALLPAPERS.length;
          const cw = isCustom ? customWallpapers[i - WALLPAPERS.length] : null;
          return (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                ...(isCustom && cw
                  ? { backgroundImage: `url("${cw.url}")`, backgroundSize: 'cover', backgroundPosition: cw.pos }
                  : { background: WALLPAPERS[i] }),
                opacity: i === safeIdx ? 1 : 0,
                transition: adjustingCustomIdx !== null ? 'none' : 'opacity 3s ease-in-out',
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </div>

      {/* Wallpaper crop overlay */}
      {adjustingCustomIdx !== null && (() => {
        const cw = customWallpapers[adjustingCustomIdx];
        if (!cw) return null;
        const parsePos = (s: string) => {
          const [x, y] = s.split(' ').map(v => parseFloat(v) || 50);
          return { x, y: y ?? x };
        };
        const onMouseDown = (e: React.MouseEvent) => {
          adjustDragRef.current = { x: e.clientX, y: e.clientY };
        };
        const onMouseMove = (e: React.MouseEvent) => {
          if (!adjustDragRef.current) return;
          const dx = e.clientX - adjustDragRef.current.x;
          const dy = e.clientY - adjustDragRef.current.y;
          adjustDragRef.current = { x: e.clientX, y: e.clientY };
          const cur = parsePos(cw.pos);
          const nx = Math.max(0, Math.min(100, cur.x - (dx / window.innerWidth) * 150));
          const ny = Math.max(0, Math.min(100, cur.y - (dy / window.innerHeight) * 150));
          handleUpdateWallpaperPosition(adjustingCustomIdx, `${nx.toFixed(1)}% ${ny.toFixed(1)}%`);
        };
        const onMouseUp = () => { adjustDragRef.current = null; };
        return (
          <div
            className="absolute inset-0 z-[5]"
            style={{ cursor: adjustDragRef.current ? 'grabbing' : 'grab' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {/* Subtle grid */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }} />
            {/* Instruction chip */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[12px] text-white/70 select-none pointer-events-none"
              style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
              ลากเพื่อปรับตำแหน่งภาพ
            </div>
            {/* Done / Cancel */}
            <div className="absolute bottom-20 right-4 flex gap-2 pointer-events-auto"
              onMouseDown={e => e.stopPropagation()}>
              <button
                onClick={() => setAdjustingCustomIdx(null)}
                className="px-4 py-1.5 rounded-full text-[12px] text-white/60 transition-colors hover:text-white/90"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        );
      })()}

      <Desktop
        moduleMap={moduleMap}
        wallpaperIdx={safeIdx}
        onWallpaperChange={setWallpaperIdx}
        wallpaperCount={WALLPAPERS.length}
        customWallpaperCount={customWallpapers.length}
        onAddWallpaper={handleAddWallpaper}
        onRemoveWallpaper={handleRemoveWallpaper}
        activeCustomIdx={safeIdx >= WALLPAPERS.length ? safeIdx - WALLPAPERS.length : -1}
        onAdjustWallpaper={(ci) => setAdjustingCustomIdx(ci)}
        isAdjusting={adjustingCustomIdx !== null}
        isLightBg={isLightBg}
      />
      {currentModule && (
        <AppWindow
          title={currentModule.title}
          icon={currentModule.icon}
          pageId={currentPage}
          key={currentPage}
        >
          <currentModule.component />
        </AppWindow>
      )}
      <Taskbar moduleMap={moduleMap} />

      {/* ── Login → Desktop boot transition overlay ── */}
      {showTransition && (
        <LoginTransition
          userName={currentUser.name}
          onDone={() => setShowTransition(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
