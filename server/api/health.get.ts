import { getDb } from '../utils/mongo'

export default defineEventHandler(async () => {
  try {
    const db = await getDb()
    if (!db) return { ok: false, database: false, reason: 'MongoDB ikke konfigureret' }
    await db.command({ ping: 1 })
    return { ok: true, database: true }
  } catch {
    return { ok: false, database: false, reason: 'Kunne ikke forbinde til MongoDB' }
  }
})
