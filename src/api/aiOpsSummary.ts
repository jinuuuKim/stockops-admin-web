/**
 * API client for Bedrock AI operational summary.
 * Calls GET /api/v1/ai/bedrock/ops-summary.
 *
 * @author StockOps Team
 * @since 2.0
 */

import api from '@/lib/api'
import type { AiOpsSummaryResponse } from '@/types/aiOpsSummary'

/**
 * Fetches an AI-generated operational summary for the given date and location.
 * Responses are cached server-side (Redis, TTL 24h) so repeated calls are cheap.
 *
 * @param businessDate - ISO date string (e.g. "2026-06-10")
 * @param centerId     - Optional center ID filter
 * @param warehouseId  - Optional warehouse ID filter
 * @returns AI operational summary payload
 */
export async function fetchOpsSummary(
  businessDate: string,
  centerId?: number,
  warehouseId?: number,
): Promise<AiOpsSummaryResponse> {
  const params: Record<string, string | number> = { businessDate }
  if (centerId != null) params.centerId = centerId
  if (warehouseId != null) params.warehouseId = warehouseId
  const response = await api.get<AiOpsSummaryResponse>('/v1/ai/bedrock/ops-summary', { params })
  return response.data
}
