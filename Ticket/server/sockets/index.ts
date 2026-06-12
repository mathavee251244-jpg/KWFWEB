import type { Server } from 'socket.io';
import db from '../db/database.js';
import { setOnline, setOffline } from '../lib/onlineState.js';

interface SocketUser {
  userId: string;
  userName: string;
  userRole: string;
}

export function setupSockets(io: Server) {
  // Auth middleware — validate session token
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error('No token'));

    const session = db.prepare(`
      SELECT s.user_id AS userId, u.name AS userName, u.role AS userRole
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ?
    `).get(token) as SocketUser | undefined;

    if (!session) return next(new Error('Invalid token'));

    socket.data = session;
    next();
  });

  io.on('connection', (socket) => {
    const { userId, userName } = socket.data as SocketUser;

    // Personal notification room
    socket.join(`user:${userId}`);
    setOnline(userId);
    io.emit('user:online', { userId, online: true });

    // Auto-join all chat rooms this user is a member of
    const userRooms = db.prepare('SELECT room_id FROM chat_room_members WHERE user_id = ?').all(userId) as { room_id: string }[];
    for (const { room_id } of userRooms) {
      socket.join(`room:${room_id}`);
    }

    // ── Chat events ──────────────────────────────────────────

    socket.on('chat:join', (roomId: string) => {
      const member = db.prepare(
        'SELECT 1 FROM chat_room_members WHERE room_id = ? AND user_id = ?'
      ).get(roomId, userId);
      if (member) socket.join(`room:${roomId}`);
    });

    socket.on('chat:leave', (roomId: string) => {
      socket.leave(`room:${roomId}`);
    });

    socket.on('chat:message', (data: { roomId: string; content: string; type?: string; fileUrl?: string; fileName?: string }) => {
      const { roomId, content, type = 'text', fileUrl, fileName } = data;
      if (!content?.trim() && !fileUrl?.trim()) return;

      const member = db.prepare(
        'SELECT 1 FROM chat_room_members WHERE room_id = ? AND user_id = ?'
      ).get(roomId, userId);
      if (!member) return;

      const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const safeContent = content?.trim() || fileName || '';

      db.prepare(
        'INSERT INTO chat_messages (id, room_id, sender_id, content, type, file_url, file_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(id, roomId, userId, safeContent, type, fileUrl ?? null, fileName ?? null, now);

      db.prepare('UPDATE chat_rooms SET updated_at = ? WHERE id = ?').run(now, roomId);

      const roomRow = db.prepare('SELECT type FROM chat_rooms WHERE id = ?').get(roomId) as { type: string } | undefined;
      const roomType = roomRow?.type ?? 'direct';

      io.to(`room:${roomId}`).emit('chat:message', {
        id, roomId, senderId: userId, senderName: userName,
        content: safeContent, type, roomType,
        fileUrl: fileUrl ?? undefined, fileName: fileName ?? undefined,
        createdAt: now,
      });
    });

    socket.on('chat:typing', (data: { roomId: string; typing: boolean }) => {
      socket.to(`room:${data.roomId}`).emit('chat:typing', {
        roomId: data.roomId, userId, userName, typing: data.typing,
      });
    });

    socket.on('disconnect', () => {
      setOffline(userId);
      io.emit('user:online', { userId, online: false });
    });
  });
}
