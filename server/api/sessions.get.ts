import { getDb } from '../utils/mongo'

export default defineEventHandler(async (event) => {
  const db = await getDb(event)
  if (!db) return []
  const childId = getQuery(event).childId as string | undefined
  const q = childId ? { childId } : {}
  return db.collection('brushing_sessions').find(q).sort({ completedAt: -1 }).limit(500).toArray()
})
