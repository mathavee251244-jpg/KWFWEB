import { Router } from 'express';
import https from 'https';
import http from 'http';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const NAS_URL  = (process.env.NAS_URL  ?? '').replace(/\/$/, '');
const NAS_USER = process.env.NAS_USER ?? '';
const NAS_PASS = process.env.NAS_PASS ?? '';

let sessionCache: { sid: string; expires: number } | null = null;
let storageCache: { data: unknown; expires: number } | null = null;

// Low-level HTTP/HTTPS fetch — bypasses self-signed cert on LAN NAS
function fetchNAS(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { rejectUnauthorized: false }, (res) => {
      let raw = '';
      res.on('data', (chunk: string) => { raw += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error('NAS returned non-JSON response')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10_000, () => { req.destroy(); reject(new Error('NAS connection timeout')); });
  });
}

interface SynoAuth { success: boolean; data?: { sid: string }; error?: { code: number } }

async function getSession(): Promise<string> {
  if (sessionCache && sessionCache.expires > Date.now()) return sessionCache.sid;
  const url = `${NAS_URL}/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=login` +
    `&account=${encodeURIComponent(NAS_USER)}&passwd=${encodeURIComponent(NAS_PASS)}` +
    `&session=helpdesk&format=sid`;
  const data = await fetchNAS(url) as SynoAuth;
  if (!data.success || !data.data?.sid) {
    throw new Error(`NAS login failed (error code: ${data.error?.code ?? 'unknown'})`);
  }
  sessionCache = { sid: data.data.sid, expires: Date.now() + 3_600_000 };
  return sessionCache.sid;
}

interface SynoStorage {
  success: boolean;
  data?: {
    volumes?: NASVolume[];
    disks?: NASDisk[];
    env?: { cmd_smarttest_enabled: boolean };
  };
  error?: { code: number };
}

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

async function queryStorage(): Promise<SynoStorage['data']> {
  const sid = await getSession();
  const url = `${NAS_URL}/webapi/entry.cgi?api=SYNO.Storage.CGI.Storage&version=1&method=load_info&_sid=${sid}`;
  const d = await fetchNAS(url) as SynoStorage;
  if (!d.success) {
    // Try once more with a fresh session
    sessionCache = null;
    const sid2 = await getSession();
    const url2 = `${NAS_URL}/webapi/entry.cgi?api=SYNO.Storage.CGI.Storage&version=1&method=load_info&_sid=${sid2}`;
    const d2 = await fetchNAS(url2) as SynoStorage;
    if (!d2.success) throw new Error(`NAS storage query failed (code: ${d2.error?.code ?? 'unknown'})`);
    return d2.data;
  }
  return d.data;
}

// GET /api/nas/storage
router.get('/storage', requireAuth, async (_req, res) => {
  if (!NAS_URL || !NAS_USER || !NAS_PASS) {
    res.json({ configured: false }); return;
  }

  if (storageCache && storageCache.expires > Date.now()) {
    res.json({ configured: true, ok: true, ...(storageCache.data as object) }); return;
  }

  try {
    const data = await queryStorage();
    storageCache = { data, expires: Date.now() + 60_000 };
    res.json({ configured: true, ok: true, ...data });
  } catch (err) {
    sessionCache = null;
    storageCache = null;
    res.status(500).json({
      configured: true,
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to connect to NAS',
    });
  }
});

export default router;
