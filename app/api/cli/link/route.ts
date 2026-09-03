import { randomBytes, randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Device } from '@/lib/models/Device';

/** CLI starts pairing: creates a pending device and returns the approval URL. */
export async function POST(req: Request) {
  await dbConnect();
  const body = (await req.json().catch(() => ({}))) as { label?: string };
  const hex = randomBytes(4).toString('hex').toUpperCase();
  const code = `${hex.slice(0, 4)}-${hex.slice(4)}`;
  const deviceSecret = randomUUID();
  await Device.create({
    code,
    deviceSecret,
    status: 'pending',
    ...(body.label ? { label: body.label } : {}),
    pairExpires: new Date(Date.now() + 10 * 60 * 1000),
  });
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return NextResponse.json({ code, deviceSecret, verifyUrl: `${base}/link?code=${code}` });
}
