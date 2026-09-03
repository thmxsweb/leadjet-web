'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Suspense, useState } from 'react';

function LoginForm() {
  const sp = useSearchParams();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const verified = sp.get('verified');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const res = await signIn('credentials', { email, password: pw, redirect: false });
    setBusy(false);
    if (res?.error) setErr('Invalid credentials, or your email is not verified yet.');
    else window.location.href = '/';
  }

  return (
    <form onSubmit={submit} className="auth-card">
      <div className="logo" style={{ padding: '0 0 6px' }}>lead<b>jet</b></div>
      <h1>Sign in</h1>
      {verified ? <div className="note ok">Email verified. You can sign in now.</div> : null}
      {err ? <div className="note bad">{err}</div> : null}
      <label>Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
      <label>Password</label>
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" required />
      <button className="btn red" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} disabled={busy}>{busy ? '...' : 'Sign in'}</button>
      <p className="alt">No account? <Link href="/signup">Create one</Link></p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-wrap">
      <Suspense><LoginForm /></Suspense>
    </div>
  );
}
