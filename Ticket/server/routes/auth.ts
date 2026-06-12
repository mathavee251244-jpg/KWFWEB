import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db/database.js';
import type { AuthRequest } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { userId, password } = req.body as { userId: string; password: string };
  if (!userId || !password) {
    res.status(400).json({ error: 'userId and password required' });
    return;
  }
  const user = db.prepare('SELECT id, name, department, email, role, status, password, avatar FROM users WHERE id = ?').get(userId) as {
    id: string; name: string; department: string; email: string;
    role: string; status: string; password: string; avatar: string | null;
  } | undefined;

  if (!user || user.password !== password) {
    res.status(401).json({ error: 'รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง' });
    return;
  }
  if (user.status === 'inactive') {
    res.status(403).json({ error: 'บัญชีนี้ถูกระงับการใช้งาน' });
    return;
  }

  const token = randomUUID();
  db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(token, user.id, new Date().toISOString());

  const { password: _pw, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.post('/logout', requireAuth, (req: AuthRequest, res) => {
  const token = req.headers.authorization?.slice(7);
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  const user = db.prepare('SELECT id, name, department, email, role, status, avatar FROM users WHERE id = ?').get(req.userId);
  res.json(user);
});

router.patch('/password', requireAuth, (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.userId) as { password: string } | undefined;
  if (!user || user.password !== currentPassword) {
    res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    return;
  }
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
    return;
  }
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPassword, req.userId);
  res.json({ ok: true });
});

export default router;
