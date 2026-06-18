/**
 * API client for AI chat messages.
 *
 * Targets the Converse tool-use assistant, which applies the StockOps-domain Guardrail, the
 * scope-limiting system prompt, and Knowledge Base grounding.
 *
 * The assistant runs a multi-step LLM + tool-use loop that can take far longer than a normal
 * request, so the call is split into an async job: POST creates the job and returns a jobId
 * immediately, then we poll until it completes. This keeps every individual request short, so it
 * no longer fights the axios timeout or any CDN/load-balancer read timeout on slow turns.
 *
 * @author StockOps Team
 * @since 2.7
 */

import api from '@/lib/api'
import type { AiChatRequest, AiChatResponse } from '@/types/aiChat'

/** Backend BedrockAgentInvokeResponse shape (the assistant result). */
interface AssistantResponse {
  answer: string
  sessionId: string
  actionSuggested: boolean
  notice?: string | null
  sessionReset?: boolean
}

interface AssistantJobCreated {
  jobId: string
}

interface AssistantJobStatus {
  jobId: string
  status: 'PENDING' | 'DONE' | 'ERROR'
  result?: AssistantResponse | null
  error?: string | null
}

/** Interval between status polls. */
const POLL_INTERVAL_MS = 1200
/** Hard ceiling on polling (≈ MAX_POLLS × interval) so a stuck job can't poll forever. */
const MAX_POLLS = 150

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function adapt(result: AssistantResponse): AiChatResponse {
  return {
    message: result.answer,
    provider: 'bedrock',
    serviceStatus: 'AVAILABLE',
    fallbackUsed: false,
    sessionId: result.sessionId,
    notice: result.notice ?? undefined,
    sessionReset: result.sessionReset ?? false,
  }
}

export async function sendChatMessage(request: AiChatRequest): Promise<AiChatResponse> {
  const created = await api.post<AssistantJobCreated>('/v1/ai/bedrock/assistant/jobs', {
    message: request.message,
    sessionId: request.sessionId,
    targetScopeType: request.scopeType,
    targetScopeId: request.scopeId,
  })
  const { jobId } = created.data

  for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
    const { data } = await api.get<AssistantJobStatus>(`/v1/ai/bedrock/assistant/jobs/${jobId}`)
    if (data.status === 'DONE' && data.result) {
      return adapt(data.result)
    }
    if (data.status === 'ERROR') {
      throw new Error(data.error || 'assistant job failed')
    }
    await delay(POLL_INTERVAL_MS)
  }
  throw new Error('assistant job timed out')
}
