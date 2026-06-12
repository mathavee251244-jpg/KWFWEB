import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth.js';

const DOCS_DIR = process.env.DOCS_PATH ??
  'C:\\Users\\ESC\\OneDrive\\เดสก์ท็อป\\MD';

const router = Router();

// GET /api/docs
router.get('/', requireAuth, (_req, res) => {
  try {
    if (!fs.existsSync(DOCS_DIR)) {
      res.json([]);
      return;
    }
    const files = fs.readdirSync(DOCS_DIR)
      .filter(f => f.endsWith('.md'))
      .sort()
      .map(f => ({
        name: f,
        title: f.replace(/\.md$/, '').replace(/_/g, ' '),
        size: fs.statSync(path.join(DOCS_DIR, f)).size,
      }));
    res.json(files);
  } catch {
    res.json([]);
  }
});

// GET /api/docs/:name
router.get('/:name', requireAuth, (req, res) => {
  const name = Array.isArray(req.params.name) ? req.params.name[0] : req.params.name;
  if (!name.endsWith('.md') || name.includes('..') || name.includes('/') || name.includes('\\')) {
    res.status(400).json({ error: 'Invalid file name' });
    return;
  }
  const filePath = path.join(DOCS_DIR, name);
  try {
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ name, content });
  } catch {
    res.status(500).json({ error: 'Failed to read file' });
  }
});

export default router;
