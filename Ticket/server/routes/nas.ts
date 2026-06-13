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

// Raw Synology DSM API shapes (may vary by DSM version)
interface RawSynoVolume {
  vol_path?: string;
  id?: string;
  vol_desc?: string;
  status?: string;
  summary_status?: string;
  fs_type?: string;
  raid_type?: string;
  size?: { total?: string | number; used?: string | number };
  // older DSM flat fields
  total_size?: string | number;
  used_size?: string | number;
  volume_path?: string;
  display_name?: string;
}
interface RawSynoDisk {
  id?: string;
  name?: string;
  model?: string;
  longName?: string;
  status?: string;
  temp?: number;
  size_total?: string | number;
  serial?: string;
  serial_number?: string;
  firm?: string;
  type?: string;   // 'disk', 'ssd', 'nvme', 'esata', 'usb'
  num?: number;    // bay slot number (if provided by DSM)
}
interface SynoStorage {
  success: boolean;
  data?: { volumes?: RawSynoVolume[]; disks?: RawSynoDisk[]; };
  error?: { code: number };
}

// Normalized shape sent to frontend (DSM-version agnostic)
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
  slot: number;    // bay number (1-based)
  size: number;    // bytes
  type: string;    // 'hdd' | 'ssd' | 'nvme' | 'usb'
  serial: string;
}

function normalizeVolume(v: RawSynoVolume): NASVolume {
  const path  = v.vol_path ?? v.volume_path ?? '';
  const name  = v.vol_desc ?? v.id ?? path;
  const total = Number(v.size?.total ?? v.total_size ?? 0);
  const used  = Number(v.size?.used  ?? v.used_size  ?? 0);
  return {
    path,
    name: name || path,
    total,
    used,
    free: total - used,
    status:   v.status ?? v.summary_status ?? 'unknown',
    fsType:   v.fs_type   ?? '',
    raidType: v.raid_type ?? '',
  };
}
function normalizeDisk(d: RawSynoDisk): NASDisk {
  const id = d.id ?? '';
  // Extract slot number: "sata1" → 1, "nvme2" → 2
  const slotMatch = id.match(/(\d+)$/);
  const slot = d.num ?? (slotMatch ? parseInt(slotMatch[1], 10) : 0);
  // Infer drive type from id or type field
  let type = 'hdd';
  const rawType = (d.type ?? '').toLowerCase();
  if (rawType === 'ssd' || rawType.includes('ssd'))    type = 'ssd';
  else if (id.includes('nvme') || rawType === 'nvme')  type = 'nvme';
  else if (id.includes('usb')  || rawType === 'usb')   type = 'usb';
  return {
    id,
    name:   d.name   ?? '',
    model:  d.model  ?? d.longName ?? '',
    status: d.status ?? 'unknown',
    temp:   d.temp   ?? 0,
    slot,
    size:   Number(d.size_total ?? 0),
    type,
    serial: d.serial ?? d.serial_number ?? '',
  };
}

async function queryStorage(): Promise<{ volumes: NASVolume[]; disks: NASDisk[] }> {
  const sid = await getSession();
  const url = `${NAS_URL}/webapi/entry.cgi?api=SYNO.Storage.CGI.Storage&version=1&method=load_info&_sid=${sid}`;
  let d = await fetchNAS(url) as SynoStorage;
  if (!d.success) {
    sessionCache = null;
    const sid2 = await getSession();
    const url2 = `${NAS_URL}/webapi/entry.cgi?api=SYNO.Storage.CGI.Storage&version=1&method=load_info&_sid=${sid2}`;
    d = await fetchNAS(url2) as SynoStorage;
    if (!d.success) throw new Error(`NAS storage query failed (code: ${d.error?.code ?? 'unknown'})`);
  }
  return {
    volumes: (d.data?.volumes ?? []).map(normalizeVolume),
    disks:   (d.data?.disks   ?? []).map(normalizeDisk),
  };
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
    const { volumes, disks } = await queryStorage();
    const payload = { volumes, disks };
    storageCache = { data: payload, expires: Date.now() + 60_000 };
    res.json({ configured: true, ok: true, ...payload });
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
