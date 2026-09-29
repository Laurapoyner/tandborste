import type { BrushingSession, Period } from '~/types'

function localKey(childId: string) { return `tandtid:sessions:${childId}` }

function normalizeSession(input: any): BrushingSession {
  return {
    ...input,
    id: input.id || input.clientId || String(input._id || crypto.randomUUID())
  }
}

export const useBrushData = () => {
  const sessions = useState<BrushingSession[]>('sessions', () => [])
  const { enqueue, flush } = useSyncQueue()

  const persistChild = (childId: string, list: BrushingSession[]) => {
    if (!import.meta.client) return
    localStorage.setItem(localKey(childId), JSON.stringify(list))
  }

  const loadLocal = (childId: string) => {
    if (!import.meta.client) return
    let parsed: BrushingSession[] = []
    try { parsed = JSON.parse(localStorage.getItem(localKey(childId)) || '[]') } catch {}
    const other = sessions.value.filter(s => s.childId !== childId)
    sessions.value = [...other, ...parsed]
    syncFromServer(childId)
  }

  const syncFromServer = async (childId: string) => {
    if (!import.meta.client || !navigator.onLine) return
    try {
      const remote = await $fetch<any[]>('/api/sessions', { query: { childId } })
      const local = sessions.value.filter(s => s.childId === childId)
      const merged = new Map<string, BrushingSession>()
      for (const item of remote || []) {
        const s = normalizeSession(item)
        merged.set(s.id || `${s.childId}:${s.completedAt}`, s)
      }
      for (const s of local) merged.set(s.id || `${s.childId}:${s.completedAt}`, s)
      const childList = [...merged.values()].sort((a,b)=>(a.completedAt||a.date).localeCompare(b.completedAt||b.date))
      persistChild(childId, childList)
      sessions.value = [...sessions.value.filter(s => s.childId !== childId), ...childList]
      await flush()
    } catch {}
  }

  const saveLocal = (session: BrushingSession) => {
    if (!import.meta.client) return
    const normalized = { ...session, id: session.id || crypto.randomUUID() }
    let list: BrushingSession[] = []
    try { list = JSON.parse(localStorage.getItem(localKey(normalized.childId)) || '[]') } catch {}
    const idx = list.findIndex(s => s.id === normalized.id)
    if (idx >= 0) list[idx] = normalized
    else list.push(normalized)
    persistChild(normalized.childId, list)
    const stateIdx = sessions.value.findIndex(s => s.id === normalized.id)
    if (stateIdx >= 0) sessions.value[stateIdx] = normalized
    else sessions.value.push(normalized)
    return normalized
  }

  const saveSession = async (session: BrushingSession) => {
    const saved = saveLocal({ ...session, id: session.id || crypto.randomUUID() })!
    enqueue('session', saved, `session:${saved.id}`)
    await flush()
  }

  const periodNow = (): Period | null => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 15) return 'morning'
    if (hour >= 17) return 'evening'
    return null
  }

  const starsFor = (childId: string) => {
    const earned = sessions.value.filter(s => s.childId === childId).reduce((a, s) => a + s.starsEarned, 0)
    if (!import.meta.client) return earned
    try {
      const spent = (JSON.parse(localStorage.getItem('tandtid:redemptions') || '[]') as any[])
        .filter(r => r.childId === childId)
        .reduce((a, r) => a + Number(r.cost || 0), 0)
      return earned - spent
    } catch { return earned }
  }

  const completedCount = (childId: string) => sessions.value.filter(s => s.childId === childId && s.status === 'completed').length

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
      const key = d.toISOString().slice(0, 10)
      const set = days.get(key)
      if (set?.has('morning') && set?.has('evening')) streak++
      else if (i === 0) { /* i dag kan stadig være i gang */ }
      else break
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  return { sessions, loadLocal, syncFromServer, saveSession, periodNow, starsFor, completedCount, dayStreak }
}
