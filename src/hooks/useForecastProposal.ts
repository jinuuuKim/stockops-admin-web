/**
 * React Query hooks for intraday forecast proposals.
 * Follows the same query-key and stale-time conventions as useAIRecommendation.
 *
 * @author StockOps Team
 * @since 2.4
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import {
  getForecastProposals,
  approveForecastProposal,
  rejectForecastProposal,
} from '@/api/forecastProposal'
import type { ForecastProposalRun, ForecastProposalFilter } from '@/types/forecastProposal'

const AI_STALE_TIME = 60000

const FORECAST_PROPOSAL_KEY = ['ai', 'intraday-proposals'] as const

/**
 * Fetch intraday forecast proposals with optional scope filters.
 * @param filter - Optional query filter parameters
 * @returns Query result with proposal array
 */
export function useForecastProposals(
  filter: ForecastProposalFilter = {}
): UseQueryResult<ForecastProposalRun[], AxiosError> {
  return useQuery({
    queryKey: [...FORECAST_PROPOSAL_KEY, filter],
    queryFn: () => getForecastProposals(filter),
    staleTime: AI_STALE_TIME,
  })
}

/**
 * Approve a proposal into a draft purchase order.
 * Invalidates the proposals query cache on success.
 * @returns Mutation result for approval action
 */
export function useApproveForecastProposal(): UseMutationResult<ForecastProposalRun, AxiosError, number> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (proposalId: number) => approveForecastProposal(proposalId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FORECAST_PROPOSAL_KEY })
    },
  })
}

/** Arguments for the reject mutation. */
export interface RejectProposalArgs {
  proposalId: number
  reason?: string
}

/**
 * Reject a proposal with an optional reason.
 * Invalidates the proposals query cache on success.
 * @returns Mutation result for rejection action
 */
export function useRejectForecastProposal(): UseMutationResult<ForecastProposalRun, AxiosError, RejectProposalArgs> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ proposalId, reason }: RejectProposalArgs) => rejectForecastProposal(proposalId, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FORECAST_PROPOSAL_KEY })
    },
  })
}
