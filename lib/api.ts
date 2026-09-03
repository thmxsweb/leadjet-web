export const API = process.env.NEXT_PUBLIC_LEADJET_API ?? 'http://127.0.0.1:4317';

export interface Lead {
  name: string;
  legal: string;
  activity: string;
  owner: string;
  role: string;
  phone: string;
  email: string;
  score: number;
  priority: string;
  opportunity: string;
  approach: string;
  domain: string;
  domainType: string;
  location: string;
  website: string;
  siteStatus: string;
  place_id: string;
  [k: string]: unknown;
}

export interface SearchBody {
  source: string;
  term: string;
  city: string;
  region: string;
  country: string;
  limit: number;
  category: string;
  owner: boolean;
  audit: boolean;
}

/** Stream leads from the local leadjet server as they are enriched. */
export async function streamSearch(
  body: SearchBody,
  handlers: {
    onMeta?: (total: number) => void;
    onLead?: (lead: Lead) => void;
    onError?: (message: string) => void;
    onDone?: () => void;
  },
): Promise<void> {
  const res = await fetch(`${API}/api/search`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.body) {
    handlers.onError?.('No response stream.');
    return;
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const ln of lines) {
      if (!ln.trim()) continue;
      let m: { t?: string; total?: number; lead?: Lead; message?: string };
      try {
        m = JSON.parse(ln);
      } catch {
        continue;
      }
      if (m.t === 'meta') handlers.onMeta?.(m.total ?? 0);
      else if (m.t === 'lead' && m.lead) handlers.onLead?.(m.lead);
      else if (m.t === 'error') handlers.onError?.(m.message ?? 'error');
    }
  }
  handlers.onDone?.();
}

export interface ConfigStatus {
  hasPlacesKey: boolean;
  keyHint: string;
  defaults: { source: string; country: string; region: string; city: string; language: string };
  jump: { configured: boolean; email: string };
  cvcrush: { appId: string };
}

export async function getConfig(): Promise<ConfigStatus> {
  return (await fetch(`${API}/api/config`)).json();
}
