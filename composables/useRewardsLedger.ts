import type { Redemption, ParentName, Reward } from '~/types'

export const useRewardsLedger = () => {
  const redemptions = useState<Redemption[]>('redemptions', () => [])
  const loading = useState('redemptions-loading', () => false)

  const hydrate = async () => {
    await syncFromServer()
  }

  const syncFromServer = async () => {
    if (!import.meta.client || !navigator.onLine || loading.value) return
    loading.value = true
    try {
      const remote = await $fetch<any[]>('/api/redemptions')
      redemptions.value = (remote || []).map((item:any) => ({
        ...item,
        id: item.id || item.clientId || String(item._id)
      })).sort((a,b)=>a.createdAt.localeCompare(b.createdAt))
    } finally {
      loading.value = false
    }
  }

  const spentFor = (childId: string) => redemptions.value
    .filter(r => r.childId === childId)
    .reduce((a,r)=>a+Number(r.cost || 0),0)

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
    await $fetch('/api/redemptions', { method: 'POST', body: redemption })
    redemptions.value.push(redemption)
    return redemption
  }

  return { redemptions, hydrate, syncFromServer, spentFor, redeem, loading }
}
