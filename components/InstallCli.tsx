'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/app-context';

const REL = 'https://github.com/thmxsweb/leadjet/releases/latest/download';
const NPM = 'npm i -g @thmxsweb/leadjet';

const OPTIONS = [
  { key: 'win', label: 'Windows', sub: 'leadjet-win.exe', href: `${REL}/leadjet-win.exe` },
  { key: 'mac', label: 'macOS', sub: 'leadjet-macos', href: `${REL}/leadjet-macos` },
  { key: 'linux', label: 'Linux', sub: 'leadjet-linux', href: `${REL}/leadjet-linux` },
];

function detectOs(): string {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent;
  if (/Win/i.test(ua)) return 'win';
  if (/Mac/i.test(ua)) return 'mac';
  if (/Linux|X11|Android/i.test(ua)) return 'linux';
  return '';
}

export default function InstallCli() {
  const { t } = useApp();
  const [os, setOs] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => setOs(detectOs()), []);

  const ordered = [...OPTIONS].sort((a, b) => (a.key === os ? -1 : b.key === os ? 1 : 0));

  async function copyNpm() {
    try {
      await navigator.clipboard.writeText(NPM);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="install">
      <div className="dl-row">
        {ordered.map((o) => (
          <a key={o.key} href={o.href} className={`dl ${o.key === os ? 'primary' : ''}`}>
            <span className="dl-os">{t('install.downloadFor')} {o.label}</span>
            <span className="dl-sub">{o.sub}{o.key === os ? ` · ${t('install.detected')}` : ''}</span>
          </a>
        ))}
      </div>
      <div className="or">{t('install.orNpm')}</div>
      <div className="npm">
        <code>{NPM}</code>
        <button className="btn" onClick={copyNpm}>{copied ? t('install.copied') : t('install.copy')}</button>
      </div>
    </div>
  );
}
