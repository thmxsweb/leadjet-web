'use client';

import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { LANGS, useApp } from '@/lib/app-context';

function SunMoon({ theme }: { theme: string }) {
  return theme === 'dark' ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  );
}

export default function Topbar({ email, onRefresh }: { email: string; onRefresh: () => void }) {
  const { theme, toggleTheme, lang, setLang, t } = useApp();
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<null | 'profile' | 'settings'>(null);
  const [msg, setMsg] = useState('');

  async function unlink() {
    if (!confirm(t('unlink.confirm'))) return;
    const r = await fetch('/api/cli/unlink', { method: 'POST' });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? `${t('unlink.done')} (${d.removed ?? 0})` : d.error ?? 'Error');
    setMenuOpen(false);
    setModal(null);
    setTimeout(() => setMsg(''), 2500);
  }

  return (
    <header className="topbar">
      <div className="wm" style={{ fontSize: 18 }}>lead<span>jet</span></div>

      <div className="spacer" />
      {msg ? <span className="who ok">{msg}</span> : null}

      <button className="icon-btn" onClick={toggleTheme} title="Theme">
        <SunMoon theme={theme} />
      </button>

      <div className="menu-wrap">
        <button className="icon-btn wide" onClick={() => setLangOpen((v) => !v)} title="Language">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>
          <span>{lang.toUpperCase()}</span>
        </button>
        {langOpen ? (
          <>
            <div className="backdrop" onClick={() => setLangOpen(false)} />
            <div className="dropdown right">
              {LANGS.map((l) => (
                <button key={l.code} className={l.code === lang ? 'on' : ''} onClick={() => { setLang(l.code); setLangOpen(false); }}>{l.label}</button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="menu-wrap">
        <button className="user-btn" onClick={() => setMenuOpen((v) => !v)}>
          <span className="avatar">{(email[0] || 'u').toUpperCase()}</span>
          <span className="who">{email}</span>
        </button>
        {menuOpen ? (
          <>
            <div className="backdrop" onClick={() => setMenuOpen(false)} />
            <div className="dropdown right">
              <button onClick={() => { setModal('profile'); setMenuOpen(false); }}>{t('menu.profile')}</button>
              <button onClick={() => { onRefresh(); setMenuOpen(false); }}>{t('menu.refresh')}</button>
              <button onClick={unlink}>{t('menu.unlink')}</button>
              <button onClick={() => { setModal('settings'); setMenuOpen(false); }}>{t('menu.settings')}</button>
              <div className="sep" />
              <button className="danger" onClick={() => signOut({ callbackUrl: '/login' })}>{t('menu.signout')}</button>
            </div>
          </>
        ) : null}
      </div>

      {modal ? (
        <div className="scrim on" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal">
            <h3>{modal === 'profile' ? t('menu.profile') : t('menu.settings')}</h3>
            <div className="kv"><span>Email</span><b>{email}</b></div>
            <div className="kv"><span>Theme</span>
              <button className="chipbtn" onClick={toggleTheme}>{theme === 'dark' ? 'Dark' : 'Light'}</button>
            </div>
            <div className="kv"><span>Language</span>
              <div className="chiprow">{LANGS.map((l) => <button key={l.code} className={`chipbtn ${l.code === lang ? 'on' : ''}`} onClick={() => setLang(l.code)}>{l.code.toUpperCase()}</button>)}</div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={unlink}>{t('menu.unlink')}</button>
              <button className="btn red" onClick={() => setModal(null)}>OK</button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
