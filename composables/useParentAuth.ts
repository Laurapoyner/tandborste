const HASH_KEY = 'tandtid:parent-pin-hash'
const SESSION_KEY = 'tandtid:parent'

async function hashPin(pin: string) {
  const bytes = new TextEncoder().encode(`tandtid-parent:${pin}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export const useParentAuth = () => {
  const { flush } = useSyncQueue()
  const verify = async (pin: string) => {
    if (!import.meta.client) return false

    if (navigator.onLine) {
      try {
        await $fetch('/api/parent-login', { method: 'POST', body: { pin } })
        localStorage.setItem(HASH_KEY, await hashPin(pin))
        sessionStorage.setItem(SESSION_KEY, '1')
        await flush()
        return true
      } catch (error: any) {
        const status = error?.statusCode || error?.response?.status
        if (status === 401) return false
        // Netværksfejl: prøv offline-verifikatoren nedenfor.
      }
    }

    const stored = localStorage.getItem(HASH_KEY)
    if (!stored) return false
    const ok = stored === await hashPin(pin)
    if (ok) sessionStorage.setItem(SESSION_KEY, '1')
    return ok
  }

  return { verify }
}
