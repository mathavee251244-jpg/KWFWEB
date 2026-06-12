import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Clock, Paperclip, Send, Lock, User,
  ChevronDown, AlertTriangle, CheckCircle2, RefreshCw,
  ChevronLeft, ChevronRight, X, ZoomIn,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import PriorityBadge from '../shared/PriorityBadge';
import type { TicketStatus, Role } from '../../types';
import { STATUS_LABELS, CATEGORY_LABELS, ROLE_LABELS } from '../../types';

const isImage = (filename: string) =>
  /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(filename);

function ImageLightbox({
  images, initialIndex, ticketId, onClose,
}: {
  images: Array<{ id: string; filename: string; originalName: string }>;
  initialIndex: number;
  ticketId: string;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const total = images.length;
  const prev = () => setIdx(i => (i > 0 ? i - 1 : total - 1));
  const next = () => setIdx(i => (i < total - 1 ? i + 1 : 0));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const src = (filename: string) => `/uploads/tickets/${ticketId}/${filename}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3 z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
        <span className="text-white/50 text-[13px]">{images[idx].originalName}</span>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-[12px]">{idx + 1} / {total}</span>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
            <X size={15} className="text-white/70" />
          </button>
        </div>
      </div>

      {/* Main image */}
      <div className="flex items-center justify-center w-full flex-1 px-16 py-16">
        <img
          key={images[idx].filename}
          src={src(images[idx].filename)}
          alt={images[idx].originalName}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          style={{ animation: 'fadeIn 0.2s ease' }}
        />
      </div>

      {/* Nav arrows */}
      {total > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center bg-black/50 border border-white/15 hover:bg-black/70 hover:border-white/30 transition-all">
            <ChevronLeft size={20} className="text-white/70" />
          </button>
          <button onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center bg-black/50 border border-white/15 hover:bg-black/70 hover:border-white/30 transition-all">
            <ChevronRight size={20} className="text-white/70" />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 px-4 py-3"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setIdx(i)}
              className="transition-all duration-200 rounded-md overflow-hidden shrink-0"
              style={{
                width: i === idx ? 56 : 44,
                height: i === idx ? 44 : 36,
                border: `2px solid ${i === idx ? 'rgba(14,165,233,0.9)' : 'rgba(255,255,255,0.15)'}`,
                boxShadow: i === idx ? '0 0 12px rgba(14,165,233,0.5)' : 'none',
                opacity: i === idx ? 1 : 0.6,
              }}
            >
              <img
                src={src(img.filename)}
                alt={img.originalName}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('th-TH', {
    day: 'numeric', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_FLOW: TicketStatus[] = ['new', 'assigned', 'in_progress', 'waiting_user', 'resolved', 'closed', 'reopened'];

const roleAvatarColor: Record<Role, string> = {
  employee: '#3b82f6',
  it_staff: '#f59e0b',
  it_manager: '#ef4444',
};

export default function TicketDetail() {
  const { selectedTicketId, tickets, users, currentUser, navigate,
    updateTicketStatus, assignTicket, addComment } = useApp();

  const ticket = tickets.find(t => t.id === selectedTicketId);
  const [commentText, setCommentText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showStatusDrop, setShowStatusDrop] = useState(false);
  const [showAssigneeDrop, setShowAssigneeDrop] = useState(false);
  const statusBtnRef = useRef<HTMLButtonElement>(null);
  const assigneeBtnRef = useRef<HTMLButtonElement>(null);
  const [statusPos, setStatusPos] = useState({ top: 0, left: 0, width: 0 });
  const [assigneePos, setAssigneePos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (statusBtnRef.current && !statusBtnRef.current.contains(e.target as Node)) setShowStatusDrop(false);
      if (assigneeBtnRef.current && !assigneeBtnRef.current.contains(e.target as Node)) setShowAssigneeDrop(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!ticket) {
    return (
      <div className="module-content flex items-center justify-center">
        <div className="text-center text-white/30">
          <p className="text-sm mb-3">ไม่พบ Ticket ที่เลือก</p>
          <button onClick={() => navigate('my_tickets')} className="win-btn text-xs">
            กลับไปรายการ Ticket
          </button>
        </div>
      </div>
    );
  }

  const isIT = currentUser.role !== 'employee';
  const itStaff = users.filter(u => u.role === 'it_staff' || u.role === 'it_manager');
  const now = new Date();
  const slaDate = new Date(ticket.slaDueTime);
  const isOverdue = slaDate < now && !['resolved', 'closed'].includes(ticket.status);
  const hoursLeft = Math.abs((slaDate.getTime() - now.getTime()) / 3600000);

  const handleSendComment = (isInternal: boolean) => {
    const text = isInternal ? noteText : commentText;
    if (!text.trim()) return;
    addComment(ticket.id, {
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      message: text,
      timestamp: new Date().toISOString(),
      isInternal,
    });
    if (isInternal) setNoteText('');
    else setCommentText('');
  };

  const handleStatusChange = (status: TicketStatus) => {
    updateTicketStatus(ticket.id, status, currentUser.name);
    setShowStatusDrop(false);
  };

  const handleAssign = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) assignTicket(ticket.id, userId, user.name);
    setShowAssigneeDrop(false);
  };

  const openStatusDrop = () => {
    if (statusBtnRef.current) {
      const r = statusBtnRef.current.getBoundingClientRect();
      setStatusPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setShowStatusDrop(v => !v);
    setShowAssigneeDrop(false);
  };

  const openAssigneeDrop = () => {
    if (assigneeBtnRef.current) {
      const r = assigneeBtnRef.current.getBoundingClientRect();
      setAssigneePos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setShowAssigneeDrop(v => !v);
    setShowStatusDrop(false);
  };

  const allComments = [...ticket.comments, ...(isIT ? ticket.internalNotes : [])]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const timelineStatusColor: Record<TicketStatus, string> = {
    new: 'bg-blue-500',
    assigned: 'bg-purple-500',
    in_progress: 'bg-amber-500',
    waiting_user: 'bg-orange-500',
    resolved: 'bg-green-500',
    closed: 'bg-slate-500',
    reopened: 'bg-red-500',
  };

  return (
    <div className="module-content fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate(isIT ? 'all_tickets' : 'my_tickets')}
          className="win-btn-ghost flex items-center gap-1.5 text-xs py-1.5"
        >
          <ArrowLeft size={13} /> กลับ
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-blue-400/80 font-medium">{ticket.id}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h2 className="text-[16px] font-semibold text-white/90 mt-1 leading-snug">{ticket.title}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Main content */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* SLA Warning */}
          {!['resolved', 'closed'].includes(ticket.status) && (
            <div className={`rounded-xl p-3 flex items-center gap-3 ${
              isOverdue
                ? 'bg-red-500/10 border border-red-500/25'
                : hoursLeft < 4
                ? 'bg-orange-500/10 border border-orange-500/25'
                : 'bg-blue-500/08 border border-blue-500/18'
            }`}>
              {isOverdue
                ? <AlertTriangle size={16} className="text-red-400 shrink-0" />
                : <Clock size={16} className={`shrink-0 ${hoursLeft < 4 ? 'text-orange-400' : 'text-blue-400'}`} />
              }
              <div>
                <div className={`text-[12px] font-medium ${isOverdue ? 'text-red-300' : hoursLeft < 4 ? 'text-orange-300' : 'text-blue-300'}`}>
                  {isOverdue ? `⚠ เกิน SLA ${hoursLeft.toFixed(0)} ชั่วโมง` : `SLA ครบกำหนด ${formatDateTime(ticket.slaDueTime)}`}
                </div>
                <div className="text-[10px] text-white/35">
                  {isOverdue ? 'ต้องดำเนินการแก้ไขทันที' : `เหลือ ${hoursLeft.toFixed(1)} ชั่วโมง`}
                </div>
              </div>
            </div>
          )}

          {/* Ticket Info */}
          <div className="glass-card rounded-xl p-4">
            <div className="section-title">ข้อมูล Ticket</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
              {[
                ['ผู้แจ้ง', ticket.requesterName],
                ['แผนก', ticket.department],
                ['อีเมล', ticket.email],
                ['หมวดหมู่', CATEGORY_LABELS[ticket.category]],
                ['สร้างเมื่อ', formatDateTime(ticket.createdAt)],
                ['อัปเดตล่าสุด', formatDateTime(ticket.updatedAt)],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="text-[10px] text-white/35 uppercase tracking-wide mb-0.5">{label}</div>
                  <div className="text-white/75">{val}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[10px] text-white/35 uppercase tracking-wide mb-1.5">รายละเอียดปัญหา</div>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>
            {ticket.attachments.length > 0 && (() => {
              const imgFiles = ticket.attachments.filter(a => isImage(a.filename));
              const otherFiles = ticket.attachments.filter(a => !isImage(a.filename));
              return (
                <div className="mt-4 flex flex-col gap-3">
                  {/* Image grid */}
                  {imgFiles.length > 0 && (
                    <div>
                      <div className="text-[10px] text-white/35 uppercase tracking-wide mb-2">
                        รูปภาพ ({imgFiles.length}) — คลิกเพื่อดูเต็มจอ
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {imgFiles.map((a, i) => (
                          <button
                            key={a.id}
                            onClick={() => setLightboxIdx(i)}
                            className="relative group rounded-xl overflow-hidden border border-white/10 hover:border-sky-400/50 transition-all"
                            style={{ width: 88, height: 72 }}
                          >
                            <img
                              src={`/uploads/tickets/${ticket.id}/${a.filename}`}
                              alt={a.originalName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                              <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {imgFiles.length > 1 && i === 0 && (
                              <div className="absolute bottom-1 right-1 bg-black/60 rounded px-1.5 py-0.5 text-[9px] text-white/80">
                                +{imgFiles.length}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Other files */}
                  {otherFiles.length > 0 && (
                    <div>
                      <div className="text-[10px] text-white/35 uppercase tracking-wide mb-2">ไฟล์แนบ ({otherFiles.length})</div>
                      <div className="flex flex-wrap gap-2">
                        {otherFiles.map(a => (
                          <a
                            key={a.id}
                            href={`/uploads/tickets/${ticket.id}/${a.filename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-white/06 border border-white/10 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors"
                          >
                            <Paperclip size={11} className="text-white/40" />
                            <span className="text-[11px] text-white/65 max-w-[180px] truncate">{a.originalName}</span>
                            <span className="text-[10px] text-white/30">({(a.size / 1024).toFixed(0)}KB)</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Lightbox */}
                  {lightboxIdx !== null && (
                    <ImageLightbox
                      images={imgFiles}
                      initialIndex={lightboxIdx}
                      ticketId={ticket.id}
                      onClose={() => setLightboxIdx(null)}
                    />
                  )}
                </div>
              );
            })()}
          </div>

          {/* Conversation */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/06">
              <span className="text-[12px] font-semibold text-white/60 uppercase tracking-wider">
                บทสนทนา ({allComments.length})
              </span>
            </div>
            <div className="p-4 flex flex-col gap-3 max-h-80 overflow-y-auto">
              {allComments.length === 0 && (
                <div className="text-center text-white/25 text-sm py-6">ยังไม่มีความคิดเห็น</div>
              )}
              {allComments.map(c => (
                <div
                  key={c.id}
                  className={`flex gap-3 ${c.isInternal ? 'opacity-80' : ''}`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                    style={{
                      background: `${roleAvatarColor[c.userRole]}22`,
                      border: `1px solid ${roleAvatarColor[c.userRole]}44`,
                      color: roleAvatarColor[c.userRole],
                    }}
                  >
                    {c.userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[12px] font-medium text-white/80">{c.userName}</span>
                      <span className="text-[10px] text-white/35">{ROLE_LABELS[c.userRole]}</span>
                      {c.isInternal && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                          <Lock size={9} /> บันทึกภายใน
                        </span>
                      )}
                      <span className="text-[10px] text-white/25">{formatDateTime(c.timestamp)}</span>
                    </div>
                    <div className={`text-sm leading-relaxed rounded-xl px-3 py-2 ${
                      c.isInternal
                        ? 'bg-amber-500/08 border border-amber-500/15 text-amber-100/70'
                        : c.userRole === 'employee'
                        ? 'bg-blue-500/08 border border-blue-500/12 text-white/75'
                        : 'bg-white/05 border border-white/08 text-white/75'
                    }`}>
                      {c.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Composer */}
            <div className="px-4 pb-4 pt-2 border-t border-white/06 flex flex-col gap-2">
              <div className="flex gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{
                    background: `${roleAvatarColor[currentUser.role]}22`,
                    border: `1px solid ${roleAvatarColor[currentUser.role]}44`,
                    color: roleAvatarColor[currentUser.role],
                  }}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <textarea
                  className="win-input flex-1 resize-none"
                  rows={2}
                  placeholder="เขียนความคิดเห็น..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => handleSendComment(false)}
                  disabled={!commentText.trim()}
                  className="win-btn flex items-center gap-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={12} /> ส่งความคิดเห็น
                </button>
              </div>

              {/* Internal Note (IT only) */}
              {isIT && (
                <div className="mt-2 pt-3 border-t border-white/06">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lock size={11} className="text-amber-400/70" />
                    <span className="text-[10px] text-amber-400/70 font-medium uppercase tracking-wider">บันทึกภายใน (IT เท่านั้น)</span>
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      className="win-input flex-1 resize-none border-amber-500/20 focus:border-amber-500/50"
                      rows={2}
                      placeholder="บันทึกหมายเหตุภายใน..."
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleSendComment(true)}
                      disabled={!noteText.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs hover:bg-amber-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Lock size={11} /> บันทึก Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card rounded-xl p-4">
            <div className="section-title">ประวัติสถานะ</div>
            <div className="flex flex-col gap-0">
              {ticket.timeline.map((t, idx) => (
                <div key={t.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${timelineStatusColor[t.toStatus]}`} />
                    {idx < ticket.timeline.length - 1 && <div className="w-px flex-1 bg-white/08 mt-1 mb-0" />}
                  </div>
                  <div className={`pb-3 ${idx < ticket.timeline.length - 1 ? '' : ''}`}>
                    <div className="text-[12px] text-white/70">
                      <span className="font-medium text-white/80">{t.changedBy}</span>
                      {' '}เปลี่ยนสถานะ
                      {t.fromStatus ? ` จาก "${STATUS_LABELS[t.fromStatus]}"` : ''}
                      {' '}เป็น <span className="font-medium">{STATUS_LABELS[t.toStatus]}</span>
                    </div>
                    <div className="text-[10px] text-white/30 mt-0.5">{formatDateTime(t.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-col gap-4">
          {/* IT Controls */}
          {isIT && (
            <div className="glass-card rounded-xl p-4">
              <div className="section-title">จัดการ Ticket</div>
              <div className="flex flex-col gap-3">
                {/* Status */}
                <div>
                  <label className="text-[11px] text-white/40 mb-1.5 block">สถานะ</label>
                  <button
                    ref={statusBtnRef}
                    onClick={openStatusDrop}
                    className="win-input w-full flex items-center justify-between cursor-pointer"
                  >
                    <StatusBadge status={ticket.status} size="sm" />
                    <ChevronDown size={13} className="text-white/40" />
                  </button>
                  {showStatusDrop && createPortal(
                    <div className="glass rounded-xl p-1.5 shadow-window fade-in"
                      style={{ position: 'fixed', top: statusPos.top, left: statusPos.left, width: statusPos.width, zIndex: 9999 }}>
                      {STATUS_FLOW.map(s => (
                        <button key={s} onMouseDown={e => e.stopPropagation()} onClick={() => handleStatusChange(s)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/08 transition-colors ${ticket.status === s ? 'bg-white/06' : ''}`}>
                          <StatusBadge status={s} size="sm" />
                        </button>
                      ))}
                    </div>,
                    document.body
                  )}
                </div>

                {/* Assignee */}
                <div>
                  <label className="text-[11px] text-white/40 mb-1.5 block">ผู้รับผิดชอบ</label>
                  <button
                    ref={assigneeBtnRef}
                    onClick={openAssigneeDrop}
                    className="win-input w-full flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-sm text-white/70 flex items-center gap-1.5">
                      <User size={13} className="text-white/40" />
                      {ticket.assigneeName || 'ยังไม่ได้มอบหมาย'}
                    </span>
                    <ChevronDown size={13} className="text-white/40" />
                  </button>
                  {showAssigneeDrop && createPortal(
                    <div className="glass rounded-xl p-1.5 shadow-window fade-in"
                      style={{ position: 'fixed', top: assigneePos.top, left: assigneePos.left, width: assigneePos.width, zIndex: 9999 }}>
                      {itStaff.map(u => (
                        <button key={u.id} onMouseDown={e => e.stopPropagation()} onClick={() => handleAssign(u.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/08 transition-colors flex items-center gap-2 ${ticket.assigneeId === u.id ? 'bg-white/06' : ''}`}>
                          <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-[10px] font-bold text-amber-300">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-[12px] text-white/80">{u.name}</div>
                            <div className="text-[10px] text-white/35">{ROLE_LABELS[u.role]}</div>
                          </div>
                        </button>
                      ))}
                    </div>,
                    document.body
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 mt-1">
                  {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'resolved', currentUser.name)}
                      className="win-btn-success w-full flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> แก้ไขแล้ว
                    </button>
                  )}
                  {ticket.status === 'resolved' && (
                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'closed', currentUser.name)}
                      className="win-btn-ghost w-full flex items-center justify-center gap-1.5"
                    >
                      ปิด Ticket
                    </button>
                  )}
                  {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                    <button
                      onClick={() => updateTicketStatus(ticket.id, 'reopened', currentUser.name)}
                      className="win-btn-danger w-full flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={14} /> เปิด Ticket ใหม่
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Ticket Summary */}
          <div className="glass-card rounded-xl p-4">
            <div className="section-title">สรุป Ticket</div>
            <div className="flex flex-col gap-2.5">
              {([
                { label: 'ผู้แจ้ง',     value: <span className="text-[12px] text-white/65">{ticket.requesterName}</span> },
                { label: 'แผนก',        value: <span className="text-[12px] text-white/65">{ticket.department}</span> },
                { label: 'ความสำคัญ',   value: <PriorityBadge priority={ticket.priority} size="sm" /> },
                { label: 'สถานะ',       value: <StatusBadge status={ticket.status} size="sm" /> },
                { label: 'ผู้รับผิดชอบ', value: <span className="text-[12px] text-white/65">{ticket.assigneeName || '—'}</span> },
              ] as const).map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] text-white/35">{label}</span>
                  {value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
