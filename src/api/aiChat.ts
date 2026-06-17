/**
 * API client for AI chat messages.
 *
 * Targets the Converse tool-use assistant (`/v1/ai/bedrock/assistant`), which applies the
 * StockOps-domain Guardrail, the scope-limiting system prompt, and Knowledge Base grounding.
 * The legacy `/v1/ai/chat/messages` endpoint had none of these (it answered off-domain
 * questions freely), so the chat UI was migrated here. The assistant's response is adapted to
 * the existing {@link AiChatResponse} shape so callers (AiChatPage, useAIChatSession) stay
 * unchanged. The assistant path returns errors as answer text rather than HTTP errors, so the
 * provider/fallback notice fields are not populated.
 *
 * @author StockOps Team
 * @since 2.1
 */

import api from '@/lib/api'
import type { AiChatRequest, AiChatResponse } from '@/types/aiChat'

/** Backend BedrockAgentInvokeResponse shape returned by the assistant endpoint. */
interface AssistantResponse {
  answer: string
  sessionId: string
  actionSuggested: boolean
}

export async function sendChatMessage(request: AiChatRequest): Promise<AiChatResponse> {
  const response = await api.post<AssistantResponse>('/v1/ai/bedrock/assistant', {
    message: request.message,
    targetScopeType: request.scopeType,
    targetScopeId: request.scopeId,
  })
  return {
    message: response.data.answer,
    provider: 'bedrock',
    serviceStatus: 'AVAILABLE',
    fallbackUsed: false,
  }
}
