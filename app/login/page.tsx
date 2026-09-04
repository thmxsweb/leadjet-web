'use client';

import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Suspense, useState } from 'react';

function AuthCard() {
  const sp = useSearchParams();
  const callbackUrl = sp.get('callbackUrl') || '/';
  const [mode, setMode] = useState<'in' | 'up'>(sp.get('tab') === 'up' ? 'up' : 'in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'up') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password: pw, name }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErr(data.error ?? 'Sign up failed.');
          setBusy(false);
          return;
        }
      }
      const r = await signIn('credentials', { email, password: pw, redirect: false });
      if (r?.error) setErr('Wrong email or password.');
      else window.location.href = callbackUrl;
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Something went wrong.');
    }
    setBusy(false);
  }

  return (
    <div className="auth-card">
      <div className="wm">lead<span>jet</span></div>
      <p className="auth-tag">Find, qualify and close local business leads.</p>

      <div className="seg">
        <button className={mode === 'in' ? 'on' : ''} onClick={() => { setMode('in'); setErr(''); }} type="button">Sign in</button>
        <button className={mode === 'up' ? 'on' : ''} onClick={() => { setMode('up'); setErr(''); }} type="button">Sign up</button>
      </div>

      {err ? <div className="note bad">{err}</div> : null}

      <form onSubmit={submit}>
        {mode === 'up' ? (
          <>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
          </>
        ) : null}
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        <label>Password</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={mode === 'up' ? 'at least 8 characters' : '••••••••'} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} required />
        <button className="btn red block" disabled={busy} type="submit">
          {busy ? '…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-wrap">
      <Suspense><AuthCard /></Suspense>
    </div>
  );
}
