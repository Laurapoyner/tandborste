export default defineNuxtPlugin(() => {
  const { startNetworkWatcher } = useSyncQueue()
  startNetworkWatcher()
})
