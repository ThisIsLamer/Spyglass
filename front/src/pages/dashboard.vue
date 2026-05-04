<template>
  <div class="page-dashboard">
    <header class="page-header">
      <h1 class="page-title">{{ t('dashboard.title') }}</h1>
    </header>

    <!-- Stats cards -->
    <div class="stats-row">
      <div class="stat-card">
        <v-icon class="stat-card__icon" color="primary" icon="mdi-eye-outline" size="24" />

        <div class="stat-card__content">
          <span class="stat-card__value">{{ stats.activeWatchers }}</span>
          <span class="stat-card__label">{{ t('dashboard.activeWatchers') }}</span>
        </div>
      </div>

      <div class="stat-card">
        <v-icon class="stat-card__icon" color="success" icon="mdi-check-circle-outline" size="24" />

        <div class="stat-card__content">
          <span class="stat-card__value">{{ stats.completedToday }}</span>
          <span class="stat-card__label">{{ t('dashboard.completedToday') }}</span>
        </div>
      </div>

      <div class="stat-card">
        <v-icon class="stat-card__icon" color="error" icon="mdi-alert-circle-outline" size="24" />

        <div class="stat-card__content">
          <span class="stat-card__value">{{ stats.failedToday }}</span>
          <span class="stat-card__label">{{ t('dashboard.failedToday') }}</span>
        </div>
      </div>

      <div class="stat-card">
        <v-icon
          class="stat-card__icon"
          :color="frigateStatus === 'connected' ? 'success' : 'error'"
          icon="mdi-server-network"
          size="24"
        />

        <div class="stat-card__content">
          <span class="stat-card__value stat-card__value--small">{{ frigateStatus === 'connected' ? t('dashboard.connected') : t('dashboard.disconnected') }}</span>
          <span class="stat-card__label">Frigate</span>
        </div>
      </div>
    </div>

    <!-- Recent events -->
    <div class="section-header">
      <h2 class="section-title">{{ t('dashboard.recentEvents') }}</h2>

      <router-link class="section-link" :to="{ name: 'events' }">
        {{ t('dashboard.viewAll') }}
        <v-icon icon="mdi-arrow-right" size="14" />
      </router-link>
    </div>

    <div v-if="loading" class="loading-state">
      <v-progress-circular color="primary" indeterminate size="28" />
    </div>

    <div v-else class="events-list">
      <router-link
        v-for="event in recentEvents"
        :key="event.guid"
        class="event-card"
        :to="{ name: 'event-detail', params: { guid: event.guid } }"
      >
        <div class="event-card__media">
          <img :alt="event.camera" class="event-card__thumbnail" :src="getThumbnailUrl(event.frigateEventId)">

          <v-chip
            class="event-card__status-badge"
            :color="getStatusColor(event.status)"
            size="x-small"
            variant="flat"
          >
            {{ t(`events.${event.status}`) }}
          </v-chip>
        </div>

        <div class="event-card__content">
          <div class="event-card__top">
            <span class="event-card__camera">{{ event.camera }}</span>
            <span class="event-card__time">{{ formatTime(event.createdAt) }}</span>
          </div>

          <p class="event-card__summary">{{ getSummary(event) }}</p>

          <div v-if="event.status === 'completed' && event.aiResponse" class="event-card__checks">
            <span
              v-for="check in getChecks(event.aiResponse).slice(0, 3)"
              :key="check.key"
              class="event-card__check"
              :class="{ 'event-card__check--ok': check.valid, 'event-card__check--fail': !check.valid }"
            >
              <v-icon :icon="check.valid ? 'mdi-check-circle' : 'mdi-close-circle'" size="12" />
              {{ check.label }}
            </span>
          </div>

          <div class="event-card__bottom">
            <span class="event-card__watcher">{{ event.watcher?.name ?? '—' }}</span>
          </div>
        </div>
      </router-link>

      <div v-if="recentEvents.length === 0" class="empty-state">
        <v-icon color="primary" icon="mdi-timeline-clock-outline" size="48" />
        <p>{{ t('dashboard.noEvents') }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, onUnmounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { analysisApi, type AnalysisEvent, getThumbnailUrl } from '@/api/analysis'
  import { frigateApi } from '@/api/frigate'
  import { watchersApi } from '@/api/watchers'
  import { subscribeSse } from '@/composables/useSse'

  const { t, locale } = useI18n()

  const loading = ref(true)
  const recentEvents = ref<AnalysisEvent[]>([])
  const frigateStatus = ref<'connected' | 'disconnected'>('disconnected')

  const stats = ref({
    activeWatchers: 0,
    completedToday: 0,
    failedToday: 0,
  })

  onMounted(async () => {
    await Promise.all([loadEvents(), loadStats(), loadFrigateStatus()])
    loading.value = false
  })

  const unsubCreated = subscribeSse('analysis.created', data => {
    const created = data as AnalysisEvent
    if (!recentEvents.value.some(e => e.guid === created.guid)) {
      recentEvents.value.unshift(created)
      if (recentEvents.value.length > 5) recentEvents.value.pop()
    }
  })

  const unsubUpdated = subscribeSse('analysis.updated', data => {
    const updated = data as AnalysisEvent
    const idx = recentEvents.value.findIndex(e => e.guid === updated.guid)
    if (idx !== -1) recentEvents.value[idx] = updated
  })

  onUnmounted(() => {
    unsubCreated()
    unsubUpdated()
  })

  async function loadEvents () {
    const result = await analysisApi.getAll()
    if (result.success) {
      recentEvents.value = result.data.slice(0, 5)
      countStats(result.data)
    }
  }

  async function loadStats () {
    const result = await watchersApi.getAll()
    if (result.success) {
      stats.value.activeWatchers = result.data.filter(w => w.enabled).length
    }
  }

  async function loadFrigateStatus () {
    const result = await frigateApi.getInfo()
    if (result.success) {
      frigateStatus.value = result.data.status
    }
  }

  function countStats (events: AnalysisEvent[]) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const e of events) {
      const created = new Date(e.createdAt)
      if (created < today) continue
      if (e.status === 'completed') stats.value.completedToday++
      if (e.status === 'failed') stats.value.failedToday++
    }
  }

  function getStatusColor (status: string) {
    const map: Record<string, string> = {
      pending: 'info',
      processing: 'warning',
      completed: 'success',
      failed: 'error',
    }
    return map[status] ?? 'info'
  }

  const lang = () => locale.value === 'ru' ? 'ru' : 'en'

  function getSummary (event: AnalysisEvent): string {
    if (!event.aiResponse) return t('events.noSummary')
    const summary = event.aiResponse.summary as Record<string, string> | string | undefined
    if (!summary) return t('events.noSummary')
    if (typeof summary === 'string') return summary
    return summary[lang()] ?? summary.en ?? t('events.noSummary')
  }

  function getChecks (aiResponse: Record<string, unknown>) {
    const checks = aiResponse.checks as Array<{
      key: string
      label: Record<string, string>
      valid: boolean
    }> | undefined

    if (!checks || !Array.isArray(checks)) return []

    return checks.map(c => ({
      key: c.key,
      label: c.label?.[lang()] ?? c.label?.en ?? c.key,
      valid: c.valid,
    }))
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
.page-dashboard {
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

// Stats
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(22, 27, 34, 0.6);
  border: 1px solid rgba(48, 54, 61, 0.5);
  border-radius: 12px;
}

.stat-card__content {
  display: flex;
  flex-direction: column;
}

.stat-card__value {
  font-size: 22px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  font-family: 'Roboto Mono', monospace;
  line-height: 1.2;

  &--small {
    font-size: 13px;
    font-weight: 600;
  }
}

.stat-card__label {
  font-size: 11px;
  color: rgba(230, 237, 243, 0.5);
}

// Section header
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.section-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.8;
  }
}

// Loading
.loading-state {
  display: flex;
  justify-content: center;
  padding: 32px;
}

// Events list
.events-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-card {
  display: flex;
  gap: 12px;
  padding: 10px;
  background: rgba(22, 27, 34, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(48, 54, 61, 0.5);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: rgba(0, 229, 255, 0.25);
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.06);
  }
}

.event-card__media {
  position: relative;
  width: 110px;
  min-width: 110px;
  height: 70px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;

  @media (max-width: 500px) {
    width: 80px;
    min-width: 80px;
    height: 54px;
  }
}

.event-card__thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.event-card__status-badge {
  position: absolute;
  top: 4px;
  right: 4px;
}

.event-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.event-card__camera {
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
  font-size: 12px;
  color: rgba(230, 237, 243, 0.8);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-card__checks {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.event-card__check {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: rgba(230, 237, 243, 0.5);

  &--ok { color: rgb(var(--v-theme-success)); }
  &--fail { color: rgb(var(--v-theme-error)); }
}

.event-card__bottom {
  margin-top: auto;
}

.event-card__watcher {
  font-size: 11px;
  color: rgba(230, 237, 243, 0.45);
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
