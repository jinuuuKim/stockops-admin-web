import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { IntradayProposalsPage } from './IntradayProposalsPage'
import { useAuthStore } from '@/stores/authStore'
import type { AuthenticatedUser } from '@/types/auth'
import type { ForecastProposalRun } from '@/types/forecastProposal'

vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(() => true),
}))

vi.mock('@/hooks/useForecastProposal', () => ({
  useForecastProposals: vi.fn(),
  useApproveForecastProposal: vi.fn(),
  useRejectForecastProposal: vi.fn(),
}))

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: [] })) },
}))

import {
  useForecastProposals,
  useApproveForecastProposal,
  useRejectForecastProposal,
} from '@/hooks/useForecastProposal'

function buildAuthUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 99,
    email: 'admin@stockops.test',
    name: 'Admin',
    role: 'ADMIN',
    permissions: ['AI_RECOMMENDATION_APPROVE'],
    scopeMetadata: { global: true, assignments: [], centerIds: [], warehouseIds: [] },
    ...overrides,
  } as AuthenticatedUser
}

function buildProposal(overrides: Partial<ForecastProposalRun> = {}): ForecastProposalRun {
  return {
    id: 1,
    businessDate: '2026-06-16',
    runSlot: 10,
    runAt: '2026-06-16T01:00:00Z',
    actionableUntil: '2026-06-19T01:00:00Z',
    actionable: true,
    productId: 42,
    productName: '우유',
    productBarcode: 'BC-42',
    centerId: 1,
    warehouseId: 2,
    status: 'PROPOSED',
    currentStockQuantity: 10,
    safetyStockQuantity: 50,
    recommendedQuantity: 45,
    sevenDayForecastQuantity: 35,
    leadTimeDays: 1,
    leadTimeDemandQuantity: 5,
    trailingSevenDayAverage: 5,
    sameWeekdayAverage: 5,
    weightedDailyDemand: 5,
    demandEventCount: 28,
    modelVersion: 'statistical',
    explanationSummary: 'forecast summary',
    approvedPurchaseOrderId: null,
    approvedPurchaseOrderNumber: null,
    approvedAt: null,
    approvedByUserId: null,
    rejectedAt: null,
    rejectedByUserId: null,
    rejectionReason: null,
    createdAt: '2026-06-16T01:00:00Z',
    updatedAt: '2026-06-16T01:00:00Z',
    ...overrides,
  }
}

function mockQuery(proposals: ForecastProposalRun[]) {
  vi.mocked(useForecastProposals).mockReturnValue({
    data: proposals,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as never)
}

const approveMutation = { mutateAsync: vi.fn() }
const rejectMutation = { mutateAsync: vi.fn() }

describe('IntradayProposalsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: 'test-token', user: buildAuthUser(), isRestoring: false, hasTriedRestore: true })
    vi.mocked(useApproveForecastProposal).mockReturnValue(approveMutation as never)
    vi.mocked(useRejectForecastProposal).mockReturnValue(rejectMutation as never)
  })

  it('renders an open proposal with approve and reject controls', async () => {
    mockQuery([buildProposal()])
    render(<IntradayProposalsPage />)
    await screen.findByTestId('intraday-proposals-page')

    expect(screen.getByTestId('intraday-proposal-row-1')).toBeInTheDocument()
    expect(screen.getByTestId('intraday-product-1')).toHaveTextContent('우유')
    expect(screen.getByTestId('intraday-slot-1')).toHaveTextContent('10시')
    expect(screen.getByTestId('intraday-quantity-1')).toHaveTextContent('45')
    expect(screen.getByTestId('intraday-approve-btn-1')).toBeInTheDocument()
    expect(screen.getByTestId('intraday-reject-btn-1')).toBeInTheDocument()
  })

  it('approves a proposal', async () => {
    approveMutation.mutateAsync.mockResolvedValue(buildProposal({ status: 'APPROVED_TO_DRAFT' }))
    mockQuery([buildProposal()])
    render(<IntradayProposalsPage />)
    await screen.findByTestId('intraday-proposals-page')

    fireEvent.click(screen.getByTestId('intraday-approve-btn-1'))

    await waitFor(() => expect(approveMutation.mutateAsync).toHaveBeenCalledWith(1))
  })

  it('rejects a proposal with a reason via the dialog', async () => {
    rejectMutation.mutateAsync.mockResolvedValue(buildProposal({ status: 'REJECTED' }))
    mockQuery([buildProposal()])
    render(<IntradayProposalsPage />)
    await screen.findByTestId('intraday-proposals-page')

    fireEvent.click(screen.getByTestId('intraday-reject-btn-1'))
    expect(screen.getByTestId('intraday-reject-dialog')).toBeInTheDocument()

    fireEvent.change(screen.getByTestId('intraday-reject-reason'), { target: { value: '재고 충분' } })
    fireEvent.click(screen.getByTestId('intraday-reject-confirm'))

    await waitFor(() =>
      expect(rejectMutation.mutateAsync).toHaveBeenCalledWith({ proposalId: 1, reason: '재고 충분' })
    )
  })

  it('shows no action controls for a past-window proposal', async () => {
    mockQuery([buildProposal({ actionable: false })])
    render(<IntradayProposalsPage />)
    await screen.findByTestId('intraday-proposals-page')

    expect(screen.queryByTestId('intraday-approve-btn-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('intraday-noaction-1')).toHaveTextContent('기한 만료')
  })
})
