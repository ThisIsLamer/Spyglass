<template>
  <div class="page-watchers">
    <header class="page-header">
      <h1 class="page-title">{{ t('watchers.title') }}</h1>

      <v-btn
        v-if="auth.isAdmin"
        color="primary"
        prepend-icon="mdi-plus"
        size="small"
        @click="openCreate"
      >
        {{ t('watchers.create') }}
      </v-btn>
    </header>

    <div v-if="loading" class="loading-state">
      <v-progress-circular color="primary" indeterminate />
    </div>

    <div v-else class="watchers-list">
      <div v-for="w in watchers" :key="w.guid" class="watcher-card" :class="{ 'watcher-card--disabled': !w.enabled }">
        <div class="watcher-card__header">
          <div class="watcher-card__name">{{ w.name }}</div>
          <div class="watcher-card__indicator" :class="{ 'watcher-card__indicator--active': w.enabled }" />
        </div>

        <div class="watcher-card__tags">
          <v-chip
            v-for="cam in w.cameras"
            :key="cam"
            color="primary"
            size="x-small"
            variant="outlined"
          >{{ cam }}</v-chip>

          <v-chip
            v-for="zone in w.zones"
            :key="zone"
            color="secondary"
            size="x-small"
            variant="outlined"
          >{{ zone }}</v-chip>

          <v-chip v-for="label in w.objectLabels" :key="label" size="x-small" variant="outlined">{{ label }}</v-chip>
        </div>

        <div class="watcher-card__meta">
          <span class="watcher-card__type">
            <v-icon :icon="w.analysisType === 'snapshot' ? 'mdi-camera' : 'mdi-video'" size="14" />
            {{ w.analysisType === 'snapshot' ? t('watchers.snapshot') : t('watchers.videoClip') }}
          </span>

          <span v-if="w.cooldownSeconds > 0" class="watcher-card__cooldown">
            <v-icon icon="mdi-timer-outline" size="14" />
            {{ w.cooldownSeconds }}s
          </span>

          <span v-if="w.aiProvider" class="watcher-card__provider">
            <v-icon icon="mdi-brain" size="14" />
            {{ w.aiProvider.name }}
          </span>
        </div>

        <div class="watcher-card__prompt">{{ w.prompt }}</div>

        <div v-if="auth.isAdmin" class="watcher-card__actions">
          <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" @click="openEdit(w)" />

          <v-btn
            :color="w.enabled ? 'warning' : 'success'"
            :icon="w.enabled ? 'mdi-pause' : 'mdi-play'"
            size="x-small"
            variant="text"
            @click="handleToggle(w)"
          />

          <v-btn
            color="error"
            icon="mdi-delete-outline"
            size="x-small"
            variant="text"
            @click="confirmDelete(w)"
          />
        </div>
      </div>

      <div v-if="watchers.length === 0" class="empty-state">
        <v-icon color="primary" icon="mdi-eye-off-outline" size="48" />
        <p>{{ t('watchers.noWatchers') }}</p>
      </div>
    </div>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="560">
      <v-card class="glass-card">
        <v-card-title>{{ editingWatcher ? t('watchers.edit') : t('watchers.create') }}</v-card-title>

        <v-card-text>
          <form autocomplete="off" class="form-fields" @submit.prevent="handleSave">
            <v-text-field v-model="form.name" :error-messages="formError" :label="t('watchers.name')" />

            <v-select
              v-model="form.cameras"
              chips
              closable-chips
              :items="availableCameras"
              :label="t('watchers.cameras')"
              multiple
            />

            <v-select
              v-model="form.zones"
              chips
              closable-chips
              :items="availableZones"
              :label="t('watchers.zones')"
              multiple
            />

            <v-select
              v-model="form.objectLabels"
              chips
              closable-chips
              :items="availableLabels"
              :label="t('watchers.objects')"
              multiple
            />

            <v-select v-model="form.analysisType" :items="analysisTypes" :label="t('watchers.analysisType')" />

            <v-textarea
              v-model="form.descriptionPrompt"
              auto-grow
              clearable
              :hint="t('watchers.descriptionPromptHint')"
              :label="t('watchers.descriptionPrompt')"
              persistent-hint
              rows="3"
            />

            <v-textarea v-model="form.prompt" auto-grow :label="t('watchers.prompt')" rows="3" />
            <v-text-field v-model.number="form.cooldownSeconds" :label="t('watchers.cooldown')" min="0" type="number" />
            <v-select v-model="form.aiProviderGuid" clearable :items="providerItems" :label="t('watchers.aiProvider')" />
            <v-switch v-model="form.enabled" color="primary" hide-details :label="t('watchers.enabled')" />
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
        <v-card-text>{{ deletingWatcher?.name }}</v-card-text>

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
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { frigateApi, type FrigateCamera } from '@/api/frigate'
  import { type AiProvider, providersApi } from '@/api/providers'
  import { type Watcher, watchersApi } from '@/api/watchers'
  import { subscribeSse } from '@/composables/useSse'
  import { useAuthStore } from '@/stores/auth'

  const { t } = useI18n()
  const auth = useAuthStore()

  const watchers = ref<Watcher[]>([])
  const loading = ref(true)
  const showDialog = ref(false)
  const saving = ref(false)
  const formError = ref('')
  const editingWatcher = ref<Watcher | null>(null)

  const showDeleteDialog = ref(false)
  const deletingWatcher = ref<Watcher | null>(null)
  const deleting = ref(false)

  // Frigate data for selects
  const frigateCameras = ref<FrigateCamera[]>([])
  const frigateLabels = ref<string[]>([])
  const providers = ref<AiProvider[]>([])

  const availableCameras = computed(() => frigateCameras.value.map(c => c.name))
  const availableZones = computed(() => {
    const zones = new Set<string>()
    for (const cam of frigateCameras.value) {
      if (form.value.cameras.includes(cam.name)) {
        for (const z of cam.zones) zones.add(z)
      }
    }
    return [...zones]
  })
  const availableLabels = computed(() => frigateLabels.value)
  const providerItems = computed(() =>
    providers.value.map(p => ({ title: `${p.name} (${p.model})`, value: p.guid })),
  )

  const analysisTypes = [
    { title: 'Snapshot', value: 'snapshot' },
    { title: 'Video Clip', value: 'video_clip' },
  ]

  const form = ref({
    name: '',
    cameras: [] as string[],
    zones: [] as string[],
    objectLabels: [] as string[],
    analysisType: 'snapshot' as 'snapshot' | 'video_clip',
    prompt: '',
    descriptionPrompt: '' as string,
    cooldownSeconds: 30,
    aiProviderGuid: null as string | null,
    enabled: true,
  })

  function openCreate () {
    editingWatcher.value = null
    form.value = {
      name: '', cameras: [], zones: [], objectLabels: [],
      analysisType: 'snapshot', prompt: '', descriptionPrompt: '', cooldownSeconds: 30,
      aiProviderGuid: null, enabled: true,
    }
    formError.value = ''
    showDialog.value = true
  }

  function openEdit (w: Watcher) {
    editingWatcher.value = w
    form.value = {
      name: w.name,
      cameras: [...w.cameras],
      zones: [...w.zones],
      objectLabels: [...w.objectLabels],
      analysisType: w.analysisType,
      prompt: w.prompt,
      descriptionPrompt: w.descriptionPrompt ?? '',
      cooldownSeconds: w.cooldownSeconds,
      aiProviderGuid: w.aiProvider?.guid ?? null,
      enabled: w.enabled,
    }
    formError.value = ''
    showDialog.value = true
  }

  function confirmDelete (w: Watcher) {
    deletingWatcher.value = w
    showDeleteDialog.value = true
  }

  async function loadAll () {
    loading.value = true
    const [watchersRes, frigateRes, providersRes] = await Promise.all([
      watchersApi.getAll(),
      frigateApi.getInfo(),
      providersApi.getAll(),
    ])
    if (watchersRes.success) watchers.value = watchersRes.data
    if (frigateRes.success) {
      frigateCameras.value = frigateRes.data.cameras
      frigateLabels.value = frigateRes.data.labels
    }
    if (providersRes.success) providers.value = providersRes.data
    loading.value = false
  }

  async function handleSave () {
    formError.value = ''
    if (!form.value.name || form.value.cameras.length === 0 || !form.value.prompt) {
      formError.value = 'Name, cameras and prompt are required'
      return
    }
    saving.value = true

    if (editingWatcher.value) {
      const res = await watchersApi.update(editingWatcher.value.guid, {
        name: form.value.name,
        cameras: form.value.cameras,
        zones: form.value.zones,
        objectLabels: form.value.objectLabels,
        analysisType: form.value.analysisType,
        prompt: form.value.prompt,
        descriptionPrompt: form.value.descriptionPrompt?.trim() || null,
        cooldownSeconds: form.value.cooldownSeconds,
        enabled: form.value.enabled,
        aiProviderGuid: form.value.aiProviderGuid,
      })
      if (res.success) {
        showDialog.value = false
        await loadAll()
      } else {
        formError.value = res.message || 'Error'
      }
    } else {
      const res = await watchersApi.create({
        name: form.value.name,
        cameras: form.value.cameras,
        analysisType: form.value.analysisType,
        prompt: form.value.prompt,
        ...(form.value.descriptionPrompt?.trim() && { descriptionPrompt: form.value.descriptionPrompt.trim() }),
        ...(form.value.zones.length > 0 && { zones: form.value.zones }),
        ...(form.value.objectLabels.length > 0 && { objectLabels: form.value.objectLabels }),
        cooldownSeconds: form.value.cooldownSeconds,
        enabled: form.value.enabled,
        ...(form.value.aiProviderGuid && { aiProviderGuid: form.value.aiProviderGuid }),
      })
      if (res.success) {
        showDialog.value = false
        await loadAll()
      } else {
        formError.value = res.message || 'Error'
      }
    }
    saving.value = false
  }

  async function handleToggle (w: Watcher) {
    const res = await watchersApi.toggle(w.guid)
    if (res.success) {
      const idx = watchers.value.findIndex(x => x.guid === w.guid)
      if (idx !== -1) watchers.value[idx] = res.data
    }
  }

  async function handleDelete () {
    if (!deletingWatcher.value) return
    deleting.value = true
    const res = await watchersApi.remove(deletingWatcher.value.guid)
    if (res.success) {
      showDeleteDialog.value = false
      await loadAll()
    }
    deleting.value = false
  }

  onMounted(loadAll)

  const unsubCreated = subscribeSse('watcher.created', data => {
    watchers.value.push(data as Watcher)
  })

  const unsubUpdated = subscribeSse('watcher.updated', data => {
    const updated = data as Watcher
    const idx = watchers.value.findIndex(w => w.guid === updated.guid)
    if (idx !== -1) watchers.value[idx] = updated
  })

  const unsubDeleted = subscribeSse('watcher.deleted', data => {
    const deleted = data as Watcher
    watchers.value = watchers.value.filter(w => w.guid !== deleted.guid)
  })

  const unsubToggled = subscribeSse('watcher.toggled', data => {
    const toggled = data as Watcher
    const idx = watchers.value.findIndex(w => w.guid === toggled.guid)
    if (idx !== -1) watchers.value[idx] = toggled
  })

  onUnmounted(() => {
    unsubCreated()
    unsubUpdated()
    unsubDeleted()
    unsubToggled()
  })
