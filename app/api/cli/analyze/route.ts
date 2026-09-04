import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { bearerUserId } from '@/lib/deviceAuth';
import { Lead } from '@/lib/models/Lead';

interface AnalysisIn {
  key?: string;
  fitScore?: number;
  verdict?: string;
  reasons?: string[];
  pitchAngle?: string;
  estBudget?: string;
  outreach?: string;
}

/**
 * CLI/MCP: save an AI analysis onto a lead (auth: 7-day device Bearer token).
 * The connected AI agent (e.g. Claude on a Pro/Max plan) does the reasoning and
 * writes the result back here so it shows on the dashboard.
 */
export async function POST(req: Request) {
  const userId = await bearerUserId(req);
  if (!userId) return NextResponse.json({ error: 'Invalid or expired CLI token. Run "leadjet link".' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { analyses?: AnalysisIn[] } & AnalysisIn;
  const items: AnalysisIn[] = Array.isArray(body.analyses) ? body.analyses : body.key ? [body] : [];
  if (!items.length) return NextResponse.json({ error: 'No analyses provided.' }, { status: 400 });

  await dbConnect();
  let saved = 0;
  for (const a of items) {
    if (!a.key) continue;
    const doc = await Lead.findOne({ userId, key: a.key }).lean();
    if (!doc) continue;
    const ai = {
      fitScore: Math.max(0, Math.min(100, Number(a.fitScore) || 0)),
      verdict: String(a.verdict ?? ''),
      reasons: Array.isArray(a.reasons) ? a.reasons.map(String).slice(0, 6) : [],
      pitchAngle: String(a.pitchAngle ?? ''),
      estBudget: String(a.estBudget ?? ''),
      outreach: String(a.outreach ?? ''),
      provider: 'mcp',
      at: new Date().toISOString(),
    };
    const data = { ...(doc.data as Record<string, unknown>), ai };
    await Lead.updateOne({ userId, key: a.key }, { $set: { data } });
    saved += 1;
  }
  return NextResponse.json({ ok: true, saved });
}
