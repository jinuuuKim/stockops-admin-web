import { useState } from 'react'
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
    } catch {
      const fallbackMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'AI 채팅 API가 아직 준비되지 않았거나 접근 권한이 없습니다.',
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
