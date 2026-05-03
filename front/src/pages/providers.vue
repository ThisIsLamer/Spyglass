<template>
  <div class="page-providers">
    <header class="page-header">
      <h1 class="page-title">{{ t('providers.title') }}</h1>

      <v-btn
        v-if="auth.isAdmin"
        color="primary"
        prepend-icon="mdi-plus"
        size="small"
        @click="showCreate = true"
      >
        {{ t('providers.create') }}
      </v-btn>
    </header>

    <!-- Providers List -->
    <div class="providers-list">
      <div
        v-for="provider in mockProviders"
        :key="provider.id"
        class="provider-card"
      >
        <div class="provider-card__header">
          <div class="provider-card__name">
            {{ provider.name }}
            <v-chip
              v-if="provider.isDefault"
              color="primary"
              size="x-small"
              variant="flat"
            >
              {{ t('providers.isDefault') }}
            </v-chip>
          </div>

          <v-icon color="primary" icon="mdi-brain" size="20" />
        </div>

        <div class="provider-card__details">
          <div class="provider-card__row">
            <span class="provider-card__label">{{ t('providers.model') }}</span>
            <span class="provider-card__value provider-card__value--mono">{{ provider.model }}</span>
          </div>

          <div class="provider-card__row">
            <span class="provider-card__label">{{ t('providers.baseUrl') }}</span>
            <span class="provider-card__value provider-card__value--mono">{{ provider.baseUrl }}</span>
          </div>

          <div class="provider-card__row">
            <span class="provider-card__label">{{ t('providers.apiKey') }}</span>
            <span class="provider-card__value">{{ provider.hasKey ? '••••••••' : '—' }}</span>
          </div>
        </div>

        <div v-if="auth.isAdmin" class="provider-card__actions">
          <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" />
          <v-btn color="error" icon="mdi-delete-outline" size="x-small" variant="text" />
        </div>
      </div>

      <div v-if="mockProviders.length === 0" class="empty-state">
        <v-icon color="primary" icon="mdi-brain" size="48" />
        <p>{{ t('providers.noProviders') }}</p>
      </div>
    </div>

    <!-- Create Dialog (placeholder) -->
    <v-dialog v-model="showCreate" max-width="500">
      <v-card class="glass-card">
        <v-card-title>{{ t('providers.create') }}</v-card-title>

        <v-card-text>
          <p style="color: rgba(230,237,243,0.6)">Форма создания будет здесь</p>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCreate = false">{{ t('common.cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useAuthStore } from '@/stores/auth'

  const { t } = useI18n()
  const auth = useAuthStore()

  const showCreate = ref(false)

  // Mock data
  const mockProviders = ref([
    {
      id: '1',
      name: 'Ollama Local',
      baseUrl: 'http://192.168.1.100:11434/v1',
      model: 'llava:13b',
      hasKey: false,
      isDefault: true,
    },
    {
      id: '2',
      name: 'OpenAI GPT-4o',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      hasKey: true,
      isDefault: false,
    },
  ])
</script>

<style lang="scss" scoped>
.page-providers {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.providers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.provider-card {
  padding: 16px;
  background: rgba(22, 27, 34, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(48, 54, 61, 0.5);
  border-radius: 14px;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: rgba(0, 229, 255, 0.2);
  }
}

.provider-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.provider-card__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.provider-card__details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.provider-card__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.provider-card__label {
  font-size: 12px;
  color: rgba(230, 237, 243, 0.5);
  min-width: 70px;
}

.provider-card__value {
  font-size: 13px;
  color: rgba(230, 237, 243, 0.8);

  &--mono {
    font-family: 'Roboto Mono', monospace;
    font-size: 12px;
  }
}

.provider-card__actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: rgba(230, 237, 243, 0.5);
}

.glass-card {
  background: rgba(22, 27, 34, 0.9) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(48, 54, 61, 0.6);
}
</style>
