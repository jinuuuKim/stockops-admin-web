import type { ChatMessage } from '@/types/aiChat'

const STORAGE_KEY = import.meta.env.VITE_ADMIN_CHAT_SESSION_STORAGE_KEY || 'stockops.admin.chat.messages'
const SESSION_ID_KEY = `${STORAGE_KEY}.sessionId`
const DEFAULT_LIMIT = Number(import.meta.env.VITE_ADMIN_CHAT_CONTEXT_MESSAGE_LIMIT || 12)

/** Backend conversation session id (multi-turn context), kept alongside the messages. */
export function loadAIChatSessionId(): string | undefined {
  return sessionStorage.getItem(SESSION_ID_KEY) || undefined
}

export function saveAIChatSessionId(sessionId: string): void {
  if (sessionId) sessionStorage.setItem(SESSION_ID_KEY, sessionId)
}

export function clearAIChatSessionId(): void {
  sessionStorage.removeItem(SESSION_ID_KEY)
}

export function loadAIChatMessages(): ChatMessage[] {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isChatMessage)
  } catch {
    return []
  }
}

export function saveAIChatMessages(messages: ChatMessage[], limit = DEFAULT_LIMIT): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-limit)))
}

export function appendAIChatMessage(message: ChatMessage, limit = DEFAULT_LIMIT): ChatMessage[] {
  const next = [...loadAIChatMessages(), message].slice(-limit)
  saveAIChatMessages(next, limit)
  return next
}

export function clearAIChatMessages(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ChatMessage>
  return typeof candidate.id === 'string'
    && (candidate.role === 'user' || candidate.role === 'assistant')
    && typeof candidate.content === 'string'
    && typeof candidate.createdAt === 'string'
}
