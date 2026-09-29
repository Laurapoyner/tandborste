import { getDb } from '../utils/mongo'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  try {
    const db = await getDb()

    if (!db) {
      return {
        ok: false,
        database: false,
        config: {
          mongodbUriPresent: Boolean(config.mongodbUri),
          mongodbDbNamePresent: Boolean(config.mongodbDbName)
        },
        reason: 'MongoDB ikke konfigureret'
      }
    }

    await db.command({ ping: 1 })

    return {
      ok: true,
      database: true,
      config: {
        mongodbUriPresent: Boolean(config.mongodbUri),
        mongodbDbNamePresent: Boolean(config.mongodbDbName)
      }
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))

    return {
      ok: false,
      database: false,
      config: {
        mongodbUriPresent: Boolean(config.mongodbUri),
        mongodbDbNamePresent: Boolean(config.mongodbDbName)
      },
      error: {
        name: err.name,
        message: err.message
      }
    }
  }
})