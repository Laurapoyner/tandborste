import { withDb } from '../utils/mongo'
import { requireParent } from '../utils/parent-auth'

export default defineEventHandler(async (event) => {
  requireParent(event)
  const body = await readBody(event)

  const result = await withDb(event, async (db) => {
    await db.collection('app_config').updateOne(
      { key: 'family' },
      {
        $set: {
          key: 'family',
          settings: body.settings,
          rewards: body.rewards,
          updatedAt: body.updatedAt || new Date().toISOString()
        }
      },
      { upsert: true }
    )
    return { ok: true }
  })

  if (!result) {
    throw createError({ statusCode: 503, statusMessage: 'MongoDB er ikke konfigureret endnu' })
  }

  return result
})
