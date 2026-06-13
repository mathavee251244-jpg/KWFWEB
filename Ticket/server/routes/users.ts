import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from '../db/database.js';
import { requireAuth, requireIT, requireManager } from '../middleware/auth.js';
import { broadcastAll } from '../lib/notify.js';
import type { AuthRequest } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AVATAR_DIR = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req: AuthRequest, _file, cb) => cb(null, `avatar-${req.params.id}-${Date.now()}.jpg`),
});
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'));
  },
});

const router = Router();

router.post('/', requireAuth, requireManager, (req, res) => {
  const { id, name, department, email, role = 'employee', password = 'Com@1234' } = req.body as {
    id: string; name: string; department: string; email: string; role?: string; password?: string;
  };
  if (!id || !name || !department || !email) {
    res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' }); return;
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(id)) {
    res.status(400).json({ error: 'Username ใช้ได้เฉพาะ a-z, 0-9, . _ -' }); return;
  }
  if (db.prepare('SELECT id FROM users WHERE id = ?').get(id)) {
    res.status(409).json({ error: 'Username นี้มีอยู่แล้ว' }); return;
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    res.status(409).json({ error: 'อีเมลนี้มีอยู่แล้ว' }); return;
  }
  db.prepare('INSERT INTO users (id, name, department, email, role, status, password) VALUES (?,?,?,?,?,?,?)')
    .run(id, name, department, email, role, 'active', password);
  const user = db.prepare('SELECT id, name, department, email, role, status, avatar FROM users WHERE id = ?').get(id);
  res.status(201).json(user);
});

router.get('/', requireAuth, requireIT, (_req, res) => {
  const users = db.prepare('SELECT id, name, department, email, role, status, avatar FROM users ORDER BY department, name').all();
  res.json(users);
});

router.get('/:id', requireAuth, (req: AuthRequest, res) => {
  if (req.userRole === 'employee' && req.params.id !== req.userId) {
    res.status(403).json({ error: 'Access denied' }); return;
  }
  const user = db.prepare('SELECT id, name, department, email, role, status, avatar FROM users WHERE id = ?').get(req.params.id);
  if (!user) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(user);
});

router.patch('/:id/role', requireAuth, requireManager, (req, res) => {
  const { role } = req.body as { role: string };
  if (!['employee', 'it_staff', 'it_manager'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' }); return;
  }
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ ok: true });
});

router.patch('/:id/status', requireAuth, requireManager, (req, res) => {
  const { status } = req.body as { status: string };
  if (!['active', 'inactive'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' }); return;
  }
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

// User changes their own password (requires current password verification)
router.patch('/me/password', requireAuth, (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่' }); return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' }); return;
  }
  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.userId) as { password: string } | undefined;
  if (!user || user.password !== currentPassword) {
    res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }); return;
  }
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, req.userId);
  res.json({ ok: true });
});

// IT manager sets a user's password directly
router.patch('/:id/password', requireAuth, requireManager, (req, res) => {
  const { password } = req.body as { password: string };
  if (!password || password.length < 6) {
    res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }); return;
  }
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(password, req.params.id);
  res.json({ ok: true });
});

router.patch('/:id/avatar', requireAuth, uploadAvatar.single('avatar'), (req: AuthRequest, res) => {
  if (req.userId !== req.params.id && req.userRole !== 'it_manager') {
    res.status(403).json({ error: 'Access denied' }); return;
  }
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const url = `/uploads/avatars/${req.file.filename}`;
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(url, req.params.id);
  broadcastAll('user:avatar', { userId: req.params.id, avatar: url });
  res.json({ avatar: url });
});

export default router;
