/**
 * plugins/vuetify.ts
 *
 * Spyglass dark theme with neon cyan accents
 */

import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const spyglassDark = {
  dark: true,
  colors: {
    'background': '#0d1117',
    'surface': '#161b22',
    'surface-bright': '#1c2128',
    'surface-variant': '#21262d',
    'on-surface': '#e6edf3',
    'on-surface-variant': '#8b949e',
    'primary': '#00e5ff',
    'primary-darken-1': '#00bcd4',
    'secondary': '#7c4dff',
    'secondary-darken-1': '#651fff',
    'accent': '#00e5ff',
    'error': '#f85149',
    'info': '#58a6ff',
    'success': '#3fb950',
    'warning': '#d29922',
  },
  variables: {
    'border-color': '#30363d',
    'border-opacity': 0.12,
    'high-emphasis-opacity': 0.95,
    'medium-emphasis-opacity': 0.7,
    'disabled-opacity': 0.38,
    'idle-opacity': 0.04,
    'hover-opacity': 0.08,
    'focus-opacity': 0.12,
    'selected-opacity': 0.08,
    'activated-opacity': 0.12,
    'pressed-opacity': 0.12,
    'dragged-opacity': 0.08,
  },
}

export default createVuetify({
  theme: {
    defaultTheme: 'spyglassDark',
    themes: {
      spyglassDark,
    },
  },
  defaults: {
    VCard: {
      rounded: 'lg',
      elevation: 0,
    },
    VBtn: {
      rounded: 'lg',
      elevation: 0,
    },
    VChip: {
      rounded: 'lg',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
  },
})
