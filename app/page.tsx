'use client';

import { useMemo, useState } from 'react';
import { streamSearch, type Lead, type SearchBody } from '@/lib/api';

const tier = (s: number) => (s >= 70 ? 'hot' : s >= 45 ? 'warm' : 'cold');

export default function Dashboard() {
  const [form, setForm] = useState<SearchBody>({
    source: 'osm',
    term: 'restaurants',
    city: 'Lyon',
    region: '',
    country: 'France',
    limit: 30,
    category: '',
    owner: true,
    audit: true,
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [pr, setPr] = useState('');
  const [sortKey, setSortKey] = useState('score');
  const [sortDir, setSortDir] = useState(-1);

  const set = (k: keyof SearchBody, v: string | number | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function run() {
    setLeads([]);
    setBusy(true);
    setProgress(3);
    setStatus('searching...');
    let total = 0;
    const acc: Lead[] = [];
    try {
      await streamSearch(form, {
        onMeta: (t) => (total = t),
        onLead: (lead) => {
          acc.push(lead);
          setLeads([...acc]);
          setProgress(Math.min(98, (acc.length / (total || 1)) * 100));
          setStatus(`${acc.length}${total ? ` / ${total}` : ''} enriched`);
        },
        onError: (m) => setStatus(`Error: ${m}`),
      });
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setBusy(false);
    setProgress(100);
    setStatus(acc.length ? `${acc.length} leads` : 'no results');
    setTimeout(() => setProgress(0), 700);
  }

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
    else {
      setSortKey(k);
      setSortDir(k === 'score' ? -1 : 1);
    }
  };

  const kpi = {
    total: leads.length,
    hot: leads.filter((l) => l.priority === 'Chaud').length,
    tel: leads.filter((l) => l.phone).length,
    mail: leads.filter((l) => l.email).length,
  };

  const th = (k: string, label: string) => (
    <th onClick={() => sortBy(k)}>{label}</th>
  );

  return (
    <div className="app">
      <aside className="side">
        <div className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" />
          lead<b>jet</b>
        </div>
        <nav className="nav">
          <a className="active">Leads</a>
          <a>Join-Jump</a>
          <a>cvcrush</a>
          <a>Activity</a>
          <a>Settings</a>
        </nav>
        <div className="foot">
          <div className="ver">
            <span>v0.1.0</span>
            <span className="dot" />
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="view">
          <div className="phead">
            <div>
              <h1>Leads</h1>
              <div className="sub">Find, qualify, select, export</div>
            </div>
          </div>

          <div className="card pad searchbar">
            <input className="term" placeholder="niche (restaurants, plumbers...)" value={form.term} onChange={(e) => set('term', e.target.value)} />
            <select className="w-sm" value={form.source} onChange={(e) => set('source', e.target.value)}>
              <option value="osm">OpenStreetMap</option>
              <option value="places">Google Places</option>
            </select>
            <input className="w-sm" placeholder="city" value={form.city} onChange={(e) => set('city', e.target.value)} />
            <input className="w-sm" placeholder="region" value={form.region} onChange={(e) => set('region', e.target.value)} />
            <input className="w-xs" placeholder="country" value={form.country} onChange={(e) => set('country', e.target.value)} />
            <input className="w-xs mono" type="number" min={1} max={200} value={form.limit} onChange={(e) => set('limit', Number(e.target.value) || 30)} />
            <label className="tog"><input type="checkbox" checked={form.owner} onChange={(e) => set('owner', e.target.checked)} /> owner</label>
            <label className="tog"><input type="checkbox" checked={form.audit} onChange={(e) => set('audit', e.target.checked)} /> audit</label>
            <button className="btn red" onClick={run} disabled={busy}>{busy ? '...' : 'Generate'}</button>
          </div>
          <div className="bar"><i style={{ width: `${progress}%` }} /></div>

          <div className="stats">
            <div className="kpi"><b>{kpi.total}</b><span>leads</span></div>
            <div className="kpi red"><b>{kpi.hot}</b><span>hot</span></div>
            <div className="kpi"><b>{kpi.tel}</b><span>phone</span></div>
            <div className="kpi"><b>{kpi.mail}</b><span>email</span></div>
          </div>

          <div className="toolbar">
            <input placeholder="filter..." style={{ width: 170 }} value={q} onChange={(e) => setQ(e.target.value)} />
            <select value={pr} onChange={(e) => setPr(e.target.value)}>
              <option value="">priority</option>
              <option value="Chaud">Hot</option>
              <option value="Tiède">Warm</option>
              <option value="Froid">Cold</option>
            </select>
            <span className="sep" />
            <span className="status">{status}</span>
            <span className="count">{rows.length} / {leads.length}</span>
          </div>

          <div className="card tablecard"><div className="twrap">
            <table>
              <thead><tr>
                {th('score', 'Score')}{th('name', 'Company')}{th('activity', 'Activity')}
                {th('owner', 'Owner')}{th('phone', 'Phone')}{th('email', 'Email')}
                {th('domain', 'Domain')}{th('opportunity', 'Opportunity')}{th('location', 'Location')}
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.place_id || i}>
                    <td><span className={`sc ${tier(r.score)} mono`}>{r.score}</span></td>
                    <td><span className="name">{r.name}</span>{r.legal && r.legal.toLowerCase() !== r.name.toLowerCase() ? <div className="mut">{r.legal}</div> : null}</td>
                    <td>{r.activity}</td>
                    <td>{r.owner ? <><span className="name">{r.owner}</span><div className="mut">{r.role}</div></> : <span className="mut">—</span>}</td>
                    <td>{r.phone ? <a className="mono" href={`tel:${r.phone.replace(/\s/g, '')}`}>{r.phone}</a> : <span className="mut">—</span>}</td>
                    <td>{r.email ? <a href={`mailto:${r.email}`}>{r.email}</a> : <span className="mut">—</span>}</td>
                    <td>{r.domainType === 'existing'
                      ? <span className="dm exist"><a href={`https://${r.domain}`} target="_blank" rel="noreferrer">{r.domain}</a></span>
                      : <span className="dm prop" title="proposed domain">{r.domain}</span>}</td>
                    <td><span className="pill">{r.opportunity}</span></td>
                    <td className="mut">{r.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leads.length === 0 ? <div className="empty">Pick a niche and a city, then <b>Generate</b>.</div> : null}
          </div></div>
        </div>
      </main>
    </div>
  );
}
