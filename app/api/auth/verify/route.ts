import { NextResponse } from 'next/server';
import { consumeVerifyToken } from '@/lib/tokens';
import { markVerified } from '@/lib/users';

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const token = new URL(req.url).searchParams.get('token') ?? '';
  try {
    const email = await consumeVerifyToken(token);
    if (!email) return NextResponse.redirect(`${base}/login?error=verify`);
    await markVerified(email);
    return NextResponse.redirect(`${base}/login?verified=1`);
  } catch {
    return NextResponse.redirect(`${base}/login?error=verify`);
  }
}
