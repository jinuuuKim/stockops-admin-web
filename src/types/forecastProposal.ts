/**
 * Intraday forecast proposal TypeScript types.
 * Matches backend ForecastProposalRunDTO and ForecastProposalStatus enum.
 *
 * @author StockOps Team
 * @since 2.4
 */

/**
 * Intraday forecast proposal lifecycle states.
 * Matches backend ForecastProposalStatus enum.
 */
export type ForecastProposalStatus =
  | 'PROPOSED'
  | 'APPROVED_TO_DRAFT'
  | 'REJECTED'
  | 'EXPIRED'

/**
 * Intraday forecast proposal response payload.
 * Matches backend ForecastProposalRunDTO record.
 */
export interface ForecastProposalRun {
  /** Proposal identifier */
  id: number
  /** Business date the slot belongs to */
  businessDate: string
  /** Scheduled hour-of-day the run belongs to (e.g. 10, 15) */
  runSlot: number
  /** Instant the run started */
  runAt: string
  /** Instant after which the proposal is history-only */
  actionableUntil: string
  /** Whether the proposal can still be approved/rejected */
  actionable: boolean
  /** Product identifier */
  productId: number
  /** Product display name */
  productName: string | null
  /** Product barcode */
  productBarcode: string | null
  /** Center identifier */
  centerId: number
  /** Warehouse identifier */
  warehouseId: number
  /** Proposal lifecycle state */
  status: ForecastProposalStatus
  /** Live available stock used by the proposal */
  currentStockQuantity: number
  /** Product safety stock threshold */
  safetyStockQuantity: number
  /** Recommended reorder quantity */
  recommendedQuantity: number
  /** Forecasted demand for the next seven days */
  sevenDayForecastQuantity: number
  /** Expected lead time in days */
  leadTimeDays: number
  /** Forecasted demand during lead time */
  leadTimeDemandQuantity: number
  /** Trailing seven-day average demand */
  trailingSevenDayAverage: number
  /** Same-weekday lookback average demand */
  sameWeekdayAverage: number
  /** Weighted daily demand estimate */
  weightedDailyDemand: number
  /** Confirmed outbound event count used by the forecast */
  demandEventCount: number
  /** Forecast model identifier that produced this proposal */
  modelVersion: string | null
  /** Deterministic explanation string */
  explanationSummary: string | null
  /** Linked draft purchase-order id after approval */
  approvedPurchaseOrderId: number | null
  /** Linked draft purchase-order number after approval */
  approvedPurchaseOrderNumber: string | null
  /** Approval timestamp */
  approvedAt: string | null
  /** Approving user id */
  approvedByUserId: number | null
  /** Rejection timestamp */
  rejectedAt: string | null
  /** Rejecting user id */
  rejectedByUserId: number | null
  /** Rejection reason */
  rejectionReason: string | null
  /** Creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
}

/**
 * Query filter parameters for intraday forecast proposals.
 */
export interface ForecastProposalFilter {
  /** Optional business date filter (ISO date string) */
  businessDate?: string
  /** Optional center scope filter */
  centerId?: number
  /** Optional warehouse scope filter */
  warehouseId?: number
  /** Optional product filter */
  productId?: number
}
