'use client';

import { useEffect, useState } from 'react';
import { LANGS, useApp } from '@/lib/app-context';
import Topbar from './Topbar';

export default function Settings({ email }: { email: string }) {
  const { theme, toggleTheme, lang, setLang, t } = useApp();
  const [jumpEmail, setJumpEmail] = useState('');
  const [jumpPass, setJumpPass] = useState('');
  const [jumpConnected, setJumpConnected] = useState(false);
  const [cvConnected, setCvConnected] = useState(false);
  const [msg, setMsg] = useState('');

  const loadInteg = () => fetch('/api/integrations').then((r) => r.json()).then((d) => {
    setJumpConnected(Boolean(d.jump?.connected));
    setJumpEmail(d.jump?.email ?? '');
    setCvConnected(Boolean(d.cvcrush?.connected));
  }).catch(() => {});
  useEffect(() => { loadInteg(); }, []);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 2500); }

  async function connectJump() {
    const r = await fetch('/api/integrations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'jump', email: jumpEmail, password: jumpPass }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setJumpPass(''); flash('Join-Jump connected.'); loadInteg(); } else flash(d.error ?? 'Error');
  }
  async function disconnectJump() {
    await fetch('/api/integrations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'jump', disconnect: true }) });
    flash('Join-Jump disconnected.'); loadInteg();
  }
  async function toggleCv() {
    await fetch('/api/integrations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'cvcrush', disconnect: cvConnected }) });
    if (!cvConnected) window.open('https://cvcrush.co/connect?app=leadjet', '_blank');
    flash(cvConnected ? 'cvcrush disconnected.' : 'cvcrush connected.'); loadInteg();
  }
  async function unlink() {
    if (!confirm(t('unlink.confirm'))) return;
    const r = await fetch('/api/cli/unlink', { method: 'POST' });
    const d = await r.json().catch(() => ({}));
    flash(r.ok ? `${t('unlink.done')} (${d.removed ?? 0})` : d.error ?? 'Error');
  }

  return (
    <div className="shell">
      <Topbar email={email} />
      <main className="content">
        <div className="settings-wrap">
          <h1 className="ph1">{t('menu.settings')}</h1>
          {msg ? <div className="note ok" style={{ marginBottom: 12 }}>{msg}</div> : null}

          <div className="card pad set-sec">
            <h3>Appearance</h3>
            <div className="kv"><span>Theme</span><button className="chipbtn" onClick={toggleTheme}>{theme === 'dark' ? 'Dark' : 'Light'}</button></div>
            <div className="kv"><span>Language</span><div className="chiprow">{LANGS.map((l) => <button key={l.code} className={`chipbtn ${l.code === lang ? 'on' : ''}`} onClick={() => setLang(l.code)}>{l.code.toUpperCase()}</button>)}</div></div>
          </div>

          <div className="card pad set-sec">
            <h3>Integrations</h3>
            <div className="integ">
              <div className="integ-head"><b>Join-Jump</b>{jumpConnected ? <span className="badge ok">Connected</span> : <span className="badge">Not connected</span>}</div>
              <p className="mut">Export leads as clients on your join-jump.com account.</p>
              {jumpConnected ? (
                <div className="row"><span className="mut">{jumpEmail}</span><button className="btn" onClick={disconnectJump}>Disconnect</button></div>
              ) : (
                <div className="integ-form">
                  <input placeholder="join-jump email" value={jumpEmail} onChange={(e) => setJumpEmail(e.target.value)} />
                  <input type="password" placeholder="password" value={jumpPass} onChange={(e) => setJumpPass(e.target.value)} />
                  <button className="btn red" onClick={connectJump}>Connect</button>
                </div>
              )}
            </div>
            <div className="integ">
              <div className="integ-head"><b>cvcrush</b>{cvConnected ? <span className="badge ok">Connected</span> : <span className="badge">Not connected</span>}</div>
              <p className="mut">Push leads to cvcrush.co.</p>
              <button className={cvConnected ? 'btn' : 'btn red'} onClick={toggleCv}>{cvConnected ? 'Disconnect' : 'Connect'}</button>
            </div>
          </div>

          <div className="card pad set-sec">
            <h3>CLI</h3>
            <p className="mut">The CLI links to this account for 7 days. Unlink to revoke it now.</p>
            <button className="btn" onClick={unlink}>{t('menu.unlink')}</button>
          </div>

          <div className="card pad set-sec">
            <h3>AI agents</h3>
            <p className="mut">Machine-readable docs for AI agents (tools, commands, usage).</p>
            <a className="btn" href="/agents" target="_blank" rel="noreferrer">Open /agents</a>
          </div>
        </div>
      </main>
    </div>
  );
}
