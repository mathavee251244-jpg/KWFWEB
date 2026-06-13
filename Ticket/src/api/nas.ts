import { api } from './client';

export interface NASVolume {
  volume_path: string;
  display_name: string;
  total_size: string;
  used_size: string;
  avail_size: string;
  status: string;
  fs_type: string;
}

export interface NASDisk {
  id: string;
  name: string;
  model: string;
  status: string;
  size_total: string;
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
