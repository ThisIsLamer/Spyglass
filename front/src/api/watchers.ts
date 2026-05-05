import { api } from './client'

export interface WatcherAiProvider {
  guid: string
  name: string
  model: string
}

export interface Watcher {
  guid: string
  name: string
  enabled: boolean
  cameras: string[]
  zones: string[]
  objectLabels: string[]
  analysisType: 'snapshot' | 'video_clip'
  prompt: string
  descriptionPrompt: string | null
  cooldownSeconds: number
  aiProvider: WatcherAiProvider | null
  createdAt: string
  updatedAt: string
}

interface WatchersListResult {
  success: true
  data: Watcher[]
}

interface WatcherResult {
  success: true
  data: Watcher
}

interface FailResult {
  success: false
  message?: string
}

export interface CreateWatcherDto {
  name: string
  cameras: string[]
  analysisType: 'snapshot' | 'video_clip'
  prompt: string
  descriptionPrompt?: string | null
  zones?: string[]
  objectLabels?: string[]
  cooldownSeconds?: number
  enabled?: boolean
  aiProviderGuid?: string
}

export interface UpdateWatcherDto {
  name?: string
  cameras?: string[]
  analysisType?: 'snapshot' | 'video_clip'
  prompt?: string
  descriptionPrompt?: string | null
  zones?: string[]
  objectLabels?: string[]
  cooldownSeconds?: number
  enabled?: boolean
  aiProviderGuid?: string | null
}

export const watchersApi = {
  getAll () {
    return api.get<WatchersListResult | FailResult>('/watchers')
  },

  getOne (guid: string) {
    return api.get<WatcherResult | FailResult>(`/watchers/${guid}`)
  },

  create (dto: CreateWatcherDto) {
    return api.post<WatcherResult | FailResult>('/watchers', dto)
  },

  update (guid: string, dto: UpdateWatcherDto) {
    return api.put<WatcherResult | FailResult>(`/watchers/${guid}`, dto)
  },

  remove (guid: string) {
    return api.delete<WatcherResult | FailResult>(`/watchers/${guid}`)
  },

  toggle (guid: string) {
    return api.post<WatcherResult | FailResult>(`/watchers/${guid}/toggle`, {})
  },
}
