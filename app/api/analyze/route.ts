import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { analyzeLead, type AiProvider } from '@/lib/ai';
import { dbConnect } from '@/lib/db';
import { Lead } from '@/lib/models/Lead';
import { User } from '@/lib/models/User';

export const maxDuration = 60;

/** Analyze one stored lead with the user's configured AI provider. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const { key } = (await req.json().catch(() => ({}))) as { key?: string };
  if (!key) return NextResponse.json({ error: 'Missing lead key.' }, { status: 400 });

  await dbConnect();
  const u = await User.findById(session.user.id).lean();
  const provider: AiProvider = u?.aiProvider === 'claude' ? 'claude' : 'gemini';
  const apiKey = provider === 'claude' ? u?.anthropicKey : u?.geminiKey;
  if (!apiKey) {
    return NextResponse.json(
      { error: `No ${provider === 'claude' ? 'Claude' : 'Gemini'} API key. Add one in Settings.` },
      { status: 400 },
    );
  }

  const doc = await Lead.findOne({ userId: session.user.id, key }).lean();
  if (!doc) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });

  try {
    const analysis = await analyzeLead(provider, apiKey, (doc.data ?? {}) as Record<string, unknown>);
    const data = { ...(doc.data as Record<string, unknown>), ai: { ...analysis, provider, at: new Date().toISOString() } };
    await Lead.updateOne({ userId: session.user.id, key }, { $set: { data } });
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed.' },
      { status: 502 },
    );
  }
}
