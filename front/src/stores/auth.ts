import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth'

export interface AuthUser {
  guid: string
  username: string
  displayName?: string
  role: 'admin' | 'operator' | 'viewer'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const ready = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isOperator = computed(() => user.value?.role === 'operator' || isAdmin.value)

  function setUser (newUser: AuthUser) {
    user.value = newUser
  }

  function clearUser () {
    user.value = null
  }

  async function init () {
    if (ready.value) {
      return
    }

    const res = await authApi.me()

    if (res.success) {
      setUser(res.user)
    }

    ready.value = true
  }

  async function logout () {
    await authApi.logout()
    clearUser()
  }

  return {
    user,
    ready,
    isAuthenticated,
    isAdmin,
    isOperator,
    setUser,
    clearUser,
    logout,
    init,
  }
})
