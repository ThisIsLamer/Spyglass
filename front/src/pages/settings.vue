<template>
  <div class="page-settings">
    <header class="page-header">
      <h1 class="page-title">{{ t('nav.settings') }}</h1>
    </header>

    <!-- Profile -->
    <section class="settings-section">
      <h2 class="settings-section__title">{{ t('nav.profile') }}</h2>

      <div class="settings-card">
        <div class="settings-card__row">
          <span class="settings-card__label">{{ t('users.username') }}</span>
          <span class="settings-card__value settings-card__value--mono">{{ auth.user?.username }}</span>
        </div>

        <div class="settings-card__row">
          <span class="settings-card__label">{{ t('users.displayName') }}</span>
          <span class="settings-card__value">{{ auth.user?.displayName || '—' }}</span>
        </div>

        <div class="settings-card__row">
          <span class="settings-card__label">{{ t('users.role') }}</span>

          <v-chip :color="getRoleColor(auth.user?.role ?? '')" size="x-small" variant="flat">
            {{ auth.user?.role }}
          </v-chip>
        </div>
      </div>
    </section>

    <!-- Language -->
    <section class="settings-section">
      <h2 class="settings-section__title">{{ t('nav.settings') }} / Language</h2>

      <div class="settings-card">
        <div class="lang-buttons">
          <v-btn
            :color="currentLang === 'ru' ? 'primary' : undefined"
            :loading="savingLang === 'ru'"
            size="small"
            :variant="currentLang === 'ru' ? 'flat' : 'outlined'"
            @click="changeLanguage('ru')"
          >
            Русский
          </v-btn>

          <v-btn
            :color="currentLang === 'en' ? 'primary' : undefined"
            :loading="savingLang === 'en'"
            size="small"
            :variant="currentLang === 'en' ? 'flat' : 'outlined'"
            @click="changeLanguage('en')"
          >
            English
          </v-btn>
        </div>
      </div>
    </section>

    <!-- Frigate -->
    <section class="settings-section">
      <h2 class="settings-section__title">Frigate</h2>

      <div v-if="frigateLoading" class="loading-state">
        <v-progress-circular color="primary" indeterminate size="24" />
      </div>

      <div v-else class="settings-card">
        <div class="settings-card__row">
          <span class="settings-card__label">Статус</span>

          <v-chip
            :color="frigateInfo?.status === 'connected' ? 'success' : 'error'"
            size="x-small"
            variant="flat"
          >
            {{ frigateInfo?.status === 'connected' ? 'Подключено' : 'Отключено' }}
          </v-chip>
        </div>

        <div v-if="frigateInfo?.error" class="settings-card__row">
          <span class="settings-card__label">Ошибка</span>
          <span class="settings-card__value settings-card__value--error">{{ frigateInfo.error }}</span>
        </div>

        <div class="settings-card__row">
          <span class="settings-card__label">Камеры</span>
          <span class="settings-card__value">{{ frigateInfo?.cameras?.length ?? 0 }}</span>
        </div>

        <!-- Cameras list -->
        <div v-if="frigateInfo?.cameras?.length" class="frigate-cameras">
          <div v-for="camera in frigateInfo.cameras" :key="camera.name" class="frigate-camera">
            <span class="frigate-camera__name">{{ camera.name }}</span>

            <div v-if="camera.zones.length > 0" class="frigate-camera__zones">
              <v-chip
                v-for="zone in camera.zones"
                :key="zone"
                color="secondary"
                size="x-small"
                variant="outlined"
              >
                {{ zone }}
              </v-chip>
            </div>
          </div>
        </div>

        <!-- Labels -->
        <div v-if="frigateInfo?.labels?.length" class="settings-card__row settings-card__row--wrap">
          <span class="settings-card__label">Объекты</span>

          <div class="frigate-labels">
            <v-chip v-for="label in frigateInfo.labels" :key="label" size="x-small" variant="outlined">
              {{ label }}
            </v-chip>
          </div>
        </div>
      </div>
    </section>

    <!-- Logout -->
    <section class="settings-section">
      <v-btn color="error" prepend-icon="mdi-logout" variant="tonal" @click="handleLogout">
        {{ t('nav.logout') }}
      </v-btn>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { authApi } from '@/api/auth'
  import { frigateApi, type FrigateCamera } from '@/api/frigate'
  import { useAuthStore } from '@/stores/auth'

  const { t, locale } = useI18n()
  const auth = useAuthStore()

  const currentLang = computed(() => locale.value)
  const savingLang = ref<string | null>(null)

  interface FrigateInfo {
    cameras: FrigateCamera[]
    labels: string[]
    status: 'connected' | 'disconnected'
    error?: string
  }

  const frigateInfo = ref<FrigateInfo | null>(null)
  const frigateLoading = ref(true)

  function getRoleColor (role: string) {
    return { admin: 'error', operator: 'warning', viewer: 'info' }[role] ?? 'info'
  }

  async function changeLanguage (lang: string) {
    savingLang.value = lang
    const res = await authApi.setLanguage(lang)
    if (res.success) {
      locale.value = lang
    }
    savingLang.value = null
  }

  async function loadFrigateInfo () {
    frigateLoading.value = true
    const res = await frigateApi.getInfo()
    if (res.success) {
      frigateInfo.value = res.data
    }
    frigateLoading.value = false
  }

  async function handleLogout () {
    await authApi.logout()
    auth.logout()
  }

  onMounted(loadFrigateInfo)
</script>

<style lang="scss" scoped>
.page-settings { max-width: 600px; margin: 0 auto; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

.settings-section { margin-bottom: 24px; }
.settings-section__title {
  font-size: 14px; font-weight: 600;
  color: rgba(230, 237, 243, 0.6);
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.settings-card {
  padding: 16px;
  background: rgba(22, 27, 34, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(48, 54, 61, 0.5);
  border-radius: 14px;
}

.settings-card__row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 0;
  &:not(:last-child) { border-bottom: 1px solid rgba(48, 54, 61, 0.3); }
  &--wrap { flex-wrap: wrap; gap: 8px; }
}

.settings-card__label { font-size: 13px; color: rgba(230, 237, 243, 0.6); }
.settings-card__value {
  font-size: 13px; color: rgb(var(--v-theme-on-surface));
  &--mono { font-family: 'Roboto Mono', monospace; }
  &--error { color: rgb(var(--v-theme-error)); font-size: 12px; }
}

.lang-buttons { display: flex; gap: 8px; }
.loading-state { display: flex; justify-content: center; padding: 24px; }

.frigate-cameras {
  display: flex; flex-direction: column; gap: 8px;
  padding-top: 12px;
  margin-top: 4px;
}

.frigate-camera {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; flex-wrap: wrap;
}

.frigate-camera__name {
  font-size: 13px; font-weight: 600;
  color: rgb(var(--v-theme-primary));
  font-family: 'Roboto Mono', monospace;
}

.frigate-camera__zones { display: flex; flex-wrap: wrap; gap: 4px; }

.frigate-labels { display: flex; flex-wrap: wrap; gap: 4px; }
</style>