</script>

<style lang="scss" scoped>
.page-watchers { max-width: 900px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.loading-state { display: flex; justify-content: center; padding: 48px; }
.watchers-list { display: flex; flex-direction: column; gap: 12px; }
.watcher-card {
  padding: 16px;
  background: rgba(22, 27, 34, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(48, 54, 61, 0.5);
  border-radius: 14px;
  transition: border-color 0.15s ease, opacity 0.15s ease;
  &:hover { border-color: rgba(0, 229, 255, 0.2); }
  &--disabled { opacity: 0.55; }
}
.watcher-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.watcher-card__name { font-size: 15px; font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.watcher-card__indicator {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(230, 237, 243, 0.3); transition: all 0.2s ease;
  &--active { background: rgb(var(--v-theme-success)); box-shadow: 0 0 8px rgba(63, 185, 80, 0.5); }
}
.watcher-card__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.watcher-card__meta {
  display: flex; gap: 16px; margin-bottom: 10px;
  font-size: 12px; color: rgba(230, 237, 243, 0.6);
}
.watcher-card__type,
.watcher-card__cooldown,
.watcher-card__provider { display: flex; align-items: center; gap: 4px; }
.watcher-card__prompt {
  font-size: 13px; color: rgba(230, 237, 243, 0.7); line-height: 1.5;
  margin-bottom: 10px; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.watcher-card__actions { display: flex; gap: 4px; justify-content: flex-end; }
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
