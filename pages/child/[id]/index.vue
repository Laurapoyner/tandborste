<script setup lang="ts">
const route = useRoute()
const id = String(route.params.id)
const { children, rewards } = useTandtidConfig()
const { loadLocal, starsFor, dayStreak, completedCount, periodNow } = useBrushData()
const child = children.find(c=>c.id===id)
if (!child) throw createError({statusCode:404,statusMessage:'Barn ikke fundet'})
onMounted(()=>loadLocal(id))
const stars = computed(()=>starsFor(id))
const streak = computed(()=>dayStreak(id))
const completed = computed(()=>completedCount(id))
const period = computed(()=>periodNow())
const periodLabel = computed(()=>period.value==='morning'?'morgen':period.value==='evening'?'aften':'tandbørstning')
function startBrushing(){
  const selectedPeriod = period.value || 'morning'
  return navigateTo(`/child/${id}/brush?period=${selectedPeriod}`)
}
</script>
<template>
<main class="container">
  <div class="topbar"><NuxtLink class="link" to="/">← Profiler</NuxtLink><span class="pill">⭐ {{ stars }}</span></div>
  <section class="hero card">
    <div class="emoji-xl">{{ period==='evening'?'🌙':'☀️' }}</div>
    <h1>{{ period==='evening'?'Godaften':'Godmorgen' }} {{ child!.name }}</h1>
    <div class="stats"><span class="pill">🔥 {{ streak }} dage</span><span class="pill">🪥 {{ completed }} færdige</span></div>
    <div style="margin-top:24px">
      <button type="button" class="btn btn-primary" @click="startBrushing">🪥 Start {{ periodLabel }}</button>
    </div>
  </section>
  <section class="grid grid-2 section">
    <NuxtLink class="card link" :to="`/child/${id}/rewards`">🎁 <strong>Mine belønninger</strong><p class="muted">Se hvad du kan spare op til.</p></NuxtLink>
    <NuxtLink class="card link" :to="`/child/${id}/badges`"><div class="emoji-lg">🏆</div><strong>Badges</strong><p class="muted">Næste mål: {{ streak < 3 ? '3 dage i træk' : streak < 7 ? '7 dage i træk' : '14 dage i træk' }}</p></NuxtLink>
  </section>
</main>
</template>
