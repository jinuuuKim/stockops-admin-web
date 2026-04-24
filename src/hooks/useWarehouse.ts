/**
 * React Query hooks for warehouse data fetching.
 *
 * @author StockOps Team
 * @since 2.0
 */

import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import api from '@/lib/api'

/**
 * Warehouse response from API.
 */
export interface Warehouse {
  id: number
  code: string
  name: string
  address?: string
  phone?: string
  status?: string
}

/**
 * Fetches all warehouses.
 *
 * @returns React Query result with warehouse array
 * @example
 * const { data: warehouses, isLoading } = useWarehouses()
 */
export function useWarehouses(): UseQueryResult<Warehouse[], AxiosError> {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get<Warehouse[]>('/v1/warehouses')
      return response.data
    },
  })
}

/**
 * Fetches warehouses belonging to a specific center.
 *
 * @param centerId - Center identifier
 * @returns React Query result with warehouse array
 * @example
 * const { data: warehouses } = useWarehousesByCenter(1)
 */
export function useWarehousesByCenter(centerId: number | null): UseQueryResult<Warehouse[], AxiosError> {
  return useQuery({
    queryKey: ['warehouses', 'center', centerId],
    queryFn: async () => {
      if (!centerId) throw new Error('Center ID is required')
      const response = await api.get<Warehouse[]>(`/v1/warehouses/center/${centerId}`)
      return response.data
    },
    enabled: centerId !== null,
  })
}
