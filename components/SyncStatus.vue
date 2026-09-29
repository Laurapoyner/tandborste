<script setup lang="ts">
const { pendingCount, syncing, isOnline } = useSyncQueue()
</script>

<template>
  <div v-if="!isOnline || pendingCount > 0 || syncing" class="sync-status" :class="{offline:!isOnline}">
    <span v-if="!isOnline">📴 Offline · gemmer på enheden</span>
    <span v-else-if="syncing">☁️ Synkroniserer…</span>
    <span v-else>☁️ {{ pendingCount }} venter på synkronisering</span>
  </div>
</template>
