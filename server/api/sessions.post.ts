import { withDb } from '../utils/mongo'
import { requireParent } from '../utils/parent-auth'

function starsForStatus(status: string) {
  return status === 'completed' ? 1 : status === 'ended_early' ? 0.5 : 0
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.id || !body?.childId || !body?.date || !body?.period) {
    throw createError({ statusCode: 400, statusMessage: 'Mangler oplysninger om tandbørstningen' })
  }

  if (body.manual) requireParent(event)

  const result = await withDb(event, async (db) => {
    const collection = db.collection('brushing_sessions')

    // Idempotent retry: samme session må aldrig registreres to gange.
    const existingSameId = await collection.findOne({ id: body.id })
    if (existingSameId) {
      return { ok: true, session: existingSameId, starsEarned: Number(existingSameId.starsEarned || 0) }
    }

    // Kun FØRSTE forsøg om morgenen og FØRSTE forsøg om aftenen giver stjerner.
    const previousAttempt = await collection.findOne({
      childId: body.childId,
      date: body.date,
      period: body.period
    })

    const rewardEligible = !previousAttempt
    const starsEarned = rewardEligible ? starsForStatus(body.status) : 0

    const doc = {
      ...body,
      starsEarned,
      rewardEligible,
      createdAtDb: new Date()
    }

    await collection.insertOne(doc)
    return { ok: true, session: doc, starsEarned, rewardEligible }
  })

  if (!result) throw createError({ statusCode: 503, statusMessage: 'MongoDB er ikke konfigureret endnu' })
  return result
})
