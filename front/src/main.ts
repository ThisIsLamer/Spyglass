/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')

// Hide splash screen after app is mounted
const splash = document.querySelector('#splash')
if (splash) {
  // Small delay to ensure first paint is ready
  requestAnimationFrame(() => {
    setTimeout(() => {
      splash.classList.add('splash--hidden')
      // Remove from DOM after transition
      splash.addEventListener('transitionend', () => {
        splash.remove()
      }, { once: true })
    }, 300)
  })
}
