import { getDb } from '../utils/mongo'

export default defineEventHandler(async (event) => {
  const db = await getDb(event)
  if (!db) return []
  return db.collection('reward_redemptions').find({}).sort({ createdAt: -1 }).limit(500).toArray()
})
