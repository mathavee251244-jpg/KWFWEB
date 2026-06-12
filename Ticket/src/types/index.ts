export type Role = 'employee' | 'it_staff' | 'it_manager';

export type TicketStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'waiting_user'
  | 'resolved'
  | 'closed'
  | 'reopened';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export type TicketCategory =
  | 'internet'
  | 'computer'
  | 'printer'
  | 'email'
  | 'software'
  | 'account'
  | 'security'
  | 'vpn'
  | 'erp'
  | 'other';

export type ServiceStatus =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage'
  | 'maintenance';

export type PageId =
  | 'desktop'
  | 'home'
  | 'submit_ticket'
  | 'my_tickets'
  | 'all_tickets'
  | 'ticket_detail'
  | 'it_dashboard'
  | 'knowledge_base'
  | 'system_status'
  | 'user_management'
  | 'ot_record'
  | 'email_dashboard'
  | 'speed_test'
  | 'chat';

export interface User {
  id: string;
  name: string;
  department: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive';
  avatar?: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: Role;
  message: string;
  timestamp: string;
  isInternal: boolean;
  attachments?: string[];
}

export interface StatusChange {
  id: string;
  ticketId: string;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus;
  changedBy: string;
  timestamp: string;
  note?: string;
}

export interface TicketAttachment {
  id: string;
  filename: string;
  originalName: string;
  size: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  department: string;
  email: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId?: string;
  assigneeName?: string;
  slaDueTime: string;
  createdAt: string;
  updatedAt: string;
  attachments: TicketAttachment[];
  comments: Comment[];
  internalNotes: Comment[];
  timeline: StatusChange[];
}

export interface Service {
  id: string;
  name: string;
  nameEn: string;
  status: ServiceStatus;
  lastChecked: string;
  uptimePercent: number;
  description?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  affectedServices: string[];
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  createdBy: string;
}

export interface Maintenance {
  id: string;
  title: string;
  description: string;
  affectedServices: string[];
  scheduledStart: string;
  scheduledEnd: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface KBArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  summary: string;
  tags: string[];
  views: number;
  helpful: number;
  createdAt: string;
  updatedAt: string;
  author: string;
  pinned?: boolean;
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  new: 'ใหม่',
  assigned: 'มอบหมายแล้ว',
  in_progress: 'กำลังดำเนินการ',
  waiting_user: 'รอผู้ใช้งาน',
  resolved: 'แก้ไขแล้ว',
  closed: 'ปิด',
  reopened: 'เปิดใหม่',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'ต่ำ',
  medium: 'กลาง',
  high: 'สูง',
  critical: 'วิกฤต',
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  internet: 'อินเทอร์เน็ต',
  computer: 'คอมพิวเตอร์',
  printer: 'เครื่องพิมพ์',
  email: 'อีเมล',
  software: 'ซอฟต์แวร์',
  account: 'บัญชีผู้ใช้',
  security: 'ความปลอดภัย',
  vpn: 'VPN',
  erp: 'ERP',
  other: 'อื่นๆ',
};

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  operational: 'ปกติ',
  degraded: 'ช้าลง',
  partial_outage: 'ขัดข้องบางส่วน',
  major_outage: 'ขัดข้องหลัก',
  maintenance: 'บำรุงรักษา',
};

export type OTStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export const OT_STATUS_LABELS: Record<OTStatus, string> = {
  draft:     'ร่าง',
  submitted: 'รออนุมัติ',
  approved:  'อนุมัติแล้ว',
  rejected:  'ไม่อนุมัติ',
};

export interface OTRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  description: string;
  status: OTStatus;
  createdAt: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectReason?: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  employee: 'พนักงาน',
  it_staff: 'เจ้าหน้าที่ IT',
  it_manager: 'ผู้จัดการ IT',
};

// ─── Chat types ────────────────────────────────────────────

export interface ChatRoom {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSender?: string;
  lastMessageSenderId?: string;
  unreadCount: number;
  otherUser?: { id: string; name: string; department: string; online: boolean; avatar?: string | null };
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
}

// ─── Notification types ────────────────────────────────────

export interface AppNotification {
  id: string;
  type: 'ticket_resolved' | 'ticket_comment' | 'ticket_status_changed' | 'ticket_assigned' | 'chat_message';
  title: string;
  message: string;
  ticketId?: string;
  chatRoomId?: string;
  createdAt: string;
  read: boolean;
}
