import { Router } from 'express';
import { randomUUID } from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db/database.js';
import { requireAuth, requireIT, requireManager } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { notifyUser, broadcastAll } from '../lib/notify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../../uploads/tickets');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOAD_DIR, String(req.params.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

// Build a full ticket object from DB rows
function buildTicket(row: Record<string, unknown>) {
  if (!row) return null;
  const comments = db.prepare(
    'SELECT * FROM comments WHERE ticket_id = ? AND is_internal = 0 ORDER BY timestamp ASC'
  ).all(row.id) as Record<string, unknown>[];
  const internalNotes = db.prepare(
    'SELECT * FROM comments WHERE ticket_id = ? AND is_internal = 1 ORDER BY timestamp ASC'
  ).all(row.id) as Record<string, unknown>[];
  const timeline = db.prepare(
    'SELECT * FROM ticket_timeline WHERE ticket_id = ? ORDER BY timestamp ASC'
  ).all(row.id) as Record<string, unknown>[];
  const attachments = db.prepare(
    'SELECT * FROM ticket_attachments WHERE ticket_id = ? ORDER BY created_at ASC'
  ).all(row.id) as Record<string, unknown>[];

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    department: row.department,
    email: row.email,
    assigneeId: row.assignee_id ?? undefined,
    assigneeName: row.assignee_name ?? undefined,
    slaDueTime: row.sla_due_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attachments: attachments.map(a => ({ id: a.id, filename: a.filename, originalName: a.original_name, size: a.size })),
    comments: comments.map(c => ({
      id: c.id, ticketId: c.ticket_id, userId: c.user_id, userName: c.user_name,
      userRole: c.user_role, message: c.message, isInternal: false, timestamp: c.timestamp,
    })),
    internalNotes: internalNotes.map(c => ({
      id: c.id, ticketId: c.ticket_id, userId: c.user_id, userName: c.user_name,
      userRole: c.user_role, message: c.message, isInternal: true, timestamp: c.timestamp,
    })),
    timeline: timeline.map(t => ({
      id: t.id, ticketId: t.ticket_id, fromStatus: t.from_status ?? null,
      toStatus: t.to_status, changedBy: t.changed_by, timestamp: t.timestamp,
    })),
  };
}

