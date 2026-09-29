<script setup lang="ts">
definePageMeta({middleware:'parent'})
import type { Redemption } from '~/types'

const {children,rewards,settings}=useTandtidConfig()
const {sessions,loadLocal,starsFor,dayStreak,completedCount}=useBrushData()
const ledger=useRewardsLedger()

const selected=ref('aya')
const activeTab=ref<'overview'|'history'|'rewards'|'settings'>('overview')
const newReward=reactive({title:'',emoji:'🎁',cost:100})
const days=[['monday','Mandag'],['tuesday','Tirsdag'],['wednesday','Onsdag'],['thursday','Torsdag'],['friday','Fredag'],['saturday','Lørdag'],['sunday','Søndag']] as const

onMounted(()=>{
  children.forEach(c=>loadLocal(c.id))
  ledger.hydrate()
})

const selectedChild=computed(()=>children.find(c=>c.id===selected.value))
const childSessions=computed(()=>sessions.value.filter(s=>s.childId===selected.value).sort((a,b)=>(b.completedAt||b.date).localeCompare(a.completedAt||a.date)))
const childRedemptions=computed(()=>ledger.redemptions.value.filter(r=>r.childId===selected.value).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)))
const allRedemptions=computed(()=>[...ledger.redemptions.value].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)))
const statusText=(s:string)=>s==='completed'?'Gennemført':s==='ended_early'?'Sluttet før tid':'Ikke udført'
const statusClass=(s:string)=>s==='completed'?'status-green':s==='ended_early'?'status-yellow':'status-red'

function addReward(){
  if(!newReward.title||!newReward.cost)return
  rewards.value.push({id:crypto.randomUUID(),title:newReward.title,emoji:newReward.emoji,cost:Number(newReward.cost),active:true})
  newReward.title='';newReward.emoji='🎁';newReward.cost=100
}
function removeReward(id:string){
  const i=rewards.value.findIndex(r=>r.id===id)
  if(i>=0) rewards.value.splice(i,1)
}
function formatDateTime(value:string){
  return new Intl.DateTimeFormat('da-DK',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))
}
function childName(id:string){return children.find(c=>c.id===id)?.name || id}
function testLink(period:'morning'|'evening', adult=false, full=false){
  return `/child/${selected.value}/brush?period=${period}&test=1${full?'&full=1':'&seconds=10'}${adult?'&adult=1':''}`
}
</script>

