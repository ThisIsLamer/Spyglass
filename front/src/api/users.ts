import { api } from './client'

export interface User {
  guid: string
  username: string
  displayName: string
  role: 'admin' | 'operator' | 'viewer'
  lastLoginAt: string | null
  language: string | null
  createdAt: string
}

interface UsersListResult {
  success: true
  data: User[]
}

interface UserResult {
  success: true
  data: User
}

interface FailResult {
  success: false
  message?: string
  error?: string
}

export interface CreateUserDto {
  username: string
  password: string
  displayName?: string
  role?: 'admin' | 'operator' | 'viewer'
  language?: string
}

export interface UpdateUserDto {
  displayName?: string
  role?: 'admin' | 'operator' | 'viewer'
  language?: string
  password?: string
  isActive?: boolean
}

export const usersApi = {
  getAll () {
    return api.get<UsersListResult | FailResult>('/users')
  },

  create (dto: CreateUserDto) {
    return api.post<UserResult | FailResult>('/users', dto)
  },

  update (guid: string, dto: UpdateUserDto) {
    return api.put<UserResult | FailResult>(`/users/${guid}`, dto)
  },
}
