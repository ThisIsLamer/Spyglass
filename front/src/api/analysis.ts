import { api } from './client'

export interface AnalysisEventWatcher {
  guid: string
  name: string
}

export interface AnalysisEvent {
  guid: string
  frigateEventId: string
  camera: string
  label: string | null
  zone: string | null
  prompt: string
  aiResponse: Record<string, unknown> | null
  aiProviderName: string
  aiModel: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  processingTimeMs: number | null
  error: string | null
  mediaPath: string | null
  watcher: AnalysisEventWatcher | null
  createdAt: string
}

interface AnalysisListResult {
  success: true
  data: AnalysisEvent[]
}

interface AnalysisResult {
  success: true
  data: AnalysisEvent
}

interface FailResult {
  success: false
  message?: string
}

export interface AnalysisFilters {
  watcherGuid?: string
  camera?: string
  status?: string
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3017/api/v1'

export function getThumbnailUrl (frigateEventId: string) {
  return `${API_URL}/frigate/events/${frigateEventId}/thumbnail`
}

export function getSnapshotUrl (frigateEventId: string) {
  return `${API_URL}/frigate/events/${frigateEventId}/snapshot`
}

export function getClipUrl (frigateEventId: string) {
  return `${API_URL}/frigate/events/${frigateEventId}/clip`
}

export const analysisApi = {
  getAll (filters?: AnalysisFilters) {
    const params = new URLSearchParams()
    if (filters?.watcherGuid) {
      params.set('watcherGuid', filters.watcherGuid)
    }
    if (filters?.camera) {
      params.set('camera', filters.camera)
    }
    if (filters?.status) {
      params.set('status', filters.status)
    }

    const query = params.toString()
    return api.get<AnalysisListResult | FailResult>(`/analysis${query ? `?${query}` : ''}`)
  },

  getOne (guid: string) {
    return api.get<AnalysisResult | FailResult>(`/analysis/${guid}`)
  },

  retry (guid: string) {
    return api.post<AnalysisResult | FailResult>(`/analysis/${guid}/retry`, {})
  },
}
