<template>
  <div class="page-event-detail">
    <button class="back-btn" @click="router.back()">
      <v-icon icon="mdi-arrow-left" size="18" />
      <span>{{ t('events.title') }}</span>
    </button>

    <div v-if="loading" class="loading-state">
      <v-progress-circular color="primary" indeterminate size="32" />
    </div>

    <div v-else-if="event" class="event-detail">
      <!-- Media -->
      <div
        class="event-detail__media"
        @mouseenter="showVideo = true"
        @mouseleave="showVideo = false"
        @touchstart="showVideo = !showVideo"
      >
        <img
          v-show="!showVideo"
          :alt="event.camera"
          class="event-detail__image"
          :src="getSnapshotUrl(event.frigateEventId)"
        >

        <video
          v-if="showVideo"
          autoplay
          class="event-detail__video"
          loop
          muted
          playsinline
          :src="getClipUrl(event.frigateEventId)"
        />

        <div class="event-detail__media-hint" :class="{ 'event-detail__media-hint--hidden': showVideo }">
          <v-icon icon="mdi-gesture-tap" size="16" />
          {{ t('events.hoverForVideo') }}
        </div>
      </div>

      <!-- Meta bar -->
      <div class="event-detail__meta-bar">
        <div class="event-detail__meta-left">
          <v-chip :color="getStatusColor(event.status)" size="small" variant="flat">
            {{ t(`events.${event.status}`) }}
          </v-chip>

          <span class="event-detail__camera">
            <v-icon icon="mdi-cctv" size="14" />
            {{ event.camera }}
          </span>

          <v-chip v-if="event.label" size="x-small" variant="outlined">
            {{ event.label }}
          </v-chip>

          <v-chip v-if="event.zone" size="x-small" variant="outlined">
            {{ event.zone }}
          </v-chip>
        </div>

        <div class="event-detail__meta-right">
          <span v-if="event.processingTimeMs" class="event-detail__processing">
            <v-icon icon="mdi-timer-outline" size="14" />
            {{ event.processingTimeMs }}ms
          </span>

          <span class="event-detail__time">{{ formatTime(event.createdAt) }}</span>
        </div>
      </div>

      <!-- Completed: AI Analysis -->
      <section v-if="event.aiResponse && event.status === 'completed'" class="event-detail__analysis">
        <!-- Exit scene banner -->
        <div v-if="isExitScene" class="analysis-exit-banner">
          <v-icon icon="mdi-exit-run" size="18" />
          <span>{{ t('events.exitScene') }}</span>
        </div>

        <!-- Summary -->
        <div v-if="summary" class="analysis-summary">
          <p>{{ summary }}</p>
        </div>

        <!-- Visitor count -->
        <div v-if="visitorCount" class="analysis-visitors">
          <v-icon icon="mdi-account-group" size="18" />
          <span class="analysis-visitors__label">{{ visitorCount.label }}</span>
          <span class="analysis-visitors__count">{{ visitorCount.count }}</span>
          <span v-if="visitorCount.message" class="analysis-visitors__message">— {{ visitorCount.message }}</span>
        </div>

        <!-- Checks -->
        <div v-if="checks.length > 0" class="analysis-indicators">
          <div
            v-for="check in checks"
            :key="check.key"
            class="indicator-item"
            :class="{
              'indicator-item--positive': check.valid === true,
              'indicator-item--negative': check.valid === false,
              'indicator-item--na': check.valid === null,
            }"
          >
            <v-icon
              :icon="check.valid === true ? 'mdi-check-circle' : check.valid === false ? 'mdi-close-circle' : 'mdi-minus-circle'"
              size="20"
            />

            <div class="indicator-item__content">
              <span class="indicator-item__label">{{ check.label }}</span>
              <span v-if="check.message" class="indicator-item__details">{{ check.message }}</span>
              <span v-else-if="check.valid === null" class="indicator-item__details">{{ t('events.notApplicable') }}</span>
            </div>
          </div>
        </div>

        <!-- Raw JSON -->
        <details class="analysis-raw">
          <summary class="analysis-raw__toggle">
            <v-icon icon="mdi-code-json" size="16" />
            {{ t('events.rawJson') }}
          </summary>

          <pre class="analysis-raw__code">{{ JSON.stringify(event.aiResponse, null, 2) }}</pre>
        </details>
      </section>

      <!-- Processing -->
      <section v-else-if="event.status === 'processing'" class="event-detail__state">
        <v-progress-circular color="primary" indeterminate size="32" />
        <p>{{ t('events.processing') }}...</p>
      </section>

      <!-- Pending -->
      <section v-else-if="event.status === 'pending'" class="event-detail__state">
        <v-icon color="info" icon="mdi-clock-outline" size="32" />
        <p>{{ t('events.pending') }}</p>
      </section>

      <!-- Failed -->
      <section v-else-if="event.status === 'failed'" class="event-detail__state event-detail__state--error">
        <v-icon color="error" icon="mdi-alert-circle-outline" size="32" />
        <p>{{ event.error || t('events.failed') }}</p>
      </section>

      <!-- Retry button (any status, admin only) -->
      <div v-if="auth.isAdmin" class="event-detail__actions">
        <v-btn
          color="warning"
          :disabled="event.status === 'processing' || event.status === 'pending'"
          :loading="retrying"
          prepend-icon="mdi-refresh"
          size="small"
          variant="tonal"
          @click="retryAnalysis"
        >
          {{ t('events.retry') }}
        </v-btn>
      </div>

      <!-- Info -->
      <div class="event-detail__info-row">
        <div class="info-block">
          <span class="info-block__label">{{ t('events.watcher') }}</span>
          <span class="info-block__value">{{ event.watcher?.name ?? '—' }}</span>
        </div>

        <div class="info-block">
          <span class="info-block__label">{{ t('events.aiProvider') }}</span>
          <span class="info-block__value">{{ event.aiProviderName }} / {{ event.aiModel }}</span>
        </div>
      </div>

      <!-- Prompt -->
      <details class="analysis-raw">
        <summary class="analysis-raw__toggle">
          <v-icon icon="mdi-text-box-outline" size="16" />
          {{ t('events.prompt') }}
        </summary>

        <pre class="analysis-raw__code analysis-raw__code--prompt">{{ event.prompt }}</pre>
      </details>
    </div>

    <!-- Not found -->
    <div v-else class="empty-state">
      <v-icon color="error" icon="mdi-alert-circle-outline" size="48" />
      <p>{{ t('events.notFound') }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { analysisApi, type AnalysisEvent, getClipUrl, getSnapshotUrl } from '@/api/analysis'
  import { subscribeSse } from '@/composables/useSse'
  import { useAuthStore } from '@/stores/auth'

  const { t, locale } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()

  const loading = ref(true)
  const event = ref<AnalysisEvent | null>(null)
  const showVideo = ref(false)
  const retrying = ref(false)

  onMounted(async () => {
    const guid = route.params.guid as string
    const result = await analysisApi.getOne(guid)
    if (result.success) {
      event.value = result.data
    }
    loading.value = false
  })

  const unsubUpdated = subscribeSse('analysis.updated', data => {
    const updated = data as AnalysisEvent
    if (event.value && updated.guid === event.value.guid) {
      event.value = updated
      retrying.value = false
    }
  })

  const unsubCreated = subscribeSse('analysis.created', data => {
    const created = data as AnalysisEvent
    if (event.value && created.guid === event.value.guid) {
      event.value = created
    }
  })

  onUnmounted(() => {
    unsubUpdated()
    unsubCreated()
  })

  const lang = computed(() => locale.value === 'ru' ? 'ru' : 'en')

  interface AiCheck {
    key: string
    label: Record<string, string>
    valid: boolean | null
    message: Record<string, string>
  }

  interface AiVisitorCount {
    label: Record<string, string>
    count: number
    message: Record<string, string>
  }

  const sceneDirection = computed(() => {
    const response = event.value?.aiResponse
    if (!response) return null
    return (response.scene_direction as string | undefined) ?? null
  })

  const isExitScene = computed(() => sceneDirection.value === 'exit')

  const checks = computed(() => {
    const response = event.value?.aiResponse
    if (!response) return []

    const raw = response.checks as AiCheck[] | undefined
    if (!raw || !Array.isArray(raw)) return []

    return raw.map(c => ({
      key: c.key,
      label: c.label?.[lang.value] ?? c.label?.en ?? c.key,
      valid: c.valid,
      message: c.message?.[lang.value] ?? c.message?.en ?? '',
    }))
  })

  const visitorCount = computed(() => {
    const response = event.value?.aiResponse
    if (!response) return null

    const raw = response.visitor_count as AiVisitorCount | undefined
    if (!raw) return null

    return {
      label: raw.label?.[lang.value] ?? raw.label?.en ?? 'Visitors',
      count: raw.count,
      message: raw.message?.[lang.value] ?? raw.message?.en ?? '',
    }
  })

  const summary = computed(() => {
    const response = event.value?.aiResponse
    if (!response) return null

    const raw = response.summary as Record<string, string> | string | undefined
    if (!raw) return null
    if (typeof raw === 'string') return raw

    return raw[lang.value] ?? raw.en ?? null
  })

  function getStatusColor (status: string) {
    const map: Record<string, string> = {
      pending: 'info',
      processing: 'warning',
      completed: 'success',
      failed: 'error',
    }
    return map[status] ?? 'info'
  }

  function formatTime (dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return t('events.justNow')
    if (diff < 3600) return `${Math.floor(diff / 60)} ${t('events.minAgo')}`
    if (diff < 86_400) return `${Math.floor(diff / 3600)} ${t('events.hoursAgo')}`

    return date.toLocaleDateString(locale.value, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function retryAnalysis () {
    if (!event.value) return
    retrying.value = true
    const result = await analysisApi.retry(event.value.guid)
    if (result.success) {
      event.value = result.data
    }
    retrying.value = false
  }
</script>

<style lang="scss" scoped>
.page-event-detail {
  max-width: 700px;
  margin: 0 auto;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 16px;
  border-radius: 10px;
  background: none;
  border: 1px solid rgba(48, 54, 61, 0.4);
  color: rgba(230, 237, 243, 0.7);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: rgba(0, 229, 255, 0.3);
    color: rgb(var(--v-theme-primary));
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.event-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.event-detail__media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.4);
  cursor: pointer;
}

.event-detail__image,
.event-detail__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.event-detail__media-hint {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  font-size: 11px;
  color: rgba(230, 237, 243, 0.7);
  transition: opacity 0.2s ease;

  &--hidden {
    opacity: 0;
  }
}

.event-detail__meta-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.event-detail__meta-left,
.event-detail__meta-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.event-detail__camera {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  font-family: 'Roboto Mono', monospace;
}

.event-detail__processing {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgb(var(--v-theme-primary));
  font-family: 'Roboto Mono', monospace;
}

.event-detail__time {
  font-size: 12px;
  color: rgba(230, 237, 243, 0.5);
  font-family: 'Roboto Mono', monospace;
}

.event-detail__analysis {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.analysis-exit-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(100, 116, 139, 0.1);
  border: 1px solid rgba(100, 116, 139, 0.25);
  border-radius: 10px;
  font-size: 13px;
  color: rgba(230, 237, 243, 0.6);

  .v-icon { color: rgba(230, 237, 243, 0.4); }
}

.analysis-summary {
  padding: 14px 16px;
  background: rgba(22, 27, 34, 0.6);
  border: 1px solid rgba(48, 54, 61, 0.5);
  border-radius: 12px;

  p {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(230, 237, 243, 0.9);
  }
}

.analysis-visitors {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(22, 27, 34, 0.6);
  border: 1px solid rgba(48, 54, 61, 0.5);
  border-radius: 12px;
  color: rgba(230, 237, 243, 0.8);
  font-size: 13px;
}

.analysis-visitors__label {
  font-weight: 600;
}

.analysis-visitors__count {
  font-size: 18px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  font-family: 'Roboto Mono', monospace;
}

.analysis-visitors__message {
  color: rgba(230, 237, 243, 0.5);
}

.analysis-indicators {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}

.indicator-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(22, 27, 34, 0.5);
  border: 1px solid rgba(48, 54, 61, 0.4);
  border-radius: 10px;

  &--positive {
    border-color: rgba(63, 185, 80, 0.2);
    background: rgba(63, 185, 80, 0.04);

    .v-icon { color: rgb(var(--v-theme-success)); }
  }

  &--negative {
    border-color: rgba(248, 81, 73, 0.2);
    background: rgba(248, 81, 73, 0.04);

    .v-icon { color: rgb(var(--v-theme-error)); }
  }

  &--na {
    border-color: rgba(48, 54, 61, 0.3);
    background: rgba(22, 27, 34, 0.3);
    opacity: 0.6;

    .v-icon { color: rgba(230, 237, 243, 0.3); }
  }
}

.indicator-item__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.indicator-item__label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(230, 237, 243, 0.85);
}

