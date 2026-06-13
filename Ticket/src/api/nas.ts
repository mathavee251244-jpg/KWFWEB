import { api } from './client';

export interface NASVolume {
  path: string;
  name: string;
  total: number;    // bytes
  used: number;     // bytes
  free: number;     // bytes
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
