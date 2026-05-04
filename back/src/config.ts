import 'dotenv/config'

export const GLOBAL_CONFIG = {
  APP: {
    PORT: Number(process.env.APP_PORT) ?? 3000,
    HOST: process.env.APP_HOST ?? '0.0.0.0',
    PAPER: process.env.APP_PASSWORD_PAPER ?? '',
    JWT_SECRET: process.env.APP_JWT_SECRET ?? 'change-me-in-production',
    CORS_ORIGIN: (process.env.APP_CORS_ORIGIN ?? 'http://localhost:3018').split(',').map(s => s.trim()),
  },
  DATABASE: {
    SQL: {
      URL: process.env.DATABASE_URL ?? 'mysql://localhost:3306/ai_provider'
    },
    LOGGING: process.env.DATABASE_LOGGING === 'true'
  },
  FRIGATE: {
    MQTT_URL: process.env.FRIGATE_MQTT_URL ?? 'mqtt://localhost:1883',
    TOPIC_PREFIX: process.env.FRIGATE_TOPIC_PREFIX ?? 'frigate',
    API_URL: process.env.FRIGATE_API_URL ?? 'http://localhost:5000',
  },
}