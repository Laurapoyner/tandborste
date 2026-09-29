<script setup lang="ts">
import type { BrushingSession, ParentName, Period } from '~/types'

interface BrushZone {
  label: string
  surface: string
  ids: string[]
  weight: number
}

const route = useRoute()
const router = useRouter()
const id = String(route.params.id)
const { children, settings } = useTandtidConfig()
const { saveSession } = useBrushData()
const child = children.find(c => c.id === id)
if (!child) throw createError({ statusCode: 404 })

const period = (route.query.period === 'evening' ? 'evening' : 'morning') as Period
const testMode = computed(() => route.query.test === '1')
const forcedAdult = computed(() => route.query.adult === '1')
const fullTest = computed(() => route.query.full === '1')
const testSeconds = Number(route.query.seconds || 10)
const total = computed(() => {
  if (!testMode.value) return settings.value.brushingSeconds
  if (fullTest.value) return settings.value.brushingSeconds
  return Math.max(5, Math.min(60, testSeconds || 10))
})

const remaining = ref(total.value)
const started = ref(false)
const finished = ref(false)
const endedEarly = ref(false)
const adultUnlocked = ref(false)
const approvedBy = ref<ParentName | undefined>()
const adultCode = ref('')
const adultError = ref('')
const video = ref<HTMLVideoElement | null>(null)
let stream: MediaStream | null = null
let interval: any = null
let startTs = 0
const cameraError = ref('')
const saveError = ref('')
const savedSession = ref<BrushingSession | null>(null)

const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const adultRequired = computed(() => forcedAdult.value || settings.value.adultRules[dayKeys[new Date().getDay()]][period])

const zones = computed<BrushZone[]>(() => [
  // Først YDER hele vejen rundt
  { label: 'Øverst venstre', surface: 'YDER', ids: ['ul-outer'], weight: 35 / 6 },
  { label: 'Øverst foran', surface: 'YDER', ids: ['uf-outer'], weight: 35 / 6 },
  { label: 'Øverst højre', surface: 'YDER', ids: ['ur-outer'], weight: 35 / 6 },
  { label: 'Nederst højre', surface: 'YDER', ids: ['lr-outer'], weight: 35 / 6 },
  { label: 'Nederst foran', surface: 'YDER', ids: ['lf-outer'], weight: 35 / 6 },
  { label: 'Nederst venstre', surface: 'YDER', ids: ['ll-outer'], weight: 35 / 6 },

  // Derefter INDER hele vejen rundt
  { label: 'Øverst venstre', surface: 'INDER', ids: ['ul-inner'], weight: 35 / 6 },
  { label: 'Øverst foran', surface: 'INDER', ids: ['uf-inner'], weight: 35 / 6 },
  { label: 'Øverst højre', surface: 'INDER', ids: ['ur-inner'], weight: 35 / 6 },
  { label: 'Nederst højre', surface: 'INDER', ids: ['lr-inner'], weight: 35 / 6 },
  { label: 'Nederst foran', surface: 'INDER', ids: ['lf-inner'], weight: 35 / 6 },
  { label: 'Nederst venstre', surface: 'INDER', ids: ['ll-inner'], weight: 35 / 6 },

  // Til sidst MIDTEN / tyggeflader
  { label: 'Øverst – tyggeflader', surface: 'MIDTEN', ids: ['upper-middle'], weight: 10 },
  { label: 'Nederst – tyggeflader', surface: 'MIDTEN', ids: ['lower-middle'], weight: 10 }
])

