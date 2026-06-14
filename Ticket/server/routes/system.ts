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
      // PowerShell Get-Volume — works on Windows 10/11 (wmic is deprecated)
      try {
        // Use single-quoted string to avoid JS template interpolation of $_ variables
        const ps = 'Get-Volume | Where-Object {$_.DriveLetter -ne $null -and $_.Size -gt 0} | ForEach-Object { $_.DriveLetter + \':\' + \'|\' + $_.SizeRemaining + \'|\' + $_.Size }';
        const out = execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`, { timeout: 8_000, encoding: 'utf8' });
        const disks = out.trim().split(/\r?\n/)
          .filter(l => l.trim() && l.includes('|'))
          .map(l => {
            const parts = l.trim().split('|');
            const path  = (parts[0] ?? '').trim();
            const free  = parseInt(parts[1] ?? '', 10) || 0;
            const total = parseInt(parts[2] ?? '', 10) || 0;
            if (!path || !total) return null;
            return { path: path + '\\', total, free, used: total - free };
          })
          .filter(Boolean) as DiskInfo[];
        if (disks.length > 0) return disks;
      } catch { /* fall through to wmic */ }

      // Fallback: wmic (Windows 8/10 older builds)
      const out = execSync('wmic logicaldisk get caption,freespace,size /format:csv', { timeout: 4_000 }).toString('utf8');
      return out.split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => /^[A-Za-z]/.test(l) && l.includes(','))
        .map(l => {
          const cols = l.split(',');
          // csv columns: Node, Caption, FreeSpace, Size
          const caption = (cols[1] ?? '').trim();
          const free    = parseInt(cols[2] ?? '', 10) || 0;
          const total   = parseInt(cols[3] ?? '', 10) || 0;
          if (!caption || !total) return null;
          return { path: caption, total, free, used: total - free };
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
