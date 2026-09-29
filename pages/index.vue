<script setup lang="ts">
const { children } = useTandtidConfig()
</script>
<template>
  <main class="container">
    <section class="hero">
      <div class="emoji-xl">🦷</div>
      <h1>Tandtid</h1>
      <p class="muted">Hvem skal børste tænder?</p>
    </section>
    <section class="grid grid-3">
      <NuxtLink v-for="child in children" :key="child.id" class="card profile" :to="`/child/${child.id}`">
        <div class="emoji-xl">{{ child.emoji }}</div><h2>{{ child.name }}</h2>
      </NuxtLink>
      <NuxtLink class="card profile" to="/parent/login"><div class="emoji-xl">🔒</div><h2>Forældre</h2></NuxtLink>
    </section>
  </main>
</template>
