<template>
  <div class="page-event-detail">
    <!-- Back button -->
    <button class="back-btn" @click="router.back()">
      <v-icon icon="mdi-arrow-left" size="18" />
      <span>{{ t('events.title') }}</span>
    </button>

    <div v-if="event" class="event-detail">
      <!-- Media Section -->
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
          :src="event.thumbnailUrl"
        >

        <video
          v-show="showVideo"
          autoplay
          class="event-detail__video"
          loop
          muted
          playsinline
          :src="event.videoUrl"
        />

        <div class="event-detail__media-hint" :class="{ 'event-detail__media-hint--hidden': showVideo }">
          <v-icon icon="mdi-gesture-tap" size="16" />
          {{ t('events.hoverForVideo') }}
        </div>
      </div>

      <!-- Status & Meta -->
      <div class="event-detail__meta-bar">
        <div class="event-detail__meta-left">
          <v-chip :color="getStatusColor(event.status)" size="small" variant="flat">
            {{ t(`events.${event.status}`) }}
          </v-chip>

          <span class="event-detail__camera">
            <v-icon icon="mdi-cctv" size="14" />
            {{ event.camera }}
          </span>
        </div>

        <div class="event-detail__meta-right">
          <span v-if="event.processingTime" class="event-detail__processing">
            <v-icon icon="mdi-timer-outline" size="14" />
            {{ event.processingTime }}ms
          </span>

          <span class="event-detail__time">{{ event.time }}</span>
        </div>
      </div>

      <!-- AI Analysis Results -->
      <section v-if="event.aiResponse && event.status === 'completed'" class="event-detail__analysis">
        <!-- Summary -->
        <div class="analysis-summary">
          <p>{{ event.aiResponse.summary }}</p>
        </div>

        <!-- Violations Alert -->
        <div v-if="event.aiResponse.violations?.length" class="analysis-violations">
          <div class="analysis-violations__header">
            <v-icon color="error" icon="mdi-alert-circle" size="18" />
            <span>Нарушения ({{ event.aiResponse.violations.length }})</span>
          </div>

          <ul class="analysis-violations__list">
            <li v-for="(violation, idx) in event.aiResponse.violations" :key="idx">
              {{ violation }}
            </li>
          </ul>
        </div>

        <!-- Indicators Grid -->
        <div class="analysis-indicators">
          <div
            v-for="indicator in indicators"
            :key="indicator.key"
            class="indicator-item"
            :class="{
              'indicator-item--positive': indicator.value === true,
              'indicator-item--negative': indicator.value === false,
            }"
          >
            <v-icon
              :icon="indicator.value ? 'mdi-check-circle' : 'mdi-close-circle'"
              size="20"
            />

            <div class="indicator-item__content">
              <span class="indicator-item__label">{{ indicator.label }}</span>
              <span v-if="indicator.details" class="indicator-item__details">{{ indicator.details }}</span>
            </div>
          </div>
        </div>

        <!-- Additional Data -->
        <div v-if="additionalFields.length > 0" class="analysis-extra">
          <div
            v-for="field in additionalFields"
            :key="field.key"
            class="extra-field"
          >
            <span class="extra-field__label">{{ field.key }}</span>
            <span class="extra-field__value">{{ field.value }}</span>
          </div>
        </div>

        <!-- Raw JSON (collapsible) -->
        <details class="analysis-raw">
          <summary class="analysis-raw__toggle">
            <v-icon icon="mdi-code-json" size="16" />
            Сырой JSON ответ
          </summary>

          <pre class="analysis-raw__code">{{ JSON.stringify(event.aiResponse, null, 2) }}</pre>
        </details>
      </section>

      <!-- Processing / Failed states -->
      <section v-else-if="event.status === 'processing'" class="event-detail__state">
        <v-progress-circular color="primary" indeterminate size="32" />
        <p>{{ t('events.processing') }}...</p>
      </section>

      <section v-else-if="event.status === 'failed'" class="event-detail__state event-detail__state--error">
        <v-icon color="error" icon="mdi-alert-circle-outline" size="32" />
        <p>{{ event.error || 'Ошибка при обработке' }}</p>

        <v-btn
          v-if="auth.isAdmin"
          color="warning"
          prepend-icon="mdi-refresh"
          size="small"
          variant="tonal"
        >
          {{ t('events.retry') }}
        </v-btn>
      </section>

      <!-- Watcher & Provider Info -->
      <div class="event-detail__info-row">
        <div class="info-block">
          <span class="info-block__label">{{ t('events.watcher') }}</span>
          <span class="info-block__value">{{ event.watcher }}</span>
        </div>

        <div class="info-block">
          <span class="info-block__label">{{ t('events.aiProvider') }}</span>
          <span class="info-block__value">{{ event.aiProvider }} / {{ event.aiModel }}</span>
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
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()

  const showVideo = ref(false)

  function getStatusColor (status: string) {
    const map: Record<string, string> = {
      pending: 'info',
      processing: 'warning',
      completed: 'success',
      failed: 'error',
    }
    return map[status] ?? 'info'
  }

  // Indicator config: which boolean fields to show as indicators
  const indicatorConfig: Record<string, { label: string, detailsKey?: string }> = {
    guard_present: { label: 'Охранник на посту', detailsKey: 'guard_description' },
    bag_inspection_performed: { label: 'Досмотр сумок', detailsKey: 'bag_inspection_details' },
    person_inspection_performed: { label: 'Досмотр посетителей', detailsKey: 'person_inspection_details' },
    visitors_detected: { label: 'Посетители обнаружены' },
  }

  const indicators = computed(() => {
    if (!event.value?.aiResponse) return []
    const response = event.value.aiResponse
    return Object.entries(indicatorConfig)
      .filter(([key]) => key in response)
      .map(([key, config]) => ({
        key,
        label: config.label,
        value: response[key] as boolean,
        details: config.detailsKey ? (response[config.detailsKey] as string) : undefined,
      }))
  })

  // Fields that are not indicators, summary, or violations
  const knownKeys = new Set([
    'summary', 'violations',
    ...Object.keys(indicatorConfig),
    ...Object.values(indicatorConfig).map(c => c.detailsKey).filter(Boolean),
  ])

  const additionalFields = computed(() => {
    if (!event.value?.aiResponse) return []
    return Object.entries(event.value.aiResponse)
      .filter(([key]) => !knownKeys.has(key))
      .map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      }))
  })

  // Mock event data — in real app this would be fetched by route.params.guid
  const event = ref({
    id: route.params.guid as string,
    camera: 'entrance_main',
    status: 'completed',
    watcher: 'Пост охраны — вход',
    time: '2 мин назад',
    processingTime: 1240,
    thumbnailUrl: 'https://placehold.co/800x450/0d1117/00e5ff?text=entrance_main+snapshot',
    videoUrl: '',
    prompt: 'Определи действия охранника: проводит ли досмотр, проверяет ли сумки, есть ли подозрительное поведение посетителей. Ответь в формате JSON.',
    aiProvider: 'Ollama Local',
    aiModel: 'llava:13b',
    error: null as string | null,
    aiResponse: {
      guard_present: true,
      guard_description: 'Охранник в форме находится за стойкой охраны слева от входа.',
      visitors_detected: true,
      visitors_count: 2,
      bag_inspection_performed: true,
      bag_inspection_details: 'Охранник проверяет сумки посетителей у стойки, используя ручной осмотр и, возможно, металлодетектор.',
      person_inspection_performed: true,
      person_inspection_details: 'Посетители проходят через рамку металлодетектора, установленную рядом со стойкой охраны.',
      summary: 'На входе присутствует охранник, который проводит досмотр посетителей и их сумок. Посетители проходят через металлодетектор, а их вещи проверяются вручную.',
      violations: [] as string[],
    } as Record<string, unknown>,
  })
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

