import { getDb } from '../utils/mongo'

export default defineEventHandler(async (event) => {
  const db = await getDb(event)
  if (!db) return null
  return db.collection('app_config').findOne({ key: 'family' })
})