// GET /api/tickets
router.get('/', requireAuth, (req: AuthRequest, res) => {
  const { status, priority, category, search, assigneeId } = req.query as Record<string, string>;
  let sql = 'SELECT * FROM tickets WHERE 1=1';
  const params: unknown[] = [];

  if (req.userRole === 'employee') {
    sql += ' AND requester_id = ?';
    params.push(req.userId);
  }
  if (status)    { sql += ' AND status = ?';   params.push(status); }
  if (priority)  { sql += ' AND priority = ?'; params.push(priority); }
  if (category)  { sql += ' AND category = ?'; params.push(category); }
  if (assigneeId){ sql += ' AND assignee_id = ?'; params.push(assigneeId); }
  if (search)    { sql += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  res.json(rows.map(r => buildTicket(r)));
});

// POST /api/tickets
router.post('/', requireAuth, (req: AuthRequest, res) => {
  const { title, description, category, priority, department, email, requesterName } = req.body as Record<string, string>;
  if (!title || !description || !category || !priority) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const slaHours: Record<string, number> = { low: 72, medium: 24, high: 8, critical: 2 };
  const hours = slaHours[priority] ?? 24;
  const now = new Date().toISOString();
  const slaDueTime = new Date(Date.now() + hours * 3600000).toISOString();

  // Get next ticket number
  const last = db.prepare("SELECT id FROM tickets ORDER BY id DESC LIMIT 1").get() as { id: string } | undefined;
  let nextNum = 1;
  if (last) {
    const match = last.id.match(/TKT-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  const id = `TKT-${String(nextNum).padStart(3, '0')}`;

  const user = db.prepare('SELECT name, department, email FROM users WHERE id = ?').get(req.userId) as { name: string; department: string; email: string } | undefined;

  db.prepare(`
    INSERT INTO tickets (id, title, description, category, priority, status, requester_id, requester_name, department, email, sla_due_time, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description, category, priority, req.userId, requesterName ?? user?.name ?? req.userId, department ?? user?.department ?? '', email ?? user?.email ?? '', slaDueTime, now, now);

  db.prepare(`
    INSERT INTO ticket_timeline (id, ticket_id, from_status, to_status, changed_by, timestamp)
    VALUES (?, ?, NULL, 'new', 'ระบบ', ?)
  `).run(`tl-${id}-1`, id, now);

  const created = buildTicket(db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as Record<string, unknown>);
  broadcastAll('ticket:created', created);
  res.status(201).json(created);
});

// GET /api/tickets/:id
router.get('/:id', requireAuth, (req: AuthRequest, res) => {
  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'Ticket not found' }); return; }
  if (req.userRole === 'employee' && row.requester_id !== req.userId) {
    res.status(403).json({ error: 'Access denied' }); return;
  }
  res.json(buildTicket(row));
});

// PATCH /api/tickets/:id/status
router.patch('/:id/status', requireAuth, requireIT, (req: AuthRequest, res) => {
  const { status } = req.body as { status: string };
  if (!status) { res.status(400).json({ error: 'status required' }); return; }
  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'Not found' }); return; }
  const now = new Date().toISOString();
  db.prepare('UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id);
  const tlId = `tl-${req.params.id}-${Date.now()}`;
  db.prepare('INSERT INTO ticket_timeline (id, ticket_id, from_status, to_status, changed_by, timestamp) VALUES (?, ?, ?, ?, ?, ?)').run(tlId, req.params.id, row.status, status, req.userName, now);

  const updated = buildTicket(db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id) as Record<string, unknown>);
  broadcastAll('ticket:updated', updated);
  if (status === 'resolved') {
    notifyUser(row.requester_id as string, 'ticket:resolved', {
      ticketId: req.params.id, title: row.title, resolvedBy: req.userName,
    });
  } else {
    notifyUser(row.requester_id as string, 'ticket:status_changed', {
      ticketId: req.params.id, title: row.title, status, changedBy: req.userName,
    });
  }
  res.json(updated);
});

// PATCH /api/tickets/:id/assign
router.patch('/:id/assign', requireAuth, requireIT, (req: AuthRequest, res) => {
  const { assigneeId, assigneeName } = req.body as { assigneeId: string; assigneeName: string };
  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'Not found' }); return; }
  const now = new Date().toISOString();
  const newStatus = row.status === 'new' ? 'assigned' : row.status;
  db.prepare('UPDATE tickets SET assignee_id = ?, assignee_name = ?, status = ?, updated_at = ? WHERE id = ?').run(assigneeId, assigneeName, newStatus, now, req.params.id);
  if (row.status === 'new') {
    db.prepare('INSERT INTO ticket_timeline (id, ticket_id, from_status, to_status, changed_by, timestamp) VALUES (?, ?, ?, ?, ?, ?)').run(`tl-${req.params.id}-${Date.now()}`, req.params.id, 'new', 'assigned', assigneeName, now);
  }
  const updatedAssign = buildTicket(db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id) as Record<string, unknown>);
  broadcastAll('ticket:updated', updatedAssign);
  notifyUser(row.requester_id as string, 'ticket:assigned', {
    ticketId: req.params.id, title: row.title, assigneeName,
  });
  if (assigneeId !== row.requester_id) {
    notifyUser(assigneeId, 'ticket:assigned_to_you', {
      ticketId: req.params.id, title: row.title,
      requesterName: row.requester_name, department: row.department,
    });
  }
  res.json(updatedAssign);
});

// POST /api/tickets/:id/comments
router.post('/:id/comments', requireAuth, (req: AuthRequest, res) => {
  const { message, isInternal } = req.body as { message: string; isInternal?: boolean };
  if (!message?.trim()) { res.status(400).json({ error: 'message required' }); return; }
  if (isInternal && req.userRole === 'employee') {
    res.status(403).json({ error: 'Internal notes: IT staff only' }); return;
  }
  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'Not found' }); return; }
  if (req.userRole === 'employee' && row.requester_id !== req.userId) {
    res.status(403).json({ error: 'Access denied' }); return;
  }
  const now = new Date().toISOString();
  const commentId = `cmt-${Date.now()}`;
  db.prepare('INSERT INTO comments (id, ticket_id, user_id, user_name, user_role, message, is_internal, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(commentId, req.params.id, req.userId, req.userName, req.userRole, message, isInternal ? 1 : 0, now);
  db.prepare('UPDATE tickets SET updated_at = ? WHERE id = ?').run(now, req.params.id);
  const updatedComment = buildTicket(db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id) as Record<string, unknown>);
  broadcastAll('ticket:updated', updatedComment);
  if (req.userRole !== 'employee' && !isInternal) {
    // IT commented → notify requester
    notifyUser(row.requester_id as string, 'ticket:comment', {
      ticketId: req.params.id, title: row.title, commentBy: req.userName, message,
    });
  } else if (req.userRole === 'employee' && row.assignee_id) {
    // Employee commented → notify assignee
    notifyUser(row.assignee_id as string, 'ticket:comment', {
      ticketId: req.params.id, title: row.title, commentBy: req.userName, message,
    });
  }
  res.status(201).json({ id: commentId, ticketId: req.params.id, userId: req.userId, userName: req.userName, userRole: req.userRole, message, isInternal: !!isInternal, timestamp: now });
});

// POST /api/tickets/:id/files
router.post('/:id/files', requireAuth, upload.array('files', 5), (req: AuthRequest, res) => {
  const row = db.prepare('SELECT requester_id FROM tickets WHERE id = ?').get(req.params.id) as { requester_id: string } | undefined;
  if (!row) { res.status(404).json({ error: 'Not found' }); return; }
  if (req.userRole === 'employee' && row.requester_id !== req.userId) {
    res.status(403).json({ error: 'Access denied' }); return;
  }
  const files = req.files as Express.Multer.File[];
  const now = new Date().toISOString();
  const saved = files.map(f => {
    const id = randomUUID();
    db.prepare('INSERT INTO ticket_attachments (id, ticket_id, filename, original_name, size, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, req.params.id, f.filename, f.originalname, f.size, now);
    return { id, filename: f.filename, originalName: f.originalname, size: f.size };
  });
  // Broadcast updated ticket so all clients see the new attachments immediately
  const updatedWithFiles = buildTicket(db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id) as Record<string, unknown>);
  broadcastAll('ticket:updated', updatedWithFiles);
  res.status(201).json(saved);
});

// DELETE all tickets — IT Manager only
router.delete('/all', requireAuth, requireManager, (_req, res) => {
  db.prepare('DELETE FROM ticket_attachments').run();
  db.prepare('DELETE FROM ticket_timeline').run();
  db.prepare('DELETE FROM comments').run();
  db.prepare('DELETE FROM tickets').run();
  broadcastAll('tickets:cleared', {});
  res.json({ ok: true });
});

export default router;
