<template>
  <v-app>
    <router-view v-slot="{ Component }">
      <transition mode="out-in" name="fade">
        <component :is="Component" />
      </transition>
    </router-view>
  </v-app>
</template>

<script lang="ts" setup>
//
</script>

<style>
html, body {
  overflow-x: hidden;
}

/* Global scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(48, 54, 61, 0.6);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(48, 54, 61, 0.9);
}

/* Root transition (login <-> app) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