<template>
<main class="container parent-container">
  <div class="topbar parent-topbar">
    <div>
      <div class="eyebrow">Forældreområde</div>
      <h2 style="margin:0">🔒 Tandtid</h2>
    </div>
    <NuxtLink class="link" to="/">Profiler</NuxtLink>
  </div>

  <nav class="parent-tabs" aria-label="Forældremenu">
    <button :class="['parent-tab',{active:activeTab==='overview'}]" @click="activeTab='overview'">🏠 <span>Overblik</span></button>
    <button :class="['parent-tab',{active:activeTab==='history'}]" @click="activeTab='history'">🪥 <span>Historik</span></button>
    <button :class="['parent-tab',{active:activeTab==='rewards'}]" @click="activeTab='rewards'">🎁 <span>Belønninger</span></button>
    <button :class="['parent-tab',{active:activeTab==='settings'}]" @click="activeTab='settings'">⚙️ <span>Indstillinger</span></button>
  </nav>

  <section class="child-switcher">
    <button v-for="c in children" :key="c.id" :class="['child-chip',{active:selected===c.id}]" @click="selected=c.id">
      <span>{{c.emoji}}</span><strong>{{c.name}}</strong>
    </button>
  </section>

  <template v-if="activeTab==='overview'">
    <section class="parent-summary-grid">
      <div class="card stat-card"><span class="stat-label">Stjerner</span><strong class="stat-number">⭐ {{starsFor(selected)}}</strong></div>
      <div class="card stat-card"><span class="stat-label">Streak</span><strong class="stat-number">🔥 {{dayStreak(selected)}}</strong><small>dage</small></div>
      <div class="card stat-card"><span class="stat-label">Gennemført</span><strong class="stat-number">🪥 {{completedCount(selected)}}</strong></div>
      <div class="card stat-card"><span class="stat-label">Belønninger brugt</span><strong class="stat-number">🎁 {{childRedemptions.length}}</strong></div>
    </section>

    <section class="section card">
      <h2>🧪 Test tandbørstningen</h2>
      <p class="muted">Test påvirker ikke stjerner, streaks eller historik.</p>
      <div class="test-actions">
        <NuxtLink class="btn" :to="testLink('morning')">⚡ Hurtigtest · 10 sek.</NuxtLink>
        <NuxtLink class="btn btn-sun" :to="testLink('morning',false,true)">🪥 Test rigtig tid · {{ settings.brushingSeconds }} sek.</NuxtLink>
        <NuxtLink class="btn" :to="testLink('morning',true,true)">👨‍👩‍👧 Voksen-flow · rigtig tid</NuxtLink>
      </div>
    </section>

    <section class="section card">
      <div class="section-heading"><div><h2>Seneste aktivitet</h2><p class="muted">{{selectedChild?.name}}</p></div><button class="btn btn-small" @click="activeTab='history'">Se alt</button></div>
      <div v-if="!childSessions.length" class="empty-state">Ingen tandbørstninger registreret endnu.</div>
      <div v-else class="activity-list">
        <div v-for="s in childSessions.slice(0,4)" :key="s.id || s.completedAt" class="activity-row">
          <div><strong>{{s.period==='morning'?'☀️ Morgen':'🌙 Aften'}}</strong><div class="muted activity-meta">{{s.date}} · {{s.actualSeconds}}/{{s.requiredSeconds}} sek.</div></div>
          <span class="pill" :class="statusClass(s.status)">{{statusText(s.status)}}</span>
        </div>
      </div>
    </section>

    <section class="section card">
      <div class="section-heading"><div><h2>Senest indløst</h2><p class="muted">Belønninger brugt af {{selectedChild?.name}}</p></div><button class="btn btn-small" @click="activeTab='rewards'">Se alle</button></div>
      <div v-if="!childRedemptions.length" class="empty-state">Ingen belønninger er indløst endnu.</div>
      <div v-else class="activity-list">
        <div v-for="r in childRedemptions.slice(0,3)" :key="r.id" class="activity-row">
          <div class="reward-main"><div class="reward-emoji">{{r.rewardEmoji}}</div><div><strong>{{r.rewardTitle}}</strong><div class="muted activity-meta">{{formatDateTime(r.createdAt)}} · {{r.approvedBy}}</div></div></div>
          <span class="pill">−{{r.cost}} ⭐</span>
        </div>
      </div>
    </section>
  </template>

  <template v-else-if="activeTab==='history'">
    <section class="section card">
      <h2>🪥 Historik – {{selectedChild?.name}}</h2>
      <div v-if="!childSessions.length" class="empty-state">Ingen tandbørstninger registreret endnu.</div>
      <div v-else class="mobile-history-list">
        <article v-for="s in childSessions" :key="s.id || s.completedAt" class="history-card">
          <div class="history-card-top"><strong>{{s.period==='morning'?'☀️ Morgen':'🌙 Aften'}}</strong><span class="pill" :class="statusClass(s.status)">{{statusText(s.status)}}</span></div>
          <div class="history-details">
            <span>📅 {{s.date}}</span><span>⏱ {{s.actualSeconds}} / {{s.requiredSeconds}} sek.</span><span>👨‍👩‍👧 {{s.approvedBy || (s.adultRequired?'Ikke godkendt':'Ikke påkrævet')}}</span>
          </div>
        </article>
      </div>
    </section>
  </template>

  <template v-else-if="activeTab==='rewards'">
    <section class="section card">
      <h2>🎁 Aktive belønninger</h2>
      <div v-for="r in rewards" :key="r.id" class="reward-admin-row">
        <div class="reward-main"><div class="reward-emoji">{{r.emoji}}</div><div><strong>{{r.title}}</strong><div class="muted">{{r.cost}} ⭐</div></div></div>
        <div class="reward-admin-actions"><label class="mini-toggle"><input v-model="r.active" type="checkbox"><span>Aktiv</span></label><button class="btn btn-danger btn-small" @click="removeReward(r.id)">Slet</button></div>
      </div>
      <div class="reward-create">
        <h3>Opret ny belønning</h3>
        <div class="form-row"><label>Navn</label><input v-model="newReward.title" class="input" placeholder="Fx vælge aftensmad"></div>
        <div class="reward-create-grid"><div class="form-row"><label>Emoji</label><input v-model="newReward.emoji" class="input" placeholder="🎁"></div><div class="form-row"><label>Stjerner</label><input v-model.number="newReward.cost" class="input" type="number" min="1"></div></div>
        <button class="btn btn-primary" @click="addReward">Opret belønning</button>
      </div>
    </section>

    <section class="section card">
      <h2>🧾 Indløste belønninger</h2>
      <p class="muted">Her kan I se, hvad børnene allerede har brugt deres stjerner på.</p>
      <div v-if="!allRedemptions.length" class="empty-state">Der er endnu ikke indløst nogen belønninger.</div>
      <div v-else class="redemption-list">
        <article v-for="r in allRedemptions" :key="r.id" class="redemption-card">
          <div class="reward-main"><div class="reward-emoji">{{r.rewardEmoji}}</div><div><strong>{{r.rewardTitle}}</strong><div class="muted">{{childName(r.childId)}} · {{formatDateTime(r.createdAt)}}</div></div></div>
          <div class="redemption-meta"><strong>−{{r.cost}} ⭐</strong><span class="muted">Godkendt af {{r.approvedBy}}</span></div>
        </article>
      </div>
    </section>
  </template>

  <template v-else>
    <section class="section grid grid-2 parent-settings-grid">
      <div class="card">
        <h2>⚙️ Tandbørstning</h2>
        <div class="form-row"><label>Standardtid i sekunder</label><input v-model.number="settings.brushingSeconds" class="input" type="number" min="15" max="600"></div>
        <div class="grid grid-2 time-grid"><div class="form-row"><label>Morgen fra</label><input v-model="settings.morningStart" class="input" type="time"></div><div class="form-row"><label>Morgen til</label><input v-model="settings.morningEnd" class="input" type="time"></div><div class="form-row"><label>Aften fra</label><input v-model="settings.eveningStart" class="input" type="time"></div><div class="form-row"><label>Aften til</label><input v-model="settings.eveningEnd" class="input" type="time"></div></div>
        <div class="switch-row"><span>Kamera</span><input v-model="settings.cameraEnabled" type="checkbox"></div>
        <div class="switch-row"><span>Konfetti</span><input v-model="settings.confettiEnabled" type="checkbox"></div>
        <div class="switch-row"><span>Lyd</span><input v-model="settings.soundEnabled" type="checkbox"></div>
      </div>
      <div class="card">
        <h2>👨‍👩‍👧 Voksenhjælp</h2>
        <p class="muted">Vælg frit hvilke dage en voksen skal hjælpe.</p>
        <div class="adult-rule-list">
          <div v-for="d in days" :key="d[0]" class="adult-rule-row">
            <strong>{{d[1]}}</strong>
            <label><input v-model="settings.adultRules[d[0]].morning" type="checkbox"> ☀️ Morgen</label>
            <label><input v-model="settings.adultRules[d[0]].evening" type="checkbox"> 🌙 Aften</label>
          </div>
        </div>
      </div>
    </section>
  </template>
</main>
</template>
