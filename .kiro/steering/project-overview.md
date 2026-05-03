---
inclusion: auto
---

# FrigateAI Sentinel

## О проекте

FrigateAI Sentinel — сервис-интеграция между Frigate NVR и генеративными AI-моделями. Слушает MQTT-события Фригата, захватывает видео/снимки с камер и зон, отправляет на анализ AI-модели по настраиваемому промту. Результат анализа может быть отправлен через уведомления (Telegram, Webhook и т.д.).

Проект задуман как универсальный инструмент: мониторинг поста охраны, контроль периметра, безопасность на производстве — любой сценарий, где нужен интеллектуальный анализ видеопотока.

## Стек

### Backend (`/back`)
- TypeScript, Fastify
- MikroORM v7 + MariaDB
- mqtt.js для связи с Frigate
- File-based routing контроллеров (вдохновлено Next.js)

### Frontend (`/front`)
- Vue 3 (Composition API) + Vuetify 4
- Pinia, Vite

### Инфраструктура
- Docker + Docker Compose
- MQTT-брокер (общий с Frigate)

## Структура проекта

- `back/src/controllers/` — file-based роутинг, каждая папка = путь API
- `back/src/entities/` — MikroORM-сущности
- `back/src/services/` — бизнес-логика (mqtt, frigate, analysis, ai-providers, notifications)
- `front/src/` — Vue-приложение

## Соглашения

- ESM-модули
- `snake_case` для колонок БД, `camelCase` для TS-свойств
- Все сущности наследуют BaseEntity (id, createdAt, updatedAt)
- API-ответы: `{ success: boolean, data?: T, error?: string }`
- async/await, без callback-стиля

## Лицензия

Dual licensing: AGPL-3.0 (open-source) + коммерческая лицензия для проприетарного использования.
