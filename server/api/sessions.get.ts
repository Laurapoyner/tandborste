import { withDb } from '../utils/mongo'

export default defineEventHandler(async (event) => {
  const childId = getQuery(event).childId as string | undefined
  const q = childId ? { childId } : {}

  const result = await withDb(event, async (db) => {
    return db.collection('brushing_sessions')
      .find(q)
      .sort({ completedAt: -1 })
      .limit(500)
      .toArray()
  })

  return result ?? []
})
