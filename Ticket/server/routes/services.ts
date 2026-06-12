import { Router } from 'express';
import db from '../db/database.js';
import { requireAuth, requireIT } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, (_req, res) => {
  const services = db.prepare('SELECT id, name, name_en as nameEn, status, last_checked as lastChecked, uptime_percent as uptimePercent, description FROM services ORDER BY id').all();
  res.json(services);
});

router.patch('/:id/status', requireAuth, requireIT, (req, res) => {
  const { status } = req.body as { status: string };
  const now = new Date().toISOString();
  db.prepare('UPDATE services SET status = ?, last_checked = ? WHERE id = ?').run(status, now, req.params.id);
  res.json(db.prepare('SELECT id, name, name_en as nameEn, status, last_checked as lastChecked, uptime_percent as uptimePercent, description FROM services WHERE id = ?').get(req.params.id));
});

type IncRow = { id: string; title: string; description: string; affected_services: string; status: string; severity: string; created_at: string; updated_at: string; resolved_at: string | null; created_by: string };
const toInc = (r: IncRow) => ({ id: r.id, title: r.title, description: r.description, affectedServices: JSON.parse(r.affected_services ?? '[]'), status: r.status, severity: r.severity, createdAt: r.created_at, updatedAt: r.updated_at, resolvedAt: r.resolved_at ?? undefined, createdBy: r.created_by });

router.get('/incidents', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM incidents ORDER BY created_at DESC').all() as IncRow[];
  res.json(rows.map(toInc));
});

router.post('/incidents', requireAuth, requireIT, (req, res) => {
  const { title, description, severity, affectedServices } = req.body as Record<string, unknown>;
  const now = new Date().toISOString();
  const id = `INC-${String(Date.now()).slice(-6)}`;
  db.prepare(`
    INSERT INTO incidents (id, title, description, affected_services, status, severity, created_at, updated_at, created_by)
    VALUES (?, ?, ?, ?, 'investigating', ?, ?, ?, ?)
  `).run(id, title, description, JSON.stringify(affectedServices ?? []), severity ?? 'medium', now, now, (req as unknown as { userName: string }).userName);
  res.status(201).json(toInc(db.prepare('SELECT * FROM incidents WHERE id = ?').get(id) as IncRow));
});

router.patch('/incidents/:id/status', requireAuth, requireIT, (req, res) => {
  const { status } = req.body as { status: string };
  const now = new Date().toISOString();
  const resolvedAt = status === 'resolved' ? now : null;
  db.prepare('UPDATE incidents SET status = ?, updated_at = ?, resolved_at = ? WHERE id = ?').run(status, now, resolvedAt, req.params.id);
  res.json(toInc(db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id) as IncRow));
});

export default router;
