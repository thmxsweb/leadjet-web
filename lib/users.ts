import { dbConnect } from './db';
import { User, type UserDoc } from './models/User';

export async function getUserByEmail(email: string): Promise<UserDoc | null> {
  await dbConnect();
  return User.findOne({ email: email.toLowerCase() }).lean<UserDoc>();
}

/** Create a user. Email verification is disabled for now, so accounts are active immediately. */
export async function createUser(email: string, passwordHash: string, name?: string): Promise<string> {
  await dbConnect();
  const doc = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    ...(name ? { name } : {}),
    emailVerified: new Date(),
  });
  return doc._id.toString();
}