.event-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// Media
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

// Meta bar
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

// Analysis section
.event-detail__analysis {
  display: flex;
  flex-direction: column;
  gap: 14px;
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

// Violations
.analysis-violations {
  padding: 14px 16px;
  background: rgba(248, 81, 73, 0.06);
  border: 1px solid rgba(248, 81, 73, 0.2);
  border-radius: 12px;
}

.analysis-violations__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-error));
  margin-bottom: 10px;
}

.analysis-violations__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  li {
    font-size: 13px;
    color: rgba(230, 237, 243, 0.8);
    padding-left: 20px;
    position: relative;

    &::before {
      content: '•';
      position: absolute;
      left: 6px;
      color: rgb(var(--v-theme-error));
    }
  }
}

// Indicators
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

    .v-icon {
      color: rgb(var(--v-theme-success));
    }
  }

  &--negative {
    border-color: rgba(248, 81, 73, 0.2);
    background: rgba(248, 81, 73, 0.04);

    .v-icon {
      color: rgb(var(--v-theme-error));
    }
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

// Additional fields
.analysis-extra {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.extra-field {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(22, 27, 34, 0.5);
  border: 1px solid rgba(48, 54, 61, 0.4);
  border-radius: 8px;
}

.extra-field__label {
  font-size: 11px;
  color: rgba(230, 237, 243, 0.5);
  font-family: 'Roboto Mono', monospace;
}

.extra-field__value {
  font-size: 12px;
  color: rgb(var(--v-theme-primary));
  font-family: 'Roboto Mono', monospace;
}

// Raw JSON
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

  &:hover {
    color: rgb(var(--v-theme-primary));
  }
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

  &--prompt {
    color: rgba(230, 237, 243, 0.8);
  }
}

// States
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

  &--error {
    border-color: rgba(248, 81, 73, 0.2);
  }
}

// Info row
.event-detail__info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
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
</style>
