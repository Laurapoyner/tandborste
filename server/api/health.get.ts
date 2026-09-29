import { getDb } from '../utils/mongo'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const uriPresent = Boolean(config.mongodbUri || process.env.NUXT_MONGODB_URI)
  const dbNamePresent = Boolean(config.mongodbDbName || process.env.NUXT_MONGODB_DB_NAME)

  try {
    const db = await getDb(event)
    if (!db) {
      return {
        ok: false,
        database: false,
        config: { mongodbUriPresent: uriPresent, mongodbDbNamePresent: dbNamePresent },
        reason: 'MongoDB URI er ikke konfigureret'
      }
    }

    await db.command({ ping: 1 })

    return {
      ok: true,
      database: true,
      config: { mongodbUriPresent: uriPresent, mongodbDbNamePresent: dbNamePresent }
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    return {
      ok: false,
      database: false,
      config: { mongodbUriPresent: uriPresent, mongodbDbNamePresent: dbNamePresent },
      error: { name: err.name, message: err.message }
    }
  }
})