const elapsed = computed(() => total.value - remaining.value)
const progress = computed(() => Math.min(100, elapsed.value / total.value * 100))
const zoneIndex = computed(() => {
  const all = zones.value
  const totalWeight = all.reduce((sum, zone) => sum + zone.weight, 0)
  const position = total.value > 0 ? (elapsed.value / total.value) * totalWeight : 0
  let cumulative = 0
  for (let i = 0; i < all.length; i++) {
    cumulative += all[i].weight
    if (position < cumulative) return i
  }
  return all.length - 1
})
const currentZone = computed(() => zones.value[zoneIndex.value])
const phaseTiming = computed(() => {
  const factor = total.value / 90
  return { outer: Math.round(35 * factor), inner: Math.round(35 * factor), middle: Math.max(1, total.value - Math.round(70 * factor)) }
})
const timeText = computed(() => `${String(Math.floor(remaining.value / 60)).padStart(2, '0')}:${String(remaining.value % 60).padStart(2, '0')}`)
const durationText = computed(() => {
  const mins = Math.floor(total.value / 60)
  const secs = total.value % 60
  if (mins > 0 && secs > 0) return `${mins} min ${secs} sek.`
  if (mins > 0) return `${mins} min`
  return `${secs} sek.`
})
const canStart = computed(() => !adultRequired.value || adultUnlocked.value)

watch(total, (value) => {
  if (!started.value && !finished.value) remaining.value = value
}, { immediate: true })

async function startCamera() {
  cameraError.value = ''
  if (!settings.value.cameraEnabled) return
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = 'Kamera er ikke tilgængeligt i denne browser.'
    return
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    if (video.value) video.value.srcObject = stream
  } catch {
    cameraError.value = 'Kamera kunne ikke åbnes. Du kan stadig teste timeren.'
  }
}

function stopCamera() {
  stream?.getTracks().forEach(t => t.stop())
  stream = null
}

async function start() {
  if (!canStart.value) return
  started.value = true
  startTs = Date.now()
  await nextTick()
  await startCamera()
  interval = setInterval(() => {
    if (remaining.value > 0) remaining.value--
    if (remaining.value <= 0) complete(false)
  }, 1000)
}

async function complete(early: boolean) {
  if (interval) clearInterval(interval)
  interval = null
  stopCamera()
  endedEarly.value = early
  finished.value = true
  await persist()
}

function earlySeconds() {
  return Math.min(total.value, Math.max(0, total.value - remaining.value))
}

function localDateString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

async function persist() {
  if (testMode.value) return
  saveError.value = ''
  const actual = earlySeconds()
  const session: BrushingSession = {
    id: crypto.randomUUID(),
    childId: id,
    date: localDateString(),
    period,
    startedAt: new Date(startTs).toISOString(),
    completedAt: new Date().toISOString(),
    requiredSeconds: total.value,
    actualSeconds: actual,
    status: endedEarly.value ? 'ended_early' : 'completed',
    adultRequired: adultRequired.value,
    adultApproved: adultRequired.value ? adultUnlocked.value : true,
    approvedBy: approvedBy.value,
    starsEarned: 0
  }
  try {
    savedSession.value = await saveSession(session)
  } catch (error: any) {
    saveError.value = error?.data?.message || error?.message || 'Tandbørstningen kunne ikke gemmes.'
  }
}

async function unlockAdult() {
  const today = String(new Date().getDate())
  if (!approvedBy.value) {
    adultError.value = 'Vælg Mor eller Far'
    return
  }
  if (adultCode.value !== today) {
    adultError.value = 'Datoen stemmer ikke'
    return
  }
  adultUnlocked.value = true
  adultError.value = ''
}

function leave() {
  router.push(testMode.value ? '/parent' : `/child/${id}`)
}

onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
  stopCamera()
})
</script>

