/**
 * React Query hooks for role → webhook channel mapping CRUD.
 *
 * @author StockOps Team
 * @since 2.3
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import api from '@/lib/api'
import type { RoleWebhookConfig, RoleWebhookConfigRequest } from '@/types/roleWebhook'

const QUERY_KEY = ['role-webhook-configs']

export function useRoleWebhookConfigs(): UseQueryResult<RoleWebhookConfig[], AxiosError> {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<RoleWebhookConfig[]>('/v1/role-webhook-configs')
      return Array.isArray(response.data) ? response.data : []
    },
    staleTime: 60_000,
  })
}

export function useCreateRoleWebhookConfig(): UseMutationResult<
  RoleWebhookConfig,
  AxiosError,
  RoleWebhookConfigRequest
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request) => {
      const response = await api.post<RoleWebhookConfig>('/v1/role-webhook-configs', request)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateRoleWebhookConfig(): UseMutationResult<
  RoleWebhookConfig,
  AxiosError,
  { id: number; data: RoleWebhookConfigRequest }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put<RoleWebhookConfig>(`/v1/role-webhook-configs/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteRoleWebhookConfig(): UseMutationResult<void, AxiosError, number> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/v1/role-webhook-configs/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
