import { ref } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

type SseHandler = (data: unknown) => void

const globalHandlers = new Map<string, Set<SseHandler>>()
let eventSource: EventSource | null = null
const registeredEvents = new Set<string>()
const connected = ref(false)

function connect () {
  if (eventSource) {
    return
  }

  eventSource = new EventSource(`${API_URL}/sse`, { withCredentials: true })

  eventSource.addEventListener('open', () => {
    connected.value = true
  })

  eventSource.addEventListener('error', () => {
    connected.value = false
  })

  eventSource.addEventListener('connected', () => {
    connected.value = true
  })
}

function addEventSourceListener (eventName: string) {
  if (!eventSource || registeredEvents.has(eventName)) {
    return
  }
  registeredEvents.add(eventName)

  eventSource.addEventListener(eventName, (e: MessageEvent) => {
    const handlers = globalHandlers.get(eventName)
    if (!handlers || handlers.size === 0) {
      return
    }

    try {
      const data = JSON.parse(e.data)
      for (const handler of handlers) {
        handler(data)
      }
    } catch {
      console.error(`[SSE] Failed to parse event "${eventName}":`, e.data)
    }
  })
}

export function initSse () {
  connect()
}

export function subscribeSse (eventName: string, handler: SseHandler): () => void {
  if (!globalHandlers.has(eventName)) {
    globalHandlers.set(eventName, new Set())
  }

  globalHandlers.get(eventName)!.add(handler)
  addEventSourceListener(eventName)

  return () => {
    globalHandlers.get(eventName)?.delete(handler)
  }
}

export function useSseConnected () {
  return connected
}
