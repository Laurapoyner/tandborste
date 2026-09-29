export type SyncKind = 'session' | 'redemption' | 'config'

export interface SyncItem {
  id: string
  kind: SyncKind
  payload: any
  createdAt: string
}

const QUEUE_KEY = 'tandtid:sync-queue'

export const useSyncQueue = () => {
  const queue = useState<SyncItem[]>('sync-queue', () => [])
  const syncing = useState('syncing', () => false)
  const lastSyncAt = useState<string | null>('last-sync-at', () => null)
  const initialized = useState('sync-queue-initialized', () => false)

  const persist = () => {
    if (!import.meta.client) return
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.value))
  }

  const hydrate = () => {
    if (!import.meta.client || initialized.value) return
    try { queue.value = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { queue.value = [] }
    initialized.value = true
  }

  const enqueue = (kind: SyncKind, payload: any, explicitId?: string) => {
    if (!import.meta.client) return
    hydrate()
    const id = explicitId || `${kind}:${payload?.id || crypto.randomUUID()}`

    // Config er "seneste værdi vinder". Det undgår en lang kø af gamle indstillinger.
    if (kind === 'config') queue.value = queue.value.filter(item => item.kind !== 'config')
    if (!queue.value.some(item => item.id === id)) {
      queue.value.push({ id, kind, payload, createdAt: new Date().toISOString() })
      persist()
    }
  }

  const remove = (id: string) => {
    queue.value = queue.value.filter(item => item.id !== id)
    persist()
  }

  const flush = async () => {
    if (!import.meta.client) return
    hydrate()
    if (syncing.value || !navigator.onLine || queue.value.length === 0) return
    syncing.value = true
    try {
      for (const item of [...queue.value]) {
        try {
          if (item.kind === 'session') {
            await $fetch('/api/sessions', { method: 'POST', body: item.payload })
          } else if (item.kind === 'redemption') {
            await $fetch('/api/redemptions', { method: 'POST', body: item.payload })
          } else if (item.kind === 'config') {
            await $fetch('/api/app-config', { method: 'PUT', body: item.payload })
          }
          remove(item.id)
          lastSyncAt.value = new Date().toISOString()
        } catch {
          // Behold fejlede elementer i køen, men lad andre typer synkronisere.
          continue
        }
      }
    } finally {
      syncing.value = false
    }
  }

  const pendingCount = computed(() => queue.value.length)
  const isOnline = useState<boolean>('network-online', () => true)

  const startNetworkWatcher = () => {
    if (!import.meta.client) return
    hydrate()
    isOnline.value = navigator.onLine
    const online = () => { isOnline.value = true; flush() }
    const offline = () => { isOnline.value = false }
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    flush()
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
    }
  }

  return { queue, hydrate, enqueue, flush, pendingCount, syncing, lastSyncAt, isOnline, startNetworkWatcher }
}
