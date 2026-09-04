'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Lead } from '@/lib/api';
import { useApp } from '@/lib/app-context';
import { estimateBudget } from '@/lib/budget';
import InstallCli from './InstallCli';
import Topbar from './Topbar';

const tier = (s: number) => (s >= 70 ? 'hot' : s >= 45 ? 'warm' : 'cold');
const COLS = ['name', 'legal', 'activity', 'owner', 'role', 'phone', 'email', 'score', 'priority', 'opportunity', 'domain', 'location', 'website', 'siren', 'siret', 'vat', 'size', 'created', 'legalForm', 'naf'];

const leadKey = (l: Lead) => String((l.place_id as string) || `${l.name}|${l.location}`);
const eur = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

interface Ai {
  fitScore?: number; verdict?: string; reasons?: string[]; pitchAngle?: string;
  estBudget?: string; outreach?: string; provider?: string;
}

export default function Dashboard({ email }: { email: string }) {
  const { t } = useApp();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [pr, setPr] = useState('');
  const [sortKey, setSortKey] = useState('score');
  const [sortDir, setSortDir] = useState(-1);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');
  const [jumpOn, setJumpOn] = useState(false);
  const [aiOn, setAiOn] = useState(false);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

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

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    fetch('/api/integrations').then((r) => r.json()).then((d) => {
      setJumpOn(Boolean(d.jump?.connected));
      setAiOn(Boolean(d.ai?.gemini || d.ai?.claude));
    }).catch(() => {});
  }, []);

  const withBudget = useMemo(
    () => leads.map((l) => ({ l, key: leadKey(l), budget: estimateBudget(l as Record<string, unknown>) })),
    [leads],
  );

  const rows = useMemo(() => {
    const ql = q.toLowerCase().trim();
    const out = withBudget.filter(({ l }) => {
      if (pr && l.priority !== pr) return false;
      if (ql) {
        const h = `${l.name} ${l.activity} ${l.owner} ${l.location} ${l.opportunity}`.toLowerCase();
        if (!h.includes(ql)) return false;
      }
      return true;
    });
    out.sort((a, b) => {
      const x = sortKey === 'budget' ? a.budget.mid : (a.l[sortKey] as string | number);
      const y = sortKey === 'budget' ? b.budget.mid : (b.l[sortKey] as string | number);
      if (typeof x === 'string') return String(x).toLowerCase() < String(y).toLowerCase() ? -sortDir : String(x).toLowerCase() > String(y).toLowerCase() ? sortDir : 0;
      return (x as number) < (y as number) ? -sortDir : (x as number) > (y as number) ? sortDir : 0;
    });
    return out;
  }, [withBudget, q, pr, sortKey, sortDir]);

  const sortBy = (k: string) => {
    if (sortKey === k) setSortDir(-sortDir);
    else { setSortKey(k); setSortDir(k === 'name' || k === 'location' ? 1 : -1); }
  };

  const pipeline = withBudget.reduce((s, r) => s + r.budget.mid, 0);
  const kpi = {
    total: leads.length,
    hot: leads.filter((l) => l.priority === 'Chaud').length,
    reach: leads.filter((l) => l.phone || l.email).length,
  };

  const allShown = rows.length > 0 && rows.every((r) => sel.has(r.key));
  const toggleAll = () => {
    const n = new Set(sel);
    if (allShown) rows.forEach((r) => n.delete(r.key));
    else rows.forEach((r) => n.add(r.key));
    setSel(n);
  };
  const toggle = (k: string) => {
    const n = new Set(sel);
    n.has(k) ? n.delete(k) : n.add(k);
    setSel(n);
  };

  async function analyze(key: string) {
    if (!aiOn) { flash('Add a Gemini or Claude key in Settings first.'); return; }
    setBusy((b) => new Set(b).add(key));
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key }) });
      const d = await res.json();
      if (res.ok && d.analysis) {
        setLeads((ls) => ls.map((l) => (leadKey(l) === key ? { ...l, ai: d.analysis } : l)));
        setOpen(key);
      } else flash(d.error ?? 'Analysis failed.');
    } catch { flash('Analysis failed.'); }
    setBusy((b) => { const n = new Set(b); n.delete(key); return n; });
  }

  async function exportJump() {
    if (!jumpOn) { flash('Connect Join-Jump in Settings first.'); return; }
    const keys = [...sel];
    if (!keys.length) { flash('Select some leads first.'); return; }
    if (!confirm(`Export ${keys.length} lead(s) to your Join-Jump client list?`)) return;
    flash(`Exporting ${keys.length} to Join-Jump…`);
    const res = await fetch('/api/export/jump', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keys }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      const parts = [`${d.created ?? 0} added`];
      if (d.resolved) parts.push(`${d.resolved} SIRET found`);
      if (d.already) parts.push(`${d.already} already clients`);
      if (d.skipped) parts.push(`${d.skipped} skipped (no SIRET/address)`);
      flash(`Join-Jump: ${parts.join(', ')}.`);
      setSel(new Set());
    } else flash(d.error ?? 'Export failed.');
  }

  async function deleteLeads() {
    const keys = [...sel];
    const n = keys.length || leads.length;
    if (!n) return;
    const what = keys.length ? `${keys.length} selected lead(s)` : `ALL ${leads.length} leads`;
    if (!confirm(`Delete ${what}? This cannot be undone.`)) return;
    const res = await fetch('/api/leads', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(keys.length ? { keys } : {}),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) { flash(`Deleted ${d.deleted ?? 0} lead(s).`); setSel(new Set()); setOpen(null); await load(); }
    else flash(d.error ?? 'Delete failed.');
  }

  function exportCsv() {
    if (!rows.length) return;
    const cols = [...COLS, 'budgetLow', 'budgetHigh'];
    const esc = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const src = sel.size ? rows.filter((r) => sel.has(r.key)) : rows;
    const csv = [cols.join(','), ...src.map(({ l, budget }) => cols.map((c) => esc(c === 'budgetLow' ? budget.low : c === 'budgetHigh' ? budget.high : l[c])).join(','))].join('\n');
    const b = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const copy = (txt: string) => { navigator.clipboard?.writeText(txt).then(() => flash('Copied.'), () => {}); };

  return (
    <div className="shell">
      <Topbar email={email} onRefresh={load} />

      <main className="content">
        {toast ? <div className="note ok toast">{toast}</div> : null}

        {leads.length === 0 && !loading ? (
          <div className="onboard card">
            <h2>{t('install.title')}</h2>
            <p>{t('install.sub')}</p>
            <InstallCli />
            <div className="steps">
              <div className="step"><span className="n">2</span><div><b>{t('step.link')}</b> <span className="mut">({t('step.linkNote')})</span><div><code>leadjet link</code></div></div></div>
              <div className="step"><span className="n">3</span><div><b>{t('step.push')}</b><div><code>leadjet leads &quot;restaurants&quot; --city Lyon --push</code></div></div></div>
            </div>
            <button className="btn red" onClick={() => load()}>{t('empty.refresh')}</button>
          </div>
        ) : null}

        {leads.length > 0 && (
          <>
            <div className="stats">
              <div className="kpi"><b>{kpi.total}</b><span>{t('kpi.leads')}</span></div>
              <div className="kpi red"><b>{kpi.hot}</b><span>{t('kpi.hot')}</span></div>
              <div className="kpi"><b>{kpi.reach}</b><span>Reachable</span></div>
              <div className="kpi green"><b>{eur(pipeline)} €</b><span>Est. pipeline</span></div>
            </div>

            <div className="toolbar">
              <input placeholder={t('filter.ph')} value={q} onChange={(e) => setQ(e.target.value)} />
              <select value={pr} onChange={(e) => setPr(e.target.value)}>
                <option value="">{t('filter.all')}</option>
                <option value="Chaud">{t('kpi.hot')}</option>
                <option value="Tiède">Warm</option>
                <option value="Froid">Cold</option>
              </select>
              <div className="spacer" />
              {sel.size > 0 ? <span className="count">{sel.size} selected</span> : <span className="count">{rows.length} / {leads.length}</span>}
              <button className="btn" onClick={exportJump} disabled={!sel.size} title={jumpOn ? '' : 'Connect Join-Jump in Settings'}>Export to Join-Jump</button>
              <button className="btn" onClick={exportCsv}>{t('exportCsv')}</button>
              <button className="btn danger" onClick={deleteLeads}>{sel.size ? `Delete (${sel.size})` : 'Delete all'}</button>
            </div>

            <div className="card tablecard"><div className="twrap">
              <table>
                <thead><tr>
                  <th className="chk"><input type="checkbox" checked={allShown} onChange={toggleAll} /></th>
                  <th onClick={() => sortBy('score')}>{t('tbl.score')}</th>
                  <th onClick={() => sortBy('name')}>{t('tbl.company')}</th>
                  <th onClick={() => sortBy('owner')}>{t('tbl.owner')}</th>
                  <th>Contact</th>
                  <th onClick={() => sortBy('opportunity')}>Opportunity</th>
                  <th onClick={() => sortBy('budget')}>Est. budget</th>
                  <th>Size · age</th>
                  <th onClick={() => sortBy('location')}>{t('tbl.location')}</th>
                  <th />
                </tr></thead>
                <tbody>
                  {rows.map(({ l, key, budget }) => {
                    const ai = l.ai as Ai | undefined;
                    const isOpen = open === key;
                    return (
                      <>
                        <tr key={key} className={sel.has(key) ? 'selrow' : ''}>
                          <td className="chk"><input type="checkbox" checked={sel.has(key)} onChange={() => toggle(key)} /></td>
                          <td><span className={`sc ${tier(l.score)}`}>{l.score}</span></td>
                          <td>
                            <span className="name">{l.name}</span>
                            {ai ? <span className="aidot" title="AI-analyzed">✦</span> : null}
                            <div className="mut">{l.activity || (l.legal !== l.name ? l.legal : '')}</div>
                          </td>
                          <td>{l.owner ? <><span className="name">{l.owner}</span><div className="mut">{l.role}</div></> : <span className="mut">—</span>}</td>
                          <td className="contact">
                            {l.phone ? <a href={`tel:${String(l.phone).replace(/\s/g, '')}`} title={l.phone}>☎</a> : null}
                            {l.email ? <a href={`mailto:${l.email}`} title={l.email}>✉</a> : null}
                            {!l.phone && !l.email ? <span className="mut">—</span> : null}
                          </td>
                          <td><span className="pill">{l.opportunity}</span></td>
                          <td className="mono"><b>{budget.label}</b> <span className={`tierbadge t${budget.tier.length}`}>{budget.tier}</span></td>
                          <td className="mut">{[l.size, l.created].filter(Boolean).join(' · ') || '—'}</td>
                          <td className="mut">{l.location}</td>
                          <td><button className="expand" onClick={() => setOpen(isOpen ? null : key)}>{isOpen ? '▲ close' : '▼ details'}</button></td>
                        </tr>
                        {isOpen ? (
                          <tr className="detailrow" key={`${key}-d`}>
                            <td colSpan={10}>
                              <div className="detail">
                                <div className="dgrid">
                                  <div><span className="dt">Legal name</span>{l.legal || '—'}</div>
                                  <div><span className="dt">Legal form</span>{(l.legalForm as string) || '—'}</div>
                                  <div><span className="dt">NAF</span>{(l.naf as string) || '—'}</div>
                                  <div><span className="dt">SIREN</span><span className="mono">{(l.siren as string) || '—'}</span></div>
                                  <div><span className="dt">SIRET</span><span className="mono">{(l.siret as string) || '—'}</span></div>
                                  <div><span className="dt">VAT</span><span className="mono">{(l.vat as string) || '—'}</span></div>
                                  <div><span className="dt">Website</span>{l.website ? <a href={`https://${l.domain}`} target="_blank" rel="noreferrer">{l.domain}</a> : <span className="prop">{l.domain} (proposed)</span>}</div>
                                  <div><span className="dt">Site status</span>{l.siteStatus || '—'}</div>
                                  {l.siren ? <div><span className="dt">Registry</span><a href={`https://data.inpi.fr/entreprises/${l.siren}`} target="_blank" rel="noreferrer">INPI ↗</a></div> : null}
                                  {l.maps ? <div><span className="dt">Map</span><a href={l.maps as string} target="_blank" rel="noreferrer">OpenStreetMap ↗</a></div> : null}
                                </div>

                                <div className="aibox">
                                  <div className="aihd">
                                    <b>AI analysis</b>
                                    <button className="btn red-o sm" onClick={() => analyze(key)} disabled={busy.has(key)}>
                                      {busy.has(key) ? 'Analyzing…' : ai ? 'Re-analyze' : 'Analyze with AI'}
                                    </button>
                                  </div>
                                  {ai ? (
                                    <div className="airesult">
                                      <div className="airow"><span className="dt">Fit</span><span className={`sc ${tier(ai.fitScore ?? 0)}`}>{ai.fitScore}</span> <b>{ai.verdict}</b></div>
                                      {ai.pitchAngle ? <div className="airow"><span className="dt">Angle</span>{ai.pitchAngle}</div> : null}
                                      {ai.estBudget ? <div className="airow"><span className="dt">AI budget</span>{ai.estBudget}</div> : null}
                                      {ai.reasons?.length ? <ul className="reasons">{ai.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul> : null}
                                      {ai.outreach ? (
                                        <div className="outreach">
                                          <div className="dt">Outreach message <button className="linkbtn" onClick={() => copy(ai.outreach!)}>copy</button></div>
                                          <p>{ai.outreach}</p>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : <p className="mut">{aiOn ? 'Not analyzed yet.' : 'Add a Gemini (free) or Claude key in Settings to analyze this lead.'}</p>}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </>
                    );
                  })}
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
