import { MongoClient, type Db } from 'mongodb'

let client: MongoClient | null = null
let dbPromise: Promise<Db> | null = null
let indexesReady = false

export async function getDb() {
  const config = useRuntimeConfig()
  if (!config.mongodbUri) return null

  if (!dbPromise) {
    client = new MongoClient(config.mongodbUri, {
      maxPoolSize: 2,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    })
    dbPromise = client.connect().then(c => c.db(config.mongodbDbName))
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
