<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-card__header">
        <img alt="Spyglass" class="login-card__logo" src="@/assets/logo.svg">
        <h1 class="login-card__title">{{ t('app.name') }}</h1>
        <p class="login-card__subtitle">{{ t('auth.subtitle') }}</p>
      </div>

      <form class="login-card__form" @submit.prevent="handleLogin">
        <v-text-field
          v-model="username"
          autocomplete="username"
          autofocus
          :error-messages="error ? ' ' : undefined"
          :label="t('auth.username')"
          prepend-inner-icon="mdi-account-outline"
        />

        <v-text-field
          v-model="password"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          autocomplete="current-password"
          :error-messages="error || undefined"
          :label="t('auth.password')"
          prepend-inner-icon="mdi-lock-outline"
          :type="showPassword ? 'text' : 'password'"
          @click:append-inner="showPassword = !showPassword"
        />

        <v-btn
          block
          class="login-card__btn"
          color="primary"
          :loading="loading"
          size="large"
          type="submit"
        >
          {{ t('auth.loginButton') }}
        </v-btn>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const { t } = useI18n()
  const router = useRouter()
  const auth = useAuthStore()

  const username = ref('')
  const password = ref('')
  const showPassword = ref(false)
  const loading = ref(false)
  const error = ref('')

  async function handleLogin () {
    error.value = ''
    loading.value = true

    try {
      // TODO: Replace with actual API call
      // Temporary mock login for UI development
      if (username.value && password.value) {
        auth.setAuth('mock-token', {
          guid: 'mock-guid',
          username: username.value,
          displayName: username.value,
          role: 'admin',
        })
        router.push({ name: 'dashboard' })
      } else {
        error.value = t('auth.loginError')
      }
    } catch {
      error.value = t('auth.loginError')
    } finally {
      loading.value = false
    }
  }
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-background));
  padding: 16px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px 32px;
  background: rgba(22, 27, 34, 0.7);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(48, 54, 61, 0.6);
  border-radius: 20px;
  box-shadow: 0 0 40px rgba(0, 229, 255, 0.04);
}

.login-card__header {
  text-align: center;
  margin-bottom: 32px;
}

.login-card__logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.login-card__title {
  font-size: 28px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.login-card__subtitle {
  font-size: 14px;
  color: rgba(230, 237, 243, 0.6);
}

.login-card__form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.login-card__btn {
  margin-top: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
</style>
