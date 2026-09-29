<script setup lang="ts">
definePageMeta({middleware:'parent'})
import type { ParentName, Period, BrushingSession } from '~/types'

const {children,rewards,settings,saveConfig,loadRemote,saving,saveError,lastSavedAt}=useTandtidConfig()
const {sessions,loadLocal,starsFor,dayStreak,completedCount,deleteSession,addManualSession}=useBrushData()
const ledger=useRewardsLedger()

const selected=ref('aya')
const activeTab=ref<'overview'|'history'|'rewards'|'settings'>('overview')
const newReward=reactive({title:'',emoji:'🎁',cost:100})
const deletingSessionId=ref<string|null>(null)
const rewardMessage=ref('')
const settingsMessage=ref('')
const manualMessage=ref('')
const manualError=ref('')
const manualOpen=ref(false)
const days=[['monday','Mandag'],['tuesday','Tirsdag'],['wednesday','Onsdag'],['thursday','Torsdag'],['friday','Fredag'],['saturday','Lørdag'],['sunday','Søndag']] as const

function localDateString(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function localTimeString(d = new Date()) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const manual=reactive({
  date: localDateString(),
  time: localTimeString(),
  period: (new Date().getHours() < 15 ? 'morning' : 'evening') as Period,
  status: 'completed' as 'completed'|'ended_early',
  actualSeconds: 90,
  createdByParent: '' as ParentName|''
})

onMounted(async()=>{
  await Promise.all(children.map(c=>loadLocal(c.id)))
  await ledger.hydrate()
  await loadRemote()
  manual.actualSeconds = settings.value.brushingSeconds
})

const selectedChild=computed(()=>children.find(c=>c.id===selected.value))
const childSessions=computed(()=>sessions.value.filter(s=>s.childId===selected.value).sort((a,b)=>(b.completedAt||b.startedAt||b.date).localeCompare(a.completedAt||a.startedAt||a.date)))
const childRedemptions=computed(()=>ledger.redemptions.value.filter(r=>r.childId===selected.value).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)))
const allRedemptions=computed(()=>[...ledger.redemptions.value].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)))
const statusText=(s:string)=>s==='completed'?'Gennemført':s==='ended_early'?'Sluttet før tid':'Ikke udført'
const statusClass=(s:string)=>s==='completed'?'status-green':s==='ended_early'?'status-yellow':'status-red'
const spentForSelected=computed(()=>ledger.spentFor(selected.value))
const visibleStars=computed(()=>starsFor(selected.value, spentForSelected.value))

async function addReward(){
  rewardMessage.value=''
  if(!newReward.title||!newReward.cost)return
  rewards.value.push({id:crypto.randomUUID(),title:newReward.title,emoji:newReward.emoji,cost:Number(newReward.cost),active:true})
  const ok=await saveConfig()
  if(ok){
    rewardMessage.value='Belønningen er gemt i databasen ✓'
    newReward.title='';newReward.emoji='🎁';newReward.cost=100
  }
}
async function removeReward(id:string){
  const i=rewards.value.findIndex(r=>r.id===id)
  if(i<0)return
  const old=rewards.value[i]
  rewards.value.splice(i,1)
  const ok=await saveConfig()
  if(!ok) rewards.value.splice(i,0,old)
  else rewardMessage.value='Belønninger gemt ✓'
}
async function saveRewards(){
  if(await saveConfig()) rewardMessage.value='Belønninger gemt ✓'
}
async function saveSettings(){
  if(await saveConfig()) settingsMessage.value='Indstillinger gemt ✓'
}
function formatDateTime(value?:string){
  if(!value)return '—'
  return new Intl.DateTimeFormat('da-DK',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))
}
function formatTime(s:BrushingSession){
  const value=s.completedAt || s.startedAt
  if(!value)return '—'
  return new Intl.DateTimeFormat('da-DK',{hour:'2-digit',minute:'2-digit'}).format(new Date(value))
}
function childName(id:string){return children.find(c=>c.id===id)?.name || id}

