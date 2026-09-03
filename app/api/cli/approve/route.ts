import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Device } from '@/lib/models/Device';

/** The logged-in user approves a pending device, binding it to their account (7-day token). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  await dbConnect();
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  if (!code) return NextResponse.json({ error: 'Missing code.' }, { status: 400 });

  const device = await Device.findOne({ code });
  if (!device) return NextResponse.json({ error: 'Unknown code.' }, { status: 404 });
  if (device.status === 'approved') return NextResponse.json({ ok: true, already: true });
  if (device.pairExpires.getTime() < Date.now()) {
    return NextResponse.json({ error: 'This code has expired. Run "leadjet link" again.' }, { status: 410 });
  }

  device.userId = session.user.id as unknown as (typeof device)['userId'];
  device.token = randomBytes(24).toString('hex');
  device.status = 'approved';
  device.tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await device.save();
  return NextResponse.json({ ok: true });
}
