import { api } from './client';

export interface NASVolume {
  path: string; name: string;
  total: number; used: number; free: number;
  status: string; fsType: string; raidType: string;
}
export interface NASDisk {
  id: string; name: string; model: string;
  status: string; temp: number;
  slot: number; size: number; type: string; serial: string;
}
export interface NASDevice {
  index: number;
  name: string;
  ok: boolean;
  volumes: NASVolume[];
  disks: NASDisk[];
  error?: string;
}

export async function getNASStorage(): Promise<NASDevice[]> {
  const result = await api.get<{ devices: NASDevice[] }>('/nas/storage');
  return result.devices ?? [];
}

export interface NASResource {
  index: number; name: string; ok: boolean;
  cpu?: number;
  memory?: { total: number; used: number; free: number };
  error?: string;
}

export async function getNASResources(): Promise<NASResource[]> {
  const result = await api.get<{ devices: NASResource[] }>('/nas/resources');
  return result.devices ?? [];
}
