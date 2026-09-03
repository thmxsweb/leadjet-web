import { MongoClient, type Collection, type Db, type Document } from 'mongodb';

const uri = process.env.MONGODB_URI ?? '';
const dbName = process.env.MONGODB_DB ?? 'leadjet';

declare global {
  // eslint-disable-next-line no-var
  var _leadjetMongo: Promise<MongoClient> | undefined;
}

function clientPromise(): Promise<MongoClient> {
  if (!uri) throw new Error('MONGODB_URI is not set.');
  if (!global._leadjetMongo) {
    global._leadjetMongo = new MongoClient(uri).connect();
  }
  return global._leadjetMongo;
}

export async function db(): Promise<Db> {
  return (await clientPromise()).db(dbName);
}

export async function col<T extends Document = Document>(name: string): Promise<Collection<T>> {
  return (await db()).collection<T>(name);
}
