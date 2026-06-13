import { api } from './client';

export interface NASVolume {
  path: string;
  name: string;
  total: number;
  used: number;
  free: number;
  status: string;
  fsType: string;
  raidType: string;
}

export interface NASDisk {
  id: string;
  name: string;
  model: string;
  status: string;
  temp: number;
  slot: number;
  size: number;
  type: string;
  serial: string;
}

export interface NASStorageResult {
  configured: boolean;
  ok?: boolean;
  volumes?: NASVolume[];
  disks?: NASDisk[];
  error?: string;
}

export async function getNASStorage(): Promise<NASStorageResult> {
  return api.get<NASStorageResult>('/nas/storage');
}
