import { type AnyBulkWriteOperation, Types } from 'mongoose';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { bearerUserId } from '@/lib/deviceAuth';
import { Lead, type LeadDoc } from '@/lib/models/Lead';

interface IncomingLead {
  place_id?: string;
  name?: string;
  location?: string;
  score?: number;
  priority?: string;
  source?: string;
  [k: string]: unknown;
}

/** CLI pushes enriched leads to the account (auth: 7-day device Bearer token). */
export async function POST(req: Request) {
  const userId = await bearerUserId(req);
  if (!userId) return NextResponse.json({ error: 'Invalid or expired CLI token. Run "leadjet link".' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { leads?: IncomingLead[] };
  const leads = Array.isArray(body.leads) ? body.leads : [];
  if (!leads.length) return NextResponse.json({ error: 'No leads.' }, { status: 400 });

  await dbConnect();
  const uid = new Types.ObjectId(userId);
  const ops: AnyBulkWriteOperation<LeadDoc>[] = leads.map((l) => {
    const key = String(l.place_id || `${l.name ?? ''}|${l.location ?? ''}`);
    return {
      updateOne: {
        filter: { userId: uid, key },
        update: {
          $set: {
            userId: uid,
            key,
            name: String(l.name ?? ''),
            score: Number(l.score ?? 0),
            priority: String(l.priority ?? ''),
            source: String(l.source ?? ''),
            data: l,
          },
        },
        upsert: true,
      },
    };
  });
  const res = await Lead.bulkWrite(ops, { ordered: false });
  const added = res.upsertedCount ?? 0;
  const total = await Lead.countDocuments({ userId: uid });
  return NextResponse.json({ ok: true, added, updated: leads.length - added, total });
}

/** Dashboard reads the account's leads. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  await dbConnect();
  const docs = await Lead.find({ userId: session.user.id }).sort({ score: -1 }).limit(2000).lean();
  return NextResponse.json({ leads: docs.map((d) => d.data) });
}
