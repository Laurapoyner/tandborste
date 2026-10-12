<script setup lang="ts">
import type { Period } from '~/types'

const route = useRoute()
const id = String(route.params.id)
const { children, settings, loadRemote } = useTandtidConfig()
const { syncFromServer, starsFor, dayStreak, completedCount, hasAttempt } = useBrushData()
const ledger = useRewardsLedger()
const child = children.find(c=>c.id===id)
if (!child) throw createError({statusCode:404,statusMessage:'Barn ikke fundet'})

const now = ref(new Date())
let clockTimer: ReturnType<typeof setTimeout> | null = null

function timeToMinutes(value:string){
  const [h,m]=value.split(':').map(Number)
  return h*60+m
}
function currentPeriod(date:Date): Period|null {
  const minute=date.getHours()*60+date.getMinutes()
  const morningStart=timeToMinutes(settings.value.morningStart)
  const morningEnd=timeToMinutes(settings.value.morningEnd)
  const eveningStart=timeToMinutes(settings.value.eveningStart)
  const eveningEnd=timeToMinutes(settings.value.eveningEnd)
  if(minute>=morningStart && minute<morningEnd)return 'morning'
  if(minute>=eveningStart && minute<=eveningEnd)return 'evening'
  return null
}
function todayLocal(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}

async function refreshChild(){
  now.value=new Date()
  await Promise.all([syncFromServer(id), ledger.syncFromServer(), loadRemote()])
  scheduleNextClockChange()
}
function nextClockChange(from = new Date()) {
  const dayStart = new Date(from)
  dayStart.setHours(0, 0, 0, 0)

  const atMinute = (dayOffset:number, minute:number) => {
    const d = new Date(dayStart)
    d.setDate(d.getDate() + dayOffset)
    d.setMinutes(minute, 0, 0)
    return d
  }

  const morningStart = timeToMinutes(settings.value.morningStart)
  const morningEnd = timeToMinutes(settings.value.morningEnd)
  const eveningStart = timeToMinutes(settings.value.eveningStart)
  const eveningEnd = timeToMinutes(settings.value.eveningEnd)

  // Morgen slutter præcis ved morningEnd. Aften er inkl. det valgte slutminut,
  // så skiftet sker ét minut efter eveningEnd (23:59 -> 00:00).
  const candidates = [
    atMinute(0, morningStart),
    atMinute(0, morningEnd),
    atMinute(0, eveningStart),
    atMinute(0, eveningEnd + 1),
    atMinute(1, morningStart),
  ].filter(d => d.getTime() > from.getTime())

  return candidates.sort((a,b)=>a.getTime()-b.getTime())[0]
}

function scheduleNextClockChange(){
  if(clockTimer) clearTimeout(clockTimer)
  const current = new Date()
  now.value = current
  const next = nextClockChange(current)
  if(!next) return

  clockTimer = setTimeout(()=>{
    now.value = new Date()
    scheduleNextClockChange()
  }, Math.max(250, next.getTime()-current.getTime()+100))
}
function handleVisibility(){
  if(document.visibilityState==='visible') refreshChild()
}
function handleFocus(){ refreshChild() }

onMounted(async()=>{
  await refreshChild()
  // Brug enhedens lokale tid og vågn kun ved næste relevante periodeskift.
  scheduleNextClockChange()
  window.addEventListener('focus',handleFocus)
  document.addEventListener('visibilitychange',handleVisibility)
})
onBeforeUnmount(()=>{
  if(clockTimer)clearTimeout(clockTimer)
  window.removeEventListener('focus',handleFocus)
  document.removeEventListener('visibilitychange',handleVisibility)
})

const stars = computed(()=>starsFor(id, ledger.spentFor(id)))
const streak = computed(()=>dayStreak(id))
const completed = computed(()=>completedCount(id))
const period = computed(()=>currentPeriod(now.value))
const periodLabel = computed(()=>period.value==='morning'?'morgen':period.value==='evening'?'aften':'tandbørstning')
const greeting = computed(()=>period.value==='morning'?'Godmorgen':period.value==='evening'?'Godaften':'Hej')
const periodEmoji = computed(()=>period.value==='morning'?'☀️':period.value==='evening'?'🌙':'🪥')
const alreadyBrushed = computed(()=>period.value ? hasAttempt(id,todayLocal(now.value),period.value) : false)
const canBrushNow = computed(()=>period.value!==null)

function startBrushing(){
  if(!period.value)return
  return navigateTo(`/child/${id}/brush?period=${period.value}`)
}
</script>
<template>
<main class="container">
  <div class="topbar"><NuxtLink class="link" to="/">← Profiler</NuxtLink><span class="pill">⭐ {{ stars }}</span></div>
  <section class="hero card">
    <div class="emoji-xl">{{ periodEmoji }}</div>
    <h1>{{ greeting }} {{ child!.name }}</h1>
    <div class="stats"><span class="pill">🔥 {{ streak }} dage</span><span class="pill">🪥 {{ completed }} færdige</span></div>
    <p v-if="alreadyBrushed" class="pill status-yellow" style="margin-top:18px">Du har allerede børstet i denne periode. Du må gerne børste igen, men du får ikke flere stjerner.</p>
    <p v-else-if="!canBrushNow" class="pill" style="margin-top:18px">Det er ikke børstetid lige nu. Morgen og aften vises automatisk ud fra tiderne i Forældre → Indstillinger.</p>
    <div style="margin-top:24px">
      <button type="button" class="btn btn-primary" :disabled="!canBrushNow" @click="startBrushing">🪥 Start {{ periodLabel }}</button>
    </div>
  </section>
  <section class="grid grid-2 section">
    <NuxtLink class="card link" :to="`/child/${id}/rewards`">🎁 <strong>Mine belønninger</strong><p class="muted">Se hvad du kan spare op til.</p></NuxtLink>
    <NuxtLink class="card link" :to="`/child/${id}/badges`"><div class="emoji-lg">🏆</div><strong>Badges</strong><p class="muted">Næste mål: {{ streak < 3 ? '3 dage i træk' : streak < 7 ? '7 dage i træk' : '14 dage i træk' }}</p></NuxtLink>
  </section>
</main>
</template>
