<template>
  <div class="app-layout">
    <Navbar />
    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import Navbar from '../components/public/Navbar.vue';
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
