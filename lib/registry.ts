/**
 * Resolve a business to its SIRET via the official French registry
 * (recherche-entreprises.api.gouv.fr — the free INSEE Sirene + INPI RNE
 * aggregator that also powers Pappers / Societe.com).
 *
 * Correctness first: we match the LOCAL establishment at the lead's postcode
 * (not the head office) and require a name/enseigne similarity, so we never
 * attach a wrong SIRET (which would invoice the wrong legal entity).
 */

const API = 'https://recherche-entreprises.api.gouv.fr/search';
const STOP = new Set(['les', 'des', 'une', 'and', 'the', 'sarl', 'sas', 'eurl', 'sasu', 'snc', 'sci', 'sa', 'chez', 'aux']);

const norm = (s: string): string => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const toks = (s: string): string[] => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w));
export const cpOf = (s: string): string => (s || '').match(/\b(\d{5})\b/)?.[1] ?? '';
const titleCase = (s: string): string => (s || '').toLowerCase().replace(/\b([a-zà-ÿ])/g, (m) => m.toUpperCase());

function frVat(siren: string): string {
  if (!/^\d{9}$/.test(siren)) return '';
  const k = (12 + 3 * (Number(siren) % 97)) % 97;
  return `FR${String(k).padStart(2, '0')}${siren}`;
}

function nameScore(query: string, cand: string): number {
  const q = toks(query);
  const c = new Set(toks(cand));
  if (!q.length) return 0;
  return q.filter((t) => c.has(t)).length / q.length;
}

export interface RegistryMatch {
  siren: string;
  siret: string;
  vat: string;
  legalName: string;
  street: string;
  city: string;
  cp: string;
  confidence: 'high' | 'medium';
}

interface Etab { siret?: string; code_postal?: string; libelle_commune?: string; adresse?: string; liste_enseignes?: string[] }
interface Result {
  siren?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  siege?: Etab;
  matching_etablissements?: Etab[];
}

async function search(name: string, cp?: string): Promise<Result[]> {
  const p = new URLSearchParams({ q: name, per_page: '10' });
  if (cp) p.set('code_postal', cp);
  try {
    const r = await fetch(`${API}?${p.toString()}`, { headers: { accept: 'application/json' } });
    if (!r.ok) return [];
    return ((await r.json()) as { results?: Result[] }).results ?? [];
  } catch {
    return [];
  }
}

/** Resolve the local establishment SIRET for a business, or null if not confident. */
export async function resolveSiret(name: string, cp?: string, city?: string): Promise<RegistryMatch | null> {
  if (!name || (!cp && !city)) return null;
  const results = await search(name, cp);
  let best: (RegistryMatch & { score: number; atCp: boolean }) | null = null;

  for (const e of results) {
    const enseignes = (e.matching_etablissements ?? []).flatMap((x) => x.liste_enseignes ?? []);
    const names = [e.nom_complet, e.nom_raison_sociale, ...enseignes].filter(Boolean).join(' ');
    const score = nameScore(name, names);

    const etabs = e.matching_etablissements ?? [];
    let etab: Etab | undefined = cp ? etabs.find((x) => x.code_postal === cp) : undefined;
    if (!etab && city) etab = etabs.find((x) => norm(x.libelle_commune ?? '') === norm(city));
    if (!etab && e.siege && (e.siege.code_postal === cp || (!cp && city && norm(e.siege.libelle_commune ?? '') === norm(city)))) etab = e.siege;
    if (!etab) etab = etabs[0] ?? e.siege;
    if (!etab?.siret) continue;

    const atCp = Boolean(cp && etab.code_postal === cp);
    const cityOk = Boolean(city && norm(etab.libelle_commune ?? '') === norm(city));
    // Accept only with a real location + name signal.
    const locOk = cp ? atCp : cityOk;
    const nameOk = score >= 0.5 || (score > 0 && results.length === 1);
    if (!locOk || !nameOk) continue;

    const cand = {
      siren: e.siren ?? '',
      siret: etab.siret,
      vat: frVat(e.siren ?? ''),
      legalName: e.nom_complet ?? name,
      street: etab.adresse ?? e.siege?.adresse ?? '',
      city: titleCase(etab.libelle_commune ?? city ?? ''),
      cp: etab.code_postal ?? cp ?? '',
      confidence: (atCp ? 'high' : 'medium') as 'high' | 'medium',
      score,
      atCp,
    };
    if (!best || cand.score > best.score || (cand.atCp && !best.atCp)) best = cand;
  }
  if (!best) return null;
  const { score: _s, atCp: _a, ...match } = best;
  return match;
}
