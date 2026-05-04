import { api } from './client'

export interface AiProvider {
  guid: string
  name: string
  baseUrl: string
  model: string
  hasApiKey: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface ProvidersListResult {
  success: true
  data: AiProvider[]
}

interface ProviderResult {
  success: true
  data: AiProvider
}

interface FailResult {
  success: false
  message?: string
}

export interface CreateProviderDto {
  name: string
  baseUrl: string
  model: string
  apiKey?: string
  isDefault?: boolean
}

export interface UpdateProviderDto {
  name?: string
  baseUrl?: string
  model?: string
  apiKey?: string | null
  isDefault?: boolean
}

export const providersApi = {
  getAll () {
    return api.get<ProvidersListResult | FailResult>('/ai-providers')
  },

  create (dto: CreateProviderDto) {
    return api.post<ProviderResult | FailResult>('/ai-providers', dto)
  },

  update (guid: string, dto: UpdateProviderDto) {
    return api.put<ProviderResult | FailResult>(`/ai-providers/${guid}`, dto)
  },

  remove (guid: string) {
    return api.delete<ProviderResult | FailResult>(`/ai-providers/${guid}`)
  },
}
