import { api, getToken } from './client';
import type { User, Role } from '../types';

export async function listUsers(): Promise<User[]> {
  return api.get<User[]>('/users');
}

export async function updateUserRole(id: string, role: Role): Promise<void> {
  await api.patch(`/users/${id}/role`, { role });
}

export async function updateUserStatus(id: string, status: 'active' | 'inactive'): Promise<void> {
  await api.patch(`/users/${id}/status`, { status });
}

export async function setUserPassword(id: string, password: string): Promise<void> {
  await api.patch(`/users/${id}/password`, { password });
}

export async function createUser(data: {
  id: string; name: string; department: string; email: string; role: string; password: string;
}): Promise<User> {
  return api.post<User>('/users', data);
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.patch('/users/me/password', { currentPassword, newPassword });
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const form = new FormData();
  form.append('avatar', file);
  const res = await fetch(`/api/users/${userId}/avatar`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Upload failed'));
  const data = await res.json() as { avatar: string };
  return data.avatar;
}
