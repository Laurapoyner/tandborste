<script setup lang="ts">
import type { ParentName, Reward } from '~/types'

const route = useRoute()
const id = String(route.params.id)
const { children, rewards, loadRemote } = useTandtidConfig()
const { loadLocal, starsFor } = useBrushData()
const ledger = useRewardsLedger()
const { verify } = useParentAuth()
const child = children.find(c => c.id === id)
const refresh = ref(0)

onMounted(async () => {
  await Promise.all([loadRemote(), loadLocal(id), ledger.hydrate()])
})

const stars = computed(() => { refresh.value; return starsFor(id, ledger.spentFor(id)) })
const selected = ref<Reward | null>(null)
const pin = ref('')
const who = ref<ParentName | undefined>()
const error = ref('')
const success = ref('')
const loading = ref(false)

async function refreshAll(){
  await Promise.all([loadRemote(), loadLocal(id), ledger.syncFromServer()])
  refresh.value++
}

async function redeem() {
  if (!selected.value) return
  if (!who.value) { error.value = 'Vælg Mor eller Far'; return }
  if (stars.value < selected.value.cost) { error.value = 'Der er ikke nok stjerner'; return }

  loading.value = true
  error.value = ''
  const ok = await verify(pin.value)
  if (!ok) {
    loading.value = false
    error.value = navigator.onLine ? 'Forkert forældre-PIN' : 'Der skal være internet for at godkende en belønning.'
    return
  }

  try {
    await ledger.redeem(id, selected.value, who.value)
    refresh.value++
    success.value = `${selected.value.emoji} ${selected.value.title} er indløst`
    selected.value = null
    pin.value = ''
    who.value = undefined
  } catch {
    error.value = 'Kunne ikke gemme indløsningen i databasen.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="container">
    <div class="topbar"><NuxtLink class="link" :to="`/child/${id}`">← {{child?.name}}</NuxtLink><span class="pill">⭐ {{stars}}</span></div>
    <div class="section-heading"><div><h1>🎁 Belønninger</h1><p class="muted">Belønninger hentes fra den fælles database.</p></div><button class="btn btn-small" @click="refreshAll">↻ Opdater</button></div>
    <p v-if="success" class="pill status-green">{{success}}</p>
    <div class="grid">
      <div v-for="r in rewards.filter(x=>x.active)" :key="r.id" class="card reward">
        <div class="reward-main"><div class="reward-emoji">{{r.emoji}}</div><div><h2>{{r.title}}</h2><div class="muted">{{r.cost}} ⭐</div></div></div>
        <button class="btn" :class="stars>=r.cost?'btn-success':''" :disabled="stars<r.cost" @click="selected=r">{{stars>=r.cost?'Indløs':`${stars}/${r.cost}`}}</button>
      </div>
    </div>
    <section v-if="selected" class="card section">
      <h2>Forælder skal godkende</h2>
      <p>{{selected.emoji}} {{selected.title}} · {{selected.cost}} ⭐</p>
      <div class="grid grid-2"><button class="btn" :class="who==='Mor'?'btn-success':''" @click="who='Mor'">👩 Mor</button><button class="btn" :class="who==='Far'?'btn-success':''" @click="who='Far'">👨 Far</button></div>
      <div class="form-row"><label>Forældre-PIN</label><input v-model="pin" class="input" type="password" inputmode="numeric"></div>
      <p v-if="error" class="pill status-red">{{error}}</p>
      <button class="btn btn-primary btn-wide" :disabled="loading" @click="redeem">{{loading?'Godkender…':'Godkend indløsning'}}</button>
    </section>
  </main>
</template>
