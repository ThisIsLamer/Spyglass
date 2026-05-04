import type { AuthUser } from '@/stores/auth'
import { api } from './client'

interface LoginResult {
  success: true
  data: { user: AuthUser }
}

interface MeResult {
  success: true
  user: AuthUser
}

interface FailResult {
  success: false
  message?: string
}

export const authApi = {
  login (username: string, password: string) {
    return api.request<LoginResult | FailResult>('POST', '/auth/login', { username, password })
  },

  logout () {
    return api.post('/auth/logout')
  },

  me () {
    return api.request<MeResult | FailResult>('GET', '/users/me')
  },

  setLanguage (language: string) {
    return api.post<{ success: true } | FailResult>('/users/me/language', { language })
  },
}
