import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models/User';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  await dbConnect();
  const u = await User.findById(session.user.id).lean();
  if (!u) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({
    email: u.email, name: u.name ?? '', fullName: u.fullName ?? '',
    dob: u.dob ?? '', phone: u.phone ?? '', image: u.image ?? '',
  });
}

const schema = z.object({
  fullName: z.string().max(120).optional(),
  dob: z.string().max(20).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional(),
  image: z.string().max(400000).optional(), // small data URL
});

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const p = schema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: 'Invalid data.' }, { status: 400 });
  await dbConnect();

  if (p.data.email) {
    const clash = await User.findOne({ email: p.data.email.toLowerCase(), _id: { $ne: session.user.id } }).lean();
    if (clash) return NextResponse.json({ error: 'That email is already in use.' }, { status: 409 });
  }
  const set: Record<string, string> = {};
  for (const k of ['fullName', 'dob', 'phone', 'image'] as const) {
    if (p.data[k] !== undefined) set[k] = p.data[k] as string;
  }
  if (p.data.email) set.email = p.data.email.toLowerCase();
  await User.updateOne({ _id: session.user.id }, { $set: set });
  return NextResponse.json({ ok: true });
}
