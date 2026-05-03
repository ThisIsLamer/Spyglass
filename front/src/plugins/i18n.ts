import { createI18n } from 'vue-i18n'
import en from '@/locales/en'
import ru from '@/locales/ru'

export default createI18n({
  legacy: false,
  locale: 'ru',
  fallbackLocale: 'en',
  messages: { en, ru },
})
