import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models/User';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  await dbConnect();
  const u = await User.findById(session.user.id).lean();
  return NextResponse.json({
    jump: { email: u?.jumpEmail ?? '', connected: Boolean(u?.jumpEmail && u?.jumpPassword) },
    cvcrush: { connected: Boolean(u?.cvcrushConnected) },
    ai: {
      provider: u?.aiProvider ?? '',
      gemini: Boolean(u?.geminiKey),
      claude: Boolean(u?.anthropicKey),
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    provider?: string; email?: string; password?: string; disconnect?: boolean;
    aiProvider?: string; key?: string;
  };
  await dbConnect();

  if (body.provider === 'ai') {
    const which = body.aiProvider === 'claude' ? 'claude' : 'gemini';
    const field = which === 'claude' ? 'anthropicKey' : 'geminiKey';
    if (body.disconnect) {
      await User.updateOne({ _id: session.user.id }, { $unset: { [field]: '' } });
      return NextResponse.json({ ok: true });
    }
    if (!body.key) return NextResponse.json({ error: 'API key required.' }, { status: 400 });
    await User.updateOne(
      { _id: session.user.id },
      { $set: { [field]: body.key.trim(), aiProvider: which } },
    );
    return NextResponse.json({ ok: true });
  }

  if (body.provider === 'jump') {
    if (body.disconnect) {
      await User.updateOne({ _id: session.user.id }, { $unset: { jumpEmail: '', jumpPassword: '' } });
      return NextResponse.json({ ok: true });
    }
    if (!body.email || !body.password) return NextResponse.json({ error: 'Email and password required.' }, { status: 400 });
    await User.updateOne({ _id: session.user.id }, { $set: { jumpEmail: body.email, jumpPassword: body.password } });
    return NextResponse.json({ ok: true });
  }
  if (body.provider === 'cvcrush') {
    await User.updateOne({ _id: session.user.id }, { $set: { cvcrushConnected: !body.disconnect } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Unknown provider.' }, { status: 400 });
}
