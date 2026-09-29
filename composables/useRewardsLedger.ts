import type { Redemption, ParentName, Reward } from '~/types'

export const useRewardsLedger = () => {
  const redemptions = useState<Redemption[]>('redemptions', () => [])
  const hydrated = useState('redemptions-hydrated', () => false)
  const { enqueue, flush } = useSyncQueue()

  const persist = () => {
    if (!import.meta.client) return
    localStorage.setItem('tandtid:redemptions', JSON.stringify(redemptions.value))
  }

  const hydrate = () => {
    if (!import.meta.client || hydrated.value) return
    try { redemptions.value = JSON.parse(localStorage.getItem('tandtid:redemptions') || '[]') } catch { redemptions.value = [] }
    hydrated.value = true
    syncFromServer()
  }

  const syncFromServer = async () => {
    if (!import.meta.client || !navigator.onLine) return
    try {
      const remote = await $fetch<any[]>('/api/redemptions')
      const merged = new Map<string, Redemption>()
      for (const item of remote || []) {
        const normalized = { ...item, id: item.id || item.clientId || String(item._id) }
        merged.set(normalized.id, normalized)
      }
      for (const item of redemptions.value) merged.set(item.id, item)
      redemptions.value = [...merged.values()].sort((a,b)=>a.createdAt.localeCompare(b.createdAt))
      persist()
      await flush()
    } catch {}
  }

  const spentFor = (childId: string) => redemptions.value.filter(r => r.childId === childId).reduce((a,r)=>a+r.cost,0)

  const redeem = async (childId: string, reward: Reward, approvedBy: ParentName) => {
    const redemption: Redemption = {
      id: crypto.randomUUID(),
      childId,
      rewardId: reward.id,
      rewardTitle: reward.title,
      rewardEmoji: reward.emoji,
      cost: reward.cost,
      approvedBy,
      createdAt: new Date().toISOString()
    }
    redemptions.value.push(redemption)
    persist()
    enqueue('redemption', redemption, `redemption:${redemption.id}`)
    await flush()
    return redemption
  }

  return { redemptions, hydrate, syncFromServer, spentFor, redeem }
}
