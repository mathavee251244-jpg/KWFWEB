import { Router } from 'express';
import https from 'https';
import http from 'http';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

interface NASConfig { index: number; url: string; user: string; pass: string; }

// Support NAS1_URL…NAS4_URL, fallback: NAS_URL = NAS 1
const NAS_CONFIGS: NASConfig[] = [1, 2, 3, 4].map(i => ({
  index: i,
  url:  (process.env[`NAS${i}_URL`]  ?? (i === 1 ? process.env.NAS_URL  ?? '' : '')).replace(/\/$/, ''),
  user: process.env[`NAS${i}_USER`] ?? (i === 1 ? process.env.NAS_USER ?? '' : ''),
  pass: process.env[`NAS${i}_PASS`] ?? (i === 1 ? process.env.NAS_PASS ?? '' : ''),
})).filter(c => c.url && c.user && c.pass);

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

// Separate session + storage cache per NAS index
const sessionCaches = new Map<number, { sid: string; expires: number }>();
const storageCaches = new Map<number, { data: { volumes: NASVolume[]; disks: NASDisk[] }; expires: number }>();

async function getSession(cfg: NASConfig): Promise<string> {
  const cached = sessionCaches.get(cfg.index);
  if (cached && cached.expires > Date.now()) return cached.sid;
  const url = `${cfg.url}/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=login` +
    `&account=${encodeURIComponent(cfg.user)}&passwd=${encodeURIComponent(cfg.pass)}` +
    `&session=helpdesk&format=sid`;
  const data = await fetchNAS(url) as SynoAuth;
  if (!data.success || !data.data?.sid) {
    throw new Error(`NAS ${cfg.index} login failed (code: ${data.error?.code ?? 'unknown'})`);
  }
  sessionCaches.set(cfg.index, { sid: data.data.sid, expires: Date.now() + 3_600_000 });
  return data.data.sid;
}

// Raw Synology DSM API shapes
interface RawSynoVolume {
  vol_path?: string; id?: string; vol_desc?: string;
  status?: string; summary_status?: string;
  fs_type?: string; raid_type?: string;
  size?: { total?: string | number; used?: string | number };
  total_size?: string | number; used_size?: string | number;
  volume_path?: string; display_name?: string;
}
interface RawSynoDisk {
  id?: string; name?: string; model?: string; longName?: string;
  status?: string; temp?: number;
  size_total?: string | number;
  serial?: string; serial_number?: string;
  firm?: string; type?: string; num?: number;
}
interface SynoStorage {
  success: boolean;
  data?: { volumes?: RawSynoVolume[]; disks?: RawSynoDisk[]; };
  error?: { code: number };
}

// Normalized shapes sent to frontend
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
  index: number; name: string;
  ok: boolean;
  volumes: NASVolume[];
  disks: NASDisk[];
  error?: string;
}

function normalizeVolume(v: RawSynoVolume): NASVolume {
  const path  = v.vol_path ?? v.volume_path ?? '';
  const name  = v.vol_desc ?? v.id ?? path;
  const total = Number(v.size?.total ?? v.total_size ?? 0);
  const used  = Number(v.size?.used  ?? v.used_size  ?? 0);
  return { path, name: name || path, total, used, free: total - used,
    status: v.status ?? v.summary_status ?? 'unknown',
    fsType: v.fs_type ?? '', raidType: v.raid_type ?? '' };
}
function normalizeDisk(d: RawSynoDisk): NASDisk {
  const id = d.id ?? '';
  const slotMatch = id.match(/(\d+)$/);
  const slot = d.num ?? (slotMatch ? parseInt(slotMatch[1], 10) : 0);
  const rawType = (d.type ?? '').toLowerCase();
  const type = rawType === 'ssd' || rawType.includes('ssd') ? 'ssd'
    : id.includes('nvme') || rawType === 'nvme' ? 'nvme'
    : id.includes('usb')  || rawType === 'usb'  ? 'usb'
    : 'hdd';
  return { id, name: d.name ?? '', model: d.model ?? d.longName ?? '',
    status: d.status ?? 'unknown', temp: d.temp ?? 0,
    slot, size: Number(d.size_total ?? 0), type,
    serial: d.serial ?? d.serial_number ?? '' };
}

async function queryStorage(cfg: NASConfig): Promise<{ volumes: NASVolume[]; disks: NASDisk[] }> {
  const sid = await getSession(cfg);
  const url = `${cfg.url}/webapi/entry.cgi?api=SYNO.Storage.CGI.Storage&version=1&method=load_info&_sid=${sid}`;
  let d = await fetchNAS(url) as SynoStorage;
  if (!d.success) {
    sessionCaches.delete(cfg.index);
    const sid2 = await getSession(cfg);
    const url2 = `${cfg.url}/webapi/entry.cgi?api=SYNO.Storage.CGI.Storage&version=1&method=load_info&_sid=${sid2}`;
    d = await fetchNAS(url2) as SynoStorage;
    if (!d.success) throw new Error(`NAS ${cfg.index} storage query failed (code: ${d.error?.code ?? 'unknown'})`);
  }
  return {
    volumes: (d.data?.volumes ?? []).map(normalizeVolume),
    disks:   (d.data?.disks   ?? []).map(normalizeDisk),
  };
}

// GET /api/nas/storage  — returns { devices: NASDevice[] }
router.get('/storage', requireAuth, async (_req, res) => {
  if (NAS_CONFIGS.length === 0) { res.json({ devices: [] }); return; }

  const results = await Promise.allSettled(
    NAS_CONFIGS.map(async cfg => {
      const cached = storageCaches.get(cfg.index);
      if (cached && cached.expires > Date.now()) {
        return { index: cfg.index, name: `NAS ${cfg.index}`, ok: true, ...cached.data } as NASDevice;
      }
      const { volumes, disks } = await queryStorage(cfg);
      storageCaches.set(cfg.index, { data: { volumes, disks }, expires: Date.now() + 60_000 });
      return { index: cfg.index, name: `NAS ${cfg.index}`, ok: true, volumes, disks } as NASDevice;
    })
  );

  const devices: NASDevice[] = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    const cfg = NAS_CONFIGS[i];
    sessionCaches.delete(cfg.index); storageCaches.delete(cfg.index);
    return {
      index: cfg.index, name: `NAS ${cfg.index}`, ok: false, volumes: [], disks: [],
      error: r.reason instanceof Error ? r.reason.message : 'Failed to connect',
    };
  });

  res.json({ devices });
});

export default router;
