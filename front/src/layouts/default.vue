<template>
  <div class="app-layout">
    <!-- Desktop Sidebar -->
    <aside
      v-if="!mobile"
      class="app-sidebar"
      :class="{ 'app-sidebar--collapsed': sidebarCollapsed }"
    >
      <div class="app-sidebar__header">
        <img alt="Spyglass" class="app-sidebar__logo" src="@/assets/logo.svg">
        <span v-if="!sidebarCollapsed" class="app-sidebar__title">{{ t('app.name') }}</span>
      </div>

      <nav class="app-sidebar__nav">
        <router-link
          v-for="item in visibleNavItems"
          :key="item.route"
          class="app-sidebar__item"
          :class="{ 'app-sidebar__item--active': currentRoute === item.route }"
          :to="{ name: item.route }"
        >
          <v-icon :icon="item.icon" size="22" />
          <span v-if="!sidebarCollapsed" class="app-sidebar__label">{{ t(item.label) }}</span>
        </router-link>
      </nav>

      <div class="app-sidebar__footer">
        <button class="app-sidebar__item" @click="toggleSidebar">
          <v-icon :icon="sidebarCollapsed ? 'mdi-chevron-right' : 'mdi-chevron-left'" size="22" />
          <span v-if="!sidebarCollapsed" class="app-sidebar__label">{{ sidebarCollapsed ? '' : '' }}</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="app-content" :class="{ 'app-content--with-sidebar': !mobile }">
      <router-view v-slot="{ Component }">
        <transition mode="out-in" name="page">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Mobile Bottom Bar -->
    <nav v-if="mobile" class="app-bottombar">
      <router-link
        v-for="item in mobileNavItems"
        :key="item.route"
        class="app-bottombar__item"
        :class="{ 'app-bottombar__item--active': currentRoute === item.route }"
        :to="{ name: item.route }"
      >
        <v-icon :icon="item.icon" size="22" />
        <span class="app-bottombar__label">{{ t(item.label) }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { useAuthStore } from '@/stores/auth'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const { mobile } = useDisplay()
  const auth = useAuthStore()

  const sidebarCollapsed = ref(false)

  const currentRoute = computed(() => route.name as string)

  interface NavItem {
    route: string
    icon: string
    label: string
    roles?: string[]
  }

  const navItems: NavItem[] = [
    { route: 'dashboard', icon: 'mdi-view-dashboard-outline', label: 'nav.dashboard' },
    { route: 'watchers', icon: 'mdi-eye-outline', label: 'nav.watchers' },
    { route: 'events', icon: 'mdi-timeline-clock-outline', label: 'nav.events' },
    { route: 'providers', icon: 'mdi-brain', label: 'nav.providers' },
    { route: 'users', icon: 'mdi-account-group-outline', label: 'nav.users', roles: ['admin'] },
    { route: 'settings', icon: 'mdi-cog-outline', label: 'nav.settings' },
  ]

  const visibleNavItems = computed(() =>
    navItems.filter(item => {
      if (!item.roles) return true
      return item.roles.includes(auth.user?.role ?? '')
    }),
  )

  const mobileNavItems = computed(() =>
    navItems
      .filter(item => {
        if (!item.roles) return true
        return item.roles.includes(auth.user?.role ?? '')
      })
      .slice(0, 5), // Max 5 items in bottom bar
  )

  function toggleSidebar () {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  async function handleLogout () {
    try {
      const { authApi } = await import('@/api/auth')
      await authApi.logout()
    } catch {
      // Ignore — we're logging out anyway
    }
    auth.logout()
    router.push({ name: 'login' })
  }
</script>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

// Sidebar
.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 240px;
  display: flex;
  flex-direction: column;
  background: rgba(22, 27, 34, 0.85);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(48, 54, 61, 0.6);
  z-index: 100;
  transition: width 0.2s ease;

  &--collapsed {
    width: 68px;
  }
}

.app-sidebar__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(48, 54, 61, 0.4);
}

.app-sidebar__logo {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.app-sidebar__title {
  font-size: 18px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.app-sidebar__nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 8px;
  overflow-y: auto;
}

.app-sidebar__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  color: rgba(230, 237, 243, 0.7);
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;
  border: 1px solid transparent;
  background: none;
  width: 100%;
  font-size: 14px;

  &:hover {
    background: rgba(0, 229, 255, 0.06);
    color: rgb(var(--v-theme-primary));
    border-color: rgba(0, 229, 255, 0.15);
  }

  &--active {
    background: rgba(0, 229, 255, 0.1);
    color: rgb(var(--v-theme-primary));
    border-color: rgba(0, 229, 255, 0.25);
    box-shadow: 0 0 12px rgba(0, 229, 255, 0.1);
  }
}

.app-sidebar__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 8px;
  border-top: 1px solid rgba(48, 54, 61, 0.4);
}

// Main content
.app-content {
  flex: 1;
  min-height: 100vh;
  padding: 16px;
  padding-bottom: 80px; // Space for mobile bottom bar

  &--with-sidebar {
    margin-left: 240px;
    padding-bottom: 16px;

    .app-sidebar--collapsed + & {
      margin-left: 68px;
    }
  }
}

// Mobile Bottom Bar
.app-bottombar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 64px;
  background: rgba(22, 27, 34, 0.92);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(48, 54, 61, 0.6);
  z-index: 100;
  padding: 0 4px;
  padding-bottom: env(safe-area-inset-bottom);
}

.app-bottombar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 12px;
  color: rgba(230, 237, 243, 0.5);
  text-decoration: none;
  transition: all 0.15s ease;
  min-width: 56px;

  &--active {
    color: rgb(var(--v-theme-primary));

    .app-bottombar__label {
      color: rgb(var(--v-theme-primary));
    }
  }
}

.app-bottombar__label {
  font-size: 10px;
  white-space: nowrap;
}

// Page transitions
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
