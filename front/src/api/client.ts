const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

class ApiClient {
  private baseUrl: string

  constructor (baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    try {
      const url = `${this.baseUrl}${path}`

      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        return (data ?? { success: false, message: `HTTP ${res.status}` }) as T
      }

      return await res.json()
    } catch {
      return { success: false, message: 'Network error' } as T
    }
  }

  get<T>(path: string) {
    return this.request<T>('GET', path)
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, body)
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>('PUT', path, body)
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path)
  }
}

export const api = new ApiClient(API_URL)
