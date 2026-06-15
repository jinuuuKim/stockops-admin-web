import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRecentSensorReadings } from './useEnvironment'
import * as environmentApi from '@/api/environment'
import type { RecentSensorReadingsResponse } from '@/types/environment'

vi.mock('@/api/environment', () => ({
  createController: vi.fn(),
  createSensor: vi.fn(),
  acknowledgeEnvironmentAlert: vi.fn(),
  deleteController: vi.fn(),
  deleteSensor: vi.fn(),
  getControllerByExternalIds: vi.fn(),
  getControllerById: vi.fn(),
  getControllers: vi.fn(),
  getEnvironmentAlerts: vi.fn(),
  getEnvironmentDashboard: vi.fn(),
  getRecentSensorReadings: vi.fn(),
  getSensorByExternalIds: vi.fn(),
  getSensorById: vi.fn(),
  getSensors: vi.fn(),
  reactivateController: vi.fn(),
  reactivateSensor: vi.fn(),
  updateController: vi.fn(),
  updateSensor: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useRecentSensorReadings', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('fetches recent readings for the selected sensor', async () => {
    const mockResponse: RecentSensorReadingsResponse = {
      sensorId: 12,
      windowMinutes: 10,
      readings: [
        {
          value: 23.4,
          valueKind: 'temperature',
          unit: 'C',
          status: 'NORMAL',
          recordedAt: '2026-06-11T09:15:30Z',
          sequenceId: 184,
        },
      ],
    }
    vi.mocked(environmentApi.getRecentSensorReadings).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useRecentSensorReadings(12), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockResponse)
    expect(environmentApi.getRecentSensorReadings).toHaveBeenCalledWith(12, 10)
  })

  it('does not fetch when no sensor is selected', () => {
    const { result } = renderHook(() => useRecentSensorReadings(null), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(environmentApi.getRecentSensorReadings).not.toHaveBeenCalled()
  })

  it('returns error state on API failure', async () => {
    vi.mocked(environmentApi.getRecentSensorReadings).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useRecentSensorReadings(12), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
  })
})
