/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App
 */

import { createApp } from 'vue'
import { registerPlugins } from '@/plugins'
import App from './App.vue'
import 'unfonts.css'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')

// Validate session & hide splash
async function bootstrap () {
  const { useAuthStore } = await import('@/stores/auth')
  const auth = useAuthStore()

  await auth.init()

  // Hide splash
  const splash = document.querySelector('#splash')
  if (splash) {
    requestAnimationFrame(() => {
      splash.classList.add('splash--hidden')
      splash.addEventListener('transitionend', () => {
        splash.remove()
      }, { once: true })
    })
  }
}

bootstrap()
