import { api } from './client';
import type { OTRecord } from '../types';

export interface CreateOTPayload {
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  description: string;
}

export async function listMyOT(): Promise<OTRecord[]> {
  return api.get<OTRecord[]>('/ot');
}

export async function listAllOT(filters?: { userId?: string; status?: string }): Promise<OTRecord[]> {
  const params = new URLSearchParams();
  if (filters?.userId) params.set('userId', filters.userId);
  if (filters?.status)  params.set('status', filters.status);
  const qs = params.toString();
  return api.get<OTRecord[]>(`/ot${qs ? `?${qs}` : ''}`);
}

export async function createOT(data: CreateOTPayload): Promise<OTRecord> {
  return api.post<OTRecord>('/ot', data);
}

export async function deleteOT(id: string): Promise<void> {
  await api.delete(`/ot/${id}`);
}

export async function submitOT(id: string): Promise<OTRecord> {
  return api.patch<OTRecord>(`/ot/${id}/submit`, {});
}

export async function approveOT(id: string): Promise<OTRecord> {
  return api.patch<OTRecord>(`/ot/${id}/approve`, {});
}

export async function rejectOT(id: string, reason?: string): Promise<OTRecord> {
  return api.patch<OTRecord>(`/ot/${id}/reject`, { reason });
}
