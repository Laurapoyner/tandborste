const SESSION_KEY = 'tandtid:parent'

export const useParentAuth = () => {
  const verify = async (pin: string) => {
    if (!import.meta.client || !navigator.onLine) return false
    try {
      await $fetch('/api/parent-login', { method: 'POST', body: { pin } })
      sessionStorage.setItem(SESSION_KEY, '1')
      return true
    } catch {
      return false
    }
  }

  return { verify }
}
