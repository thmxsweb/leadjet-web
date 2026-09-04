import { JumpClient } from '@thmxsweb/jj-sdk';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Lead } from '@/lib/models/Lead';
import { User } from '@/lib/models/User';

export const maxDuration = 60;

const str = (v: unknown): string => (v == null ? '' : String(v));

/** Export selected leads to the user's Join-Jump client list (dedup by name). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const { keys } = (await req.json().catch(() => ({}))) as { keys?: string[] };
  const list = Array.isArray(keys) ? keys.slice(0, 100) : [];
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
  let skipped = 0;
  const errors: string[] = [];

  for (const doc of docs) {
    const data = (doc.data ?? {}) as Record<string, unknown>;
    const name = str(data.legal) || str(data.name) || str(doc.name);
    if (!name) { skipped += 1; continue; }
    try {
      const found = await jump.missions.searchClients({ query: name });
      const exists = found.clients?.some((c) => str(c.name).toLowerCase() === name.toLowerCase());
      if (exists) { skipped += 1; continue; }
      await jump.missions.createClient({ name });
      created += 1;
    } catch (err) {
      errors.push(`${name}: ${err instanceof Error ? err.message : 'failed'}`);
    }
  }

  return NextResponse.json({ ok: true, created, skipped, errors: errors.slice(0, 5) });
}
