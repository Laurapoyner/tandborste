import { MongoClient, type Db } from 'mongodb'
import type { H3Event } from 'h3'

function mongoSettings(event?: H3Event) {
  const config = useRuntimeConfig(event)

  const uri = String(
    config.mongodbUri || process.env.NUXT_MONGODB_URI || ''
  ).trim()

  const dbName = String(
    config.mongodbDbName || process.env.NUXT_MONGODB_DB_NAME || ''
  ).trim()

  return { uri, dbName }
}

/**
 * Cloudflare Workers genbruger isolates mellem requests, men netværks-I/O
 * (fx en åben MongoDB TCP socket) må ikke genbruges på tværs af requests.
 *
 * Derfor oprettes MongoClient inde i den aktuelle request og lukkes igen,
 * når database-operationen er færdig.
 */
export async function withDb<T>(
  event: H3Event,
  fn: (db: Db) => Promise<T>
): Promise<T | null> {
  const { uri, dbName } = mongoSettings(event)
  if (!uri) return null

  const client = new MongoClient(uri, {
    maxPoolSize: 1,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000
  })

  try {
    await client.connect()
    const db = client.db(dbName || undefined)
    return await fn(db)
  } finally {
    try {
      await client.close()
    } catch {
      // Lukning må ikke skjule resultatet af selve requesten.
    }
  }
}

export function getMongoConfigStatus(event: H3Event) {
  const { uri, dbName } = mongoSettings(event)
  return {
    mongodbUriPresent: Boolean(uri),
    mongodbDbNamePresent: Boolean(dbName)
  }
}
