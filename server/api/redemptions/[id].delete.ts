import { withDb } from '../../utils/mongo'
import { requireParent } from '../../utils/parent-auth'

export default defineEventHandler(async (event) => {
  requireParent(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Mangler id' })
  }

  const result = await withDb(event, async (db) => {
    const deletion = await db.collection('reward_redemptions').deleteOne({ id })
    return { ok: true, deleted: deletion.deletedCount === 1 }
  })

  if (!result) {
    throw createError({ statusCode: 503, statusMessage: 'MongoDB er ikke konfigureret endnu' })
  }

  return result
})
