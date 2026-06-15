import React, { useState, useEffect } from 'react';

const DARK_BG =
  `radial-gradient(ellipse 130% 75% at 50% 20%, rgba(255,192,203,0.55) 0%, rgba(255,170,185,0.30) 40%, transparent 65%),
   radial-gradient(ellipse 90% 70% at 18% 78%, rgba(255,160,180,0.32) 0%, transparent 55%),
   radial-gradient(ellipse 80% 65% at 88% 72%, rgba(255,210,225,0.28) 0%, transparent 52%),
   linear-gradient(160deg, #1e1018 0%, #2a1420 28%, #221018 58%, #1c0e16 82%, #180c14 100%)`;

const LIGHT_BG =
  `radial-gradient(ellipse 130% 80% at 52% 12%, rgba(228,185,195,0.42) 0%, rgba(218,175,188,0.20) 42%, transparent 65%),
   radial-gradient(ellipse 95% 72% at 10% 80%, rgba(195,182,228,0.30) 0%, transparent 58%),
   radial-gradient(ellipse 80% 62% at 90% 68%, rgba(232,210,195,0.28) 0%, transparent 52%),
   linear-gradient(160deg, #f5ece9 0%, #f2e8ed 32%, #efe8f2 62%, #f4ede9 100%)`;
import {
  Home as HomeIcon, Ticket as TicketIcon, List, LayoutDashboard,
  Search, TrendingUp, BookOpen, Monitor, Users, Timer, Mail, Zap, MessageCircle,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
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
  const { isDark } = useTheme();
  const [showTransition, setShowTransition] = useState(false);
  const prevAuth = React.useRef(false);

  const isLightBg = !isDark;

  // Detect first login → show transition
  useEffect(() => {
    if (isAuthenticated && !prevAuth.current) {
      setShowTransition(true);
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

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
      {/* Background — follows dark/light theme */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark ? DARK_BG : LIGHT_BG,
          transition: 'background 0.6s ease',
        }}
      />

      <Desktop
        moduleMap={moduleMap}
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
