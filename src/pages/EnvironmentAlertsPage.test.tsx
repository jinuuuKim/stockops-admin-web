import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EnvironmentAlertsPage } from './EnvironmentAlertsPage'
import type { SensorAlert } from '@/types/environment'

const mutate = vi.fn()

const activeAlert: SensorAlert = {
  id: 1,
  sensorId: 10,
  sensorName: '냉장고 A 온도센서',
  alertType: 'temperature',
  severity: 'CRITICAL',
  message: '냉장고 A 온도센서: 12.5C (CRITICAL)',
  acknowledged: false,
  acknowledgedAt: null,
  acknowledgedBy: null,
  acknowledgementNote: null,
  resolvedAt: null,
  createdAt: '2026-06-10T00:00:00.000Z',
}

const handledAlert: SensorAlert = {
  ...activeAlert,
  id: 2,
  sensorName: '창고 B 습도센서',
  severity: 'WARNING',
  acknowledged: true,
  acknowledgedAt: '2026-06-09T00:00:00.000Z',
  acknowledgedBy: 'admin@stockops.local',
  acknowledgementNote: '환기 조치 완료',
  createdAt: '2026-06-09T00:00:00.000Z',
}

vi.mock('@/hooks/useEnvironment', () => ({
  useEnvironmentAlerts: () => ({ data: [activeAlert, handledAlert], isLoading: false, isError: false }),
  useAcknowledgeEnvironmentAlert: () => ({ mutate, isPending: false, isError: false }),
}))

describe('EnvironmentAlertsPage', () => {
  it('lists active and handled alerts and acknowledges with a handling note', () => {
    render(<EnvironmentAlertsPage />)

    expect(screen.getByRole('heading', { name: '환경 알림 처리' })).toBeInTheDocument()
    expect(screen.getByText('처리 필요 (1)')).toBeInTheDocument()
    expect(screen.getByText('처리 내역 (1)')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /알림 선택: 냉장고 A 온도센서/ }))

    fireEvent.change(screen.getByLabelText('처리내용'), { target: { value: '센서 교체 완료' } })
    fireEvent.click(screen.getByRole('button', { name: '처리 완료' }))

    expect(mutate).toHaveBeenCalledWith(
      { id: 1, note: '센서 교체 완료' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })
})
