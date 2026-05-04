import { api } from './client'

export interface FrigateCamera {
  name: string
  zones: string[]
}

interface FrigateInfoResult {
  success: true
  data: {
    cameras: FrigateCamera[]
    labels: string[]
    status: 'connected' | 'disconnected'
    error?: string
  }
}

interface FailResult {
  success: false
  message?: string
}

export const frigateApi = {
  getInfo () {
    return api.get<FrigateInfoResult | FailResult>('/frigate/info')
  },
}
