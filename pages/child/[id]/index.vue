<script setup lang="ts">
const route = useRoute()
const id = String(route.params.id)
const { children, rewards, loadRemote } = useTandtidConfig()
const { loadLocal, starsFor, dayStreak, completedCount, periodNow, hasAttempt } = useBrushData()
const ledger = useRewardsLedger()
const child = children.find(c=>c.id===id)
if (!child) throw createError({statusCode:404,statusMessage:'Barn ikke fundet'})

onMounted(async()=>{
  await Promise.all([loadLocal(id), ledger.hydrate(), loadRemote()])
})

const stars = computed(()=>starsFor(id, ledger.spentFor(id)))
const streak = computed(()=>dayStreak(id))
const completed = computed(()=>completedCount(id))
const period = computed(()=>periodNow())
const periodLabel = computed(()=>period.value==='morning'?'morgen':period.value==='evening'?'aften':'tandbørstning')
function todayLocal(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
const alreadyBrushed = computed(()=>period.value ? hasAttempt(id,todayLocal(),period.value) : false)
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
    <p v-if="alreadyBrushed" class="pill status-yellow" style="margin-top:18px">Du har allerede børstet i denne periode. Du må gerne børste igen, men du får ikke flere stjerner.</p>
    <div style="margin-top:24px"><button type="button" class="btn btn-primary" @click="startBrushing">🪥 Start {{ periodLabel }}</button></div>
  </section>
  <section class="grid grid-2 section">
    <NuxtLink class="card link" :to="`/child/${id}/rewards`">🎁 <strong>Mine belønninger</strong><p class="muted">Se hvad du kan spare op til.</p></NuxtLink>
    <NuxtLink class="card link" :to="`/child/${id}/badges`"><div class="emoji-lg">🏆</div><strong>Badges</strong><p class="muted">Næste mål: {{ streak < 3 ? '3 dage i træk' : streak < 7 ? '7 dage i træk' : '14 dage i træk' }}</p></NuxtLink>
  </section>
</main>
</template>
