/**
 * API client functions for intraday forecast proposals.
 * Provides data fetching and approve/reject actions for the proposal workspace.
 *
 * @author StockOps Team
 * @since 2.4
 */

import api from '@/lib/api'
import type { ForecastProposalRun, ForecastProposalFilter } from '@/types/forecastProposal'

/**
 * Fetch scoped intraday forecast proposals.
 * @param filter - Optional query filter parameters
 * @returns Array of proposal payloads
 */
export async function getForecastProposals(filter: ForecastProposalFilter = {}): Promise<ForecastProposalRun[]> {
  const params: Record<string, string | number> = {}
  if (filter.businessDate) params.businessDate = filter.businessDate
  if (filter.centerId != null) params.centerId = filter.centerId
  if (filter.warehouseId != null) params.warehouseId = filter.warehouseId
  if (filter.productId != null) params.productId = filter.productId

  const response = await api.get<ForecastProposalRun[]>('/v1/ai/intraday-proposals', { params })
  return response.data
}

/**
 * Approve a proposal into a draft purchase order. Only open, in-window proposals can be approved.
 * @param proposalId - Proposal identifier
 * @returns Approved proposal with linked draft purchase order
 */
export async function approveForecastProposal(proposalId: number): Promise<ForecastProposalRun> {
  const response = await api.post<ForecastProposalRun>(`/v1/ai/intraday-proposals/${proposalId}/approve`)
  return response.data
}

/**
 * Reject a proposal. Only open, in-window proposals can be rejected.
 * @param proposalId - Proposal identifier
 * @param reason - Optional rejection reason
 * @returns Rejected proposal
 */
export async function rejectForecastProposal(proposalId: number, reason?: string): Promise<ForecastProposalRun> {
  const params: Record<string, string> = {}
  if (reason) params.reason = reason
  const response = await api.post<ForecastProposalRun>(`/v1/ai/intraday-proposals/${proposalId}/reject`, null, { params })
  return response.data
}
