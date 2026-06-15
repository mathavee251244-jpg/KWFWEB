import { Router } from 'express';
import { requireAuth, requireIT } from '../middleware/auth.js';

const router = Router();

const SM_URL  = 'https://mailstd-01.zth.netdesignhost.com';
const SM_USER = process.env.SMARTERMAIL_USER ?? 'admin@bangkokseafood.co.th';
const SM_PASS = process.env.SMARTERMAIL_PASS ?? 'Com@1234';
const DOMAIN  = 'bangkokseafood.co.th';

// ── Token cache ───────────────────────────────────────────────────────────────
let tokenCache: { token: string; exp: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;
  const res  = await fetch(`${SM_URL}/api/v1/auth/authenticate-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: SM_USER, password: SM_PASS }),
  });
  const data = await res.json() as { accessToken: string; accessTokenExpiration: string };
  tokenCache = { token: data.accessToken, exp: new Date(data.accessTokenExpiration).getTime() };
  return data.accessToken;
}

async function smGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${SM_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`SmarterMail ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function smPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${SM_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`SmarterMail ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// ── Response caches ───────────────────────────────────────────────────────────
let connectionsCache: { data: unknown; exp: number } | null = null;
let summaryCache:     { data: unknown; exp: number } | null = null;

// ── GET /api/smartermail/connections ─────────────────────────────────────────
router.get('/connections', requireAuth, requireIT, async (_req, res) => {
  try {
    if (connectionsCache && connectionsCache.exp > Date.now()) { res.json(connectionsCache.data); return; }
    const data = await smPost('/api/v1/settings/domain/users-connections-counts', { domain: DOMAIN });
    connectionsCache = { data, exp: Date.now() + 15_000 };
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// ── GET /api/smartermail/summary ──────────────────────────────────────────────
router.get('/summary', requireAuth, requireIT, async (_req, res) => {
  try {
    if (summaryCache && summaryCache.exp > Date.now()) { res.json(summaryCache.data); return; }

    const now   = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fmt   = (d: Date) => d.toISOString().slice(0, 10);

    const [summaryResult, diskResult] = await Promise.allSettled([
      smPost<{ jsonString: string }>('/api/v1/report/summary/domain', {
        domain: DOMAIN, startDate: fmt(start), endDate: fmt(now),
      }),
      smGet<{ used: number; mailboxUsed: number; fileStorageUsed: number; allowed: number }>(
        '/api/v1/report/disk-usage/'
      ),
    ]);

    if (summaryResult.status === 'rejected') {
      throw new Error(`Summary API: ${summaryResult.reason}`);
    }

    const rawSummary = summaryResult.value;
    const diskUsage  = diskResult.status === 'fulfilled'
      ? diskResult.value
      : { used: 0, mailboxUsed: 0, fileStorageUsed: 0, allowed: 0 };

    if (!rawSummary.jsonString) {
      throw new Error(`Summary API returned no jsonString. Keys: ${Object.keys(rawSummary).join(', ')}`);
    }

    type AnyCard = {
      cardTitle: string;
      cardData?: { value: number };
      cardContents?: unknown[];
    };
    type BarItem = { name: string; value: string | number; type?: string; suffix?: string };
    type FlatContent = { data?: BarItem[] };
    type ColoredItem = { data?: { name: string; value: string | number } };

    const cards = JSON.parse(rawSummary.jsonString) as AnyCard[];

    const findCard = (title: string) => cards.find(c => c.cardTitle === title);

    // Regular bar-group cards: cardContents[0].data is a BarItem[]
    const mapToObj = (title: string): Record<string, number> => {
      const c0 = (findCard(title)?.cardContents?.[0] ?? {}) as FlatContent;
      return Object.fromEntries(
        (c0.data ?? [])
          .filter(d => d.name && d.type !== 'center')
          .map(d => [d.name, Number(d.value)])
      );
    };

    // COLORED_CARDS: cardContents is array-of-arrays, each inner item has data as single object
    const sessions: Record<string, number> = {};
    cards.filter(c => c.cardTitle === 'COLORED_CARDS').forEach(c => {
      (c.cardContents ?? []).forEach((inner: unknown) => {
        const arr = Array.isArray(inner) ? (inner as ColoredItem[]) : [];
        arr.forEach(cc => {
          if (cc?.data?.name) sessions[cc.data.name] = Number(cc.data.value);
        });
      });
    });

    // Disk percentage — center data point inside DISK_USAGE barGroup
    const diskPct = Number(
      ((findCard('DISK_USAGE')?.cardContents?.[0] ?? {}) as FlatContent)
        .data?.find(d => d.type === 'center' && d.suffix === '%')?.value ?? 0
    );

    const data = {
      diskPct,
      diskUsage,
      summary: {
        incoming:   mapToObj('INCOMING_MESSAGES'),
        outgoing:   mapToObj('OUTGOING_MESSAGES'),
        bwOverview: mapToObj('BANDWIDTH_OVERVIEW'),
        spam:       mapToObj('INCOMING_SPAM'),
        greylist:   mapToObj('GREYLISTED_CONNECTIONS'),
        throttled:  mapToObj('THROTTLED_MESSAGES'),
        sessions,
      },
    };

    summaryCache = { data, exp: Date.now() + 60_000 };
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// ── GET /api/smartermail/debug-cards (temporary) ─────────────────────────────
router.get('/debug-cards', requireAuth, requireIT, async (_req, res) => {
  try {
    const now   = new Date();
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fmt   = (d: Date) => d.toISOString().slice(0, 10);
    const raw = await smPost<{ jsonString: string }>('/api/v1/report/summary/domain', {
      domain: DOMAIN, startDate: fmt(start), endDate: fmt(now),
    });
    // Return raw parsed structure so we can inspect exactly what we get
    const cards = JSON.parse(raw.jsonString);
    res.json(cards);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

export default router;
