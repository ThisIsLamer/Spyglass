<template>
  <div class="page-events">
    <header class="page-header">
      <h1 class="page-title">{{ t('events.title') }}</h1>
    </header>

    <!-- Filters -->
    <div class="filters-bar">
      <v-chip
        v-for="status in statuses"
        :key="status.value"
        :color="activeStatus === status.value ? status.color : undefined"
        size="small"
        :variant="activeStatus === status.value ? 'flat' : 'outlined'"
        @click="activeStatus = status.value"
      >
        {{ status.label }}
      </v-chip>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <v-progress-circular color="primary" indeterminate size="32" />
    </div>

    <!-- Events List -->
    <div v-else class="events-list">
      <router-link
        v-for="event in filteredEvents"
        :key="event.guid"
        class="event-card"
        :to="{ name: 'event-detail', params: { guid: event.guid } }"
      >
        <!-- Thumbnail -->
        <div class="event-card__media">
          <img
            :alt="event.camera"
            class="event-card__thumbnail"
            :src="getThumbnailUrl(event.frigateEventId)"
          >

          <div class="event-card__media-overlay">
            <v-icon icon="mdi-play-circle-outline" size="24" />
          </div>

          <v-chip
            class="event-card__status-badge"
            :color="getStatusColor(event.status)"
            size="x-small"
            variant="flat"
          >
            {{ t(`events.${event.status}`) }}
          </v-chip>
        </div>

        <!-- Content -->
        <div class="event-card__content">
          <div class="event-card__top">
            <span class="event-card__camera">
              <v-icon icon="mdi-cctv" size="14" />
              {{ event.camera }}
            </span>

            <span class="event-card__time">{{ formatTime(event.createdAt) }}</span>
          </div>

          <p class="event-card__summary">
            {{ getSummary(event) }}
          </p>

          <!-- Checks indicators -->
          <div v-if="event.aiResponse && event.status === 'completed'" class="event-card__indicators">
            <span
              v-for="check in getChecks(event.aiResponse)"
              :key="check.key"
              class="event-card__indicator"
              :class="{
                'event-card__indicator--positive': check.valid,
                'event-card__indicator--negative': !check.valid,
              }"
            >
              <v-icon :icon="check.valid ? 'mdi-check-circle' : 'mdi-close-circle'" size="12" />
              {{ check.label }}
            </span>
          </div>

          <!-- Error -->
          <p v-if="event.status === 'failed' && event.error" class="event-card__error">
            {{ event.error }}
          </p>

          <div class="event-card__bottom">
            <span class="event-card__watcher">
              <v-icon icon="mdi-eye-outline" size="13" />
              {{ event.watcher?.name ?? '—' }}
            </span>

            <span v-if="event.processingTimeMs" class="event-card__processing">
              {{ event.processingTimeMs }}ms
            </span>
          </div>
        </div>
      </router-link>

      <div v-if="filteredEvents.length === 0" class="empty-state">
        <v-icon color="primary" icon="mdi-timeline-clock-outline" size="48" />
        <p>{{ t('events.noEvents') }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { analysisApi, type AnalysisEvent, getThumbnailUrl } from '@/api/analysis'
  import { subscribeSse } from '@/composables/useSse'

  const { t, locale } = useI18n()

  const loading = ref(true)
  const events = ref<AnalysisEvent[]>([])
  const activeStatus = ref('all')

  const statuses = [
    { value: 'all', label: 'Все', color: 'primary' },
    { value: 'completed', label: t('events.completed'), color: 'success' },
    { value: 'processing', label: t('events.processing'), color: 'warning' },
    { value: 'pending', label: t('events.pending'), color: 'info' },
    { value: 'failed', label: t('events.failed'), color: 'error' },
  ]

  onMounted(async () => {
    await loadEvents()
  })

  const unsubCreated = subscribeSse('analysis.created', (data: unknown) => {
    const created = data as AnalysisEvent
    if (!events.value.some(e => e.guid === created.guid)) {
      events.value.unshift(created)
    }
  })

  const unsubUpdated = subscribeSse('analysis.updated', (data: unknown) => {
    const updated = data as AnalysisEvent
    const idx = events.value.findIndex(e => e.guid === updated.guid)
    if (idx !== -1) events.value[idx] = updated
  })

  onUnmounted(() => {
    unsubCreated()
    unsubUpdated()
  })

  async function loadEvents () {
    loading.value = true
    const result = await analysisApi.getAll()
    if (result.success) {
      events.value = result.data
    }
    loading.value = false
  }

  const filteredEvents = computed(() => {
    if (activeStatus.value === 'all') return events.value
    return events.value.filter(e => e.status === activeStatus.value)
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

  interface AiCheck {
    key: string
    label: string
    valid: boolean
  }

  function getChecks (aiResponse: Record<string, unknown>): AiCheck[] {
    const checks = aiResponse.checks as Array<{
      key: string
      label: Record<string, string>
      valid: boolean
    }> | undefined

    if (!checks || !Array.isArray(checks)) return []

    const lang = locale.value === 'ru' ? 'ru' : 'en'

    return checks.map(c => ({
      key: c.key,
      label: c.label?.[lang] ?? c.label?.en ?? c.key,
      valid: c.valid,
    }))
  }

  function getSummary (event: AnalysisEvent): string {
    if (!event.aiResponse) return t('events.noSummary')

    const summary = event.aiResponse.summary as Record<string, string> | string | undefined
    if (!summary) return t('events.noSummary')

    if (typeof summary === 'string') return summary

    const lang = locale.value === 'ru' ? 'ru' : 'en'
    return summary[lang] ?? summary.en ?? t('events.noSummary')
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
</script>

<style lang="scss" scoped>
.page-events {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.filters-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-card {
  display: flex;
  gap: 14px;
  padding: 12px;
  background: rgba(22, 27, 34, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(48, 54, 61, 0.5);
  border-radius: 14px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;

  &:hover {
    border-color: rgba(0, 229, 255, 0.25);
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.06);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.event-card__media {
  position: relative;
  width: 140px;
  min-width: 140px;
  height: 90px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;

  @media (max-width: 600px) {
    width: 100px;
    min-width: 100px;
    height: 68px;
  }
}

.event-card__thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.event-card__media-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.15s ease;
  color: white;

  .event-card:hover & {
    opacity: 1;
  }
}

.event-card__status-badge {
  position: absolute;
  top: 6px;
  right: 6px;
}

.event-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.event-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.event-card__camera {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  font-family: 'Roboto Mono', monospace;
}

.event-card__time {
  font-size: 11px;
  color: rgba(230, 237, 243, 0.4);
  font-family: 'Roboto Mono', monospace;
}

.event-card__summary {
  font-size: 13px;
  color: rgba(230, 237, 243, 0.85);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-card__error {
  font-size: 12px;
  color: rgb(var(--v-theme-error));
  line-height: 1.4;
}

.event-card__indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.event-card__indicator {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: rgba(230, 237, 243, 0.5);

  &--positive {
    color: rgb(var(--v-theme-success));
  }

  &--negative {
    color: rgb(var(--v-theme-error));
  }
}

.event-card__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.event-card__watcher {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: rgba(230, 237, 243, 0.45);
}

.event-card__processing {
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(0, 229, 255, 0.08);
  border-radius: 6px;
  font-family: 'Roboto Mono', monospace;
  color: rgb(var(--v-theme-primary));
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
