import { getToken } from './client';
import type { ChatRoom, ChatMessage } from '../types';

const BASE = '/api/chat';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Error');
    throw new Error(text);
  }
  return res.json() as Promise<T>;
}

export interface ChatUserItem {
  id: string;
  name: string;
  department: string;
  role: string;
  online: boolean;
  avatar?: string;
}

export const listChatUsers = () =>
  req<ChatUserItem[]>('GET', '/users');

export const listRooms = () =>
  req<ChatRoom[]>('GET', '/rooms');

export const getOrCreateDM = (targetUserId: string) =>
  req<{ id: string }>('POST', '/rooms/direct', { targetUserId });

export const createGroup = (name: string, memberIds: string[]) =>
  req<{ id: string; name: string }>('POST', '/rooms/group', { name, memberIds });

export const getMessages = (roomId: string, before?: string) =>
  req<ChatMessage[]>('GET', `/rooms/${roomId}/messages${before ? `?before=${before}` : ''}`);

export const markRoomRead = (roomId: string) =>
  req<{ ok: boolean }>('POST', `/rooms/${roomId}/read`);

export async function uploadChatFile(file: File): Promise<{ url: string; fileName: string; type: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/chat/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Upload failed'));
  return res.json() as Promise<{ url: string; fileName: string; type: string }>;
}
