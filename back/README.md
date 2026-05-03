# AI Provider Gateway

Система-провайдер для маршрутизации запросов к различным AI сервисам с аутентификацией, балансировкой нагрузки и мониторингом.

## Возможности

- 🔐 Аутентификация по токенам
- ⚖️ Балансировка нагрузки между серверами
- 📊 Мониторинг состояния серверов
- 🔌 Поддержка различных провайдеров (Ollama, vLLM)
- 🚀 Высокая производительность с Fastify

## Быстрый старт

1. Установка зависимостей:
```bash
npm install
```

2. Настройка окружения:
```bash
cp .env.example .env
# Отредактируйте .env файл
```

3. Настройка базы данных:
```bash
npm run db:migrate
npm run db:generate
```

4. Запуск в режиме разработки:
```bash
npm run dev
```

## API Endpoints

### Аутентификация
Все запросы к `/api/*` требуют заголовок:
```
Authorization: Bearer YOUR_TOKEN
```

### Основные эндпоинты

- `POST /api/chat/completions` - Отправка запроса к AI модели
- `GET /api/models` - Получение списка доступных моделей
- `GET /health` - Проверка состояния сервиса

## Архитектура

```
src/
├── types/           # TypeScript типы
├── providers/       # Провайдеры AI сервисов
├── services/        # Бизнес-логика
├── middleware/      # Middleware для Fastify
├── routes/          # API маршруты
└── utils/           # Утилиты
```

## Конфигурация серверов

Серверы настраиваются в базе данных или через конфигурационный файл. Поддерживаемые типы:
- `ollama` - Ollama сервер
- `vllm` - vLLM сервер  
- `openai-compatible` - OpenAI-совместимые API

## Стратегии балансировки

- `round-robin` - По очереди
- `least-connections` - Наименее загруженный
- `weighted` - Взвешенная по приоритету
- `health-based` - На основе состояния и производительности

## Разработка

```bash
# Линтинг
npm run lint
npm run lint:fix

# Тестирование
npm test
npm run test:watch

# Сборка
npm run build
npm start
```