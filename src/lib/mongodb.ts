import { type Db, MongoClient, type MongoClientOptions } from "mongodb";

const DEFAULT_DB_NAME = "pizzahub";

const SERVERLESS_MONGO_OPTIONS: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 60_000,
  serverSelectionTimeoutMS: 8_000,
  connectTimeoutMS: 8_000,
};

interface MongoGlobalCache {
  client?: MongoClient;
  clientPromise?: Promise<MongoClient>;
}

const globalForMongo = globalThis as typeof globalThis & {
  __pizzaHubMongo?: MongoGlobalCache;
};

function getCache(): MongoGlobalCache {
  if (!globalForMongo.__pizzaHubMongo) {
    globalForMongo.__pizzaHubMongo = {};
  }
  return globalForMongo.__pizzaHubMongo;
}

export function getDbName(): string {
  return process.env.DB_NAME?.trim() || DEFAULT_DB_NAME;
}

export function getMongoClient(): MongoClient {
  const cache = getCache();

  if (cache.client) {
    return cache.client;
  }

  const uri = process.env.DB_URI?.trim();
  if (!uri) {
    throw new Error(
      "Missing required environment variable DB_URI. Set DB_URI in your environment to a valid MongoDB connection string.",
    );
  }

  const client = new MongoClient(uri, SERVERLESS_MONGO_OPTIONS);
  cache.client = client;
  return client;
}

export function getMongoClientPromise(): Promise<MongoClient> {
  const cache = getCache();

  if (!cache.clientPromise) {
    const client = getMongoClient();
    cache.clientPromise = client.connect().catch((error: unknown) => {
      cache.clientPromise = undefined;
      throw error;
    });
  }

  return cache.clientPromise;
}

export function getDB(dbName?: string): Db {
  return getMongoClient().db(dbName?.trim() || getDbName());
}

export async function connectDB(dbName?: string): Promise<Db> {
  const client = await getMongoClientPromise();
  return client.db(dbName?.trim() || getDbName());
}
