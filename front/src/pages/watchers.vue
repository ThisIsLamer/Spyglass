<template>
  <div class="page-watchers">
    <header class="page-header">
      <h1 class="page-title">{{ t('watchers.title') }}</h1>

      <v-btn
        v-if="auth.isAdmin"
        color="primary"
        prepend-icon="mdi-plus"
        size="small"
        @click="showCreate = true"
      >
        {{ t('watchers.create') }}
      </v-btn>
    </header>

    <!-- Watchers Grid -->
    <div class="watchers-grid">
      <div
        v-for="watcher in mockWatchers"
        :key="watcher.id"
        class="watcher-card"
        :class="{ 'watcher-card--disabled': !watcher.enabled }"
      >
        <div class="watcher-card__header">
          <div class="watcher-card__name">{{ watcher.name }}</div>

          <div
            class="watcher-card__indicator"
            :class="{ 'watcher-card__indicator--active': watcher.enabled }"
          />
        </div>

        <div class="watcher-card__tags">
          <v-chip
            v-for="camera in watcher.cameras"
            :key="camera"
            color="primary"
            size="x-small"
            variant="outlined"
          >
            {{ camera }}
          </v-chip>

          <v-chip
            v-for="zone in watcher.zones"
            :key="zone"
            color="secondary"
            size="x-small"
            variant="outlined"
          >
            {{ zone }}
          </v-chip>
        </div>

        <div class="watcher-card__meta">
          <span class="watcher-card__type">
            <v-icon :icon="watcher.analysisType === 'snapshot' ? 'mdi-camera' : 'mdi-video'" size="14" />
            {{ t(`watchers.${watcher.analysisType === 'snapshot' ? 'snapshot' : 'videoClip'}`) }}
          </span>

          <span v-if="watcher.cooldown > 0" class="watcher-card__cooldown">
            <v-icon icon="mdi-timer-outline" size="14" />
            {{ watcher.cooldown }}s
          </span>
        </div>

        <div class="watcher-card__prompt">
          {{ watcher.prompt }}
        </div>

        <div v-if="auth.isAdmin" class="watcher-card__actions">
          <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" />

          <v-btn
            :color="watcher.enabled ? 'warning' : 'success'"
            :icon="watcher.enabled ? 'mdi-pause' : 'mdi-play'"
            size="x-small"
            variant="text"
          />

          <v-btn color="error" icon="mdi-delete-outline" size="x-small" variant="text" />
        </div>
      </div>

      <div v-if="mockWatchers.length === 0" class="empty-state">
        <v-icon color="primary" icon="mdi-eye-off-outline" size="48" />
        <p>{{ t('watchers.noWatchers') }}</p>
      </div>
    </div>

    <!-- Create Dialog (placeholder) -->
    <v-dialog v-model="showCreate" max-width="500">
      <v-card class="glass-card">
        <v-card-title>{{ t('watchers.create') }}</v-card-title>

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
  const mockWatchers = ref([
    {
      id: '1',
      name: 'Пост охраны — вход',
      enabled: true,
      cameras: ['entrance_main', 'entrance_side'],
      zones: ['checkpoint'],
      analysisType: 'video_clip',
      prompt: 'Определи действия охранника: проводит ли досмотр, проверяет ли сумки, есть ли подозрительное поведение посетителей.',
      cooldown: 30,
    },
    {
      id: '2',
      name: 'Парковка — движение',
      enabled: true,
      cameras: ['parking_east', 'parking_west'],
      zones: [],
      analysisType: 'snapshot',
      prompt: 'Определи наличие подозрительной активности на парковке: оставленные предметы, длительное нахождение людей без движения.',
      cooldown: 60,
    },
    {
      id: '3',
      name: 'Холл — скопления',
      enabled: false,
      cameras: ['hall_floor1'],
      zones: ['main_entrance', 'elevator_area'],
      analysisType: 'snapshot',
      prompt: 'Оцени плотность людей в зоне. Если скопление более 10 человек — отметь как потенциальную проблему.',
      cooldown: 120,
    },
  ])
</script>

<style lang="scss" scoped>
.page-watchers {
  max-width: 900px;
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

.watchers-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.watcher-card {
  padding: 16px;
  background: rgba(22, 27, 34, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(48, 54, 61, 0.5);
  border-radius: 14px;
  transition: border-color 0.15s ease, opacity 0.15s ease;

  &:hover {
    border-color: rgba(0, 229, 255, 0.2);
  }

  &--disabled {
    opacity: 0.55;
  }
}

.watcher-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.watcher-card__name {
  font-size: 15px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.watcher-card__indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(230, 237, 243, 0.3);
  transition: all 0.2s ease;

  &--active {
    background: rgb(var(--v-theme-success));
    box-shadow: 0 0 8px rgba(63, 185, 80, 0.5);
  }
}

.watcher-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.watcher-card__meta {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
  font-size: 12px;
  color: rgba(230, 237, 243, 0.6);
}

.watcher-card__type,
.watcher-card__cooldown {
  display: flex;
  align-items: center;
  gap: 4px;
}

.watcher-card__prompt {
  font-size: 13px;
  color: rgba(230, 237, 243, 0.7);
  line-height: 1.5;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.watcher-card__actions {
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
