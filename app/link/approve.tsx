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
    else {
      setState('err');
      setMsg(d.error ?? 'Approval failed.');
    }
  }

  if (state === 'ok') {
    return (
      <div className="auth-card">
        <div className="wm" style={{fontSize:20}}>lead<span>jet</span></div>
        <h1>Device linked</h1>
        <div className="note ok">Your CLI is now linked to <b>{email}</b> for 7 days. Return to your terminal.</div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="wm" style={{fontSize:20}}>lead<span>jet</span></div>
      <h1>Link your CLI</h1>
      {msg ? <div className="note bad">{msg}</div> : null}
      <p style={{ color: 'var(--mut)', fontSize: 13 }}>
        Authorize this terminal to push leads to <b>{email}</b>. Code:
      </p>
      <div className="mono" style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, textAlign: 'center', margin: '10px 0 16px' }}>{code || '—'}</div>
      <button className="btn red" style={{ width: '100%', justifyContent: 'center' }} onClick={approve} disabled={state === 'busy' || !code}>
        {state === 'busy' ? '...' : 'Approve for 7 days'}
      </button>
    </div>
  );
}
