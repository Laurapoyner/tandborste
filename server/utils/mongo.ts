import { MongoClient, type Db } from 'mongodb'
import type { H3Event } from 'h3'

let client: MongoClient | null = null
let dbPromise: Promise<Db> | null = null
let indexesReady = false
let activeConnectionKey = ''

function mongoSettings(event?: H3Event) {
  // useRuntimeConfig(event) er vigtigt på serverless/Cloudflare, fordi runtime
  // bindings/secrets skal læses fra den aktuelle request-kontekst.
  const config = useRuntimeConfig(event)

  // Cloudflare Workers eksponerer også vars + secrets på process.env med
  // moderne compatibility dates. Fallbacken gør opsætningen mere robust.
  const uri = String(
    config.mongodbUri || process.env.NUXT_MONGODB_URI || ''
  ).trim()

  const dbName = String(
    config.mongodbDbName || process.env.NUXT_MONGODB_DB_NAME || ''
  ).trim()

  return { uri, dbName }
}

export async function getDb(event?: H3Event) {
  const { uri, dbName } = mongoSettings(event)
  if (!uri) return null

  const connectionKey = `${uri}::${dbName}`

  // Hvis bindings ændres mellem Worker-versioner/isolate-liv, opret ny klient.
  if (activeConnectionKey && activeConnectionKey !== connectionKey) {
    try { await client?.close() } catch {}
    client = null
    dbPromise = null
    indexesReady = false
  }
  activeConnectionKey = connectionKey

  if (!dbPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 2,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    })

    dbPromise = client.connect()
      .then(c => c.db(dbName || undefined))
      .catch(err => {
        // Gør det muligt at prøve igen ved næste request i stedet for at cache
        // et rejected promise resten af Worker-isolatets levetid.
        dbPromise = null
        client = null
        indexesReady = false
        throw err
      })
  }

  const db = await dbPromise

  if (!indexesReady) {
    indexesReady = true
    Promise.allSettled([
      db.collection('brushing_sessions').createIndex({ id: 1 }, { unique: true }),
      db.collection('reward_redemptions').createIndex({ id: 1 }, { unique: true }),
      db.collection('app_config').createIndex({ key: 1 }, { unique: true })
    ]).catch(() => {})
  }

  return db
}
