import { getDb } from '../../utils/mongo'
import { requireParent } from '../../utils/parent-auth'

export default defineEventHandler(async (event) => {
  requireParent(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Mangler id' })

  const db = await getDb(event)
  if (!db) throw createError({ statusCode: 503, statusMessage: 'MongoDB er ikke konfigureret endnu' })

  const result = await db.collection('brushing_sessions').deleteOne({ id })

  // Det er stadig OK, hvis posten allerede var slettet eller aldrig nåede serveren.
  return { ok: true, id, deleted: result.deletedCount > 0 }
})
