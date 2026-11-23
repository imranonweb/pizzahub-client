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
  uri?: string;
}

const globalForMongo = globalThis as typeof globalThis & {
  __pizzaHubMongo?: MongoGlobalCache;
};

function stripSurroundingQuotes(raw?: string): string {
  const trimmed = raw?.trim() ?? "";
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function getCache(): MongoGlobalCache {
  if (!globalForMongo.__pizzaHubMongo) {
    globalForMongo.__pizzaHubMongo = {};
  }
  return globalForMongo.__pizzaHubMongo;
}

export function getMongoUri(): string {
  const uri =
    stripSurroundingQuotes(process.env.DB_URI) ||
    stripSurroundingQuotes(process.env.MONGODB_URI);
  if (!uri) {
    throw new Error(
      "Missing required environment variable DB_URI (or MONGODB_URI). Set DB_URI in your environment to a valid MongoDB connection string.",
    );
  }
  return uri;
}

export function getDbName(): string {
  return stripSurroundingQuotes(process.env.DB_NAME) || DEFAULT_DB_NAME;
}

export function resetMongoCache(): void {
  const cache = getCache();
  cache.client = undefined;
  cache.clientPromise = undefined;
  cache.uri = undefined;
}

export function getMongoClient(): MongoClient {
  const cache = getCache();
  const uri = getMongoUri();

  if (cache.client && cache.uri === uri) {
    return cache.client;
  }

  const client = new MongoClient(uri, SERVERLESS_MONGO_OPTIONS);
  cache.client = client;
  cache.uri = uri;
  cache.clientPromise = undefined;
  return client;
}

export function getMongoClientPromise(): Promise<MongoClient> {
  const cache = getCache();
  const client = getMongoClient();

  if (!cache.clientPromise) {
    cache.clientPromise = client.connect().catch((error: unknown) => {
      cache.client = undefined;
      cache.clientPromise = undefined;
      cache.uri = undefined;
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
