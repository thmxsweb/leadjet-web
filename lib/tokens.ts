import { randomUUID } from 'crypto';
import { col } from './mongo';

interface VerifyTokenDoc {
  token: string;
  email: string;
  expires: Date;
}

async function tokens() {
  return col<VerifyTokenDoc>('verification_tokens');
}

/** Create a single-use email-verification token (valid 24h). */
export async function createVerifyToken(email: string): Promise<string> {
  const token = randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const c = await tokens();
  await c.deleteMany({ email: email.toLowerCase() });
  await c.insertOne({ token, email: email.toLowerCase(), expires });
  return token;
}

/** Consume a verification token, returning the email if valid. */
export async function consumeVerifyToken(token: string): Promise<string | null> {
  const c = await tokens();
  const doc = await c.findOne({ token });
  if (!doc) return null;
  await c.deleteOne({ token });
  if (doc.expires.getTime() < Date.now()) return null;
  return doc.email;
}
