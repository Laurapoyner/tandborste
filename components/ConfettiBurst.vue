<script setup lang="ts">
const pieces = Array.from({length:28},(_,i)=>({id:i,left:Math.random()*100,delay:Math.random()*.4,emoji:['⭐','✨','🎉','🦷'][i%4]}))
</script>
<template><div class="celebrate"><span v-for="p in pieces" :key="p.id" class="confetti" :style="{left:p.left+'%',animationDelay:p.delay+'s'}">{{p.emoji}}</span></div></template>
