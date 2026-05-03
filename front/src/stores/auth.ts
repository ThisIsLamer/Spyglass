import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface AuthUser {
  guid: string
  username: string
  displayName: string
  role: 'admin' | 'operator' | 'viewer'
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('spyglass_token'))
  const user = ref<AuthUser | null>(
    JSON.parse(localStorage.getItem('spyglass_user') || 'null'),
  )

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isOperator = computed(() => user.value?.role === 'operator' || isAdmin.value)

  function setAuth (newToken: string, newUser: AuthUser) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('spyglass_token', newToken)
    localStorage.setItem('spyglass_user', JSON.stringify(newUser))
  }

  function logout () {
    token.value = null
    user.value = null
    localStorage.removeItem('spyglass_token')
    localStorage.removeItem('spyglass_user')
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    isOperator,
    setAuth,
    logout,
  }
})
