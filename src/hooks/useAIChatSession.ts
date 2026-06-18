import { useState } from 'react'
import axios from 'axios'
import { sendChatMessage } from '@/api/aiChat'
import {
  appendAIChatMessage,
  clearAIChatMessages,
  clearAIChatSessionId,
  loadAIChatMessages,
  loadAIChatSessionId,
  saveAIChatMessages,
  saveAIChatSessionId,
} from '@/lib/aiChatSessionStorage'
import type { ChatMessage } from '@/types/aiChat'

/**
 * Maps a failed chat request to a user-facing reason. The previous single catch-all message
 * ("API가 준비되지 않았거나 접근 권한이 없습니다") masked timeouts — the common case, since the
 * assistant's tool-use loop can run long — as a permission/availability problem. Branching makes
 * the distinct failures (timeout vs. permission vs. server vs. network) actionable for the user.
 */
function describeChatError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      || /timeout/i.test(error.message)
    if (timedOut) {
      return '응답이 지연되어 시간이 초과되었습니다. 질문 범위를 좁히거나 잠시 후 다시 시도해 주세요.'
    }
    const status = error.response?.status
    if (status === 401 || status === 403) {
      return 'AI 채팅 접근 권한이 없습니다. 로그인 상태와 권한을 확인해 주세요.'
    }
    if (status != null && status >= 500) {
      return 'AI 서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    }
    if (status != null) {
      return `요청을 처리하지 못했습니다. (오류 ${status})`
    }
    return 'AI 서버에 연결할 수 없습니다. 네트워크 또는 서비스 상태를 확인해 주세요.'
  }
  return 'AI 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
}

/**
 * Session-only admin AI chat state. Conversation is kept in browser sessionStorage
 * (no DB, no cookie, no localStorage) and recent context survives a tab refresh.
 * The backend conversation session id is threaded through so the assistant has multi-turn
 * context; the server's history notice (getting long / reset) is surfaced via providerNotice.
 */
export function useAIChatSession() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadAIChatMessages())
  const [sessionId, setSessionId] = useState<string | undefined>(() => loadAIChatSessionId())
  const [isSending, setIsSending] = useState(false)
  const [providerNotice, setProviderNotice] = useState('')

  async function send(content: string): Promise<void> {
    const text = content.trim()
    if (!text || isSending) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }
    setMessages(appendAIChatMessage(userMessage))
    setIsSending(true)

    try {
      const response = await sendChatMessage({ message: text, sessionId })
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message || '응답을 받지 못했습니다.',
        createdAt: new Date().toISOString(),
      }
      if (response.sessionReset) {
        // Backend hit the size cap and started a fresh session — drop the prior transcript so the
        // visible history matches the "이전 내용은 초기화됐습니다" notice, keeping only this exchange.
        const reset = [userMessage, assistantMessage]
        saveAIChatMessages(reset)
        setMessages(reset)
      } else {
        setMessages(appendAIChatMessage(assistantMessage))
      }
      if (response.sessionId) {
        saveAIChatSessionId(response.sessionId)
        setSessionId(response.sessionId)
      }
      setProviderNotice(response.notice || response.serviceNotice || response.fallbackNotice || '')
    } catch (error) {
      const fallbackMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: describeChatError(error),
        createdAt: new Date().toISOString(),
      }
      setMessages(appendAIChatMessage(fallbackMessage))
    } finally {
      setIsSending(false)
    }
  }

  function clear(): void {
    clearAIChatMessages()
    clearAIChatSessionId()
    setMessages([])
    setSessionId(undefined)
    setProviderNotice('')
  }

  return { messages, send, clear, isSending, providerNotice }
}
