/**
 * AiOpsSummaryPanel component tests.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AiOpsSummaryPanel } from './AiOpsSummaryPanel'
import * as aiOpsSummaryApi from '@/api/aiOpsSummary'
import type { AiOpsSummaryResponse } from '@/types/aiOpsSummary'

vi.mock('@/api/aiOpsSummary')

const fetchMock = vi.mocked(aiOpsSummaryApi.fetchOpsSummary)

function sampleSummary(overrides: Partial<AiOpsSummaryResponse> = {}): AiOpsSummaryResponse {
  return {
    businessDate: '2026-06-10',
    centerId: 1,
    warehouseId: 1,
    summary: '운영 위험이 높습니다. 즉시 발주가 필요합니다.',
    urgentItems: ['상품 A 재고 부족 — 즉시 발주 권장'],
    recommendedActions: ['상품 A 50개 즉시 발주', '센서 점검 예약'],
    riskLevel: 'HIGH',
    generatedAt: '2026-06-10T08:00:00Z',
    sourceCounts: {
      recommendations: 3,
      sensorAlerts: 2,
      criticalExpiry: 1,
      warningExpiry: 0,
      overdueShipments: 1,
    },
    confidenceCaveat: '추천 3건, 센서 알림 2건, 만료 경보 1건, 지연 PO 1건을 기반으로 생성되었습니다.',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AiOpsSummaryPanel', () => {
  it('renders the "AI 운영 요약 보기" button initially', () => {
    render(<AiOpsSummaryPanel businessDate="2026-06-10" />)
    expect(screen.getByRole('button', { name: 'AI 운영 요약 보기' })).toBeInTheDocument()
  })

  it('shows loading state while fetching', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {})) // never resolves
    render(<AiOpsSummaryPanel businessDate="2026-06-10" centerId={1} />)

    fireEvent.click(screen.getByRole('button', { name: 'AI 운영 요약 보기' }))

    expect(await screen.findByText('분석 중...')).toBeInTheDocument()
  })

  it('shows summary text after successful fetch', async () => {
    fetchMock.mockResolvedValueOnce(sampleSummary())
    render(<AiOpsSummaryPanel businessDate="2026-06-10" centerId={1} warehouseId={1} />)

    fireEvent.click(screen.getByRole('button', { name: 'AI 운영 요약 보기' }))

    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'AI 운영 요약' })).toBeInTheDocument()
    )
    expect(screen.getByText(/즉시 발주가 필요합니다/)).toBeInTheDocument()
  })

  it('displays risk level badge', async () => {
    fetchMock.mockResolvedValueOnce(sampleSummary({ riskLevel: 'HIGH' }))
    render(<AiOpsSummaryPanel businessDate="2026-06-10" />)

    fireEvent.click(screen.getByRole('button', { name: 'AI 운영 요약 보기' }))

    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'AI 운영 요약' })).toBeInTheDocument()
    )
    expect(screen.getByLabelText('위험도: 높음')).toBeInTheDocument()
  })

  it('shows urgent items and recommended actions', async () => {
    fetchMock.mockResolvedValueOnce(sampleSummary())
    render(<AiOpsSummaryPanel businessDate="2026-06-10" />)

    fireEvent.click(screen.getByRole('button', { name: 'AI 운영 요약 보기' }))

    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'AI 운영 요약' })).toBeInTheDocument()
    )
    expect(screen.getByRole('list', { name: '긴급 항목' })).toBeInTheDocument()
    expect(screen.getByText(/즉시 발주 권장/)).toBeInTheDocument()
    expect(screen.getByRole('list', { name: '권장 조치' })).toBeInTheDocument()
    expect(screen.getByText(/상품 A 50개/)).toBeInTheDocument()
  })

  it('renders source counts chips (§5.4)', async () => {
    fetchMock.mockResolvedValueOnce(sampleSummary())
    render(<AiOpsSummaryPanel businessDate="2026-06-10" />)

    fireEvent.click(screen.getByRole('button', { name: 'AI 운영 요약 보기' }))

    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'AI 운영 요약' })).toBeInTheDocument()
    )
    const sourceSection = screen.getByLabelText('데이터 출처')
    expect(sourceSection).toBeInTheDocument()
    expect(sourceSection.textContent).toContain('추천')
    expect(sourceSection.textContent).toContain('지연 PO')
  })

  it('reveals confidence caveat when info button clicked', async () => {
    fetchMock.mockResolvedValueOnce(sampleSummary())
    render(<AiOpsSummaryPanel businessDate="2026-06-10" />)

    fireEvent.click(screen.getByRole('button', { name: 'AI 운영 요약 보기' }))

    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'AI 운영 요약' })).toBeInTheDocument()
    )

    // Caveat hidden initially
    expect(screen.queryByLabelText('신뢰도 안내 내용')).not.toBeInTheDocument()

    // Click caveat toggle
    fireEvent.click(screen.getByRole('button', { name: '신뢰도 안내' }))
    expect(await screen.findByLabelText('신뢰도 안내 내용')).toBeInTheDocument()
    expect(screen.getByLabelText('신뢰도 안내 내용')).toHaveTextContent(
      '추천 3건, 센서 알림 2건'
    )
  })

  it('shows error message when fetch fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'))
    render(<AiOpsSummaryPanel businessDate="2026-06-10" />)

    fireEvent.click(screen.getByRole('button', { name: 'AI 운영 요약 보기' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent('AI 운영 요약을 불러오지 못했습니다')
  })

  it('does not re-fetch if summary is already loaded', async () => {
    fetchMock.mockResolvedValueOnce(sampleSummary())
    render(<AiOpsSummaryPanel businessDate="2026-06-10" />)

    // First click: fetches
    fireEvent.click(screen.getByRole('button', { name: 'AI 운영 요약 보기' }))
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'AI 운영 요약' })).toBeInTheDocument()
    )

    // Close the panel
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'AI 운영 요약' })).not.toBeInTheDocument()
    )

    // Reopen: should NOT call fetchMock again
    fireEvent.click(screen.getByRole('button', { name: 'AI 운영 요약 보기' }))
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'AI 운영 요약' })).toBeInTheDocument()
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
