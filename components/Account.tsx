'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/app-context';
import Topbar from './Topbar';

interface Profile { email: string; fullName: string; dob: string; phone: string; image: string }

export default function Account({ email }: { email: string }) {
  const { t } = useApp();
  const [p, setP] = useState<Profile>({ email, fullName: '', dob: '', phone: '', image: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/profile').then((r) => r.json()).then((d) => { if (!d.error) setP((x) => ({ ...x, ...d })); }).catch(() => {});
  }, []);

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = String(reader.result); };
    img.onload = () => {
      const s = 256;
      const c = document.createElement('canvas');
      c.width = s; c.height = s;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      const scale = Math.max(s / img.width, s / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
      setP((x) => ({ ...x, image: c.toDataURL('image/jpeg', 0.85) }));
    };
    reader.readAsDataURL(f);
  }

  async function save() {
    setBusy(true); setMsg('');
    const r = await fetch('/api/profile', {
      method: 'PUT', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: p.fullName, dob: p.dob, phone: p.phone, email: p.email, image: p.image }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg(r.ok ? 'Saved.' : d.error ?? 'Error');
    setTimeout(() => setMsg(''), 2500);
  }

  return (
    <div className="shell">
      <Topbar email={email} />
      <main className="content">
        <div className="panel card pad">
          <h1 className="ph1">{t('menu.profile')}</h1>
          {msg ? <div className="note ok" style={{ marginBottom: 12 }}>{msg}</div> : null}

          <div className="avatar-row">
            {p.image ? <img className="avatar-lg" src={p.image} alt="" /> : <div className="avatar-lg ph">{(p.fullName[0] || email[0] || 'u').toUpperCase()}</div>}
            <div>
              <button className="btn" onClick={() => fileRef.current?.click()}>Change picture</button>
              {p.image ? <button className="btn" style={{ marginLeft: 8 }} onClick={() => setP((x) => ({ ...x, image: '' }))}>Remove</button> : null}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
            </div>
          </div>

          <div className="fld"><label>Full name</label><input value={p.fullName} onChange={(e) => setP({ ...p, fullName: e.target.value })} placeholder="Your full name" /></div>
          <div className="fld"><label>Date of birth</label><input type="date" value={p.dob} onChange={(e) => setP({ ...p, dob: e.target.value })} /></div>
          <div className="fld"><label>Email</label><input type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} /></div>
          <div className="fld"><label>Phone</label><input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} placeholder="+33 ..." /></div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn red" onClick={save} disabled={busy}>{busy ? '…' : 'Save changes'}</button>
            <a className="btn" href="/">Back to dashboard</a>
          </div>
        </div>
      </main>
    </div>
  );
}
