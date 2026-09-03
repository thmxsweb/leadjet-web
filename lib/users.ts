import { ObjectId } from 'mongodb';
import { col } from './mongo';

export interface UserDoc {
  _id?: ObjectId;
  email: string;
  name?: string;
  passwordHash: string;
  emailVerified: Date | null;
  createdAt: Date;
}

export async function users() {
  return col<UserDoc>('users');
}

export async function getUserByEmail(email: string): Promise<UserDoc | null> {
  return (await users()).findOne({ email: email.toLowerCase() });
}

export async function createUser(email: string, passwordHash: string, name?: string): Promise<ObjectId> {
  const res = await (await users()).insertOne({
    email: email.toLowerCase(),
    passwordHash,
    ...(name ? { name } : {}),
    emailVerified: null,
    createdAt: new Date(),
  });
  return res.insertedId;
}

export async function markVerified(email: string): Promise<void> {
  await (await users()).updateOne(
    { email: email.toLowerCase() },
    { $set: { emailVerified: new Date() } },
  );
}
