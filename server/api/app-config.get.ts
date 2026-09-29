import { getDb } from '../utils/mongo'

export default defineEventHandler(async () => {
  const db = await getDb()
  if (!db) return null
  return db.collection('app_config').findOne({ key: 'family' })
})