async function removeBrushing(session:any){
  if(!session?.id)return
  const period=session.period==='morning'?'morgen':'aften'
  const name=selectedChild.value?.name || 'barnet'
  const ok=confirm(`Slet ${name}s tandbørstning fra ${session.date} (${period})?`)
  if(!ok)return
  deletingSessionId.value=session.id
  try{ await deleteSession(session) } finally{ deletingSessionId.value=null }
}

async function createManualBrushing(){
  manualMessage.value='';manualError.value=''
  if(!manual.createdByParent){manualError.value='Vælg Mor eller Far';return}
  try{
    const when=new Date(`${manual.date}T${manual.time}:00`)
    const session:BrushingSession={
      id:crypto.randomUUID(),
      childId:selected.value,
      date:manual.date,
      period:manual.period,
      startedAt:new Date(when.getTime()-Math.max(1,Number(manual.actualSeconds))*1000).toISOString(),
      completedAt:when.toISOString(),
      requiredSeconds:settings.value.brushingSeconds,
      actualSeconds:manual.status==='completed'?settings.value.brushingSeconds:Math.max(1,Number(manual.actualSeconds)),
      status:manual.status,
      adultRequired:false,
      adultApproved:true,
      approvedBy:manual.createdByParent,
      createdByParent:manual.createdByParent,
      manual:true,
      starsEarned:0
    }
    const saved=await addManualSession(session)
    manualMessage.value=saved.rewardEligible===false
      ? 'Tandbørstningen er gemt. Der var allerede en tandbørstning i denne periode, så den giver ingen ekstra stjerne.'
      : 'Tandbørstningen er gemt i databasen ✓'
    manualOpen.value=false
  }catch(error:any){
    manualError.value=error?.data?.message || error?.message || 'Kunne ikke gemme tandbørstningen.'
  }
}
function testLink(period:'morning'|'evening', adult=false, full=false){
  return `/child/${selected.value}/brush?period=${period}&test=1${full?'&full=1':'&seconds=10'}${adult?'&adult=1':''}`
}
</script>

