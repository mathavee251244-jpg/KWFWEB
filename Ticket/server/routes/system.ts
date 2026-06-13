import { Router } from 'express';
import os from 'os';
import { execSync } from 'child_process';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── CPU usage (rolling average via background interval) ───────────────────────
interface CpuSnap { total: number; idle: number; }

function snap(): CpuSnap[] {
  return os.cpus().map(c => {
    const t = c.times;
    return { total: t.user + t.nice + t.sys + t.idle + t.irq, idle: t.idle };
  });
}

let prevSnap = snap();
let cpuUsage = 0;

setInterval(() => {
  const curr = snap();
  let totalDelta = 0, idleDelta = 0;
  for (let i = 0; i < Math.min(prevSnap.length, curr.length); i++) {
    totalDelta += curr[i].total - prevSnap[i].total;
    idleDelta  += curr[i].idle  - prevSnap[i].idle;
  }
  if (totalDelta > 0) cpuUsage = Math.round((1 - idleDelta / totalDelta) * 100);
  prevSnap = curr;
}, 2_000);

// ── Disk info ─────────────────────────────────────────────────────────────────
interface DiskInfo { path: string; total: number; used: number; free: number; }

function getDisks(): DiskInfo[] {
  try {
    if (process.platform === 'win32') {
      const out = execSync('wmic logicaldisk get caption,freespace,size /format:csv', { timeout: 4_000 }).toString();
      return out.split('\n')
        .map(l => l.trim())
        .filter(l => /^[A-Z]/.test(l)) // lines starting with hostname
        .map(l => {
          const [, caption, freeStr, sizeStr] = l.split(',');
          const total = parseInt(sizeStr, 10) || 0;
          const free  = parseInt(freeStr, 10) || 0;
          if (!caption || !total) return null;
          return { path: caption.trim(), total, free, used: total - free };
        })
        .filter(Boolean) as DiskInfo[];
    } else {
      const out = execSync("df -B1 | awk 'NR>1 && $1!~/tmpfs|udev|overlay/ {print $6,$2,$3,$4}'", { timeout: 4_000 }).toString();
      return out.trim().split('\n')
        .filter(Boolean)
        .map(l => {
          const [path, total, used, free] = l.trim().split(/\s+/);
          return { path, total: parseInt(total, 10) || 0, used: parseInt(used, 10) || 0, free: parseInt(free, 10) || 0 };
        })
        .filter(d => d.total > 0)
        .slice(0, 4);
    }
  } catch { return []; }
}

// ── Endpoint ──────────────────────────────────────────────────────────────────
let cache: { data: unknown; exp: number } | null = null;

router.get('/resources', requireAuth, (_req, res) => {
  if (cache && cache.exp > Date.now()) { res.json(cache.data); return; }

  const cpus   = os.cpus();
  const total  = os.totalmem();
  const free   = os.freemem();

  const data = {
    cpu:      { model: cpus[0]?.model?.replace(/\s+/g, ' ').trim() ?? 'Unknown', cores: cpus.length, usage: cpuUsage },
    memory:   { total, free, used: total - free },
    disks:    getDisks(),
    uptime:   os.uptime(),
    hostname: os.hostname(),
    platform: process.platform,
  };

  cache = { data, exp: Date.now() + 5_000 };
  res.json(data);
});

export default router;
