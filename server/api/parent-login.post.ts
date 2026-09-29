import { setParentSession } from '../utils/parent-auth'

export default defineEventHandler(async (event) => {
  const { pin } = await readBody(event)
  const config = useRuntimeConfig(event)
  if (!config.parentPin) throw createError({ statusCode: 503, statusMessage: 'Forældre-PIN er ikke konfigureret' })
  if (String(pin) !== String(config.parentPin)) throw createError({ statusCode: 401, statusMessage: 'Forkert PIN' })
  setParentSession(event, String(pin))
  return { ok: true }
})
