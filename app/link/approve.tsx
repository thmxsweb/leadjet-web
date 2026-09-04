'use client';

import { useState } from 'react';

export default function Approve({ code, email }: { code: string; email: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');

  async function approve() {
    setState('busy');
    const r = await fetch('/api/cli/approve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setState('ok');
    else { setState('err'); setMsg(d.error ?? 'Approval failed.'); }
  }

  if (state === 'ok') {
    return (
      <div className="auth-card link-card">
        <div className="wm" style={{ fontSize: 22 }}>lead<span>jet</span></div>
        <div className="link-check">✓</div>
        <h1>CLI linked</h1>
        <p className="link-sub">Your CLI is now linked to <b>{email}</b> for 7 days. You can close this tab and go back to your terminal.</p>
      </div>
    );
  }

  return (
    <div className="auth-card link-card">
      <div className="wm" style={{ fontSize: 22 }}>lead<span>jet</span></div>
      <h1>Link your CLI</h1>
      <p className="link-sub">A terminal is asking to link to your account and push leads for 7 days.</p>

      <div className="code-box">
        <span className="code-label">Device code</span>
        <span className="code-val mono">{code || '—'}</span>
      </div>

      <div className="link-acct">
        <span className="avatar">{(email[0] || 'u').toUpperCase()}</span>
        <div><div className="link-acct-lbl">Linking to</div><div className="link-acct-email">{email}</div></div>
      </div>

      {msg ? <div className="note bad">{msg}</div> : null}

      <button className="btn red block" onClick={approve} disabled={state === 'busy' || !code}>
        {state === 'busy' ? 'Linking…' : 'Approve for 7 days'}
      </button>
      <p className="link-foot">Only approve if you just ran <code>leadjet link</code> yourself.</p>
    </div>
  );
}
