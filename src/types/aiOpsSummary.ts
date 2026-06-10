/**
 * TypeScript types for Bedrock AI operational summary responses.
 * Matches backend BedrockOpsSummaryResponse (§5.4 output spec).
 *
 * @author StockOps Team
 * @since 2.0
 */

import type { RiskLevel } from '@/types/aiExplanation'

export type { RiskLevel }

/**
 * Source counts map returned alongside the ops summary.
 * Keys match OpsFacts.toSourceCounts() in BedrockAiFacade.
 */
export interface AiOpsSummarySourceCounts {
  recommendations: number
  sensorAlerts: number
  criticalExpiry: number
  warningExpiry: number
  overdueShipments: number
  [key: string]: number
}

/**
 * AI-generated operational summary for a given business date and location.
 * Returned by GET /api/v1/ai/bedrock/ops-summary.
 *
 * Per §5.4 design spec: includes sourceCounts (deterministic, not from AI)
 * and confidenceCaveat (computed from input data count, §8 compliant).
 */
export interface AiOpsSummaryResponse {
  /** Business date of the summary */
  businessDate: string
  /** Distribution center ID (null = all centers) */
  centerId: number | null
  /** Warehouse ID (null = all warehouses) */
  warehouseId: number | null
  /** Korean-language AI-generated summary text */
  summary: string
  /** Urgent items requiring immediate attention */
  urgentItems: string[]
  /** Recommended actions from the AI */
  recommendedActions: string[]
  /** Overall risk level */
  riskLevel: RiskLevel
  /** ISO 8601 timestamp of when the summary was generated */
  generatedAt: string
  /** Per-source record counts used to build this summary (§5.4) */
  sourceCounts: AiOpsSummarySourceCounts
  /** Caveat string describing data quality (§5.4, §8 compliant) */
  confidenceCaveat: string
}
