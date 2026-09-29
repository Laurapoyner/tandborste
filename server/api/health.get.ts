import { withDb, getMongoConfigStatus } from '../utils/mongo'

export default defineEventHandler(async (event) => {
  const config = getMongoConfigStatus(event)

  try {
    const result = await withDb(event, async (db) => {
      await db.command({ ping: 1 })
      return {
        databaseName: db.databaseName
      }
    })

    if (!result) {
      return {
        ok: false,
        database: false,
        config,
        reason: 'MongoDB URI er ikke konfigureret'
      }
    }

    return {
      ok: true,
      database: true,
      databaseName: result.databaseName,
      config
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    return {
      ok: false,
      database: false,
      config,
      error: {
        name: err.name,
        message: err.message
      }
    }
  }
})
