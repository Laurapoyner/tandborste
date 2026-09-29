import { createHash, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'tandtid_parent'

function tokenFor(pin: string) {
  return createHash('sha256').update(`tandtid-parent-session:${pin}`).digest('hex')
}

export function setParentSession(event: any, pin: string) {
  setCookie(event, COOKIE_NAME, tokenFor(pin), {
    httpOnly: true,
    secure: getRequestURL(event).protocol === 'https:',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })
}

export function requireParent(event: any) {
  const config = useRuntimeConfig(event)
  if (!config.parentPin) throw createError({ statusCode: 503, statusMessage: 'Forældre-PIN er ikke konfigureret' })
  const actual = getCookie(event, COOKIE_NAME) || ''
  const expected = tokenFor(String(config.parentPin))
  const a = Buffer.from(actual)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw createError({ statusCode: 401, statusMessage: 'Forældrelogin kræves' })
  }
}
