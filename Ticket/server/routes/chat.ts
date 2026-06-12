import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { getOnlineUsers } from '../lib/onlineState.js';
import type { AuthRequest } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHAT_UPLOAD_DIR = path.join(__dirname, '../../uploads/chat');
if (!fs.existsSync(CHAT_UPLOAD_DIR)) fs.mkdirSync(CHAT_UPLOAD_DIR, { recursive: true });

const chatStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CHAT_UPLOAD_DIR),
  filename: (req: AuthRequest, file, cb) => {
    const ext = path.extname(file.originalname);
    const sender = (req.userId ?? 'user').replace(/[^\w.-]/g, '_');
    const ts = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    cb(null, `${sender}_${ts}${ext}`);
  },
});
const chatUpload = multer({ storage: chatStorage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();

// POST /api/chat/upload
router.post('/upload', requireAuth, chatUpload.single('file'), (req: AuthRequest, res) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const isImage = req.file.mimetype.startsWith('image/');
  res.json({
    url: `/uploads/chat/${req.file.filename}`,
    fileName: req.file.originalname,
    type: isImage ? 'image' : 'file',
  });
});

// GET /api/chat/users — list all active users (for DM creation)
router.get('/users', requireAuth, (req: AuthRequest, res) => {
  const users = db.prepare(
    "SELECT id, name, department, role, avatar FROM users WHERE status = 'active' AND id != ? ORDER BY name"
  ).all(req.userId) as Record<string, unknown>[];
  const online = new Set(getOnlineUsers());
  res.json(users.map(u => ({ ...u, online: online.has(u.id as string) })));
});

// GET /api/chat/rooms
router.get('/rooms', requireAuth, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const rows = db.prepare(`
    SELECT
      cr.id, cr.name, cr.type, cr.created_by AS createdBy,
      cr.created_at AS createdAt, cr.updated_at AS updatedAt,
      (SELECT COUNT(*) FROM chat_room_members WHERE room_id = cr.id) AS memberCount,
      (SELECT cm.content FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) AS lastMessage,
      (SELECT cm.created_at FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) AS lastMessageAt,
      (SELECT u2.name FROM chat_messages cm JOIN users u2 ON cm.sender_id = u2.id WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) AS lastMessageSender,
      (SELECT cm.sender_id FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) AS lastMessageSenderId,
      (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.id AND cm.created_at > COALESCE(crm.last_read_at, '')) AS unreadCount
    FROM chat_rooms cr
    JOIN chat_room_members crm ON crm.room_id = cr.id AND crm.user_id = ?
    ORDER BY COALESCE(cr.updated_at, cr.created_at) DESC
  `).all(userId) as Record<string, unknown>[];

  const online = new Set(getOnlineUsers());

  const result = rows.map(row => {
    if (row.type === 'direct') {
      const other = db.prepare(`
        SELECT u.id, u.name, u.department, u.avatar FROM chat_room_members crm
        JOIN users u ON crm.user_id = u.id
        WHERE crm.room_id = ? AND crm.user_id != ? LIMIT 1
      `).get(row.id, userId) as { id: string; name: string; department: string; avatar: string | null } | undefined;
      return { ...row, otherUser: other ? { ...other, online: online.has(other.id) } : null };
    }
    return row;
  });

  res.json(result);
});

// POST /api/chat/rooms/direct
router.post('/rooms/direct', requireAuth, (req: AuthRequest, res) => {
  const { targetUserId } = req.body as { targetUserId: string };
  const userId = req.userId!;

  if (!targetUserId || targetUserId === userId) {
    res.status(400).json({ error: 'Invalid target user' });
    return;
  }

  const existing = db.prepare(`
    SELECT cr.id FROM chat_rooms cr
    WHERE cr.type = 'direct'
    AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = cr.id AND user_id = ?)
    AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = cr.id AND user_id = ?)
    LIMIT 1
  `).get(userId, targetUserId) as { id: string } | undefined;

  if (existing) {
    res.json({ id: existing.id });
    return;
  }

  const now = new Date().toISOString();
  const roomId = `dm-${Date.now()}`;

  db.prepare(
    "INSERT INTO chat_rooms (id, name, type, created_by, created_at, updated_at) VALUES (?, NULL, 'direct', ?, ?, ?)"
  ).run(roomId, userId, now, now);
  db.prepare('INSERT INTO chat_room_members (room_id, user_id, joined_at) VALUES (?, ?, ?)').run(roomId, userId, now);
  db.prepare('INSERT INTO chat_room_members (room_id, user_id, joined_at) VALUES (?, ?, ?)').run(roomId, targetUserId, now);

  res.status(201).json({ id: roomId });
});

// POST /api/chat/rooms/group
router.post('/rooms/group', requireAuth, (req: AuthRequest, res) => {
  const { name, memberIds } = req.body as { name: string; memberIds: string[] };
  const userId = req.userId!;

  if (!name?.trim()) {
    res.status(400).json({ error: 'Group name required' });
    return;
  }

  const now = new Date().toISOString();
  const roomId = `grp-${Date.now()}`;

  db.prepare(
    "INSERT INTO chat_rooms (id, name, type, created_by, created_at, updated_at) VALUES (?, ?, 'group', ?, ?, ?)"
  ).run(roomId, name.trim(), userId, now, now);

  const allMembers = Array.from(new Set([userId, ...(memberIds ?? [])]));
  const ins = db.prepare('INSERT INTO chat_room_members (room_id, user_id, joined_at) VALUES (?, ?, ?)');
  for (const mid of allMembers) ins.run(roomId, mid, now);

  res.status(201).json({ id: roomId, name: name.trim() });
});

// GET /api/chat/rooms/:id/messages
router.get('/rooms/:id/messages', requireAuth, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const roomId = req.params.id;

  const member = db.prepare(
    'SELECT 1 FROM chat_room_members WHERE room_id = ? AND user_id = ?'
  ).get(roomId, userId);
  if (!member) { res.status(403).json({ error: 'Access denied' }); return; }

  const { before, limit = '60' } = req.query as Record<string, string>;
  let sql = `
    SELECT cm.id, cm.room_id AS roomId, cm.sender_id AS senderId,
           u.name AS senderName, cm.content, cm.type,
           cm.file_url AS fileUrl, cm.file_name AS fileName, cm.created_at AS createdAt
    FROM chat_messages cm
    JOIN users u ON cm.sender_id = u.id
    WHERE cm.room_id = ?
  `;
  const params: unknown[] = [roomId];

  if (before) { sql += ' AND cm.created_at < ?'; params.push(before); }
  sql += ` ORDER BY cm.created_at DESC LIMIT ${parseInt(limit)}`;

  const messages = (db.prepare(sql).all(...params) as Record<string, unknown>[]).reverse();
  res.json(messages);
});

// POST /api/chat/rooms/:id/read
router.post('/rooms/:id/read', requireAuth, (req: AuthRequest, res) => {
  const now = new Date().toISOString();
  db.prepare(
    'UPDATE chat_room_members SET last_read_at = ? WHERE room_id = ? AND user_id = ?'
  ).run(now, req.params.id, req.userId);
  res.json({ ok: true });
});

export default router;
