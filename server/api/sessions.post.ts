import { withDb } from '../utils/mongo'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.id) {
    throw createError({ statusCode: 400, statusMessage: 'Mangler id' })
  }

  const result = await withDb(event, async (db) => {
    await db.collection('brushing_sessions').updateOne(
      { id: body.id },
      { $setOnInsert: { ...body, createdAtDb: new Date() } },
      { upsert: true }
    )
    return { ok: true, id: body.id }
  })

  if (!result) {
    throw createError({ statusCode: 503, statusMessage: 'MongoDB er ikke konfigureret endnu' })
  }

  return result
})
