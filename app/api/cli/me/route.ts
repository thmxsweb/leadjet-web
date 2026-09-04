import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Device } from '@/lib/models/Device';
import { User } from '@/lib/models/User';

/** CLI checks its link: returns the linked account email + token expiry. */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return NextResponse.json({ error: 'No token.' }, { status: 401 });
  await dbConnect();
  const device = await Device.findOne({ token, status: 'approved' });
  if (!device || !device.userId || (device.tokenExpires && device.tokenExpires.getTime() < Date.now())) {
    return NextResponse.json({ error: 'Invalid or expired.' }, { status: 401 });
  }
  const user = await User.findById(device.userId).lean();
  return NextResponse.json({ email: user?.email ?? '', expiresAt: device.tokenExpires });
}
