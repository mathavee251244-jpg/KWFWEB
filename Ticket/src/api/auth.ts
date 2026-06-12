import { api, setToken, clearToken } from './client';
import type { User } from '../types';

interface LoginResponse { token: string; user: User }

export async function login(userId: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/auth/login', { userId, password });
  setToken(res.token);
  localStorage.setItem('helpdesk_user', JSON.stringify(res.user));
  return res;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout', {}).catch(() => {});
  clearToken();
}

export async function getMe(): Promise<User> {
  return api.get<User>('/auth/me');
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.patch('/auth/password', { currentPassword, newPassword });
}
