import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Device } from '@/lib/models/Device';

/** CLI polls with its code + secret; once approved, it receives the 7-day token (once). */
export async function POST(req: Request) {
  await dbConnect();
  const { code, deviceSecret } = (await req.json().catch(() => ({}))) as {
    code?: string;
    deviceSecret?: string;
  };
  if (!code || !deviceSecret) return NextResponse.json({ error: 'Missing code/secret.' }, { status: 400 });

  const device = await Device.findOne({ code });
  if (!device || device.deviceSecret !== deviceSecret) {
    return NextResponse.json({ error: 'Invalid device.' }, { status: 403 });
  }
  if (device.status !== 'approved' || !device.token) {
    if (device.pairExpires.getTime() < Date.now()) {
      return NextResponse.json({ status: 'expired' }, { status: 410 });
    }
    return NextResponse.json({ status: 'pending' });
  }
  device.delivered = true;
  await device.save();
  return NextResponse.json({ status: 'approved', token: device.token, expiresAt: device.tokenExpires });
}
