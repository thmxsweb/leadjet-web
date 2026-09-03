import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI ?? '';
const dbName = process.env.MONGODB_DB ?? 'leadjet';

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: Cached | undefined;
}

const cached: Cached = global._mongoose ?? { conn: null, promise: null };
global._mongoose = cached;

/** Connect once and reuse the connection across hot reloads / serverless invocations. */
export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!uri) throw new Error('MONGODB_URI is not set.');
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { dbName });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
