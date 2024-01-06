import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI as string;
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});

export async function connectMongo(): Promise<MongoClient> {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
    return client;
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}

export { client };
