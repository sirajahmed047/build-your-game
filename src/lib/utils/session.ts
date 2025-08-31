import { v4 as uuidv4 } from 'uuid'

const SESSION_STORAGE_KEY = 'interactive-story-session-id'

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side: generate a new session ID
    return uuidv4()
  }
  
  // Client-side: get from localStorage or create new
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY)
  
  if (!sessionId) {
    sessionId = uuidv4()
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
  }
  
  return sessionId
}

export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

export function setSessionIdHeader(headers: HeadersInit = {}): HeadersInit {
  const sessionId = getOrCreateSessionId()
  return {
    ...headers,
    'x-session-id': sessionId
  }
}