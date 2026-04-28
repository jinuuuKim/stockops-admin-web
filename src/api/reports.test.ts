import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  getInventoryTurnoverReport,
  getAbcAnalysisReport,
  getXyzAnalysisReport,
  getAbcXyzMatrixReport,
} from './reports'
import api from '@/lib/api'
import type {
  InventoryTurnoverReportResponse,
  AbcAnalysisReportResponse,
  XyzAnalysisReportResponse,
  AbcXyzMatrixReportResponse,
} from '@/types/analytics'

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('reports API', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('getInventoryTurnoverReport calls correct endpoint with params', async () => {
    const mockResponse: InventoryTurnoverReportResponse = {
      items: [{ productId: 1, productName: 'P1', productBarcode: '123', turnoverRate: 2.5, cogs: 1000, avgInventory: 400 }],
    }
    vi.mocked(api.get).mockResolvedValue({ data: mockResponse })

    const result = await getInventoryTurnoverReport('2024-01-01', '2024-01-31', 1)

    expect(api.get).toHaveBeenCalledWith('/v1/reports/inventory-turnover', {
      params: { startDate: '2024-01-01', endDate: '2024-01-31', centerId: 1 },
    })
    expect(result).toEqual(mockResponse)
  })

  it('getInventoryTurnoverReport strips undefined params', async () => {
    const mockResponse: InventoryTurnoverReportResponse = { items: [] }
    vi.mocked(api.get).mockResolvedValue({ data: mockResponse })

    await getInventoryTurnoverReport('2024-01-01', '2024-01-31')

    expect(api.get).toHaveBeenCalledWith('/v1/reports/inventory-turnover', {
      params: { startDate: '2024-01-01', endDate: '2024-01-31' },
    })
  })

  it('getAbcAnalysisReport calls correct endpoint', async () => {
    const mockResponse: AbcAnalysisReportResponse = {
      items: [{ productId: 1, productName: 'P1', revenue: 5000, revenuePercentage: 50, cumulativePercentage: 50, class: 'A' }],
    }
    vi.mocked(api.get).mockResolvedValue({ data: mockResponse })

    const result = await getAbcAnalysisReport(1)

    expect(api.get).toHaveBeenCalledWith('/v1/reports/abc-analysis', {
      params: { centerId: 1 },
    })
    expect(result).toEqual(mockResponse)
  })

  it('getAbcAnalysisReport without centerId sends empty params', async () => {
    const mockResponse: AbcAnalysisReportResponse = { items: [] }
    vi.mocked(api.get).mockResolvedValue({ data: mockResponse })

    await getAbcAnalysisReport()

    expect(api.get).toHaveBeenCalledWith('/v1/reports/abc-analysis', {
      params: {},
    })
  })

  it('getXyzAnalysisReport calls correct endpoint', async () => {
    const mockResponse: XyzAnalysisReportResponse = {
      items: [{ productId: 1, productName: 'P1', coefficientOfVariation: 0.5, class: 'X' }],
    }
    vi.mocked(api.get).mockResolvedValue({ data: mockResponse })

    const result = await getXyzAnalysisReport(2)

    expect(api.get).toHaveBeenCalledWith('/v1/reports/xyz-analysis', {
      params: { centerId: 2 },
    })
    expect(result).toEqual(mockResponse)
  })

  it('getAbcXyzMatrixReport calls correct endpoint', async () => {
    const mockResponse: AbcXyzMatrixReportResponse = {
      cells: [{ abcClass: 'A', xyzClass: 'X', productCount: 5, products: [{ productId: 1, productName: 'P1' }] }],
    }
    vi.mocked(api.get).mockResolvedValue({ data: mockResponse })

    const result = await getAbcXyzMatrixReport()

    expect(api.get).toHaveBeenCalledWith('/v1/reports/abc-xyz-matrix', {
      params: {},
    })
    expect(result).toEqual(mockResponse)
  })

  it('propagates API errors', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Server error'))

    await expect(getInventoryTurnoverReport('2024-01-01', '2024-01-31')).rejects.toThrow('Server error')
  })
})
