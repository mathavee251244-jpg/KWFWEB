import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Plus, Users, X, Send, Search, ArrowLeft, Check, UserPlus, Paperclip } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSocket } from '../../lib/socket';
import { playChatSound } from '../../lib/sound';
import * as ChatAPI from '../../api/chat';
import type { ChatRoom, ChatMessage } from '../../types';
import type { ChatUserItem } from '../../api/chat';

// ─── Helpers ──────────────────────────────────────────────

function getAvatarColor(name: string): string {
  const palette = ['#0ea5e9', '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(h) % palette.length];
}

function initials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function isSameDay(a: string, b: string): boolean {
  const d1 = new Date(a); const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function dateSeparatorLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (isSameDay(iso, now.toISOString())) return 'วันนี้';
  if (isSameDay(iso, yest.toISOString())) return 'เมื่อวาน';
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function fmtRoomTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'เมื่อกี้';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} น.`;
  if (diff < 86_400_000) return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

interface MsgGroup { senderId: string; senderName: string; messages: ChatMessage[] }

function groupMessages(msgs: ChatMessage[]): MsgGroup[] {
  const groups: MsgGroup[] = [];
  for (const m of msgs) {
    const last = groups[groups.length - 1];
    if (last && last.senderId === m.senderId) {
      const prevTime = new Date(last.messages[last.messages.length - 1].createdAt).getTime();
      if (new Date(m.createdAt).getTime() - prevTime < 300_000) {
        last.messages.push(m); continue;
      }
    }
    groups.push({ senderId: m.senderId, senderName: m.senderName, messages: [m] });
  }
  return groups;
}

// ─── @mention renderer ────────────────────────────────────

function renderWithMentions(text: string, myId: string, myName: string): React.ReactNode {
  const mentionRx = /@[\w.ก-๙]+/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = mentionRx.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const tag = match[0];
    const isMe = tag.slice(1).toLowerCase() === myId.toLowerCase() ||
                 tag.slice(1).toLowerCase() === myName.toLowerCase();
    parts.push(
      <span key={match.index} className={`rounded px-0.5 font-medium ${isMe ? 'bg-amber-400/25 text-amber-300' : 'text-sky-400'}`}>
        {tag}
      </span>
    );
    last = match.index + tag.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? <>{parts}</> : text;
}

// ─── Avatar component ──────────────────────────────────────

function Avatar({ name, size = 32, online, avatarUrl }: { name: string; size?: number; online?: boolean; avatarUrl?: string | null }) {
  const color = getAvatarColor(name);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name}
          className="w-full h-full rounded-full object-cover"
          style={{ border: `1.5px solid ${color}55` }} />
      ) : (
        <div className="w-full h-full rounded-full flex items-center justify-center font-semibold"
          style={{ background: `${color}22`, border: `1.5px solid ${color}55`, fontSize: size * 0.38, color }}>
          {initials(name)}
        </div>
      )}
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 rounded-full border-2 border-[rgba(4,7,20,0.95)] ${online ? 'bg-green-400' : 'bg-slate-500'}`}
          style={{ width: size * 0.28, height: size * 0.28 }} />
      )}
    </div>
  );
}

// ─── NewDM Modal ───────────────────────────────────────────

