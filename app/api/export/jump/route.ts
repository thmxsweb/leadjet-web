import { JumpClient } from '@thmxsweb/jj-sdk';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Lead } from '@/lib/models/Lead';
import { User } from '@/lib/models/User';
import { cpOf, resolveSiret } from '@/lib/registry';

export const maxDuration = 60;

const S = (d: Record<string, unknown>, k: string): string => (d[k] == null ? '' : String(d[k]));

/**
 * Map a lead to a Join-Jump *enterprise* client body.
 * The API requires type, label, siret, vat_number, vat_rate and a complete
 * address (country/street/city/zip). Leads without a SIRET or address can't be
 * created as companies, so they're skipped with a reason.
 */
function toClientBody(d: Record<string, unknown>): { body?: Record<string, unknown>; skip?: string; label: string } {
  const label = S(d, 'legal') || S(d, 'name');
  const siret = S(d, 'siret').replace(/\s/g, '');
  const street = S(d, 'regAddress') || S(d, 'location');
  const city = S(d, 'regCity');
  const zip = S(d, 'regCp') || (S(d, 'location').match(/\b(\d{5})\b/)?.[1] ?? '');
  const vat = S(d, 'vat');
  if (!label) return { skip: 'no name', label: '(unnamed)' };
  if (!/^\d{14}$/.test(siret)) return { skip: 'no SIRET', label };
  if (!street || !city || !/^\d{5}$/.test(zip)) return { skip: 'incomplete address', label };
  return {
    label,
    body: {
      type: 'enterprise',
      label,
      siret,
      vat_number: vat || null,
      vat_rate: 2000,
      address: { country: 'FR', street, city, zip_code: zip },
    },
  };
}

/** Export selected leads to the user's Join-Jump client list (dedup by SIRET/name). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const { keys } = (await req.json().catch(() => ({}))) as { keys?: string[] };
  const list = Array.isArray(keys) ? keys.slice(0, 60) : [];
  if (!list.length) return NextResponse.json({ error: 'No leads selected.' }, { status: 400 });

  await dbConnect();
  const u = await User.findById(session.user.id).lean();
  if (!u?.jumpEmail || !u?.jumpPassword) {
    return NextResponse.json({ error: 'Connect Join-Jump in Settings first.' }, { status: 400 });
  }

  const docs = await Lead.find({ userId: session.user.id, key: { $in: list } }).lean();
  if (!docs.length) return NextResponse.json({ error: 'Leads not found.' }, { status: 404 });

  const jump = new JumpClient({ credentials: { email: u.jumpEmail, password: u.jumpPassword } });

  let created = 0;
  let already = 0;
  let resolved = 0;
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const doc of docs) {
    const data = (doc.data ?? {}) as Record<string, unknown>;

    // If the SIRET or address is missing, resolve it live from the French registry.
    const hasSiret = /^\d{14}$/.test(S(data, 'siret').replace(/\s/g, ''));
    const hasAddr = Boolean((S(data, 'regAddress') || S(data, 'location')) && S(data, 'regCity') && (S(data, 'regCp') || cpOf(S(data, 'location'))));
    if (!hasSiret || !hasAddr) {
      const name = S(data, 'legal') || S(data, 'name');
      const cp = S(data, 'regCp') || cpOf(S(data, 'location'));
      const city = S(data, 'regCity');
      const street = S(data, 'regAddress') || S(data, 'location');
      const match = await resolveSiret(name, cp || undefined, city || undefined, street || undefined);
      if (match) {
        data.siret = data.siret || match.siret;
        data.siren = data.siren || match.siren;
        data.vat = data.vat || match.vat;
        data.regAddress = S(data, 'regAddress') || match.street;
        data.regCity = S(data, 'regCity') || match.city;
        data.regCp = S(data, 'regCp') || match.cp;
        resolved += 1;
        // Persist so the dashboard shows it and future exports skip the lookup.
        await Lead.updateOne({ userId: session.user.id, key: doc.key }, { $set: { data } });
      }
    }

    const m = toClientBody(data);
    if (m.skip || !m.body) { skipped.push(`${m.label}: ${m.skip}`); continue; }
    try {
      const found = await jump.missions.searchClients({ query: m.label });
      const siret = m.body.siret as string;
      const dup = found.clients?.some(
        (c) => (c.siret && c.siret === siret) || String(c.label ?? '').toLowerCase() === m.label.toLowerCase(),
      );
      if (dup) { already += 1; continue; }
      await jump.missions.createClient(m.body);
      created += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'failed';
      errors.push(`${m.label}: ${msg}`);
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    already,
    resolved,
    skipped: skipped.length,
    errors: errors.slice(0, 5),
    skippedDetail: skipped.slice(0, 8),
  });
}
