import { onUnmounted, ref } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3017/api/v1'

type SseHandler = (data: unknown) => void

const handlers = new Map<string, Set<SseHandler>>()
let eventSource: EventSource | null = null
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

  for (const eventName of handlers.keys()) {
    registerListener(eventName)
  }
}

function disconnect () {
  if (!eventSource) {
    return
  }
  eventSource.close()
  eventSource = null
  connected.value = false
}

function registerListener (eventName: string) {
  if (!eventSource) {
    return
  }

  eventSource.addEventListener(eventName, (e: MessageEvent) => {
    const eventHandlers = handlers.get(eventName)
    if (!eventHandlers) {
      return
    }

    try {
      const data = JSON.parse(e.data)
      for (const handler of eventHandlers) {
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

export function useSse (eventName: string, handler: SseHandler) {
  if (!handlers.has(eventName)) {
    handlers.set(eventName, new Set())
    if (eventSource) {
      registerListener(eventName)
    }
  }

  handlers.get(eventName)!.add(handler)

  onUnmounted(() => {
    handlers.get(eventName)?.delete(handler)
    if (handlers.get(eventName)?.size === 0) {
      handlers.delete(eventName)
    }
  })

  return { connected }
}
