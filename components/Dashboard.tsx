'use client';

import { signOut } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Lead } from '@/lib/api';

const tier = (s: number) => (s >= 70 ? 'hot' : s >= 45 ? 'warm' : 'cold');
const COLS = ['name', 'legal', 'activity', 'owner', 'role', 'phone', 'email', 'score', 'priority', 'opportunity', 'domain', 'location', 'website', 'siren'];

export default function Dashboard({ email }: { email: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [pr, setPr] = useState('');
  const [sortKey, setSortKey] = useState('score');
  const [sortDir, setSortDir] = useState(-1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads', { cache: 'no-store' });
      const data = await res.json();
      setLeads(Array.isArray(data.leads) ? data.leads : []);
    } catch {
      setLeads([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const ql = q.toLowerCase().trim();
    const out = leads.filter((r) => {
      if (pr && r.priority !== pr) return false;
      if (ql) {
        const h = `${r.name} ${r.activity} ${r.owner} ${r.location} ${r.opportunity}`.toLowerCase();
        if (!h.includes(ql)) return false;
      }
      return true;
    });
    out.sort((a, b) => {
      const x = a[sortKey] as string | number;
      const y = b[sortKey] as string | number;
      if (typeof x === 'string') return String(x).toLowerCase() < String(y).toLowerCase() ? -sortDir : String(x).toLowerCase() > String(y).toLowerCase() ? sortDir : 0;
      return (x as number) < (y as number) ? -sortDir : (x as number) > (y as number) ? sortDir : 0;
    });
    return out;
  }, [leads, q, pr, sortKey, sortDir]);

  const sortBy = (k: string) => {
    if (sortKey === k) setSortDir(-sortDir);
    else { setSortKey(k); setSortDir(k === 'score' ? -1 : 1); }
  };

  const kpi = {
    total: leads.length,
    hot: leads.filter((l) => l.priority === 'Chaud').length,
    tel: leads.filter((l) => l.phone).length,
    mail: leads.filter((l) => l.email).length,
  };

  function exportCsv() {
    if (!rows.length) return;
    const esc = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = [COLS.join(','), ...rows.map((r) => COLS.map((c) => esc(r[c])).join(','))].join('\n');
    const b = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="logo">lead<b>jet</b></div>
        <div className="spacer" />
        <span className="who">{email}</span>
        <button className="btn" onClick={() => load()}>Refresh</button>
        <button className="btn" onClick={() => signOut({ callbackUrl: '/login' })}>Sign out</button>
      </header>

      <main className="content">
        <div className="stats">
          <div className="kpi"><b>{kpi.total}</b><span>leads</span></div>
          <div className="kpi red"><b>{kpi.hot}</b><span>hot</span></div>
          <div className="kpi"><b>{kpi.tel}</b><span>phone</span></div>
          <div className="kpi"><b>{kpi.mail}</b><span>email</span></div>
        </div>

        {leads.length === 0 && !loading ? (
          <div className="onboard card">
            <h2>No leads yet</h2>
            <p>Find leads with the CLI on your machine, then they appear here.</p>
            <ol>
              <li><code>npm i -g @thmxsweb/leadjet</code></li>
              <li><code>leadjet link</code> <span className="mut">(links this account for 7 days)</span></li>
              <li><code>leadjet leads &quot;restaurants&quot; --city Lyon --push</code></li>
            </ol>
            <button className="btn red" onClick={() => load()}>I have pushed leads — Refresh</button>
          </div>
        ) : (
          <>
            <div className="toolbar">
              <input placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
              <select value={pr} onChange={(e) => setPr(e.target.value)}>
                <option value="">All priorities</option>
                <option value="Chaud">Hot</option>
                <option value="Tiède">Warm</option>
                <option value="Froid">Cold</option>
              </select>
              <div className="spacer" />
              <span className="count">{rows.length} / {leads.length}</span>
              <button className="btn" onClick={exportCsv}>Export CSV</button>
            </div>

            <div className="card tablecard"><div className="twrap">
              <table>
                <thead><tr>
                  <th onClick={() => sortBy('score')}>Score</th>
                  <th onClick={() => sortBy('name')}>Company</th>
                  <th onClick={() => sortBy('activity')}>Activity</th>
                  <th onClick={() => sortBy('owner')}>Owner</th>
                  <th onClick={() => sortBy('phone')}>Phone</th>
                  <th onClick={() => sortBy('email')}>Email</th>
                  <th onClick={() => sortBy('domain')}>Domain</th>
                  <th onClick={() => sortBy('opportunity')}>Opportunity</th>
                  <th onClick={() => sortBy('location')}>Location</th>
                </tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={(r.place_id as string) || i}>
                      <td><span className={`sc ${tier(r.score)}`}>{r.score}</span></td>
                      <td><span className="name">{r.name}</span>{r.legal && r.legal.toLowerCase() !== r.name.toLowerCase() ? <div className="mut">{r.legal}</div> : null}</td>
                      <td>{r.activity}</td>
                      <td>{r.owner ? <><span className="name">{r.owner}</span><div className="mut">{r.role}</div></> : <span className="mut">—</span>}</td>
                      <td>{r.phone ? <a href={`tel:${String(r.phone).replace(/\s/g, '')}`}>{r.phone}</a> : <span className="mut">—</span>}</td>
                      <td>{r.email ? <a href={`mailto:${r.email}`}>{r.email}</a> : <span className="mut">—</span>}</td>
                      <td>{r.domainType === 'existing' ? <a href={`https://${r.domain}`} target="_blank" rel="noreferrer">{r.domain}</a> : <span className="prop">{r.domain}</span>}</td>
                      <td><span className="pill">{r.opportunity}</span></td>
                      <td className="mut">{r.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading ? <div className="empty">Loading…</div> : null}
            </div></div>
          </>
        )}
      </main>
    </div>
  );
}
