<script setup lang="ts">
const online = ref(true)

onMounted(() => {
  const update = () => { online.value = navigator.onLine }
  update()
  window.addEventListener('online', update)
  window.addEventListener('offline', update)
  onBeforeUnmount(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })
})
</script>

<template>
  <div v-if="!online" class="offline-banner">
    ⚠️ Offline – Tandtid kan åbnes, men nye tandbørstninger og ændringer kan ikke gemmes før der er internet.
  </div>
</template>