<template>
  <main class="container">
    <div class="topbar">
      <NuxtLink class="link" :to="testMode ? '/parent' : `/child/${id}`">← Tilbage</NuxtLink>
      <span class="pill">{{ period === 'morning' ? '☀️ Morgen' : '🌙 Aften' }}</span>
    </div>

    <div v-if="testMode" class="test-banner">🧪 <strong>Testtilstand</strong> · {{ fullTest ? 'Rigtig børstetid' : 'Hurtigtest' }} · Gemmer ikke resultatet</div>

    <section v-if="!started && adultRequired && !adultUnlocked" class="card hero adult-unlock-card">
      <div class="emoji-xl">👨‍👩‍👧</div>
      <h1>Mor eller Far skal hjælpe</h1>
      <p class="muted">Før børstningen kan starte, skal en voksen vælge sig selv og bekræfte dagens dato.</p>

      <div class="grid grid-2 adult-choice-grid section">
        <button class="btn adult-choice" :class="approvedBy === 'Mor' ? 'btn-success' : ''" @click="approvedBy = 'Mor'">👩 Mor</button>
        <button class="btn adult-choice" :class="approvedBy === 'Far' ? 'btn-success' : ''" @click="approvedBy = 'Far'">👨 Far</button>
      </div>

      <div class="form-row adult-date-row">
        <label>Indtast dagens dato</label>
        <input v-model="adultCode" class="input" inputmode="numeric" placeholder="Fx 29" />
      </div>

      <p v-if="adultError" class="pill status-red">{{ adultError }}</p>
      <button class="btn btn-primary" @click="unlockAdult">Fortsæt</button>
    </section>

    <section v-else-if="!started" class="card hero">
      <div class="emoji-xl">🪥</div>
      <h1>Klar, {{ child?.name }}?</h1>
      <p v-if="adultRequired && adultUnlocked" class="pill status-green">{{ approvedBy }} hjælper med denne børstning</p>
      <p class="muted">Du skal børste i {{ durationText }}</p>
      <p class="brush-plan">YDER {{ phaseTiming.outer }} sek. · INDER {{ phaseTiming.inner }} sek. · MIDTEN {{ phaseTiming.middle }} sek.</p>
      <button class="btn btn-primary" @click="start">Start tandbørstning</button>
    </section>

    <section v-else-if="!finished" class="brush-layout brush-layout-visual">
      <div class="camera card camera-card">
        <video v-if="settings.cameraEnabled" ref="video" autoplay playsinline muted></video>
        <div v-else class="emoji-xl">🪞</div>
        <div class="camera-label">Se dig selv her</div>
        <div v-if="cameraError" class="camera-error">{{ cameraError }}</div>
      </div>

      <div class="card timer guide-card">
        <div class="zone-step">Område {{ zoneIndex + 1 }} / {{ zones.length }}</div>
        <div class="timer-number">{{ timeText }}</div>
        <div class="progress"><div :style="{ width: progress + '%' }"></div></div>

        <div class="zone-guide-text">
          <strong>{{ currentZone.surface }}</strong>
          <span>{{ currentZone.label }}</span>
        </div>

        <ToothMap :active-ids="currentZone.ids" :title="currentZone.label" :surface="currentZone.surface" />

        <button class="btn btn-danger btn-wide" @click="complete(true)">Stop før tid</button>
      </div>
    </section>

    <section v-else class="card hero">
      <ConfettiBurst v-if="!endedEarly && settings.confettiEnabled" />
      <div class="emoji-xl">{{ endedEarly ? '🟡' : '🎉' }}</div>
      <h1>{{ endedEarly ? 'Sluttet før tid' : 'Flot klaret!' }}</h1>
      <p :class="['pill', endedEarly ? 'status-yellow' : 'status-green']">{{ earlySeconds() }} sek. / {{ total }} sek.</p>
      <p v-if="adultRequired && approvedBy" class="muted">Godkendt før start af {{ approvedBy }}</p>
      <p v-if="testMode" class="muted">Testen er færdig. Der er ikke gemt stjerner eller historik.</p>
      <p v-else-if="saveError" class="pill status-red">⚠️ {{saveError}} Bed Mor eller Far tilføje tandbørstningen manuelt under Forældre → Historik.</p>
      <p v-else-if="savedSession?.rewardEligible===false" class="pill status-yellow">Tandbørstningen er gemt, men du har allerede fået dagens stjerne for denne periode.</p>
      <p v-else-if="savedSession" class="pill status-green">Gemt ✓ +{{savedSession.starsEarned}} ⭐</p>
      <button class="btn btn-primary" @click="leave">{{ testMode ? 'Tilbage til forældre' : 'Færdig' }}</button>
    </section>
  </main>
</template>