.indicator-item__details {
  font-size: 12px;
  color: rgba(230, 237, 243, 0.55);
  line-height: 1.4;
}

.analysis-raw {
  border: 1px solid rgba(48, 54, 61, 0.4);
  border-radius: 12px;
  overflow: hidden;
}

.analysis-raw__toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  font-size: 13px;
  color: rgba(230, 237, 243, 0.6);
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover { color: rgb(var(--v-theme-primary)); }
}

.analysis-raw__code {
  padding: 14px;
  margin: 0;
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: rgb(var(--v-theme-primary));
  background: rgba(0, 0, 0, 0.3);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;

  &--prompt { color: rgba(230, 237, 243, 0.8); }
}

.event-detail__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 16px;
  background: rgba(22, 27, 34, 0.5);
  border: 1px solid rgba(48, 54, 61, 0.4);
  border-radius: 12px;
  color: rgba(230, 237, 243, 0.6);

  &--error { border-color: rgba(248, 81, 73, 0.2); }
}

.event-detail__actions {
  display: flex;
  gap: 8px;
}

.event-detail__info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 500px) { grid-template-columns: 1fr; }
}

.info-block {
  padding: 12px 14px;
  background: rgba(22, 27, 34, 0.5);
  border: 1px solid rgba(48, 54, 61, 0.4);
  border-radius: 10px;
}

.info-block__label {
  display: block;
  font-size: 11px;
  color: rgba(230, 237, 243, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.info-block__value {
  font-size: 13px;
  color: rgba(230, 237, 243, 0.85);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: rgba(230, 237, 243, 0.5);
}
</style>
