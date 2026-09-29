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

function defaults() {
  return {
    brushingSeconds: 90,
    morningStart: '05:00', morningEnd: '15:00', eveningStart: '17:00', eveningEnd: '23:59',
    cameraEnabled: true, confettiEnabled: true, soundEnabled: true,
    adultRules: structuredClone(defaultAdultRules)
  }
}

export const useTandtidConfig = () => {
  const settings = useState('settings', defaults)
  const rewards = useState<Reward[]>('rewards', () => structuredClone(defaultRewards))
  const loading = useState('config-loading', () => false)
  const saving = useState('config-saving', () => false)
  const loaded = useState('config-loaded', () => false)
  const lastSavedAt = useState<string | null>('config-last-saved', () => null)
  const saveError = useState<string | null>('config-save-error', () => null)
  const refreshBound = useState('config-refresh-bound', () => false)

  const loadRemote = async () => {
    if (!import.meta.client || !navigator.onLine || loading.value) return
    loading.value = true
    try {
      const remote = await $fetch<any>('/api/app-config')
      if (remote?.settings) settings.value = { ...defaults(), ...remote.settings }
      if (Array.isArray(remote?.rewards)) rewards.value = remote.rewards
      loaded.value = true
    } catch {
      // Behold værdierne i hukommelsen. MongoDB er stadig source of truth.
    } finally {
      loading.value = false
    }
  }

  const saveConfig = async () => {
    if (!import.meta.client) return false
    if (!navigator.onLine) {
      saveError.value = 'Ingen internetforbindelse – ændringerne er ikke gemt.'
      return false
    }
    saving.value = true
    saveError.value = null
    try {
      const updatedAt = new Date().toISOString()
      await $fetch('/api/app-config', {
        method: 'PUT',
        body: { settings: settings.value, rewards: rewards.value, updatedAt }
      })
      lastSavedAt.value = updatedAt
      return true
    } catch (error: any) {
      saveError.value = error?.data?.message || error?.statusMessage || 'Kunne ikke gemme ændringerne i databasen.'
      return false
    } finally {
      saving.value = false
    }
  }

  if (import.meta.client) {
    onMounted(() => {
      loadRemote()
      if (!refreshBound.value) {
        refreshBound.value = true
        window.addEventListener('focus', loadRemote)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') loadRemote()
        })
      }
    })
  }

  return { children, settings, rewards, loading, saving, loaded, lastSavedAt, saveError, loadRemote, saveConfig }
}
