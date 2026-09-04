import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { bearerUserId } from '@/lib/deviceAuth';
import { Lead } from '@/lib/models/Lead';

/** CLI/MCP: list the linked account's leads (auth: 7-day device Bearer token). */
export async function GET(req: Request) {
  const userId = await bearerUserId(req);
  if (!userId) return NextResponse.json({ error: 'Invalid or expired CLI token. Run "leadjet link".' }, { status: 401 });

  await dbConnect();
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 200, 1000);
  const onlyNew = url.searchParams.get('unanalyzed') === '1';

  const docs = await Lead.find({ userId }).sort({ score: -1 }).limit(limit).lean();
  const leads = docs
    .map((d) => ({ key: d.key, ...(d.data as Record<string, unknown>) }))
    .filter((l) => !onlyNew || !(l as { ai?: unknown }).ai);
  return NextResponse.json({ leads });
}
