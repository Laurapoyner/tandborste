import type { BrushingSession, Period } from '~/types'

function normalizeSession(input: any): BrushingSession {
  return {
    ...input,
    id: input.id || input.clientId || String(input._id || crypto.randomUUID())
  }
}

function chronological(a: BrushingSession, b: BrushingSession) {
  return String(a.completedAt || a.startedAt || a.date).localeCompare(String(b.completedAt || b.startedAt || b.date))
}

export const useBrushData = () => {
  const sessions = useState<BrushingSession[]>('sessions', () => [])
  const loading = useState('sessions-loading', () => false)

  const syncFromServer = async (childId?: string) => {
    if (!import.meta.client || !navigator.onLine || loading.value) return
    loading.value = true
    try {
      const remote = await $fetch<any[]>('/api/sessions', { query: childId ? { childId } : {} })
      const normalized = (remote || []).map(normalizeSession)
      if (childId) {
        sessions.value = [
          ...sessions.value.filter(s => s.childId !== childId),
          ...normalized
        ]
      } else {
        sessions.value = normalized
      }
    } finally {
      loading.value = false
    }
  }

  // Behold navnet, så eksisterende sider ikke skal ændres overalt.
  const loadLocal = (childId: string) => syncFromServer(childId)

  const saveSession = async (session: BrushingSession) => {
    if (!import.meta.client || !navigator.onLine) {
      throw new Error('Ingen internetforbindelse – tandbørstningen blev ikke gemt.')
    }
    const payload = { ...session, id: session.id || crypto.randomUUID() }
    const result = await $fetch<any>('/api/sessions', { method: 'POST', body: payload })
    const saved = normalizeSession(result?.session || { ...payload, starsEarned: result?.starsEarned ?? payload.starsEarned })
    const idx = sessions.value.findIndex(s => s.id === saved.id)
    if (idx >= 0) sessions.value[idx] = saved
    else sessions.value.push(saved)
    return saved
  }

  const addManualSession = async (session: BrushingSession) => {
    return saveSession({ ...session, manual: true })
  }

  const deleteSession = async (session: BrushingSession) => {
    if (!import.meta.client || !session.id) return
    if (!navigator.onLine) throw new Error('Ingen internetforbindelse – tandbørstningen blev ikke slettet.')
    await $fetch(`/api/sessions/${encodeURIComponent(session.id)}`, { method: 'DELETE' })
    sessions.value = sessions.value.filter(s => s.id !== session.id)
  }

  const periodNow = (): Period | null => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 15) return 'morning'
    if (hour >= 17) return 'evening'
    return null
  }

  const firstAttempts = (childId: string) => {
    const child = sessions.value.filter(s => s.childId === childId).sort(chronological)
    const seen = new Set<string>()
    const first: BrushingSession[] = []
    for (const s of child) {
      const key = `${s.date}:${s.period}`
      if (seen.has(key)) continue
      seen.add(key)
      first.push(s)
    }
    return first
  }

  const earnedFor = (childId: string) => firstAttempts(childId).reduce((sum, s) => {
    if (s.status === 'completed') return sum + 1
    if (s.status === 'ended_early') return sum + 0.5
    return sum
  }, 0)

  const starsFor = (childId: string, spent = 0) => earnedFor(childId) - spent

  const completedCount = (childId: string) => sessions.value
    .filter(s => s.childId === childId && s.status === 'completed').length

  const dayStreak = (childId: string) => {
    const child = sessions.value.filter(s => s.childId === childId && s.status === 'completed')
    const days = new Map<string, Set<string>>()
    child.forEach(s => {
      const set = days.get(s.date) || new Set<string>()
      set.add(s.period)
      days.set(s.date, set)
    })
    let streak = 0
    const d = new Date()
    for (let i = 0; i < 365; i++) {
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      const set = days.get(key)
      if (set?.has('morning') && set?.has('evening')) streak++
      else if (i === 0) { /* i dag kan stadig være i gang */ }
      else break
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  const hasAttempt = (childId: string, date: string, period: Period) =>
    sessions.value.some(s => s.childId === childId && s.date === date && s.period === period)

  return { sessions, loadLocal, syncFromServer, saveSession, addManualSession, deleteSession, periodNow, starsFor, earnedFor, completedCount, dayStreak, hasAttempt, loading }
}
