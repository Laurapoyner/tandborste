<script setup lang="ts">
const pin = ref('')
const error = ref('')
const loading = ref(false)
const { verify } = useParentAuth()

async function login() {
  loading.value = true
  error.value = ''
  const ok = await verify(pin.value)
  loading.value = false
  if (ok) return navigateTo('/parent')
  error.value = navigator.onLine
    ? 'Forkert PIN-kode'
    : 'PIN kan først bruges offline på denne enhed, når den har været godkendt online mindst én gang.'
}
</script>

<template>
  <main class="container">
    <section class="card hero" style="max-width:520px;margin:70px auto">
      <div class="emoji-xl">🔒</div>
      <h1>Forældre</h1>
      <div class="form-row">
        <label>PIN-kode</label>
        <input v-model="pin" class="input" type="password" inputmode="numeric" @keyup.enter="login">
      </div>
      <p v-if="error" class="pill status-red">{{ error }}</p>
      <button class="btn btn-primary btn-wide" :disabled="loading" @click="login">{{ loading ? 'Tjekker…' : 'Log ind' }}</button>
      <NuxtLink class="link" to="/" style="display:block;margin-top:18px">← Tilbage</NuxtLink>
    </section>
  </main>
</template>
