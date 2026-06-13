import { api } from './client';
import type { Ticket, TicketStatus, TicketCategory, TicketPriority, Comment } from '../types';

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  search?: string;
  assigneeId?: string;
}

export async function listTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  const qs = params.toString();
  return api.get<Ticket[]>(`/tickets${qs ? `?${qs}` : ''}`);
}

export async function getTicket(id: string): Promise<Ticket> {
  return api.get<Ticket>(`/tickets/${id}`);
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  requesterName?: string;
  department?: string;
  email?: string;
}

export async function createTicket(data: CreateTicketPayload): Promise<Ticket> {
  return api.post<Ticket>('/tickets', data);
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<Ticket> {
  return api.patch<Ticket>(`/tickets/${id}/status`, { status });
}

export async function assignTicket(id: string, assigneeId: string, assigneeName: string): Promise<Ticket> {
  return api.patch<Ticket>(`/tickets/${id}/assign`, { assigneeId, assigneeName });
}

export async function addComment(id: string, message: string, isInternal: boolean): Promise<Comment> {
  return api.post<Comment>(`/tickets/${id}/comments`, { message, isInternal });
}

export async function uploadFiles(id: string, files: File[]): Promise<{ id: string; filename: string; originalName: string }[]> {
  const form = new FormData();
  files.forEach(f => form.append('files', f));
  const res = await fetch(`/api/tickets/${id}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('helpdesk_token') ?? ''}` },
    body: form,
  });
  if (!res.ok) throw new Error('File upload failed');
  return res.json();
}

export async function clearAllTickets(): Promise<void> {
  await api.delete<{ ok: boolean }>('/tickets/all');
}

export async function clearOpenTickets(): Promise<number> {
  const r = await api.delete<{ ok: boolean; deleted: number }>('/tickets/open');
  return r.deleted;
}
