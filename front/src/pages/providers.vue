<template>
  <div class="page-providers">
    <header class="page-header">
      <h1 class="page-title">{{ t('providers.title') }}</h1>

      <v-btn
        v-if="auth.isAdmin"
        color="primary"
        prepend-icon="mdi-plus"
        size="small"
        @click="openCreate"
      >
        {{ t('providers.create') }}
      </v-btn>
    </header>

    <div v-if="loading" class="loading-state">
      <v-progress-circular color="primary" indeterminate />
    </div>

    <div v-else class="providers-list">
      <div v-for="provider in providers" :key="provider.guid" class="provider-card">
        <div class="provider-card__header">
          <div class="provider-card__name">
            {{ provider.name }}
            <v-chip v-if="provider.isDefault" color="primary" size="x-small" variant="flat">
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
            <span class="provider-card__value">{{ provider.hasApiKey ? '••••••••' : '—' }}</span>
          </div>
        </div>

        <div v-if="auth.isAdmin" class="provider-card__actions">
          <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" @click="openEdit(provider)" />

          <v-btn
            color="error"
            icon="mdi-delete-outline"
            size="x-small"
            variant="text"
            @click="confirmDelete(provider)"
          />
        </div>
      </div>

      <div v-if="providers.length === 0" class="empty-state">
        <v-icon color="primary" icon="mdi-brain" size="48" />
        <p>{{ t('providers.noProviders') }}</p>
      </div>
    </div>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="500">
      <v-card class="glass-card">
        <v-card-title>{{ editingProvider ? t('providers.edit') : t('providers.create') }}</v-card-title>

        <v-card-text>
          <form autocomplete="off" class="form-fields" @submit.prevent="handleSave">
            <v-text-field v-model="form.name" :error-messages="formError" :label="t('providers.name')" />
            <v-text-field v-model="form.baseUrl" :label="t('providers.baseUrl')" placeholder="http://localhost:11434/v1" />
            <v-text-field v-model="form.model" :label="t('providers.model')" placeholder="llava:13b" />
            <v-text-field v-model="form.apiKey" :label="t('providers.apiKey')" :placeholder="editingProvider?.hasApiKey ? 'Оставьте пустым чтобы не менять' : ''" />
            <v-switch v-model="form.isDefault" color="primary" hide-details :label="t('providers.isDefault')" />
          </form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="primary" :loading="saving" variant="flat" @click="handleSave">{{ t('common.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card class="glass-card">
        <v-card-title>{{ t('common.delete') }}</v-card-title>

        <v-card-text>
          Удалить провайдер <strong>{{ deletingProvider?.name }}</strong>?
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">{{ t('common.cancel') }}</v-btn>
          <v-btn color="error" :loading="deleting" variant="flat" @click="handleDelete">{{ t('common.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { type AiProvider, providersApi } from '@/api/providers'
  import { useSse } from '@/composables/useSse'
  import { useAuthStore } from '@/stores/auth'

  const { t } = useI18n()
  const auth = useAuthStore()

  const providers = ref<AiProvider[]>([])
  const loading = ref(true)
  const showDialog = ref(false)
  const saving = ref(false)
  const formError = ref('')
  const editingProvider = ref<AiProvider | null>(null)

  const showDeleteDialog = ref(false)
  const deletingProvider = ref<AiProvider | null>(null)
  const deleting = ref(false)

  const form = ref({
    name: '',
    baseUrl: '',
    model: '',
    apiKey: '',
    isDefault: false,
  })

  function openCreate () {
    editingProvider.value = null
    form.value = { name: '', baseUrl: '', model: '', apiKey: '', isDefault: false }
    formError.value = ''
    showDialog.value = true
  }

  function openEdit (provider: AiProvider) {
    editingProvider.value = provider
    form.value = {
      name: provider.name,
      baseUrl: provider.baseUrl,
      model: provider.model,
      apiKey: '',
      isDefault: provider.isDefault,
    }
    formError.value = ''
    showDialog.value = true
  }

  function confirmDelete (provider: AiProvider) {
    deletingProvider.value = provider
    showDeleteDialog.value = true
  }

  async function loadProviders () {
    loading.value = true
    const res = await providersApi.getAll()
    if (res.success) providers.value = res.data
    loading.value = false
  }

  async function handleSave () {
    formError.value = ''
    saving.value = true

    if (editingProvider.value) {
      const dto: Record<string, unknown> = {}
      if (form.value.name) dto.name = form.value.name
      if (form.value.baseUrl) dto.baseUrl = form.value.baseUrl
      if (form.value.model) dto.model = form.value.model
      if (form.value.apiKey) dto.apiKey = form.value.apiKey
      dto.isDefault = form.value.isDefault

      const res = await providersApi.update(editingProvider.value.guid, dto)
      if (res.success) {
        showDialog.value = false
        await loadProviders()
      } else {
        formError.value = res.message || 'Error'
      }
    } else {
      if (!form.value.name || !form.value.baseUrl || !form.value.model) {
        formError.value = 'Name, URL and model are required'
        saving.value = false
        return
      }
      const res = await providersApi.create({
        name: form.value.name,
        baseUrl: form.value.baseUrl,
        model: form.value.model,
        ...(form.value.apiKey && { apiKey: form.value.apiKey }),
        isDefault: form.value.isDefault,
      })
      if (res.success) {
        showDialog.value = false
        await loadProviders()
      } else {
        formError.value = res.message || 'Error'
      }
    }

    saving.value = false
  }

  async function handleDelete () {
    if (!deletingProvider.value) return
    deleting.value = true
    const res = await providersApi.remove(deletingProvider.value.guid)
    if (res.success) {
      showDeleteDialog.value = false
      await loadProviders()
    }
    deleting.value = false
  }

  onMounted(loadProviders)

  useSse('ai-provider.created', data => {
    providers.value.push(data as AiProvider)
  })

  useSse('ai-provider.updated', data => {
    const updated = data as AiProvider
    const idx = providers.value.findIndex(p => p.guid === updated.guid)
    if (idx !== -1) providers.value[idx] = updated
  })

  useSse('ai-provider.deleted', data => {
    const deleted = data as AiProvider
    providers.value = providers.value.filter(p => p.guid !== deleted.guid)
  })
</script>

<style lang="scss" scoped>
.page-providers { max-width: 800px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.loading-state { display: flex; justify-content: center; padding: 48px; }
.providers-list { display: flex; flex-direction: column; gap: 12px; }
.provider-card {
  padding: 16px;
  background: rgba(22, 27, 34, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(48, 54, 61, 0.5);
  border-radius: 14px;
  transition: border-color 0.15s ease;
  &:hover { border-color: rgba(0, 229, 255, 0.2); }
}
.provider-card__header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
}
.provider-card__name {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 600; color: rgb(var(--v-theme-on-surface));
}
.provider-card__details { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.provider-card__row { display: flex; align-items: center; gap: 8px; }
.provider-card__label { font-size: 12px; color: rgba(230, 237, 243, 0.5); min-width: 70px; }
.provider-card__value {
  font-size: 13px; color: rgba(230, 237, 243, 0.8);
  &--mono { font-family: 'Roboto Mono', monospace; font-size: 12px; }
}
.provider-card__actions { display: flex; gap: 4px; justify-content: flex-end; }
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 48px 16px; color: rgba(230, 237, 243, 0.5);
}
.glass-card {
  background: rgba(22, 27, 34, 0.95) !important;
  backdrop-filter: blur(20px); border: 1px solid rgba(48, 54, 61, 0.6);
}
.form-fields { display: flex; flex-direction: column; gap: 4px; }
</style>
