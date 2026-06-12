import React, { useRef, useEffect } from 'react';
import {
  Home, Ticket, List, LayoutDashboard,
  BookOpen, Monitor, Users, LogOut, Timer, Sun, Moon,
  Bell, MessageCircle, CheckCircle2, X, Camera, User,
  Volume2, VolumeX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { PageId, Role } from '../../types';

type ModuleEntry = { title: string; icon: React.ReactNode; component: React.ComponentType };
interface Props { moduleMap: Record<Exclude<PageId, 'desktop'>, ModuleEntry> }

const navItems: Array<{ id: Exclude<PageId, 'desktop'>; icon: React.ReactNode; label: string; minRole?: Role }> = [
  { id: 'home',            icon: <Home size={18} />,            label: 'หน้าแรก' },
  { id: 'submit_ticket',   icon: <Ticket size={18} />,          label: 'แจ้งปัญหา' },
  { id: 'my_tickets',      icon: <List size={18} />,            label: 'Ticket ของฉัน' },
  { id: 'all_tickets',     icon: <LayoutDashboard size={18} />, label: 'Ticket ทั้งหมด', minRole: 'it_staff' },
  { id: 'it_dashboard',    icon: <LayoutDashboard size={18} />, label: 'Dashboard IT',   minRole: 'it_staff' },
  { id: 'knowledge_base',  icon: <BookOpen size={18} />,        label: 'คลังความรู้' },
  { id: 'system_status',   icon: <Monitor size={18} />,         label: 'สถานะระบบ' },
  { id: 'user_management', icon: <Users size={18} />,           label: 'ผู้ใช้งาน',       minRole: 'it_staff' },
  { id: 'chat',            icon: <MessageCircle size={18} />,   label: 'Chat' },
];

const ROLE_DISPLAY: Record<Role, { label: string; color: string }> = {
  employee:   { label: 'User',  color: '#22c55e' },
  it_staff:   { label: 'IT',    color: '#f59e0b' },
  it_manager: { label: 'Admin', color: '#ef4444' },
};

export default function Taskbar({ }: Props) {
  const { currentPage, currentUser, navigate, logout, notifications, toasts, markNotificationsRead, dismissToast, updateAvatar, chatMuted, toggleChatMute } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const [showNotif, setShowNotif] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [time, setTime] = React.useState(() => {
    const n = new Date();
    return `${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`;
  });
  React.useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setTime(`${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  // Close panels when clicking outside
  useEffect(() => {
    if (!showNotif && !showProfile) return;
    const handler = (e: MouseEvent) => {
      if (showNotif && notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
      if (showProfile && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotif, showProfile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      await updateAvatar(file);
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const canAccess = (minRole?: Role) => {
    if (!minRole) return true;
    if (minRole === 'it_staff') return currentUser.role === 'it_staff' || currentUser.role === 'it_manager';
    return currentUser.role === 'it_manager';
  };

  const visibleNav = navItems.filter(n => canAccess(n.minRole));
  const cfg = ROLE_DISPLAY[currentUser.role];
  const unreadCount = notifications.filter(n => !n.read).length;

  const formatNotifTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return 'เมื่อกี้';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} น.ที่แล้ว`;
    return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* ── Toast notifications (bottom-right) ──────────── */}
      {toasts.length > 0 && (
        <div className="fixed right-4 z-[9998] flex flex-col gap-2"
          style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
          {toasts.map(t => {
            const isChat = t.type === 'chat_message';
            return (
              <div key={t.id}
                className="glass-panel rounded-2xl px-4 py-3 flex items-start gap-3 w-76 toast-slide-in"
                style={{
                  width: 300,
                  border: `1px solid ${isChat ? 'rgba(14,165,233,0.3)' : 'rgba(34,197,94,0.25)'}`,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${isChat ? 'rgba(14,165,233,0.08)' : 'rgba(34,197,94,0.06)'}`,
                }}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isChat ? 'bg-sky-500/20' : 'bg-green-500/20'}`}>
                  {isChat
                    ? <MessageCircle size={15} className="text-sky-400" />
                    : <CheckCircle2 size={15} className="text-green-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-white/90">{t.title}</div>
                  <div className="text-[11px] text-white/50 mt-0.5 leading-snug line-clamp-2">{t.message}</div>
                  {isChat && (
                    <button onClick={() => { navigate('chat'); dismissToast(t.id); }}
                      className="text-[10px] text-sky-400 hover:text-sky-300 mt-1 transition-colors">
                      ไปที่แชท →
                    </button>
                  )}
                  {t.ticketId && (
                    <button onClick={() => { navigate('ticket_detail', t.ticketId!); dismissToast(t.id); }}
                      className="text-[10px] text-sky-400 hover:text-sky-300 mt-1 transition-colors">
                      ดู Ticket →
                    </button>
                  )}
                </div>
                <button onClick={() => dismissToast(t.id)} className="text-white/25 hover:text-white/70 shrink-0 transition-colors mt-0.5">
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Taskbar ─────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 taskbar-bg flex items-center px-2 sm:px-3 gap-1 sm:gap-2 z-50 select-none"
        style={{ height: 'calc(52px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Home / Start */}
        <button
          onClick={() => navigate('desktop')}
          className={`taskbar-btn flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 h-9 rounded-lg text-white/70 hover:text-white/95 transition-colors ${currentPage === 'desktop' ? 'active !text-white/95' : ''}`}
        >
          <span className="text-lg leading-none">⊞</span>
          <span className="hidden md:inline text-[11px] font-semibold">IT Helpdesk</span>
        </button>

        <div className="w-px h-6 bg-white/8 mx-0.5 sm:mx-1" />

        {/* Nav items */}
        <div className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
          {visibleNav.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`taskbar-btn flex flex-col items-center justify-center w-[46px] sm:w-[54px] h-[42px] rounded-lg transition-all relative group ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                <span className={`transition-colors ${isActive ? 'text-sky-400' : 'text-white/55 group-hover:text-white/85'}`}>
                  {item.icon}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-sky-400" />
                )}
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white/90 text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-6 bg-white/8 mx-0.5 sm:mx-1" />

        {/* Right area */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Clock */}
          <div className="text-[11px] text-white/40 tabular-nums hidden lg:block">{time}</div>

          {/* OT */}
          <button
            onClick={() => navigate('ot_record')}
            className={`taskbar-btn flex items-center gap-1 px-1.5 sm:px-2.5 h-9 rounded-lg ${currentPage === 'ot_record' ? 'active' : ''}`}
            title="บันทึก OT"
          >
            <Timer size={14} className={currentPage === 'ot_record' ? 'text-amber-400' : 'text-white/50'} />
            <span className="text-[11px] hidden sm:block text-white/60">OT</span>
          </button>

          {/* Chat mute toggle */}
          <button
            onClick={toggleChatMute}
            className="taskbar-btn flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
            title={chatMuted ? 'เปิดเสียงแชท' : 'ปิดเสียงแชท'}
          >
            {chatMuted
              ? <VolumeX size={14} className="text-amber-400/80" />
              : <Volume2 size={14} className="text-white/40" />
            }
          </button>

          {/* Notification Bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setShowNotif(v => !v); if (!showNotif) markNotificationsRead(); }}
              className="taskbar-btn flex items-center justify-center w-9 h-9 rounded-lg text-white/45 hover:text-white/90 transition-colors relative"
              title="การแจ้งเตือน"
            >
              <Bell size={15} className={unreadCount > 0 ? 'text-sky-400' : ''} />
              {unreadCount > 0 && (
                <span key={unreadCount} className="absolute top-1 right-1 min-w-[14px] h-3.5 bg-sky-500 rounded-full text-[9px] text-white flex items-center justify-center leading-none px-0.5 badge-pop">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotif && (
              <div className="absolute bottom-full right-0 mb-2 w-72 glass-panel rounded-2xl shadow-2xl overflow-hidden z-[9999] fade-in"
                style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/07">
                  <span className="text-[12px] font-semibold text-white/70">การแจ้งเตือน</span>
                  <button onClick={() => setShowNotif(false)} className="text-white/30 hover:text-white/60">
                    <X size={12} />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-white/25 text-[12px]">ไม่มีการแจ้งเตือน</div>
                  ) : (
                    notifications.slice(0, 15).map(n => {
                      const isChat = n.type === 'chat_message';
                      return (
                        <button key={n.id}
                          onClick={() => {
                            if (isChat) navigate('chat');
                            else if (n.ticketId) navigate('ticket_detail', n.ticketId);
                            setShowNotif(false);
                          }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left border-b border-white/[0.04] last:border-0">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isChat ? 'bg-sky-500/15' : 'bg-green-500/15'}`}>
                            {isChat
                              ? <MessageCircle size={11} className="text-sky-400" />
                              : <CheckCircle2 size={11} className="text-green-400" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-white/80">{n.title}</div>
                            <div className="text-[10px] text-white/40 mt-0.5 leading-snug truncate">{n.message}</div>
                            <div className="text-[9px] text-white/25 mt-1">{formatNotifTime(n.createdAt)}</div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="taskbar-btn flex items-center justify-center w-9 h-9 rounded-lg text-white/45 hover:text-white/90 transition-colors"
            title={isDark ? 'สลับเป็น Light mode' : 'สลับเป็น Dark mode'}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* User badge / Profile button */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfile(v => !v)}
              className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 h-9 rounded-lg bg-white/04 border border-white/07 hover:bg-white/08 transition-colors"
              title="โปรไฟล์"
            >
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="avatar"
                  className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-white/20" />
              ) : (
                <span className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: cfg.color }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="text-[11px] text-white/75 hidden sm:block max-w-[70px] truncate">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-white/35 hidden xl:block">[{cfg.label}]</span>
            </button>

            {/* Profile dropdown */}
            {showProfile && (
              <div className="absolute bottom-full right-0 mb-2 w-64 glass-panel rounded-2xl shadow-2xl overflow-hidden z-[9999] profile-in"
                style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/07">
                  <span className="text-[12px] font-semibold text-white/70">โปรไฟล์</span>
                  <button onClick={() => setShowProfile(false)} className="text-white/30 hover:text-white/60">
                    <X size={12} />
                  </button>
                </div>
                <div className="p-4 flex flex-col items-center gap-3">
                  {/* Avatar display */}
                  <div className="relative">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt="avatar"
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-white/20" />
                    ) : (
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
                        style={{ background: cfg.color }}>
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-400 flex items-center justify-center transition-colors disabled:opacity-50"
                      title="เปลี่ยนรูปโปรไฟล์"
                    >
                      {avatarUploading ? (
                        <div className="w-3 h-3 border border-white/60 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera size={11} className="text-white" />
                      )}
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*"
                      className="hidden" onChange={handleAvatarChange} />
                  </div>
                  {/* User info */}
                  <div className="text-center">
                    <div className="text-[13px] font-semibold text-white/90">{currentUser.name}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{currentUser.email}</div>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ background: `${cfg.color}20`, color: cfg.color }}>
                      <User size={9} />
                      {cfg.label}
                    </div>
                  </div>
                  {/* Upload hint */}
                  <p className="text-[10px] text-white/25 text-center">
                    คลิก <Camera size={9} className="inline" /> เพื่อเปลี่ยนรูปโปรไฟล์
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-white/8" />

          {/* Logout */}
          <button
            onClick={logout}
            className="taskbar-btn flex items-center justify-center w-9 h-9 rounded-lg text-white/30 hover:text-red-400 transition-colors"
            title="ออกจากระบบ"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
