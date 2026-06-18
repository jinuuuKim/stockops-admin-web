/**
 * AI chat TypeScript types.
 * Matches backend AiChatResponse DTO.
 *
 * @author StockOps Team
 * @since 2.1
 */

export type AiServiceStatus =
  | 'AVAILABLE'
  | 'FALLBACK_ACTIVE'
  | 'UNCONFIGURED'
  | 'UNAUTHENTICATED'
  | 'UNAVAILABLE'

export interface AiChatRequest {
  message: string
  scopeType?: string
  scopeId?: number
  /** Conversation session id for multi-turn context; echo back what the last response returned. */
  sessionId?: string
}

export interface AiChatResponse {
  message: string
  provider: string
  serviceStatus: AiServiceStatus
  fallbackUsed: boolean
  fallbackNotice?: string
  serviceNotice?: string
  fallbackReason?: string
  /** Server-assigned session id to reuse on the next turn. */
  sessionId?: string
  /** System notice (history getting long, or session was reset); shown as a banner. */
  notice?: string
  /** True when the server cleared the stored conversation history for this session. */
  sessionReset?: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}
