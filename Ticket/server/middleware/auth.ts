import type { Request, Response, NextFunction } from 'express';
import db from '../db/database.js';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  userName?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.slice(7);
  const session = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token) as { user_id: string } | undefined;
  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }
  const user = db.prepare('SELECT id, role, name FROM users WHERE id = ?').get(session.user_id) as { id: string; role: string; name: string } | undefined;
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }
  req.userId = user.id;
  req.userRole = user.role;
  req.userName = user.name;
  next();
}

export function requireIT(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'it_staff' && req.userRole !== 'it_manager') {
    res.status(403).json({ error: 'IT staff only' });
    return;
  }
  next();
}

export function requireManager(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'it_manager') {
    res.status(403).json({ error: 'IT manager only' });
    return;
  }
  next();
}
