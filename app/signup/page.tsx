'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: pw, name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setErr(data.error ?? 'Signup failed.');
      return;
    }
    window.location.href = '/login?created=1';
  }

  return (
    <div className="auth-wrap">
      <form onSubmit={submit} className="auth-card">
        <div className="logo" style={{ padding: '0 0 6px' }}>lead<b>jet</b></div>
        <h1>Create your account</h1>
        {err ? <div className="note bad">{err}</div> : null}
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        <label>Password</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="at least 8 characters" required />
        <button className="btn red" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} disabled={busy}>{busy ? '...' : 'Create account'}</button>
        <p className="alt">Already have an account? <Link href="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
