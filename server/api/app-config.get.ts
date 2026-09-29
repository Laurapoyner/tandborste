import { withDb } from '../utils/mongo'

export default defineEventHandler(async (event) => {
  const result = await withDb(event, async (db) => {
    return db.collection('app_config').findOne({ key: 'family' })
  })

  return result ?? null
})
