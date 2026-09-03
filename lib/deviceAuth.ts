import { dbConnect } from './db';
import { Device } from './models/Device';

/** Resolve a CLI Bearer token to its owner's userId, or null if invalid/expired. */
export async function bearerUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;
  await dbConnect();
  const device = await Device.findOne({ token, status: 'approved' });
  if (!device || !device.userId) return null;
  if (device.tokenExpires && device.tokenExpires.getTime() < Date.now()) return null;
  return device.userId.toString();
}
