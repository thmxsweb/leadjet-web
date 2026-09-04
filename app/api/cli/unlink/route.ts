import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Device } from '@/lib/models/Device';

/** Unlink all CLIs from the signed-in account (revokes their tokens). */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  await dbConnect();
  const res = await Device.deleteMany({ userId: new Types.ObjectId(session.user.id) });
  return NextResponse.json({ ok: true, removed: res.deletedCount ?? 0 });
}