function NewDMModal({
  chatUsers, onlineSet, onSelect, onClose,
}: {
  chatUsers: ChatUserItem[];
  onlineSet: Set<string>;
  onSelect: (userId: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const filtered = chatUsers.filter(u =>
    u.name.toLowerCase().includes(q.toLowerCase()) ||
    u.department.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel rounded-2xl w-full max-w-xs mx-4 p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold text-white/80">ส่งข้อความ</span>
          <button onClick={onClose} className="text-white/35 hover:text-white/70"><X size={14} /></button>
        </div>
        <div className="relative mb-3">
          <input className="win-input text-[12px]" placeholder="ค้นหาผู้ใช้..." value={q} onChange={e => setQ(e.target.value)} autoFocus />
        </div>
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-center py-6 text-white/30 text-[12px]">ไม่พบผู้ใช้</div>
          )}
          {filtered.map(u => (
            <button key={u.id} onClick={() => onSelect(u.id)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-left transition-colors">
              <Avatar name={u.name} size={32} online={onlineSet.has(u.id)} />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-white/80 truncate">{u.name}</div>
                <div className="text-[10px] text-white/35 truncate">{u.department}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NewGroup Modal ────────────────────────────────────────

function NewGroupModal({
  chatUsers, onCreate, onClose,
}: {
  chatUsers: ChatUserItem[];
  onCreate: (name: string, memberIds: string[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const filtered = chatUsers.filter(u =>
    u.name.toLowerCase().includes(q.toLowerCase()) ||
    u.department.toLowerCase().includes(q.toLowerCase())
  );
  const toggle = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel rounded-2xl w-full max-w-xs mx-4 p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold text-white/80">สร้างกลุ่มแชท</span>
          <button onClick={onClose} className="text-white/35 hover:text-white/70"><X size={14} /></button>
        </div>
        <input className="win-input mb-3 text-[12px]" placeholder="ชื่อกลุ่ม *" value={name} onChange={e => setName(e.target.value)} />
        <div className="relative mb-2">
          <input className="win-input text-[12px]" placeholder="ค้นหาสมาชิก..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        {selected.size > 0 && (
          <div className="text-[10px] text-white/40 mb-1.5">เลือกแล้ว {selected.size} คน</div>
        )}
        <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto mb-3">
          {filtered.map(u => (
            <button key={u.id} onClick={() => toggle(u.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors ${selected.has(u.id) ? 'bg-sky-500/15' : 'hover:bg-white/[0.04]'}`}>
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.has(u.id) ? 'bg-sky-500 border-sky-500' : 'border-white/20'}`}>
                {selected.has(u.id) && <Check size={10} className="text-white" />}
              </div>
              <Avatar name={u.name} size={28} />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-white/80 truncate">{u.name}</div>
                <div className="text-[10px] text-white/35 truncate">{u.department}</div>
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => name.trim() && selected.size > 0 && onCreate(name.trim(), Array.from(selected))}
          disabled={!name.trim() || selected.size === 0}
          className="win-btn w-full text-[12px] disabled:opacity-40">
          สร้างกลุ่ม ({selected.size} คน)
        </button>
      </div>
    </div>
  );
}

// ─── Main Chat Component ───────────────────────────────────

export default function Chat() {
  const { currentUser, chatMuted } = useApp();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<'all' | 'direct' | 'group'>('all');
  const [search, setSearch] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [showNewDM, setShowNewDM] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [chatUsers, setChatUsers] = useState<ChatUserItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [socketConnected, setSocketConnected] = useState(() => !!getSocket()?.connected);
  const [avatarMap, setAvatarMap] = useState<Map<string, string | null>>(new Map());
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [msgSearch, setMsgSearch] = useState('');
  const [msgSearchDate, setMsgSearchDate] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const msgSearchRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const myTypingTimer = useRef<ReturnType<typeof setTimeout>>();
  const selectedRoomRef = useRef<ChatRoom | null>(null);
  selectedRoomRef.current = selectedRoom;

  // Seed avatarMap from currentUser on mount / when avatar changes
  useEffect(() => {
    setAvatarMap(prev => { const m = new Map(prev); m.set(currentUser.id, currentUser.avatar ?? null); return m; });
  }, [currentUser.id, currentUser.avatar]);

  // Load rooms
  const loadRooms = useCallback(async () => {
    try {
      const data = await ChatAPI.listRooms();
      setRooms(data);
      // Populate avatarMap from direct room otherUser data
      setAvatarMap(prev => {
        const m = new Map(prev);
        data.forEach(r => {
          if (r.otherUser) m.set(r.otherUser.id, r.otherUser.avatar ?? null);
        });
        return m;
      });
      setLoadError(false);
    } catch (err) {
      console.error('loadRooms failed:', err);
      setLoadError(true);
    } finally { setLoadingRooms(false); }
  }, []);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  // Load users for modals + populate avatar map
  const ensureUsers = useCallback(async () => {
    if (chatUsers.length > 0) return;
    try {
      const data = await ChatAPI.listChatUsers();
      setChatUsers(data);
      setAvatarMap(prev => {
        const m = new Map(prev);
        data.forEach(u => m.set(u.id, u.avatar ?? null));
        m.set(currentUser.id, currentUser.avatar ?? null);
        return m;
      });
    } catch (err) {
      console.error('listChatUsers failed:', err);
    }
  }, [chatUsers.length, currentUser.id, currentUser.avatar]);

  // Socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMessage = (msg: ChatMessage) => {
      const curRoom = selectedRoomRef.current;

      // Update room list preview for all messages
      setRooms(prev => prev.map(r => r.id === msg.roomId ? {
        ...r,
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        lastMessageSender: msg.senderName,
        lastMessageSenderId: msg.senderId,
        updatedAt: msg.createdAt,
        unreadCount: curRoom?.id === msg.roomId ? 0
          : msg.senderId === currentUser.id ? r.unreadCount
          : r.unreadCount + 1,
      } : r).sort((a, b) => {
        const ta = a.lastMessageAt ?? a.updatedAt;
        const tb = b.lastMessageAt ?? b.updatedAt;
        return ta < tb ? 1 : ta > tb ? -1 : 0;
      }));

      // Only add to messages list if not own message — own messages are added optimistically on send
      if (curRoom && msg.roomId === curRoom.id && msg.senderId !== currentUser.id) {
        setMessages(prev => [...prev, msg]);
        ChatAPI.markRoomRead(msg.roomId).catch(() => {});
        if (!chatMuted) playChatSound();
      }
    };

    const onTyping = (data: { roomId: string; userId: string; userName: string; typing: boolean }) => {
      const cur = selectedRoomRef.current;
      if (!cur || data.roomId !== cur.id || data.userId === currentUser.id) return;
      setTypingUsers(prev => {
        const m = new Map(prev);
        if (data.typing) {
          m.set(data.userId, data.userName);
          clearTimeout(typingTimers.current.get(data.userId));
          typingTimers.current.set(data.userId, setTimeout(() => {
            setTypingUsers(p => { const n = new Map(p); n.delete(data.userId); return n; });
          }, 3500));
        } else {
          m.delete(data.userId);
        }
        return m;
      });
    };

    const onOnline = ({ userId, online }: { userId: string; online: boolean }) => {
      setOnlineUsers(prev => { const s = new Set(prev); online ? s.add(userId) : s.delete(userId); return s; });
      setChatUsers(prev => prev.map(u => u.id === userId ? { ...u, online } : u));
      setRooms(prev => prev.map(r => r.otherUser?.id === userId
        ? { ...r, otherUser: { ...r.otherUser!, online } }
        : r
      ));
    };

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    const onAvatarUpdate = ({ userId, avatar }: { userId: string; avatar: string }) => {
      setAvatarMap(prev => { const m = new Map(prev); m.set(userId, avatar); return m; });
    };

    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);
    socket.on('user:online', onOnline);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('user:avatar', onAvatarUpdate);
    setSocketConnected(socket.connected);

    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
      socket.off('user:online', onOnline);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('user:avatar', onAvatarUpdate);
      typingTimers.current.forEach(t => clearTimeout(t));
      typingTimers.current.clear();
    };
  }, [currentUser.id]);

  // Re-join room and reload rooms on socket reconnect
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onReconnect = () => {
      loadRooms();
      const room = selectedRoomRef.current;
      if (room) socket.emit('chat:join', room.id);
    };
    socket.on('connect', onReconnect);
    return () => { socket.off('connect', onReconnect); };
  }, [loadRooms]);

  // Join/leave socket room on selection
  useEffect(() => {
    if (!selectedRoom) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('chat:join', selectedRoom.id);
    return () => { socket.emit('chat:leave', selectedRoom.id); };
  }, [selectedRoom?.id]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    setShowSidebar(false);
    setMessages([]);
    setTypingUsers(new Map());
    setMentionQuery(null);
    setLoadingMsgs(true);
    try {
      const msgs = await ChatAPI.getMessages(room.id);
      setMessages(prev => {
        const optimistic = prev.filter(m => m.id.startsWith('opt-'));
        if (optimistic.length === 0) return msgs;
        const serverIds = new Set(msgs.map(m => m.id));
        return [...msgs, ...optimistic.filter(m => !serverIds.has(m.id))];
      });
      await ChatAPI.markRoomRead(room.id);
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unreadCount: 0 } : r));
    } catch (err) {
      console.error('selectRoom failed:', err);
    } finally { setLoadingMsgs(false); }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = useCallback(() => {
    if (!input.trim() || !selectedRoom) return;
    const content = input.trim();
    setInput('');
    setMentionQuery(null);
    const optimistic: ChatMessage = {
      id: `opt-${Date.now()}`,
      roomId: selectedRoom.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      type: 'text',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    const socket = getSocket();
    if (socket) {
      socket.emit('chat:message', { roomId: selectedRoom.id, content, type: 'text' });
      clearTimeout(myTypingTimer.current);
      socket.emit('chat:typing', { roomId: selectedRoom.id, typing: false });
    }
    inputRef.current?.focus();
  }, [input, selectedRoom, currentUser.id, currentUser.name]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom) return;
    e.target.value = '';
    setUploading(true);
    try {
      const { url, fileName, type } = await ChatAPI.uploadChatFile(file);
      const socket = getSocket();
      if (!socket) return;
      const optimistic: ChatMessage = {
        id: `opt-${Date.now()}`,
        roomId: selectedRoom.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        content: fileName,
        type: type as 'text' | 'image' | 'file',
        fileUrl: url,
        fileName,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimistic]);
      socket.emit('chat:message', { roomId: selectedRoom.id, content: fileName, type, fileUrl: url, fileName });
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const insertMention = useCallback((user: ChatUserItem) => {
    const el = inputRef.current;
    const cursor = el?.selectionStart ?? input.length;
    const beforeCursor = input.slice(0, cursor);
    const afterCursor = input.slice(cursor);
    const mentionMatch = beforeCursor.match(/@([\w฀-๿]*)$/);
    if (!mentionMatch) return;
    const newBefore = beforeCursor.slice(0, mentionMatch.index) + `@${user.name} `;
    setInput(newBefore + afterCursor);
    setMentionQuery(null);
    setTimeout(() => el?.focus(), 0);
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    // detect @mention before cursor
    const cursor = e.target.selectionStart ?? val.length;
    const beforeCursor = val.slice(0, cursor);
    const mentionMatch = beforeCursor.match(/@([\w฀-๿]*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      ensureUsers();
    } else {
      setMentionQuery(null);
    }
    const socket = getSocket();
    if (!socket || !selectedRoom) return;
    socket.emit('chat:typing', { roomId: selectedRoom.id, typing: true });
    clearTimeout(myTypingTimer.current);
    myTypingTimer.current = setTimeout(() => {
      socket.emit('chat:typing', { roomId: selectedRoom.id, typing: false });
    }, 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && mentionQuery !== null) {
      e.preventDefault();
      setMentionQuery(null);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startDM = async (targetUserId: string) => {
    setShowNewDM(false);
    try {
      const { id } = await ChatAPI.getOrCreateDM(targetUserId);
      const freshRooms = await ChatAPI.listRooms();
      setRooms(freshRooms);
      const room = freshRooms.find(r => r.id === id);
      if (room) selectRoom(room);
    } catch (err) {
      console.error('startDM failed:', err);
    }
  };

  const createGroup = async (name: string, memberIds: string[]) => {
    setShowNewGroup(false);
    try {
      const { id } = await ChatAPI.createGroup(name, memberIds);
      const freshRooms = await ChatAPI.listRooms();
      setRooms(freshRooms);
      const room = freshRooms.find(r => r.id === id);
      if (room) selectRoom(room);
    } catch (err) {
      console.error('createGroup failed:', err);
    }
  };

  const getRoomName = (room: ChatRoom) =>
    room.type === 'direct' ? (room.otherUser?.name ?? 'DM') : (room.name ?? 'กลุ่ม');

  const getRoomSubtitle = (room: ChatRoom) =>
    room.type === 'direct' ? (room.otherUser?.department ?? '') : `${room.memberCount} คน`;

  const filteredRooms = rooms.filter(r => {
    if (filter === 'direct' && r.type !== 'direct') return false;
    if (filter === 'group' && r.type !== 'group') return false;
    if (search) {
      const name = getRoomName(r).toLowerCase();
      if (!name.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const totalUnread = rooms.reduce((s, r) => s + (r.unreadCount ?? 0), 0);
  const typingNames = Array.from(typingUsers.values());

  // Build grouped + separated messages (apply search filter + date filter)
  const displayedMessages = (msgSearch.trim() || msgSearchDate)
    ? messages.filter(m => {
        if (msgSearch.trim() && !m.content.toLowerCase().includes(msgSearch.toLowerCase())) return false;
        if (msgSearchDate) {
          const d = new Date(m.createdAt).toISOString().slice(0, 10);
          if (d !== msgSearchDate) return false;
        }
        return true;
      })
    : messages;
  const groups = groupMessages(displayedMessages);
  const renderMessages = () => {
    const elements: React.ReactNode[] = [];
    let lastDateLabel = '';
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      const firstMsg = g.messages[0];
      const dateLabel = dateSeparatorLabel(firstMsg.createdAt);
      if (dateLabel !== lastDateLabel) {
        lastDateLabel = dateLabel;
        elements.push(
          <div key={`sep-${gi}`} className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/06" />
            <span className="text-[10px] text-white/30 px-2">{dateLabel}</span>
            <div className="flex-1 h-px bg-white/06" />
          </div>
        );
      }
      const isOwn = g.senderId === currentUser.id;
      elements.push(
        <div key={`grp-${gi}`} className={`flex gap-2 mb-3 msg-in ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {!isOwn && <Avatar name={g.senderName} size={30} online={onlineUsers.has(g.senderId)} avatarUrl={avatarMap.get(g.senderId)} />}
          <div className={`flex flex-col gap-0.5 max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
            {!isOwn && (
              <span className="text-[10px] font-medium ml-1 mb-0.5" style={{ color: getAvatarColor(g.senderName) }}>{g.senderName}</span>
            )}
            {g.messages.map((m, mi) => (
              <div key={m.id}
                className={`text-[13px] leading-snug break-words transition-all ${
                  m.type === 'image' && m.fileUrl ? '' :
                  isOwn
                    ? 'px-3.5 py-2 text-white/95 rounded-2xl rounded-br-sm shadow-lg'
                    : 'px-3.5 py-2 bg-white/[0.07] border border-white/[0.10] text-white/85 rounded-2xl rounded-bl-sm'
                }`}
                style={m.type !== 'image' && !m.fileUrl && isOwn ? {
                  background: 'linear-gradient(135deg, rgba(14,165,233,0.35) 0%, rgba(99,102,241,0.28) 100%)',
                  border: '1px solid rgba(14,165,233,0.35)',
                  boxShadow: '0 2px 12px rgba(14,165,233,0.15)',
                } : {}}
              >
                {m.type === 'image' && m.fileUrl ? (
                  <img
                    src={m.fileUrl}
                    alt={m.fileName ?? 'รูปภาพ'}
                    className="max-w-[220px] max-h-[220px] rounded-2xl object-cover cursor-pointer block hover:opacity-90 transition-opacity"
                    onClick={() => window.open(m.fileUrl, '_blank')}
                  />
                ) : m.type === 'file' && m.fileUrl ? (
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <Paperclip size={12} className="shrink-0" />
                    <span className="underline underline-offset-2 truncate max-w-[200px]">{m.fileName ?? m.content}</span>
                  </a>
                ) : (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{renderWithMentions(m.content, currentUser.id, currentUser.name)}</span>
                )}
                {mi === g.messages.length - 1 && (
                  <div className={`text-[9px] mt-1 ${isOwn ? 'text-sky-200/40 text-right' : 'text-white/25'}`}>
                    {fmtTime(m.createdAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return elements;
  };

  return (
    <div className="flex h-full relative overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <div className={`
        flex flex-col shrink-0 border-r transition-all duration-200
        ${showSidebar ? 'w-full sm:w-[280px]' : 'hidden sm:flex sm:w-[280px]'}
      `} style={{ borderColor: 'rgba(255,255,255,0.07)' }}>

        {/* Sidebar Header */}
        <div className="px-4 pt-4 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-sky-400" />
              <span className="text-[14px] font-semibold text-white/85">Chat</span>
              {totalUnread > 0 && (
                <span className="text-[10px] bg-sky-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setShowNewDM(true); ensureUsers(); }}
                className="taskbar-btn flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-sky-400"
                title="ส่งข้อความใหม่"
              >
                <UserPlus size={13} />
              </button>
              <button
                onClick={() => { setShowNewGroup(true); ensureUsers(); }}
                className="taskbar-btn flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-sky-400"
                title="สร้างกลุ่ม"
              >
                <Users size={13} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              className="win-input pl-8 text-[12px] py-1.5"
              placeholder="ค้นหา..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {(['all', 'direct', 'group'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-1 text-[10px] py-1 rounded-lg transition-colors ${filter === f ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-white/35 hover:text-white/60'}`}>
                {f === 'all' ? 'ทั้งหมด' : f === 'direct' ? 'DM' : 'กลุ่ม'}
              </button>
            ))}
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {loadingRooms ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-5 h-5 border-2 border-sky-400/25 border-t-sky-400 rounded-full animate-spin" />
            </div>
          ) : loadError ? (
            <div className="text-center py-10 px-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={18} className="text-red-400/60" />
              </div>
              <div className="text-[12px] text-red-400/80 font-medium mb-1">เชื่อมต่อ Server ไม่ได้</div>
              <div className="text-[10px] text-white/25 leading-relaxed mb-3">
                กรุณาตรวจสอบว่า server รันอยู่<br />
                <code className="text-sky-400/60">npm run dev:server</code>
              </div>
              <button onClick={loadRooms} className="text-[11px] text-sky-400 hover:text-sky-300 border border-sky-500/30 rounded-lg px-3 py-1.5">
                ลองใหม่
              </button>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-10">
              <MessageCircle size={28} className="mx-auto text-white/15 mb-2" />
              <div className="text-[12px] text-white/25">ยังไม่มีการสนทนา</div>
              <button onClick={() => { setShowNewDM(true); ensureUsers(); }}
                className="mt-3 text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 mx-auto">
                <Plus size={11} /> เริ่มแชทใหม่
              </button>
            </div>
          ) : (
            filteredRooms.map(room => {
              const isActive = selectedRoom?.id === room.id;
              const name = getRoomName(room);
              const sub = getRoomSubtitle(room);
              const isOnline = room.type === 'direct' && room.otherUser ? onlineUsers.has(room.otherUser.id) || room.otherUser.online : false;
              return (
                <button key={room.id} onClick={() => selectRoom(room)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-colors ${
                    isActive ? 'bg-white/[0.08] border border-white/[0.10]' : 'hover:bg-white/[0.05]'
                  }`}>
                  {room.type === 'direct' ? (
                    <Avatar name={name} size={36} online={isOnline} avatarUrl={room.otherUser?.avatar} />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-sky-500/20 border border-sky-500/30">
                      <Users size={14} className="text-sky-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[12px] font-medium text-white/80 truncate">{name}</span>
                      <span className="text-[10px] text-white/30 shrink-0">{fmtRoomTime(room.lastMessageAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <span className="text-[11px] text-white/35 truncate">
                        {room.lastMessage
                          ? (room.lastMessageSenderId === currentUser.id ? 'คุณ: ' : '') + room.lastMessage
                          : <span className="italic text-white/20">{sub}</span>
                        }
                      </span>
                      {room.unreadCount > 0 && (
                        <span className="text-[10px] bg-sky-500 text-white rounded-full px-1.5 min-w-[18px] text-center leading-[18px] shrink-0">
                          {room.unreadCount > 99 ? '99+' : room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat Area ────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${!showSidebar || selectedRoom ? '' : 'hidden sm:flex'}`}>
        {!selectedRoom ? (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-sky-400/60" />
            </div>
            <div className="text-[15px] font-medium text-white/40 mb-1">เลือกการสนทนา</div>
            <div className="text-[12px] text-white/20">หรือเริ่มแชทใหม่โดยกดปุ่ม + ทางซ้าย</div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 h-12 shrink-0 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <button onClick={() => { setShowSidebar(true); setSelectedRoom(null); }}
                className="sm:hidden text-white/40 hover:text-white/70 mr-1">
                <ArrowLeft size={16} />
              </button>
              {selectedRoom.type === 'direct' && selectedRoom.otherUser ? (
                <Avatar name={selectedRoom.otherUser.name} size={30}
                  online={onlineUsers.has(selectedRoom.otherUser.id) || selectedRoom.otherUser.online}
                  avatarUrl={avatarMap.get(selectedRoom.otherUser.id)} />
              ) : (
                <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                  <Users size={13} className="text-sky-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-white/85 truncate">
                  {getRoomName(selectedRoom)}
                </div>
                {selectedRoom.type === 'direct' && selectedRoom.otherUser ? (
                  <div className="text-[10px] text-white/30 leading-none mt-0.5">
                    {(onlineUsers.has(selectedRoom.otherUser.id) || selectedRoom.otherUser.online)
                      ? <span className="text-green-400">ออนไลน์</span>
                      : selectedRoom.otherUser.department}
                  </div>
                ) : (
                  <div className="text-[10px] text-white/30 leading-none mt-0.5">{selectedRoom.memberCount} สมาชิก</div>
                )}
              </div>
              {/* Search toggle button */}
              <button
                onClick={() => { setShowMsgSearch(v => !v); setMsgSearch(''); setTimeout(() => msgSearchRef.current?.focus(), 50); }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showMsgSearch ? 'bg-sky-500/20 text-sky-400' : 'text-white/30 hover:text-white/70 hover:bg-white/[0.06]'}`}
                title="ค้นหาในการสนทนา"
              >
                <Search size={14} />
              </button>
            </div>

            {/* Message search bar */}
            {showMsgSearch && (
              <div className="px-4 py-2 border-b flex items-center gap-2 fade-in" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <Search size={12} className="text-sky-400 shrink-0" />
                <input
                  ref={msgSearchRef}
                  className="flex-1 bg-transparent text-[12px] text-white/85 outline-none placeholder-white/25 min-w-0"
                  placeholder="ค้นหาข้อความ..."
                  value={msgSearch}
                  onChange={e => setMsgSearch(e.target.value)}
                />
                <input
                  type="date"
                  className="bg-transparent text-[11px] text-white/60 outline-none border border-white/10 rounded-lg px-2 py-0.5 [color-scheme:dark] shrink-0"
                  value={msgSearchDate}
                  onChange={e => setMsgSearchDate(e.target.value)}
                />
                {(msgSearch || msgSearchDate) && (
                  <span className="text-[10px] text-white/35 shrink-0">
                    {displayedMessages.length} รายการ
                  </span>
                )}
                <button onClick={() => { setMsgSearch(''); setMsgSearchDate(''); setShowMsgSearch(false); }} className="text-white/30 hover:text-white/70 shrink-0">
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {loadingMsgs && messages.length === 0 ? (
                <div className="flex items-center justify-center h-20">
                  <div className="w-5 h-5 border-2 border-sky-400/25 border-t-sky-400 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-[12px] text-white/20">ยังไม่มีข้อความ</div>
                  <div className="text-[11px] text-white/15 mt-1">ส่งข้อความแรกเลย!</div>
                </div>
              ) : (
                renderMessages()
              )}

              {/* Typing indicator */}
              {typingNames.length > 0 && (
                <div className="flex items-center gap-2 mt-1 ml-1">
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-white/30">
                    {typingNames.join(', ')} กำลังพิมพ์...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-4 pb-3 pt-2 border-t relative" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              {/* @mention dropdown */}
              {mentionQuery !== null && chatUsers.length > 0 && (() => {
                const mentionFiltered = chatUsers
                  .filter(u => u.id !== currentUser.id && (
                    mentionQuery === '' || u.name.toLowerCase().includes(mentionQuery.toLowerCase())
                  ))
                  .slice(0, 6);
                if (mentionFiltered.length === 0) return null;
                return (
                  <div className="absolute left-4 right-4 bottom-full mb-1 glass-panel rounded-xl overflow-hidden z-50 shadow-2xl"
                    style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                    {mentionFiltered.map(u => (
                      <button key={u.id} onMouseDown={e => { e.preventDefault(); insertMention(u); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.07] text-left transition-colors">
                        <Avatar name={u.name} size={24} online={onlineUsers.has(u.id)} avatarUrl={avatarMap.get(u.id)} />
                        <span className="text-[12px] font-medium text-white/80">{u.name}</span>
                        <span className="text-[10px] text-white/35 truncate">{u.department}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}
              {!socketConnected && (
                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span className="text-[10px] text-amber-400/70">กำลังเชื่อมต่อ... ข้อความจะถูกส่งเมื่อเชื่อมต่อสำเร็จ</span>
                </div>
              )}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-8 h-9 rounded-xl flex items-center justify-center shrink-0 text-white/35 hover:text-white/70 hover:bg-white/[0.06] transition-colors disabled:opacity-30"
                  title="แนบรูปภาพหรือไฟล์"
                >
                  {uploading
                    ? <div className="w-3.5 h-3.5 border-2 border-sky-400/40 border-t-sky-400 rounded-full animate-spin" />
                    : <Paperclip size={14} />
                  }
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="พิมพ์ข้อความ... (Enter ส่ง, Shift+Enter ขึ้นบรรทัด)"
                  className="flex-1 win-input resize-none text-[13px] py-2.5 leading-snug"
                  style={{ maxHeight: '120px', overflowY: 'auto' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
                  style={{
                    background: input.trim() ? 'rgba(14,165,233,0.85)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(14,165,233,0.4)',
                  }}
                >
                  <Send size={14} className="text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showNewDM && (
        <NewDMModal
          chatUsers={chatUsers}
          onlineSet={onlineUsers}
          onSelect={startDM}
          onClose={() => setShowNewDM(false)}
        />
      )}
      {showNewGroup && (
        <NewGroupModal
          chatUsers={chatUsers}
          onCreate={createGroup}
          onClose={() => setShowNewGroup(false)}
        />
      )}
    </div>
  );
}
