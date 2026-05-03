<template>
  <div class="page-dashboard">
    <header class="page-header">
      <h1 class="page-title">{{ t('dashboard.title') }}</h1>
    </header>

    <div class="events-list">
      <router-link
        v-for="event in recentEvents"
        :key="event.id"
        class="event-card"
        :to="{ name: 'event-detail', params: { guid: event.id } }"
      >
        <div class="event-card__media">
          <img :alt="event.camera" class="event-card__thumbnail" :src="event.thumbnailUrl">

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
            <span class="event-card__time">{{ event.time }}</span>
          </div>

          <p class="event-card__summary">{{ event.summary }}</p>

          <div v-if="event.violations.length > 0" class="event-card__violations">
            <v-chip
              v-for="(v, idx) in event.violations.slice(0, 2)"
              :key="idx"
              color="error"
              size="x-small"
              variant="tonal"
            >
              {{ v }}
            </v-chip>
          </div>

          <div class="event-card__bottom">
            <span class="event-card__watcher">{{ event.watcher }}</span>
          </div>
        </div>
      </router-link>

      <div v-if="recentEvents.length === 0" class="empty-state">
        <v-icon color="primary" icon="mdi-timeline-clock-outline" size="48" />
        <p>{{ t('dashboard.noEvents') }}</p>
      </div>
    </div>

    <router-link v-if="recentEvents.length > 0" class="view-all-link" :to="{ name: 'events' }">
      Все события
      <v-icon icon="mdi-arrow-right" size="16" />
    </router-link>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  function getStatusColor (status: string) {
    const map: Record<string, string> = {
      pending: 'info',
      processing: 'warning',
      completed: 'success',
      failed: 'error',
    }
    return map[status] ?? 'info'
  }

  const recentEvents = ref([
    {
      id: 'evt-001',
      camera: 'entrance_main',
      status: 'completed',
      summary: 'На входе присутствует охранник, который проводит досмотр посетителей.',
      watcher: 'Пост охраны',
      time: '2 мин назад',
      violations: [] as string[],
      thumbnailUrl: 'https://placehold.co/320x180/0d1117/00e5ff?text=entrance',
    },
    {
      id: 'evt-002',
      camera: 'entrance_main',
      status: 'completed',
      summary: 'На входе отсутствует охранник. Трое посетителей прошли без проверки.',
      watcher: 'Пост охраны',
      time: '7 мин назад',
      violations: ['Нет охранника', 'Нет досмотра'],
      thumbnailUrl: 'https://placehold.co/320x180/0d1117/f85149?text=VIOLATION',
    },
    {
      id: 'evt-003',
      camera: 'parking_east',
      status: 'processing',
      summary: 'Анализ в процессе...',
      watcher: 'Парковка',
      time: '1 мин назад',
      violations: [] as string[],
      thumbnailUrl: 'https://placehold.co/320x180/0d1117/d29922?text=processing',
    },
  ])
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
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: rgba(0, 229, 255, 0.25);
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.06);
  }
}

.event-card__media {
  position: relative;
  width: 120px;
  min-width: 120px;
  height: 78px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;

  @media (max-width: 500px) {
    width: 90px;
    min-width: 90px;
    height: 60px;
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
  font-size: 13px;
  color: rgba(230, 237, 243, 0.85);
  line-height: 1.4;
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

.event-card__bottom {
  margin-top: auto;
}

.event-card__watcher {
  font-size: 11px;
  color: rgba(230, 237, 243, 0.45);
}

.view-all-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  padding: 10px;
  font-size: 13px;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  border-radius: 10px;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(0, 229, 255, 0.06);
  }
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
