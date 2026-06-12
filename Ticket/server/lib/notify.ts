import type { Server } from 'socket.io';

let _io: Server | null = null;

export function setIO(io: Server) {
  _io = io;
}

export function notifyUser(userId: string, event: string, data: unknown) {
  _io?.to(`user:${userId}`).emit(event, data);
}

export function broadcastAll(event: string, data: unknown) {
  _io?.emit(event, data);
}

export function getIO() { return _io; }
