import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createUser, getUserByEmail } from '@/lib/users';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email and a password of at least 8 characters.' }, { status: 400 });
  }
  const { email, password, name } = parsed.data;
  try {
    if (await getUserByEmail(email)) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    const hash = await bcrypt.hash(password, 10);
    await createUser(email, hash, name);
    // Email verification is disabled for now (no sending domain) — account is active.
    return NextResponse.json({ ok: true, verified: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Signup failed.' }, { status: 500 });
  }
}