<template>
<main class="container parent-container">
  <div class="topbar parent-topbar">
    <div><div class="eyebrow">Forældreområde</div><h2 style="margin:0">🔒 Tandtid</h2></div>
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
      <div class="card stat-card"><span class="stat-label">Stjerner</span><strong class="stat-number">⭐ {{visibleStars}}</strong></div>
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
  </template>

  <template v-else-if="activeTab==='history'">
    <section class="section card">
      <div class="section-heading">
        <div><h2>🪥 Historik – {{selectedChild?.name}}</h2><p class="muted">MongoDB er fælles historik på alle enheder.</p></div>
        <button class="btn btn-primary btn-small" @click="manualOpen=!manualOpen">➕ Tilføj tandbørstning</button>
      </div>

      <div v-if="manualOpen" class="card" style="margin:16px 0;background:#fffaf4">
        <h3>Tilføj tandbørstning manuelt</h3>
        <p class="muted">Brug denne hvis barnet har børstet, men registreringen ikke blev gemt.</p>
        <div class="grid grid-2">
          <div class="form-row"><label>Dato</label><input v-model="manual.date" class="input" type="date"></div>
          <div class="form-row"><label>Klokkeslæt</label><input v-model="manual.time" class="input" type="time"></div>
          <div class="form-row"><label>Periode</label><select v-model="manual.period" class="input"><option value="morning">Morgen</option><option value="evening">Aften</option></select></div>
          <div class="form-row"><label>Resultat</label><select v-model="manual.status" class="input"><option value="completed">Gennemført</option><option value="ended_early">Sluttet før tid</option></select></div>
          <div v-if="manual.status==='ended_early'" class="form-row"><label>Sekunder børstet</label><input v-model.number="manual.actualSeconds" class="input" type="number" min="1" :max="settings.brushingSeconds"></div>
          <div class="form-row"><label>Tilføjet af</label><select v-model="manual.createdByParent" class="input"><option value="">Vælg</option><option value="Mor">Mor</option><option value="Far">Far</option></select></div>
        </div>
        <p v-if="manualError" class="pill status-red">{{manualError}}</p>
        <button class="btn btn-primary" @click="createManualBrushing">Gem tandbørstning</button>
      </div>
      <p v-if="manualMessage" class="pill status-green">{{manualMessage}}</p>

      <div v-if="!childSessions.length" class="empty-state">Ingen tandbørstninger registreret endnu.</div>
      <div v-else class="mobile-history-list">
        <article v-for="s in childSessions" :key="s.id || s.completedAt" class="history-card">
          <div class="history-card-top">
            <strong>{{s.period==='morning'?'☀️ Morgen':'🌙 Aften'}}</strong>
            <span class="pill" :class="statusClass(s.status)">{{statusText(s.status)}}</span>
          </div>
          <div class="history-details">
            <span>📅 {{s.date}}</span>
            <span>🕒 {{formatTime(s)}}</span>
            <span>⏱ {{s.actualSeconds}} / {{s.requiredSeconds}} sek.</span>
            <span>⭐ {{Number(s.starsEarned || 0)}}{{s.rewardEligible===false?' · ekstra børstning':''}}</span>
            <span v-if="s.manual">✍️ Manuelt tilføjet{{s.createdByParent?' af '+s.createdByParent:''}}</span>
            <span>👨‍👩‍👧 {{s.approvedBy || (s.adultRequired?'Ikke godkendt':'Ikke påkrævet')}}</span>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:12px">
            <button class="btn btn-danger btn-small" type="button" :disabled="deletingSessionId===s.id" @click="removeBrushing(s)">
              {{ deletingSessionId===s.id ? 'Sletter…' : '🗑 Slet tandbørstning' }}
            </button>
          </div>
        </article>
      </div>
    </section>
  </template>

  <template v-else-if="activeTab==='rewards'">
    <section class="section card">
      <div class="section-heading"><div><h2>🎁 Aktive belønninger</h2><p class="muted">Gemmes direkte i MongoDB og vises på børnenes enheder.</p></div><button class="btn btn-small" @click="loadRemote">↻ Hent igen</button></div>
      <p v-if="rewardMessage" class="pill status-green">{{rewardMessage}}</p>
      <p v-if="saveError" class="pill status-red">{{saveError}}</p>
      <div v-for="r in rewards" :key="r.id" class="reward-admin-row">
        <div class="reward-main"><div class="reward-emoji">{{r.emoji}}</div><div><strong>{{r.title}}</strong><div class="muted">{{r.cost}} ⭐</div></div></div>
        <div class="reward-admin-actions"><label class="mini-toggle"><input v-model="r.active" type="checkbox" @change="saveRewards"><span>Aktiv</span></label><button class="btn btn-danger btn-small" @click="removeReward(r.id)">Slet</button></div>
      </div>
      <div class="reward-create">
        <h3>Opret ny belønning</h3>
        <div class="form-row"><label>Navn</label><input v-model="newReward.title" class="input" placeholder="Fx vælge aftensmad"></div>
        <div class="reward-create-grid"><div class="form-row"><label>Emoji</label><input v-model="newReward.emoji" class="input" placeholder="🎁"></div><div class="form-row"><label>Stjerner</label><input v-model.number="newReward.cost" class="input" type="number" min="1"></div></div>
        <button class="btn btn-primary" :disabled="saving" @click="addReward">{{saving?'Gemmer…':'Opret og gem belønning'}}</button>
      </div>
    </section>

    <section class="section card">
      <h2>🧾 Indløste belønninger</h2>
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
        <div class="adult-rule-list">
          <div v-for="d in days" :key="d[0]" class="adult-rule-row"><strong>{{d[1]}}</strong><label><input v-model="settings.adultRules[d[0]].morning" type="checkbox"> ☀️ Morgen</label><label><input v-model="settings.adultRules[d[0]].evening" type="checkbox"> 🌙 Aften</label></div>
        </div>
      </div>
    </section>
    <section class="section card">
      <p v-if="settingsMessage" class="pill status-green">{{settingsMessage}}</p>
      <p v-if="saveError" class="pill status-red">{{saveError}}</p>
      <button class="btn btn-primary" :disabled="saving" @click="saveSettings">{{saving?'Gemmer…':'Gem indstillinger i databasen'}}</button>
    </section>
  </template>
</main>
</template>
