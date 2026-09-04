/**
 * AI lead analysis. Bring-your-own-key: Gemini (free tier) or Anthropic (paid).
 * Runs server-side only — keys never reach the browser.
 */

export type AiProvider = 'gemini' | 'claude';

export interface LeadAnalysis {
  fitScore: number; // 0-100, how good a prospect for a freelance web dev
  verdict: string; // one-line take
  reasons: string[]; // 2-4 bullet reasons
  pitchAngle: string; // the angle to sell on
  estBudget: string; // e.g. "2 000 – 3 500 €"
  outreach: string; // ready-to-send first message (French), personalized
}

const GEMINI_MODEL = 'gemini-2.0-flash';
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

function buildPrompt(lead: Record<string, unknown>): string {
  const s = (k: string): string => (lead[k] == null ? '' : String(lead[k]));
  const facts = [
    `Nom: ${s('name') || '—'}`,
    `Raison sociale: ${s('legal') || '—'}`,
    `Activité: ${s('activity') || '—'}`,
    `Dirigeant: ${s('owner')}${s('role') ? ` (${s('role')})` : ''}`,
    `Téléphone: ${s('phone') || '—'}`,
    `Email: ${s('email') || '—'}`,
    `Site web: ${s('website') || 'aucun'}`,
    `État du site: ${s('siteStatus') || '—'}`,
    `Opportunité détectée: ${s('opportunity') || '—'}`,
    `Score interne: ${s('score')}/100 (${s('priority')})`,
    `Forme juridique: ${s('legalForm') || '—'}`,
    `Effectif: ${s('size') || '—'}`,
    `Créée en: ${s('created') || '—'}`,
    `Localisation: ${s('location') || '—'}`,
    `SIRET: ${s('siret') || '—'} · TVA: ${s('vat') || '—'}`,
  ].join('\n');

  return `Tu es un stratège commercial pour un développeur web freelance (sites vitrines, e-commerce, refontes, SEO) basé en France.
Analyse ce prospect et réponds UNIQUEMENT en JSON valide, sans texte autour, avec exactement ces clés:
{
  "fitScore": number (0-100, à quel point c'est un bon prospect pour du dev web),
  "verdict": string (une phrase, franc et concret),
  "reasons": string[] (2 à 4 raisons courtes),
  "pitchAngle": string (l'angle d'accroche à utiliser),
  "estBudget": string (fourchette réaliste en euros, ex: "2 000 – 3 500 €"),
  "outreach": string (un premier message de prospection en français, prêt à envoyer, personnalisé, 3-5 phrases, ton humain et direct, pas de blabla marketing, tutoiement ou vouvoiement selon le contexte pro)
}

Prospect:
${facts}`;
}

function parseJson(text: string): LeadAnalysis {
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  const raw = JSON.parse(slice) as Partial<LeadAnalysis>;
  return {
    fitScore: Math.max(0, Math.min(100, Number(raw.fitScore) || 0)),
    verdict: String(raw.verdict ?? ''),
    reasons: Array.isArray(raw.reasons) ? raw.reasons.map(String).slice(0, 4) : [],
    pitchAngle: String(raw.pitchAngle ?? ''),
    estBudget: String(raw.estBudget ?? ''),
    outreach: String(raw.outreach ?? ''),
  };
}

async function callGemini(key: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callClaude(key: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Claude ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as { content?: { text?: string }[] };
  return data.content?.[0]?.text ?? '';
}

export async function analyzeLead(
  provider: AiProvider,
  key: string,
  lead: Record<string, unknown>,
): Promise<LeadAnalysis> {
  const prompt = buildPrompt(lead);
  const text = provider === 'claude' ? await callClaude(key, prompt) : await callGemini(key, prompt);
  if (!text.trim()) throw new Error('Empty response from the AI provider.');
  return parseJson(text);
}
