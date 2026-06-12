import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type {
  PageId, Role, User, Ticket, Service, Incident, Maintenance, KBArticle,
  TicketStatus, TicketCategory, TicketPriority, Comment, OTRecord, AppNotification,
} from '../types';
import { STATUS_LABELS } from '../types';
import { clearToken, getToken } from '../api/client';
import * as AuthAPI from '../api/auth';
import * as TicketsAPI from '../api/tickets';
import * as UsersAPI from '../api/users';
import * as OtAPI from '../api/ot';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import { playNotifSound } from '../lib/sound';

import { mockKBArticles, mockMaintenances } from '../data/mockData';

interface AppState {
  isAuthenticated: boolean;
  isLoading: boolean;
  apiError: string | null;
  currentPage: PageId;
  currentUser: User;
  selectedTicketId: string | null;
  tickets: Ticket[];
  users: User[];
  services: Service[];
  incidents: Incident[];
  maintenances: Maintenance[];
  kbArticles: KBArticle[];
  otRecords: OTRecord[];
  notifications: AppNotification[];
  toasts: AppNotification[];
}

interface AppContextValue extends AppState {
  login: (userId: string, password: string) => Promise<void>;
  logout: () => void;
  navigate: (page: PageId, ticketId?: string) => void;
  refreshTickets: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshOT: () => Promise<void>;
  addTicket: (data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'internalNotes' | 'timeline'>) => Promise<string>;
  updateTicketStatus: (ticketId: string, newStatus: TicketStatus, changedBy: string) => Promise<void>;
  assignTicket: (ticketId: string, assigneeId: string, assigneeName: string) => Promise<void>;
  addComment: (ticketId: string, comment: Omit<Comment, 'id' | 'ticketId'>) => Promise<void>;
  updateUserRole: (userId: string, role: Role) => Promise<void>;
  updateUserStatus: (userId: string, status: 'active' | 'inactive') => Promise<void>;
  addOTRecord: (record: Omit<OTRecord, 'id' | 'createdAt'>) => Promise<void>;
  deleteOTRecord: (id: string) => Promise<void>;
  submitOTRecord: (id: string) => Promise<void>;
  approveOTRecord: (id: string) => Promise<void>;
  rejectOTRecord: (id: string, reason?: string) => Promise<void>;
  getMyOTRecords: () => OTRecord[];
  updateServiceStatus: (serviceId: string, status: Service['status']) => void;
  addIncident: (incident: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateIncidentStatus: (id: string, status: Incident['status']) => void;
  deleteIncident: (id: string) => void;
  addMaintenance: (m: Omit<Maintenance, 'id'>) => void;
  deleteMaintenance: (id: string) => void;
  updateMaintenanceStatus: (id: string, status: Maintenance['status']) => void;
  addKBArticle: (article: Omit<KBArticle, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'helpful'>) => void;
  deleteKBArticle: (id: string) => void;
  togglePinKBArticle: (id: string) => void;
  markNotificationsRead: () => void;
  dismissToast: (id: string) => void;
  switchUser: (userId: string) => void;
  checkPassword: (userId: string, password: string) => boolean;
  changePassword: (userId: string, newPassword: string) => Promise<void>;
  createUser: (data: { id: string; name: string; department: string; email: string; role: string; password: string }) => Promise<void>;
  getUserPassword: (userId: string) => string;
  updateAvatar: (file: File) => Promise<void>;
  chatMuted: boolean;
  toggleChatMute: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const GUEST_USER: User = { id: 'guest', name: 'Guest', department: '', email: '', role: 'employee', status: 'active' };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<PageId>('desktop');
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const currentPageRef = React.useRef<PageId>('desktop');
  const currentUserRef = React.useRef<User>(GUEST_USER);
  currentPageRef.current = currentPage;
  currentUserRef.current = currentUser;
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>(mockMaintenances);
  const [kbArticles, setKBArticles] = useState<KBArticle[]>(mockKBArticles);
  const [otRecords, setOTRecords] = useState<OTRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [chatMuted, setChatMuted] = useState(() => localStorage.getItem('chat_muted') === 'true');
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const notif: AppNotification = {
      ...n,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [notif, ...prev].slice(0, 30));
    setToasts(prev => [...prev, notif]);
    playNotifSound();
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== notif.id));
      toastTimers.current.delete(notif.id);
    }, 7000);
    toastTimers.current.set(notif.id, timer);
  }, []);

  const dismissToast = useCallback((id: string) => {
    clearTimeout(toastTimers.current.get(id));
    toastTimers.current.delete(id);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const markNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const initSocket = useCallback((token: string) => {
    const sock = connectSocket(token);

    // Remove existing listeners before re-registering to prevent duplicates.
    // React StrictMode runs effects twice in dev; connectSocket returns the same
    // socket on the second call, so without this sock.on() would stack up handlers.
    const APP_EVENTS = [
      'ticket:resolved', 'ticket:created', 'ticket:updated',
      'ticket:status_changed', 'ticket:assigned', 'ticket:comment',
      'chat:message', 'user:avatar',
    ] as const;
    APP_EVENTS.forEach(ev => sock.off(ev));

    sock.on('ticket:resolved', (data: { ticketId: string; title: string; resolvedBy: string }) => {
      addNotification({
        type: 'ticket_resolved',
        title: 'Ticket แก้ไขแล้ว',
        message: `"${data.title}" ถูกแก้ไขโดย ${data.resolvedBy}`,
        ticketId: data.ticketId,
      });
      // ticket:updated also fires for resolved — no setTickets here to avoid double update
    });

    // Global chat notification — fires when not on chat page
    sock.on('chat:message', (msg: { roomId: string; senderId: string; senderName: string; content: string; type: string; roomType?: string }) => {
      if (currentPageRef.current !== 'chat' && msg.senderId !== currentUserRef.current.id) {
        const isDirect = !msg.roomType || msg.roomType === 'direct';
        const uid = currentUserRef.current.id;
        const uname = currentUserRef.current.name;
        const isMentioned = msg.content.includes(`@${uid}`) ||
          msg.content.toLowerCase().includes(`@${uname.toLowerCase()}`);
        if (!isDirect && !isMentioned) return;

        addNotification({
          type: 'chat_message',
          title: msg.senderName,
          message: msg.type === 'text' ? msg.content.slice(0, 80) : '📎 ส่งไฟล์มาให้คุณ',
          chatRoomId: msg.roomId,
        });
        if (localStorage.getItem('chat_muted') !== 'true') {
          import('../lib/sound').then(({ playChatSound }) => playChatSound());
        }
      }
    });

    // Avatar sync — update user avatars in real time
    sock.on('user:avatar', ({ userId, avatar }: { userId: string; avatar: string }) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, avatar } : u));
      if (userId === currentUserRef.current.id) {
        setCurrentUser(prev => {
          const updated = { ...prev, avatar };
          localStorage.setItem('helpdesk_user', JSON.stringify(updated));
          return updated;
        });
      }
    });

    // Real-time ticket sync — notify IT when new ticket arrives
    sock.on('ticket:created', (ticket: Ticket) => {
      setTickets(prev => prev.find(t => t.id === ticket.id) ? prev : [ticket, ...prev]);
      const user = currentUserRef.current;
      if ((user.role === 'it_staff' || user.role === 'it_manager') && ticket.requesterId !== user.id) {
        addNotification({
          type: 'ticket_comment',
          title: `Ticket ใหม่ · ${ticket.id}`,
          message: `${ticket.requesterName} (${ticket.department}): ${ticket.title}`,
          ticketId: ticket.id,
        });
      }
    });

    sock.on('ticket:updated', (ticket: Ticket) => {
      setTickets(prev => prev.map(t => t.id === ticket.id ? ticket : t));
    });

    sock.on('ticket:status_changed', (data: { ticketId: string; title: string; status: TicketStatus; changedBy: string }) => {
      addNotification({
        type: 'ticket_status_changed',
        title: 'สถานะ Ticket เปลี่ยนแปลง',
        message: `"${data.title}" → ${STATUS_LABELS[data.status]} โดย ${data.changedBy}`,
        ticketId: data.ticketId,
      });
    });

    sock.on('ticket:assigned', (data: { ticketId: string; title: string; assigneeName: string }) => {
      addNotification({
        type: 'ticket_assigned',
        title: 'Ticket ได้รับการมอบหมาย',
        message: `"${data.title}" มอบหมายให้ ${data.assigneeName}`,
        ticketId: data.ticketId,
      });
    });

    sock.on('ticket:comment', (data: { ticketId: string; title: string; commentBy: string; message: string }) => {
      addNotification({
        type: 'ticket_comment',
        title: `${data.commentBy} แสดงความคิดเห็น`,
        message: data.message.slice(0, 80),
        ticketId: data.ticketId,
      });
    });
  }, [addNotification]);

  useEffect(() => {
    const token = getToken();
    const userJson = localStorage.getItem('helpdesk_user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        setCurrentUser(user);
        setIsAuthenticated(true);
        AuthAPI.getMe().then(freshUser => {
          setCurrentUser(freshUser);
          localStorage.setItem('helpdesk_user', JSON.stringify(freshUser));
          initSocket(token);
          loadInitialData(freshUser).finally(() => setIsLoading(false));
        }).catch(() => {
          clearToken();
          setIsAuthenticated(false);
          setIsLoading(false);
        });
      } catch {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async (user: User) => {
    try {
      const [tkts, svcs, incs] = await Promise.all([
        TicketsAPI.listTickets(),
        fetch('/api/services', { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
        fetch('/api/services/incidents', { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
      ]);
      setTickets(tkts);
      setServices(svcs);
      setIncidents(incs);
      if (user.role !== 'employee') {
        const usrs = await UsersAPI.listUsers();
        setUsers(usrs);
      }
      const ots = await OtAPI.listMyOT();
      setOTRecords(ots);
    } catch (err) {
      setApiError('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อ');
      console.error(err);
    }
  };

  const login = useCallback(async (userId: string, password: string) => {
    const { user } = await AuthAPI.login(userId, password);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentPage('desktop');
    setApiError(null);
    const token = getToken();
    if (token) initSocket(token);
    await loadInitialData(user);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initSocket]);

  const logout = useCallback(() => {
    AuthAPI.logout().catch(() => {});
    disconnectSocket();
    clearToken();
    setIsAuthenticated(false);
    setCurrentUser(GUEST_USER);
    setCurrentPage('desktop');
    setTickets([]);
    setUsers([]);
    setOTRecords([]);
    setNotifications([]);
    setToasts([]);
  }, []);

  const navigate = useCallback((page: PageId, ticketId?: string) => {
    if (ticketId) setSelectedTicketId(ticketId);
    setCurrentPage(page);
  }, []);

  const refreshTickets = useCallback(async () => {
    const tkts = await TicketsAPI.listTickets();
    setTickets(tkts);
  }, []);

  const refreshUsers = useCallback(async () => {
    const usrs = await UsersAPI.listUsers();
    setUsers(usrs);
  }, []);

  const refreshOT = useCallback(async () => {
    const ots = await OtAPI.listMyOT();
    setOTRecords(ots);
  }, []);

  const addTicket = useCallback(async (
    data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'internalNotes' | 'timeline'>
  ): Promise<string> => {
    const ticket = await TicketsAPI.createTicket({
      title: data.title,
      description: data.description,
      category: data.category as TicketCategory,
      priority: data.priority as TicketPriority,
      requesterName: data.requesterName,
      department: data.department,
      email: data.email,
    });
    // State updated via ticket:created socket event — no local setTickets to avoid duplicate
    return ticket.id;
  }, []);

  const updateTicketStatus = useCallback(async (ticketId: string, newStatus: TicketStatus, _changedBy: string) => {
    await TicketsAPI.updateTicketStatus(ticketId, newStatus);
    // State updated via ticket:updated socket event — no local setTickets needed
  }, []);

  const assignTicket = useCallback(async (ticketId: string, assigneeId: string, assigneeName: string) => {
    await TicketsAPI.assignTicket(ticketId, assigneeId, assigneeName);
    // State updated via ticket:updated socket event — no local setTickets needed
  }, []);

  const addComment = useCallback(async (ticketId: string, commentData: Omit<Comment, 'id' | 'ticketId'>) => {
    await TicketsAPI.addComment(ticketId, commentData.message, commentData.isInternal);
    // State updated via ticket:updated socket event — no local setTickets needed
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: Role) => {
    await UsersAPI.updateUserRole(userId, role);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    if (currentUser.id === userId) setCurrentUser(prev => ({ ...prev, role }));
  }, [currentUser.id]);

  const updateUserStatus = useCallback(async (userId: string, status: 'active' | 'inactive') => {
    await UsersAPI.updateUserStatus(userId, status);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
  }, []);

  const addOTRecord = useCallback(async (recordData: Omit<OTRecord, 'id' | 'createdAt'>) => {
    const record = await OtAPI.createOT({
      date: recordData.date, startTime: recordData.startTime,
      endTime: recordData.endTime, hours: recordData.hours,
      description: recordData.description,
    });
    setOTRecords(prev => [record, ...prev]);
  }, []);

  const deleteOTRecord = useCallback(async (id: string) => {
    await OtAPI.deleteOT(id);
    setOTRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  const submitOTRecord = useCallback(async (id: string) => {
    const updated = await OtAPI.submitOT(id);
    setOTRecords(prev => prev.map(r => r.id === id ? updated : r));
  }, []);

  const approveOTRecord = useCallback(async (id: string) => {
    const updated = await OtAPI.approveOT(id);
    setOTRecords(prev => prev.map(r => r.id === id ? updated : r));
  }, []);

  const rejectOTRecord = useCallback(async (id: string, reason?: string) => {
    const updated = await OtAPI.rejectOT(id, reason);
    setOTRecords(prev => prev.map(r => r.id === id ? updated : r));
  }, []);

  const getMyOTRecords = useCallback((): OTRecord[] => {
    return otRecords.filter(r => r.userId === currentUser.id);
  }, [otRecords, currentUser.id]);

  const updateServiceStatus = useCallback((serviceId: string, status: Service['status']) => {
    const now = new Date().toISOString();
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, status, lastChecked: now } : s));
    fetch(`/api/services/${serviceId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status }),
    }).catch(console.error);
  }, []);

  const addIncident = useCallback((data: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const incident: Incident = { ...data, id: `INC-${Date.now()}`, createdAt: now, updatedAt: now };
    setIncidents(prev => [incident, ...prev]);
    fetch('/api/services/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data),
    }).catch(console.error);
  }, []);

  const updateIncidentStatus = useCallback((id: string, status: Incident['status']) => {
    const now = new Date().toISOString();
    setIncidents(prev => prev.map(i => i.id === id
      ? { ...i, status, updatedAt: now, resolvedAt: status === 'resolved' ? now : i.resolvedAt }
      : i
    ));
    fetch(`/api/services/incidents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status }),
    }).catch(console.error);
  }, []);

  const deleteIncident = useCallback((id: string) => {
    setIncidents(prev => prev.filter(i => i.id !== id));
  }, []);

  const addMaintenance = useCallback((data: Omit<Maintenance, 'id'>) => {
    setMaintenances(prev => [{ ...data, id: `MNT-${Date.now()}` }, ...prev]);
  }, []);

  const deleteMaintenance = useCallback((id: string) => {
    setMaintenances(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateMaintenanceStatus = useCallback((id: string, status: Maintenance['status']) => {
    setMaintenances(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  }, []);

  const addKBArticle = useCallback((data: Omit<KBArticle, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'helpful'>) => {
    const now = new Date().toISOString();
    setKBArticles(prev => [{ ...data, id: `kb-${Date.now()}`, views: 0, helpful: 0, createdAt: now, updatedAt: now }, ...prev]);
  }, []);

  const deleteKBArticle = useCallback((id: string) => {
    setKBArticles(prev => prev.filter(a => a.id !== id));
  }, []);

  const togglePinKBArticle = useCallback((id: string) => {
    setKBArticles(prev => prev.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a));
  }, []);

  const updateAvatar = useCallback(async (file: File) => {
    const url = await UsersAPI.uploadAvatar(currentUser.id, file);
    const updated = { ...currentUser, avatar: url };
    setCurrentUser(updated);
    localStorage.setItem('helpdesk_user', JSON.stringify(updated));
  }, [currentUser]);

  const toggleChatMute = useCallback(() => {
    setChatMuted(prev => {
      const next = !prev;
      localStorage.setItem('chat_muted', next ? 'true' : 'false');
      return next;
    });
  }, []);

  const switchUser = useCallback((_userId: string) => {
    console.warn('switchUser is deprecated in API mode — use login()');
  }, []);

  const checkPassword = useCallback((_userId: string, _password: string) => true, []);
  const changePassword = useCallback(async (userId: string, newPassword: string) => {
    await UsersAPI.setUserPassword(userId, newPassword);
  }, []);
  const createUser = useCallback(async (data: { id: string; name: string; department: string; email: string; role: string; password: string }) => {
    const user = await UsersAPI.createUser(data);
    setUsers(prev => [...prev, user as import('../types').User]);
  }, []);
  const getUserPassword = useCallback((_userId: string) => '••••••', []);

  const value: AppContextValue = {
    isAuthenticated, isLoading, apiError,
    currentPage, currentUser, selectedTicketId,
    tickets, users, services, incidents, maintenances, kbArticles, otRecords,
    notifications, toasts,
    login, logout, navigate, refreshTickets, refreshUsers, refreshOT,
    addTicket, updateTicketStatus, assignTicket, addComment,
    updateUserRole, updateUserStatus,
    addOTRecord, deleteOTRecord, submitOTRecord, approveOTRecord, rejectOTRecord, getMyOTRecords,
    updateServiceStatus, addIncident, updateIncidentStatus, deleteIncident,
    addMaintenance, deleteMaintenance, updateMaintenanceStatus,
    addKBArticle, deleteKBArticle, togglePinKBArticle,
    markNotificationsRead, dismissToast,
    switchUser, checkPassword, changePassword, createUser, getUserPassword,
    updateAvatar, chatMuted, toggleChatMute,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
