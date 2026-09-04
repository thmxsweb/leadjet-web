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
  const [showJumpForm, setShowJumpForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'claude'>('gemini');
  const [aiKey, setAiKey] = useState('');
  const [geminiOn, setGeminiOn] = useState(false);
  const [claudeOn, setClaudeOn] = useState(false);

  const loadInteg = () => fetch('/api/integrations').then((r) => r.json()).then((d) => {
    setJumpConnected(Boolean(d.jump?.connected));
    setJumpEmail(d.jump?.email ?? '');
    setCvConnected(Boolean(d.cvcrush?.connected));
    setGeminiOn(Boolean(d.ai?.gemini));
    setClaudeOn(Boolean(d.ai?.claude));
    if (d.ai?.provider === 'gemini' || d.ai?.provider === 'claude') setAiProvider(d.ai.provider);
  }).catch(() => {});
  useEffect(() => { loadInteg(); }, []);
  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 2500); }

  async function connectJump() {
    const r = await fetch('/api/integrations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'jump', email: jumpEmail, password: jumpPass }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setJumpPass(''); setShowJumpForm(false); flash('Join-Jump connected.'); loadInteg(); } else flash(d.error ?? 'Error');
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
  async function saveAiKey() {
    if (!aiKey.trim()) return;
    const r = await fetch('/api/integrations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'ai', aiProvider, key: aiKey.trim() }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setAiKey(''); flash(`${aiProvider === 'claude' ? 'Claude' : 'Gemini'} key saved.`); loadInteg(); } else flash(d.error ?? 'Error');
  }
  async function removeAiKey(which: 'gemini' | 'claude') {
    await fetch('/api/integrations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'ai', aiProvider: which, disconnect: true }) });
    flash(`${which === 'claude' ? 'Claude' : 'Gemini'} key removed.`); loadInteg();
  }
  async function unlink() {
    if (!confirm(t('unlink.confirm'))) return;
    const r = await fetch('/api/cli/unlink', { method: 'POST' });
    const d = await r.json().catch(() => ({}));
    flash(r.ok ? `${t('unlink.done')} (${d.removed ?? 0})` : d.error ?? 'Error');
  }

  const badge = (on: boolean) => <span className={`badge ${on ? 'ok' : ''}`}>{on ? 'Connected' : 'Not connected'}</span>;

  return (
    <div className="shell">
      <Topbar email={email} />
      <main className="content">
        <div className="settings-page">
          <div className="settings-hd">
            <h1>{t('menu.settings')}</h1>
            <p>Manage appearance, integrations and your CLI link.</p>
          </div>
          {msg ? <div className="note ok toast">{msg}</div> : null}

          <section className="sgroup">
            <div className="sgroup-hd"><h3>Appearance</h3><p>How leadjet looks for you.</p></div>
            <div className="card">
              <div className="srow"><div className="srow-l"><b>Theme</b><span>Switch between light and dark.</span></div><button className="chipbtn" onClick={toggleTheme}>{theme === 'dark' ? 'Dark' : 'Light'}</button></div>
              <div className="srow"><div className="srow-l"><b>Language</b><span>Interface language.</span></div><div className="chiprow">{LANGS.map((l) => <button key={l.code} className={`chipbtn ${l.code === lang ? 'on' : ''}`} onClick={() => setLang(l.code)}>{l.code.toUpperCase()}</button>)}</div></div>
            </div>
          </section>

          <section className="sgroup">
            <div className="sgroup-hd"><h3>Integrations</h3><p>Connect the accounts you close deals with.</p></div>
            <div className="card">
              <div className="srow">
                <div className="srow-l"><b>Join-Jump {badge(jumpConnected)}</b><span>{jumpConnected ? jumpEmail : 'Export leads as clients on join-jump.com.'}</span></div>
                <div className="srow-r">{jumpConnected
                  ? <button className="btn" onClick={disconnectJump}>Disconnect</button>
                  : <button className="btn red" onClick={() => setShowJumpForm((v) => !v)}>Connect</button>}
                </div>
              </div>
              {showJumpForm && !jumpConnected ? (
                <div className="srow inline-form">
                  <input placeholder="join-jump email" value={jumpEmail} onChange={(e) => setJumpEmail(e.target.value)} />
                  <input type="password" placeholder="password" value={jumpPass} onChange={(e) => setJumpPass(e.target.value)} />
                  <button className="btn red" onClick={connectJump}>Save</button>
                </div>
              ) : null}
              <div className="srow">
                <div className="srow-l"><b>cvcrush {badge(cvConnected)}</b><span>Push leads to cvcrush.co.</span></div>
                <div className="srow-r"><button className={cvConnected ? 'btn' : 'btn red'} onClick={toggleCv}>{cvConnected ? 'Disconnect' : 'Connect'}</button></div>
              </div>
            </div>
          </section>

          <section className="sgroup">
            <div className="sgroup-hd"><h3>AI analysis</h3><p>Analyze leads with AI — fit, pitch angle, budget and a ready-to-send message.</p></div>
            <div className="card">
              <div className="srow">
                <div className="srow-l"><b>Provider</b><span>Gemini has a free tier · Claude uses your Anthropic API key (paid).</span></div>
                <div className="chiprow">
                  <button className={`chipbtn ${aiProvider === 'gemini' ? 'on' : ''}`} onClick={() => setAiProvider('gemini')}>Gemini {geminiOn ? '✓' : ''}</button>
                  <button className={`chipbtn ${aiProvider === 'claude' ? 'on' : ''}`} onClick={() => setAiProvider('claude')}>Claude {claudeOn ? '✓' : ''}</button>
                </div>
              </div>
              <div className="srow inline-form">
                <input type="password" placeholder={aiProvider === 'claude' ? 'Anthropic API key (sk-ant-…)' : 'Google AI Studio API key'} value={aiKey} onChange={(e) => setAiKey(e.target.value)} />
                <button className="btn red" onClick={saveAiKey}>Save key</button>
                {(aiProvider === 'gemini' ? geminiOn : claudeOn) ? <button className="btn" onClick={() => removeAiKey(aiProvider)}>Remove</button> : null}
              </div>
              <div className="srow"><div className="srow-l"><span>{aiProvider === 'claude'
                ? 'Get a key at console.anthropic.com. Note: a Claude Pro/Max subscription cannot be used here — third-party apps need an API key.'
                : 'Get a free key at aistudio.google.com/apikey.'}</span></div>
                <a className="btn" href={aiProvider === 'claude' ? 'https://console.anthropic.com/settings/keys' : 'https://aistudio.google.com/apikey'} target="_blank" rel="noreferrer">Get a key</a>
              </div>
            </div>
          </section>

          <section className="sgroup">
            <div className="sgroup-hd"><h3>CLI</h3><p>The local engine that finds and pushes your leads.</p></div>
            <div className="card">
              <div className="srow"><div className="srow-l"><b>Linked device</b><span>The CLI links for 7 days. Unlink to revoke it now.</span></div><button className="btn" onClick={unlink}>{t('menu.unlink')}</button></div>
            </div>
          </section>

          <section className="sgroup">
            <div className="sgroup-hd"><h3>AI agents</h3><p>Let AI agents drive leadjet.</p></div>
            <div className="card">
              <div className="srow"><div className="srow-l"><b>Agent docs</b><span>Machine-readable tools, commands and usage.</span></div><a className="btn" href="/agents" target="_blank" rel="noreferrer">Open /agents</a></div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
