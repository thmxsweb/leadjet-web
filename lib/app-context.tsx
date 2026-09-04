'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'en' | 'fr' | 'es';
export type Theme = 'dark' | 'light';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
];

const DICT: Record<Lang, Record<string, string>> = {
  en: {
    'menu.profile': 'Profile', 'menu.refresh': 'Refresh', 'menu.unlink': 'Unlink CLI',
    'menu.settings': 'Settings', 'menu.signout': 'Sign out',
    'install.title': 'Install the leadjet CLI', 'install.sub': 'Pick your installer, then link this account. Your leads appear here after you push.',
    'install.downloadFor': 'Download for', 'install.detected': 'detected', 'install.orNpm': 'or with npm (needs Node 18+)',
    'install.copy': 'Copy', 'install.copied': 'Copied',
    'step.link': 'Link this account', 'step.linkNote': 'valid 7 days', 'step.push': 'Find & push leads',
    'empty.refresh': 'I have pushed leads — Refresh',
    'kpi.leads': 'leads', 'kpi.hot': 'hot', 'kpi.phone': 'phone', 'kpi.email': 'email',
    'tbl.score': 'Score', 'tbl.company': 'Company', 'tbl.activity': 'Activity', 'tbl.owner': 'Owner',
    'tbl.phone': 'Phone', 'tbl.email': 'Email', 'tbl.domain': 'Domain', 'tbl.opportunity': 'Opportunity', 'tbl.location': 'Location',
    'filter.ph': 'Filter…', 'filter.all': 'All priorities', 'exportCsv': 'Export CSV',
    'unlink.confirm': 'Unlink all CLIs from this account? They will need to run "leadjet link" again.',
    'unlink.done': 'CLI unlinked.',
  },
  fr: {
    'menu.profile': 'Profil', 'menu.refresh': 'Actualiser', 'menu.unlink': 'Délier le CLI',
    'menu.settings': 'Réglages', 'menu.signout': 'Déconnexion',
    'install.title': 'Installer le CLI leadjet', 'install.sub': "Choisis ton installeur, puis lie ce compte. Tes leads apparaissent ici après le push.",
    'install.downloadFor': 'Télécharger pour', 'install.detected': 'détecté', 'install.orNpm': 'ou avec npm (Node 18+)',
    'install.copy': 'Copier', 'install.copied': 'Copié',
    'step.link': 'Lier ce compte', 'step.linkNote': 'valable 7 jours', 'step.push': 'Trouver & pousser les leads',
    'empty.refresh': "J'ai poussé des leads — Actualiser",
    'kpi.leads': 'leads', 'kpi.hot': 'chaud', 'kpi.phone': 'téléphone', 'kpi.email': 'email',
    'tbl.score': 'Score', 'tbl.company': 'Entreprise', 'tbl.activity': 'Activité', 'tbl.owner': 'Propriétaire',
    'tbl.phone': 'Tél', 'tbl.email': 'Email', 'tbl.domain': 'Domaine', 'tbl.opportunity': 'Opportunité', 'tbl.location': 'Lieu',
    'filter.ph': 'Filtrer…', 'filter.all': 'Toutes priorités', 'exportCsv': 'Export CSV',
    'unlink.confirm': 'Délier tous les CLI de ce compte ? Ils devront relancer « leadjet link ».',
    'unlink.done': 'CLI délié.',
  },
  es: {
    'menu.profile': 'Perfil', 'menu.refresh': 'Actualizar', 'menu.unlink': 'Desvincular CLI',
    'menu.settings': 'Ajustes', 'menu.signout': 'Cerrar sesión',
    'install.title': 'Instala el CLI de leadjet', 'install.sub': 'Elige tu instalador, luego vincula esta cuenta. Tus leads aparecen aquí tras el push.',
    'install.downloadFor': 'Descargar para', 'install.detected': 'detectado', 'install.orNpm': 'o con npm (Node 18+)',
    'install.copy': 'Copiar', 'install.copied': 'Copiado',
    'step.link': 'Vincular esta cuenta', 'step.linkNote': 'válido 7 días', 'step.push': 'Buscar y enviar leads',
    'empty.refresh': 'He enviado leads — Actualizar',
    'kpi.leads': 'leads', 'kpi.hot': 'calientes', 'kpi.phone': 'teléfono', 'kpi.email': 'email',
    'tbl.score': 'Puntuación', 'tbl.company': 'Empresa', 'tbl.activity': 'Actividad', 'tbl.owner': 'Propietario',
    'tbl.phone': 'Tel', 'tbl.email': 'Email', 'tbl.domain': 'Dominio', 'tbl.opportunity': 'Oportunidad', 'tbl.location': 'Lugar',
    'filter.ph': 'Filtrar…', 'filter.all': 'Todas las prioridades', 'exportCsv': 'Exportar CSV',
    'unlink.confirm': '¿Desvincular todos los CLI de esta cuenta? Tendrán que ejecutar «leadjet link» de nuevo.',
    'unlink.done': 'CLI desvinculado.',
  },
};

interface AppCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: (key: string) => string;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    try {
      const l = localStorage.getItem('lj_lang') as Lang | null;
      if (l && DICT[l]) setLangState(l);
      else {
        const nav = (navigator.language || 'en').slice(0, 2) as Lang;
        if (DICT[nav]) setLangState(nav);
      }
      const th = (localStorage.getItem('lj_theme') as Theme | null) ?? 'dark';
      setThemeState(th);
      document.documentElement.dataset.theme = th;
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('lj_lang', l); } catch { /* ignore */ }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('lj_theme', next); } catch { /* ignore */ }
      document.documentElement.dataset.theme = next;
      return next;
    });
  }, []);

  const t = useCallback((key: string) => DICT[lang][key] ?? DICT.en[key] ?? key, [lang]);

  const value = useMemo(() => ({ lang, setLang, theme, toggleTheme, t }), [lang, setLang, theme, toggleTheme, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used within AppProvider');
  return c;
}
