/**
 * Estimate the deal value a lead could realistically pay for web work.
 * Heuristic, computed from data we already have (need + company profile).
 * Clearly an estimate — shown as a range with a €/€€/€€€ tier.
 */

const YEAR = 2026;

export interface BudgetEstimate {
  low: number;
  high: number;
  mid: number;
  /** '€' | '€€' | '€€€' */
  tier: string;
  /** e.g. "1 800 – 3 200 €" */
  label: string;
}

type Lead = Record<string, unknown>;
const str = (v: unknown): string => (v == null ? '' : String(v));

/** Base range (EUR) driven by the kind of web work the lead needs. */
function baseRange(lead: Lead): [number, number] {
  const opp = str(lead.opportunity).toLowerCase();
  const status = str(lead.siteStatus).toLowerCase();
  const hasSite = Boolean(str(lead.website));
  if (opp.includes('création') || opp.includes('creation') || !hasSite || status.includes('aucun') || status.includes('réseau'))
    return [1500, 4500];
  if (opp.includes('mort') || status.includes('hors ligne')) return [1400, 3800];
  if (opp.includes('builder')) return [1200, 3200];
  if (opp.includes('responsive') || opp.includes('https')) return [900, 2400];
  if (opp.includes('correct')) return [400, 1200];
  return [800, 2500];
}

/** Bigger, older, more structured companies can spend more. */
function multiplier(lead: Lead): number {
  const size = str(lead.size).toLowerCase();
  let m = 0.95;
  if (size.includes('0 salarié')) m = 0.85;
  else if (/^1-2|^3-5|1-2|3-5/.test(size)) m = 1.0;
  else if (/6-9|10-19/.test(size)) m = 1.25;
  else if (/20-49/.test(size)) m = 1.6;
  else if (/50-99|100-|200-|250-|500-/.test(size)) m = 2.1;

  const created = Number(str(lead.created));
  if (created) {
    const age = YEAR - created;
    if (age >= 10) m *= 1.12;
    else if (age >= 3) m *= 1.04;
  }

  const legal = str(lead.legalForm).toLowerCase();
  if (/sas|sasu|sarl|eurl|\bsa\b|snc/.test(legal)) m *= 1.08;
  else if (/individuel|\bei\b|auto|association/.test(legal)) m *= 0.85;

  return Math.max(0.7, Math.min(2.5, m));
}

const round100 = (n: number): number => Math.round(n / 100) * 100;
const fmtEur = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export function estimateBudget(lead: Lead): BudgetEstimate {
  const [bl, bh] = baseRange(lead);
  const m = multiplier(lead);
  const low = round100(bl * m);
  const high = round100(bh * m);
  const mid = Math.round((low + high) / 2);
  const tier = mid < 1200 ? '€' : mid < 2800 ? '€€' : '€€€';
  return { low, high, mid, tier, label: `${fmtEur(low)} – ${fmtEur(high)} €` };
}
