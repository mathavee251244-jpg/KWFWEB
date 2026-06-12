import { Router } from 'express';
import db from '../db/database.js';
import { requireAuth, requireManager } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

type OTRow = {
  id: string; user_id: string; user_name: string; date: string;
  start_time: string; end_time: string; hours: number; description: string;
  status: string; created_at: string; submitted_at: string | null;
  approved_by: string | null; approved_at: string | null; reject_reason: string | null;
};

function toOT(r: OTRow) {
  return {
    id: r.id, userId: r.user_id, userName: r.user_name, date: r.date,
    startTime: r.start_time, endTime: r.end_time, hours: r.hours,
    description: r.description, status: r.status, createdAt: r.created_at,
    submittedAt: r.submitted_at ?? undefined, approvedBy: r.approved_by ?? undefined,
    approvedAt: r.approved_at ?? undefined, rejectReason: r.reject_reason ?? undefined,
  };
}

const router = Router();

// GET /api/ot  — employee gets own, IT gets all
router.get('/', requireAuth, (req: AuthRequest, res) => {
  let rows;
  if (req.userRole === 'employee') {
    rows = db.prepare('SELECT * FROM ot_records WHERE user_id = ? ORDER BY date DESC, created_at DESC').all(req.userId);
  } else {
    const { userId, status } = req.query as Record<string, string>;
    let sql = 'SELECT * FROM ot_records WHERE 1=1';
    const params: unknown[] = [];
    if (userId) { sql += ' AND user_id = ?'; params.push(userId); }
    if (status)  { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY date DESC, created_at DESC';
    rows = db.prepare(sql).all(...params);
  }
  res.json((rows as OTRow[]).map(toOT));
});

// POST /api/ot  — create OT record (draft)
router.post('/', requireAuth, (req: AuthRequest, res) => {
  const { date, startTime, endTime, hours, description } = req.body as Record<string, string | number>;
  if (!date || !startTime || !endTime || !hours || !description) {
    res.status(400).json({ error: 'Missing required fields' }); return;
  }
  const id = `OT-${Date.now()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO ot_records (id, user_id, user_name, date, start_time, end_time, hours, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
  `).run(id, req.userId, req.userName, date, startTime, endTime, hours, description, now);
  res.status(201).json(toOT(db.prepare('SELECT * FROM ot_records WHERE id = ?').get(id) as OTRow));
});

// DELETE /api/ot/:id
router.delete('/:id', requireAuth, (req: AuthRequest, res) => {
  const row = db.prepare('SELECT user_id, status FROM ot_records WHERE id = ?').get(req.params.id) as { user_id: string; status: string } | undefined;
  if (!row) { res.status(404).json({ error: 'Not found' }); return; }
  if (row.user_id !== req.userId && req.userRole === 'employee') {
    res.status(403).json({ error: 'Access denied' }); return;
  }
  if (row.status === 'approved') {
    res.status(400).json({ error: 'ไม่สามารถลบ OT ที่อนุมัติแล้วได้' }); return;
  }
  db.prepare('DELETE FROM ot_records WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// PATCH /api/ot/:id/submit  — draft → submitted
router.patch('/:id/submit', requireAuth, (req: AuthRequest, res) => {
  const row = db.prepare('SELECT user_id, status FROM ot_records WHERE id = ?').get(req.params.id) as { user_id: string; status: string } | undefined;
  if (!row) { res.status(404).json({ error: 'Not found' }); return; }
  if (row.user_id !== req.userId) { res.status(403).json({ error: 'Access denied' }); return; }
  if (row.status !== 'draft') { res.status(400).json({ error: 'Only draft records can be submitted' }); return; }
  const now = new Date().toISOString();
  db.prepare("UPDATE ot_records SET status = 'submitted', submitted_at = ? WHERE id = ?").run(now, req.params.id);
  res.json(toOT(db.prepare('SELECT * FROM ot_records WHERE id = ?').get(req.params.id) as OTRow));
});

// PATCH /api/ot/:id/approve  — submitted → approved  (manager)
router.patch('/:id/approve', requireAuth, requireManager, (req: AuthRequest, res) => {
  const row = db.prepare('SELECT status FROM ot_records WHERE id = ?').get(req.params.id) as { status: string } | undefined;
  if (!row) { res.status(404).json({ error: 'Not found' }); return; }
  if (row.status !== 'submitted') { res.status(400).json({ error: 'Only submitted records can be approved' }); return; }
  const now = new Date().toISOString();
  db.prepare("UPDATE ot_records SET status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?").run(req.userName, now, req.params.id);
  res.json(toOT(db.prepare('SELECT * FROM ot_records WHERE id = ?').get(req.params.id) as OTRow));
});

// PATCH /api/ot/:id/reject  — submitted → rejected  (manager)
router.patch('/:id/reject', requireAuth, requireManager, (req: AuthRequest, res) => {
  const { reason } = req.body as { reason?: string };
  const row = db.prepare('SELECT status FROM ot_records WHERE id = ?').get(req.params.id) as { status: string } | undefined;
  if (!row) { res.status(404).json({ error: 'Not found' }); return; }
  if (row.status !== 'submitted') { res.status(400).json({ error: 'Only submitted records can be rejected' }); return; }
  const now = new Date().toISOString();
  db.prepare("UPDATE ot_records SET status = 'rejected', approved_by = ?, approved_at = ?, reject_reason = ? WHERE id = ?").run(req.userName, now, reason ?? '', req.params.id);
  res.json(toOT(db.prepare('SELECT * FROM ot_records WHERE id = ?').get(req.params.id) as OTRow));
});

export default router;
