import { getToken } from './client';

const BASE = '/api/docs';

async function req<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error'));
  return res.json() as Promise<T>;
}

export interface DocFile {
  name: string;
  title: string;
  size: number;
}

export const listDocs = () => req<DocFile[]>('/');
export const getDoc = (name: string) =>
  req<{ name: string; content: string }>(`/${encodeURIComponent(name)}`);
