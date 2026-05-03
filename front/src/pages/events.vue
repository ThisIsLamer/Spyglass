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

    <!-- Events List -->
    <div class="events-list">
      <router-link
        v-for="event in filteredEvents"
        :key="event.id"
        class="event-card"
        :to="{ name: 'event-detail', params: { guid: event.id } }"
      >
        <!-- Thumbnail -->
        <div class="event-card__media">
          <img
            :alt="event.camera"
            class="event-card__thumbnail"
            :src="event.thumbnailUrl"
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

            <span class="event-card__time">{{ event.time }}</span>
          </div>

          <p class="event-card__summary">
            {{ event.aiResponse?.summary || t('events.noSummary') }}
          </p>

          <!-- Violations -->
          <div v-if="event.aiResponse?.violations?.length" class="event-card__violations">
            <v-chip
              v-for="(violation, idx) in event.aiResponse.violations.slice(0, 2)"
              :key="idx"
              color="error"
              size="x-small"
              variant="tonal"
            >
              {{ violation }}
            </v-chip>

            <v-chip
              v-if="event.aiResponse.violations.length > 2"
              size="x-small"
              variant="outlined"
            >
              +{{ event.aiResponse.violations.length - 2 }}
            </v-chip>
          </div>

          <!-- Indicators -->
          <div v-if="event.aiResponse && event.status === 'completed'" class="event-card__indicators">
            <span
              v-for="indicator in getIndicators(event.aiResponse)"
              :key="indicator.key"
              class="event-card__indicator"
              :class="{ 'event-card__indicator--positive': indicator.value, 'event-card__indicator--negative': !indicator.value }"
            >
              <v-icon :icon="indicator.value ? 'mdi-check-circle' : 'mdi-close-circle'" size="12" />
              {{ indicator.label }}
            </span>
          </div>

          <div class="event-card__bottom">
            <span class="event-card__watcher">
              <v-icon icon="mdi-eye-outline" size="13" />
              {{ event.watcher }}
            </span>

            <span v-if="event.processingTime" class="event-card__processing">
              {{ event.processingTime }}ms
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
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  const activeStatus = ref('all')

  const statuses = [
    { value: 'all', label: 'Все', color: 'primary' },
    { value: 'completed', label: t('events.completed'), color: 'success' },
    { value: 'processing', label: t('events.processing'), color: 'warning' },
    { value: 'pending', label: t('events.pending'), color: 'info' },
    { value: 'failed', label: t('events.failed'), color: 'error' },
  ]

  function getStatusColor (status: string) {
    const map: Record<string, string> = {
      pending: 'info',
      processing: 'warning',
      completed: 'success',
      failed: 'error',
    }
    return map[status] ?? 'info'
  }

  interface AiResponse {
    [key: string]: unknown
    guard_present?: boolean
    visitors_detected?: boolean
    bag_inspection_performed?: boolean
    person_inspection_performed?: boolean
    summary?: string
    violations?: string[]
  }

  interface AnalysisEvent {
    id: string
    camera: string
    status: string
    watcher: string
    time: string
    processingTime: number | null
    thumbnailUrl: string
    aiResponse: AiResponse | null
  }

  const indicatorLabels: Record<string, string> = {
    guard_present: 'Охранник',
    bag_inspection_performed: 'Досмотр сумок',
    person_inspection_performed: 'Досмотр людей',
    visitors_detected: 'Посетители',
  }

  function getIndicators (response: AiResponse) {
    return Object.entries(indicatorLabels)
      .filter(([key]) => key in response)
      .map(([key, label]) => ({
        key,
        label,
        value: !!response[key],
      }))
  }

  const filteredEvents = computed(() => {
    if (activeStatus.value === 'all') return mockEvents.value
    return mockEvents.value.filter(e => e.status === activeStatus.value)
  })

  // Mock data with realistic AI responses
  const mockEvents = ref<AnalysisEvent[]>([
    {
      id: 'evt-001',
      camera: 'entrance_main',
      status: 'completed',
      watcher: 'Пост охраны — вход',
      time: '2 мин назад',
      processingTime: 1240,
      thumbnailUrl: 'https://placehold.co/320x180/0d1117/00e5ff?text=entrance_main',
      aiResponse: {
        guard_present: true,
        guard_description: 'Охранник в форме находится за стойкой охраны слева от входа.',
        visitors_detected: true,
        visitors_count: 2,
        bag_inspection_performed: true,
        bag_inspection_details: 'Охранник проверяет сумки посетителей у стойки.',
        person_inspection_performed: true,
        person_inspection_details: 'Посетители проходят через рамку металлодетектора.',
        summary: 'На входе присутствует охранник, который проводит досмотр посетителей и их сумок. Посетители проходят через металлодетектор, а их вещи проверяются вручную.',
        violations: [],
      },
    },
    {
      id: 'evt-002',
      camera: 'entrance_main',
      status: 'completed',
      watcher: 'Пост охраны — вход',
      time: '7 мин назад',
      processingTime: 1180,
      thumbnailUrl: 'https://placehold.co/320x180/0d1117/f85149?text=VIOLATION',
      aiResponse: {
        guard_present: false,
        guard_description: 'Охранник отсутствует за стойкой охраны, но видно, что стойка охраны есть.',
        visitors_detected: true,
        visitors_count: 3,
        bag_inspection_performed: false,
        bag_inspection_details: 'Досмотр сумок не производился',
        person_inspection_performed: false,
        person_inspection_details: 'Досмотр посетителей не производился',
        summary: 'На входе в помещение отсутствует охранник и досмотр посетителей и их сумок. Трое посетителей прошли через металлодетектор без проверки.',
        violations: [
          'Отсутствие охранника на посту',
          'Отсутствие досмотра посетителей',
          'Отсутствие досмотра сумок',
        ],
      },
    },
    {
      id: 'evt-003',
      camera: 'parking_east',
      status: 'processing',
      watcher: 'Парковка — движение',
      time: '1 мин назад',
      processingTime: null,
      thumbnailUrl: 'https://placehold.co/320x180/0d1117/d29922?text=processing...',
      aiResponse: null,
    },
    {
      id: 'evt-004',
      camera: 'hall_floor1',
      status: 'failed',
      watcher: 'Холл — скопления',
      time: '15 мин назад',
      processingTime: null,
      thumbnailUrl: 'https://placehold.co/320x180/0d1117/f85149?text=error',
      aiResponse: null,
    },
  ])
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

// Media / Thumbnail
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

// Content
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

.event-card__violations {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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
