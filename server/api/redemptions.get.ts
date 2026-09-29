import { withDb } from '../utils/mongo'

export default defineEventHandler(async (event) => {
  const result = await withDb(event, async (db) => {
    return db.collection('reward_redemptions')
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray()
  })

  return result ?? []
})
