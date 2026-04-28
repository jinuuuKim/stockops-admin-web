/**
 * API client functions for report endpoints.
 * Provides data fetching for inventory turnover, ABC/XYZ analysis,
 * and the ABC-XYZ matrix.
 *
 * @author StockOps Team
 * @since 2.0
 */

import api from '@/lib/api'
import type {
  InventoryTurnoverReportResponse,
  AbcAnalysisReportResponse,
  XyzAnalysisReportResponse,
  AbcXyzMatrixReportResponse,
} from '@/types/analytics'

function buildReportParams(params: Record<string, string | number | undefined>): Record<string, string | number> {
  const result: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      result[key] = value
    }
  }
  return result
}

export async function getInventoryTurnoverReport(
  startDate?: string,
  endDate?: string,
  centerId?: number,
): Promise<InventoryTurnoverReportResponse> {
  const response = await api.get<InventoryTurnoverReportResponse>('/v1/reports/inventory-turnover', {
    params: buildReportParams({ startDate, endDate, centerId }),
  })
  return response.data
}

export async function getAbcAnalysisReport(centerId?: number): Promise<AbcAnalysisReportResponse> {
  const response = await api.get<AbcAnalysisReportResponse>('/v1/reports/abc-analysis', {
    params: buildReportParams({ centerId }),
  })
  return response.data
}

export async function getXyzAnalysisReport(centerId?: number): Promise<XyzAnalysisReportResponse> {
  const response = await api.get<XyzAnalysisReportResponse>('/v1/reports/xyz-analysis', {
    params: buildReportParams({ centerId }),
  })
  return response.data
}

export async function getAbcXyzMatrixReport(centerId?: number): Promise<AbcXyzMatrixReportResponse> {
  const response = await api.get<AbcXyzMatrixReportResponse>('/v1/reports/abc-xyz-matrix', {
    params: buildReportParams({ centerId }),
  })
  return response.data
}
