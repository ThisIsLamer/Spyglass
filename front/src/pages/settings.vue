<template>
  <div class="page-settings">
    <header class="page-header">
      <h1 class="page-title">{{ t('nav.settings') }}</h1>
    </header>

    <!-- Profile Section -->
    <section class="settings-section">
      <h2 class="settings-section__title">{{ t('nav.profile') }}</h2>

      <div class="settings-card">
        <div class="settings-card__row">
          <span class="settings-card__label">{{ t('users.username') }}</span>
          <span class="settings-card__value">{{ auth.user?.username }}</span>
        </div>

        <div class="settings-card__row">
          <span class="settings-card__label">{{ t('users.displayName') }}</span>
          <span class="settings-card__value">{{ auth.user?.displayName }}</span>
        </div>

        <div class="settings-card__row">
          <span class="settings-card__label">{{ t('users.role') }}</span>

          <v-chip :color="getRoleColor(auth.user?.role ?? '')" size="x-small" variant="flat">
            {{ auth.user?.role }}
          </v-chip>
        </div>
      </div>
    </section>

    <!-- Language Section -->
    <section class="settings-section">
      <h2 class="settings-section__title">Язык / Language</h2>

      <div class="settings-card">
        <div class="lang-buttons">
          <v-btn
            :color="locale === 'ru' ? 'primary' : undefined"
            size="small"
            :variant="locale === 'ru' ? 'flat' : 'outlined'"
            @click="locale = 'ru'"
          >
            Русский
          </v-btn>

          <v-btn
            :color="locale === 'en' ? 'primary' : undefined"
            size="small"
            :variant="locale === 'en' ? 'flat' : 'outlined'"
            @click="locale = 'en'"
          >
            English
          </v-btn>
        </div>
      </div>
    </section>

    <!-- Frigate Connection -->
    <section class="settings-section">
      <h2 class="settings-section__title">Frigate</h2>

      <div class="settings-card">
        <div class="settings-card__row">
          <span class="settings-card__label">Статус</span>
          <v-chip color="success" size="x-small" variant="flat">Подключено</v-chip>
        </div>

        <div class="settings-card__row">
          <span class="settings-card__label">Камеры</span>
          <span class="settings-card__value">5</span>
        </div>

        <div class="settings-card__row">
          <span class="settings-card__label">Объекты</span>
          <span class="settings-card__value">person, car, dog, cat</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import { useI18n } from 'vue-i18n'
  import { useAuthStore } from '@/stores/auth'

  const { t, locale } = useI18n()
  const auth = useAuthStore()

  function getRoleColor (role: string) {
    const map: Record<string, string> = {
      admin: 'error',
      operator: 'warning',
      viewer: 'info',
    }
    return map[role] ?? 'info'
  }
</script>

<style lang="scss" scoped>
.page-settings {
  max-width: 600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section__title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(230, 237, 243, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(48, 54, 61, 0.3);
  }
}

.settings-card__label {
  font-size: 13px;
  color: rgba(230, 237, 243, 0.6);
}

.settings-card__value {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  font-family: 'Roboto Mono', monospace;
}

.lang-buttons {
  display: flex;
  gap: 8px;
}
</style>
