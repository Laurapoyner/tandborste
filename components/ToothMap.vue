<script setup lang="ts">
const props = defineProps<{
  activeIds: string[]
  title?: string
  surface?: string
}>()

const isActive = (id: string) => props.activeIds.includes(id)
const mode = computed(() => {
  const s = (props.surface || '').toLowerCase()
  if (s.includes('inder')) return 'inner'
  if (s.includes('midten') || s.includes('tygge')) return 'middle'
  return 'outer'
})

const upper = [
  { x: 62, w: 32, h: 40, id: 'ul' },
  { x: 96, w: 31, h: 43, id: 'ul' },
  { x: 129, w: 29, h: 46, id: 'ul' },
  { x: 160, w: 28, h: 49, id: 'uf' },
  { x: 190, w: 28, h: 49, id: 'uf' },
  { x: 220, w: 29, h: 46, id: 'ur' },
  { x: 251, w: 31, h: 43, id: 'ur' },
  { x: 284, w: 32, h: 40, id: 'ur' },
]
const lower = [
  { x: 62, w: 32, h: 40, id: 'll' },
  { x: 96, w: 31, h: 43, id: 'll' },
  { x: 129, w: 29, h: 46, id: 'll' },
  { x: 160, w: 28, h: 49, id: 'lf' },
  { x: 190, w: 28, h: 49, id: 'lf' },
  { x: 220, w: 29, h: 46, id: 'lr' },
  { x: 251, w: 31, h: 43, id: 'lr' },
  { x: 284, w: 32, h: 40, id: 'lr' },
]

function activeFor(zone: string) {
  if (mode.value === 'middle') return false
  return isActive(`${zone}-${mode.value}`)
}
</script>

<template>
  <div class="tooth-map-wrap normal-mouth-map">
    <div class="surface-title" :class="`surface-${mode}`">
      {{ mode === 'outer' ? 'YDER' : mode === 'inner' ? 'INDER' : 'MIDTEN' }}
    </div>

    <svg viewBox="0 0 380 300" class="tooth-map clean-tooth-map" role="img" aria-label="Tandkort med markeret område">
      <defs>
        <filter id="cleanShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#617180" flood-opacity=".13"/>
        </filter>
      </defs>

      <!-- simple, calm gums -->
      <path d="M48 78 C92 42 288 42 332 78 C300 67 266 63 190 63 C114 63 80 67 48 78Z" fill="#f7c5ca"/>
      <path d="M48 222 C92 258 288 258 332 222 C300 233 266 237 190 237 C114 237 80 233 48 222Z" fill="#f7c5ca"/>

      <!-- upper teeth: normal front-view teeth -->
      <g v-for="(t,i) in upper" :key="'u'+i" filter="url(#cleanShadow)">
        <path
          :d="`M${t.x} 68 Q${t.x+t.w/2} 58 ${t.x+t.w} 68 L${t.x+t.w-3} ${68+t.h-8} Q${t.x+t.w/2} ${68+t.h+3} ${t.x+3} ${68+t.h-8} Z`"
          :class="['clean-tooth',{active:activeFor(t.id)}]"
        />
        <path v-if="mode==='inner' && activeFor(t.id)" :d="`M${t.x+8} 78 Q${t.x+t.w/2} 72 ${t.x+t.w-8} 78 L${t.x+t.w-10} ${68+t.h-14} Q${t.x+t.w/2} ${68+t.h-8} ${t.x+10} ${68+t.h-14} Z`" class="inner-overlay"/>
      </g>

      <!-- lower teeth -->
      <g v-for="(t,i) in lower" :key="'l'+i" filter="url(#cleanShadow)">
        <path
          :d="`M${t.x+3} ${232-t.h+8} Q${t.x+t.w/2} ${232-t.h-3} ${t.x+t.w-3} ${232-t.h+8} L${t.x+t.w} 232 Q${t.x+t.w/2} 242 ${t.x} 232 Z`"
          :class="['clean-tooth',{active:activeFor(t.id)}]"
        />
        <path v-if="mode==='inner' && activeFor(t.id)" :d="`M${t.x+10} ${232-t.h+14} Q${t.x+t.w/2} ${232-t.h+8} ${t.x+t.w-10} ${232-t.h+14} L${t.x+t.w-8} 221 Q${t.x+t.w/2} 226 ${t.x+8} 221 Z`" class="inner-overlay"/>
      </g>

      <!-- chewing surfaces shown as calm top-down pads between arches -->
      <g v-if="mode==='middle'">
        <g :class="['chew-zone',{active:isActive('upper-middle')}]">
          <rect x="58" y="132" width="86" height="24" rx="12"/>
          <rect x="236" y="132" width="86" height="24" rx="12"/>
        </g>
        <g :class="['chew-zone',{active:isActive('lower-middle')}]">
          <rect x="58" y="165" width="86" height="24" rx="12"/>
          <rect x="236" y="165" width="86" height="24" rx="12"/>
        </g>
        <text x="190" y="151" text-anchor="middle" class="middle-label">øverst</text>
        <text x="190" y="184" text-anchor="middle" class="middle-label">nederst</text>
      </g>

      <g class="map-helper clean-helper">
        <text x="22" y="153" text-anchor="middle">VENSTRE</text>
        <text x="358" y="153" text-anchor="middle">HØJRE</text>
      </g>
    </svg>

    <div class="tooth-map-caption">
      <strong>{{ title || 'Børst her nu' }}</strong>
      <span v-if="mode==='outer'">Siden af tænderne mod læber og kinder</span>
      <span v-else-if="mode==='inner'">Siden af tænderne mod tungen</span>
      <span v-else>Oven på de bagerste tænder</span>
    </div>
  </div>
</template>
