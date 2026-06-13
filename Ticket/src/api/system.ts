import { api } from './client';

export interface SystemResources {
  cpu:      { model: string; cores: number; usage: number };
  memory:   { total: number; free: number; used: number };
  disks:    { path: string; total: number; used: number; free: number }[];
  uptime:   number;
  hostname: string;
  platform: string;
}

export async function getSystemResources(): Promise<SystemResources> {
  return api.get<SystemResources>('/system/resources');
}
