import type { ChildProfile, Reward } from '~/types'

const children: ChildProfile[] = [
  { id: 'aya', name: 'Aya', emoji: '👧' },
  { id: 'ellie', name: 'Ellie', emoji: '👧' }
]
const defaultRewards: Reward[] = [
  { id: 'ipad', title: 'Må spille iPad fra kl. 16:30 en dag', emoji: '🎮', cost: 20, active: true },
  { id: 'donut', title: 'Må få en donut', emoji: '🍩', cost: 50, active: true },
  { id: 'toy', title: 'Må få legetøj for op til 50 kr.', emoji: '🎁', cost: 100, active: true }
]
const defaultAdultRules: Record<string,{morning:boolean,evening:boolean}> = {
  monday:{morning:true,evening:false}, tuesday:{morning:false,evening:false}, wednesday:{morning:false,evening:false},
  thursday:{morning:false,evening:true}, friday:{morning:false,evening:false}, saturday:{morning:false,evening:false}, sunday:{morning:false,evening:false}
}

const SETTINGS_KEY = 'tandtid:settings'
const REWARDS_KEY = 'tandtid:rewards'
const META_KEY = 'tandtid:config-updated-at'

export const useTandtidConfig = () => {
  const settings = useState('settings', () => ({
    brushingSeconds: 90,
    morningStart: '05:00', morningEnd: '15:00', eveningStart: '17:00', eveningEnd: '23:59',
    cameraEnabled: true, confettiEnabled: true, soundEnabled: true,
    adultRules: structuredClone(defaultAdultRules)
  }))
  const rewards = useState<Reward[]>('rewards', () => structuredClone(defaultRewards))
  const hydrated = useState('config-hydrated',()=>false)
  const watchersReady = useState('config-watchers-ready',()=>false)
  const { enqueue, flush } = useSyncQueue()

  const persistLocal = (updatedAt = new Date().toISOString()) => {
    if (!import.meta.client) return
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
    localStorage.setItem(REWARDS_KEY, JSON.stringify(rewards.value))
    localStorage.setItem(META_KEY, updatedAt)
  }

  const queueConfig = () => {
    const updatedAt = new Date().toISOString()
    persistLocal(updatedAt)
    enqueue('config', { settings: settings.value, rewards: rewards.value, updatedAt }, 'config:family')
    flush()
  }

  const loadRemote = async () => {
    if (!import.meta.client || !navigator.onLine) return
    try {
      const remote = await $fetch<any>('/api/app-config')
      if (!remote?.updatedAt) {
        queueConfig()
        return
      }
      const localUpdatedAt = localStorage.getItem(META_KEY) || ''
      if (!localUpdatedAt || remote.updatedAt > localUpdatedAt) {
        if (remote.settings) settings.value = { ...settings.value, ...remote.settings }
        if (Array.isArray(remote.rewards)) rewards.value = remote.rewards
        persistLocal(remote.updatedAt)
      } else if (localUpdatedAt > remote.updatedAt) {
        enqueue('config', { settings: settings.value, rewards: rewards.value, updatedAt: localUpdatedAt }, 'config:family')
      }
      await flush()
    } catch {}
  }

  const hydrate = () => {
    if (!import.meta.client || hydrated.value) return
    try {
      const s = localStorage.getItem(SETTINGS_KEY)
      if (s) {
        const parsed = JSON.parse(s)
        // Migration fra den tidligere standard på 1:15 til den nye standard på 1:30.
        if (parsed.brushingSeconds === 75) parsed.brushingSeconds = 90
        settings.value = { ...settings.value, ...parsed }
      }
      const r = localStorage.getItem(REWARDS_KEY)
      if (r) rewards.value = JSON.parse(r)
    } catch {}
    hydrated.value = true

    if (!watchersReady.value) {
      watchersReady.value = true
      watch(settings, queueConfig, { deep: true })
      watch(rewards, queueConfig, { deep: true })
    }
    loadRemote()
  }

  if (import.meta.client) onMounted(hydrate)
  return { children, settings, rewards, hydrate, loadRemote }
}
