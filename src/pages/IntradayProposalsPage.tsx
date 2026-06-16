/**
 * Intraday forecast proposals workspace page.
 * Displays per-slot reorder proposals produced through the day from live inventory/demand,
 * with approve (into a draft purchase order) and reject actions within the actionable window.
 *
 * @author StockOps Team
 * @since 2.4
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuthStore } from '@/stores/authStore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import {
  useForecastProposals,
  useApproveForecastProposal,
  useRejectForecastProposal,
} from '@/hooks/useForecastProposal'
import type { ForecastProposalRun, ForecastProposalStatus } from '@/types/forecastProposal'
import { showToast } from '@/lib/toast'
import api from '@/lib/api'
import { AxiosError } from 'axios'
import {
  TrendingUp,
  CheckCircle2,
  Ban,
  Clock,
  RefreshCw,
  Filter,
  ShoppingCart,
  XCircle,
} from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'

interface CenterOption {
  id: number
  code: string
  name: string
}

interface WarehouseOption {
  id: number
  code: string
  name: string
  centerId: number
}

const STATUS_CONFIG: Record<ForecastProposalStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PROPOSED: { label: '제안', color: 'bg-amber-100 text-amber-700', icon: TrendingUp },
  APPROVED_TO_DRAFT: { label: '승인 완료', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  REJECTED: { label: '거부', color: 'bg-red-100 text-red-700', icon: XCircle },
  EXPIRED: { label: '만료', color: 'bg-neutral-100 text-neutral-600', icon: Clock },
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return '-'
  return value.toLocaleString('ko-KR')
}

function formatDecimal(value: number | null | undefined, decimals = 2): string {
  if (value == null) return '-'
  return value.toFixed(decimals)
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('ko-KR')
}

function conflictMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && error.response?.status === 409) {
    return '이미 처리되었거나 액션 기한이 지난 제안입니다. 새로고침 후 다시 시도하세요.'
  }
  return fallback
}

export function IntradayProposalsPage() {
  const user = useAuthStore((s) => s.user)
  const isOnline = useOnlineStatus()
  const scopeMetadata = user?.scopeMetadata

  const [centerId, setCenterId] = useState<number | undefined>(undefined)
  const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined)
  const [centers, setCenters] = useState<CenterOption[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([])
  const [actingId, setActingId] = useState<number | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ForecastProposalRun | null>(null)

  const filter = { centerId, warehouseId }
  const proposalsQuery = useForecastProposals(filter)
  const approveMutation = useApproveForecastProposal()
  const rejectMutation = useRejectForecastProposal()

  useEffect(() => {
    async function loadFilters() {
      try {
        const [centersRes, warehousesRes] = await Promise.all([
          api.get<CenterOption[]>('/v1/centers'),
          api.get<WarehouseOption[]>('/v1/warehouses'),
        ])
        setCenters(centersRes.data)
        setWarehouses(warehousesRes.data)
      } catch {
        // Filter data will remain empty
      }
    }
    loadFilters()
  }, [])

  useEffect(() => {
    if (scopeMetadata && !scopeMetadata.global) {
      /* eslint-disable react-hooks/set-state-in-effect -- applies server-provided single-scope defaults to the filter controls. */
      if (scopeMetadata.centerIds.length === 1) {
        setCenterId(scopeMetadata.centerIds[0])
      }
      if (scopeMetadata.warehouseIds.length === 1) {
        setWarehouseId(scopeMetadata.warehouseIds[0])
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [scopeMetadata])

  const scopedCenters = scopeMetadata?.global
    ? centers
    : centers.filter((c) => scopeMetadata?.centerIds.includes(c.id) ?? false)

  const scopedWarehouses = centerId
    ? warehouses.filter((w) => w.centerId === centerId)
    : warehouses

  const filteredWarehouses = scopeMetadata?.global
    ? scopedWarehouses
    : scopedWarehouses.filter((w) => scopeMetadata?.warehouseIds.includes(w.id) ?? false)

  const handleCenterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setCenterId(value ? Number(value) : undefined)
    setWarehouseId(undefined)
  }, [])

  const handleWarehouseChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setWarehouseId(value ? Number(value) : undefined)
  }, [])

  const handleApprove = useCallback(async (proposalId: number) => {
    setActingId(proposalId)
    try {
      await approveMutation.mutateAsync(proposalId)
      showToast({ message: '발주 초안이 생성되었습니다.', variant: 'success' })
    } catch (error) {
      showToast({ message: conflictMessage(error, '승인에 실패했습니다.'), variant: 'error' })
    } finally {
      setActingId(null)
    }
  }, [approveMutation])

  const handleReject = useCallback(async (proposalId: number, reason: string) => {
    setActingId(proposalId)
    try {
      await rejectMutation.mutateAsync({ proposalId, reason: reason.trim() || undefined })
      showToast({ message: '제안을 거부했습니다.', variant: 'success' })
      setRejectTarget(null)
    } catch (error) {
      showToast({ message: conflictMessage(error, '거부에 실패했습니다.'), variant: 'error' })
    } finally {
      setActingId(null)
    }
  }, [rejectMutation])

  const proposals = proposalsQuery.data ?? []

  const proposedCount = proposals.filter((p) => p.status === 'PROPOSED').length
  const approvedCount = proposals.filter((p) => p.status === 'APPROVED_TO_DRAFT').length
  const rejectedCount = proposals.filter((p) => p.status === 'REJECTED').length
  const expiredCount = proposals.filter((p) => p.status === 'EXPIRED').length

  return (
    <div className="space-y-6" data-testid="intraday-proposals-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">인트라데이 예측 제안</h1>
          <p className="text-text-secondary mt-1">
            하루 중 시점별로 생성된 발주 제안을 확인하고 승인 또는 거부하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => proposalsQuery.refetch()}
            disabled={proposalsQuery.isLoading || !isOnline}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
            data-testid="intraday-refresh"
          >
            <RefreshCw className={`w-4 h-4 ${proposalsQuery.isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200" data-testid="intraday-filters">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-text-secondary" />
          <h2 className="text-sm font-semibold text-text-primary">필터</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="intraday-center-filter" className="block text-xs font-medium text-text-secondary mb-1">센터</label>
            <select
              id="intraday-center-filter"
              value={centerId ?? ''}
              onChange={handleCenterChange}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              data-testid="intraday-center-filter"
            >
              <option value="">전체 센터</option>
              {scopedCenters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="intraday-warehouse-filter" className="block text-xs font-medium text-text-secondary mb-1">창고</label>
            <select
              id="intraday-warehouse-filter"
              value={warehouseId ?? ''}
              onChange={handleWarehouseChange}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              data-testid="intraday-warehouse-filter"
            >
              <option value="">전체 창고</option>
              {filteredWarehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="intraday-summary-cards">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-xs font-medium text-text-secondary mb-1">제안</h3>
          <p className="text-2xl font-bold text-amber-600" data-testid="intraday-proposed-count">{proposedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-xs font-medium text-text-secondary mb-1">승인 완료</h3>
          <p className="text-2xl font-bold text-emerald-600" data-testid="intraday-approved-count">{approvedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-xs font-medium text-text-secondary mb-1">거부</h3>
          <p className="text-2xl font-bold text-red-600" data-testid="intraday-rejected-count">{rejectedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-xs font-medium text-text-secondary mb-1">만료</h3>
          <p className="text-2xl font-bold text-neutral-600" data-testid="intraday-expired-count">{expiredCount}</p>
        </div>
      </div>

      {/* Loading State */}
      {proposalsQuery.isLoading && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 animate-pulse" data-testid="intraday-loading">
          <div className="space-y-4">
            <div className="h-6 bg-neutral-200 rounded w-1/3" />
            <div className="h-4 bg-neutral-200 rounded w-2/3" />
            <div className="h-40 bg-neutral-100 rounded" />
          </div>
        </div>
      )}

      {/* Error State */}
      {proposalsQuery.error && (
        <EmptyState
          title="제안 데이터를 불러오지 못했습니다"
          description="필터를 변경하거나 다시 시도해주세요."
          variant="error"
          actionLabel="다시 시도"
          onAction={() => proposalsQuery.refetch()}
        />
      )}

      {/* Empty State */}
      {!proposalsQuery.isLoading && !proposalsQuery.error && proposals.length === 0 && (
        <EmptyState
          title="제안 데이터가 없습니다"
          description="센터/창고 필터를 변경하거나, 인트라데이 스케줄러가 실행될 때까지 기다려주세요."
          icon={ShoppingCart}
        />
      )}

      {/* Proposal Table */}
      {!proposalsQuery.isLoading && !proposalsQuery.error && proposals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden" data-testid="intraday-proposal-table">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">상태</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">슬롯</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">상품</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">현재고</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">안전재고</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">추천 발주량</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">가중 일평균</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">기한</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {proposals.map((proposal) => (
                  <ProposalRow
                    key={proposal.id}
                    proposal={proposal}
                    isActing={actingId === proposal.id}
                    isOnline={isOnline}
                    onApprove={handleApprove}
                    onRejectClick={setRejectTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rejectTarget && (
        <RejectProposalDialog
          proposal={rejectTarget}
          isSubmitting={actingId === rejectTarget.id}
          onCancel={() => setRejectTarget(null)}
          onConfirm={(reason) => handleReject(rejectTarget.id, reason)}
        />
      )}
    </div>
  )
}

interface ProposalRowProps {
  proposal: ForecastProposalRun
  isActing: boolean
  isOnline: boolean
  onApprove: (id: number) => void
  onRejectClick: (proposal: ForecastProposalRun) => void
}

function ProposalRow({ proposal, isActing, isOnline, onApprove, onRejectClick }: ProposalRowProps) {
  const statusConfig = STATUS_CONFIG[proposal.status]
  const StatusIcon = statusConfig.icon
  const canAct = proposal.status === 'PROPOSED' && proposal.actionable

  return (
    <tr className="hover:bg-neutral-50" data-testid={`intraday-proposal-row-${proposal.id}`}>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}>
          <StatusIcon className="w-3 h-3" />
          {statusConfig.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-mono" data-testid={`intraday-slot-${proposal.id}`}>
        {String(proposal.runSlot).padStart(2, '0')}시
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-text-primary" data-testid={`intraday-product-${proposal.id}`}>
          {proposal.productName ?? `상품 #${proposal.productId}`}
        </div>
        {proposal.productBarcode && (
          <div className="text-xs text-text-light">{proposal.productBarcode}</div>
        )}
      </td>
      <td className="px-4 py-3 text-right font-mono" data-testid={`intraday-stock-${proposal.id}`}>
        {formatNumber(proposal.currentStockQuantity)}
      </td>
      <td className="px-4 py-3 text-right font-mono" data-testid={`intraday-safety-${proposal.id}`}>
        {formatNumber(proposal.safetyStockQuantity)}
      </td>
      <td className="px-4 py-3 text-right font-mono font-semibold" data-testid={`intraday-quantity-${proposal.id}`}>
        {formatNumber(proposal.recommendedQuantity)}
      </td>
      <td className="px-4 py-3 text-right font-mono" data-testid={`intraday-weighted-${proposal.id}`}>
        {formatDecimal(proposal.weightedDailyDemand)}
      </td>
      <td className="px-4 py-3 text-xs text-text-secondary" data-testid={`intraday-until-${proposal.id}`}>
        {formatDateTime(proposal.actionableUntil)}
      </td>
      <td className="px-4 py-3" data-testid={`intraday-actions-${proposal.id}`}>
        {canAct ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onApprove(proposal.id)}
              disabled={isActing || !isOnline}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              data-testid={`intraday-approve-btn-${proposal.id}`}
              title={!isOnline ? '오프라인에서는 승인할 수 없습니다.' : undefined}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {isActing ? '처리 중...' : '발주 승인'}
            </button>
            <button
              type="button"
              onClick={() => onRejectClick(proposal)}
              disabled={isActing || !isOnline}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-neutral-200 text-text-secondary rounded-lg hover:bg-neutral-50 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              data-testid={`intraday-reject-btn-${proposal.id}`}
            >
              <Ban className="w-3.5 h-3.5" />
              거부
            </button>
          </div>
        ) : proposal.status === 'APPROVED_TO_DRAFT' && proposal.approvedPurchaseOrderNumber ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700" data-testid={`intraday-po-link-${proposal.id}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>발주 {proposal.approvedPurchaseOrderNumber}</span>
          </div>
        ) : (
          <span className="text-xs text-text-light" data-testid={`intraday-noaction-${proposal.id}`}>
            {proposal.status === 'PROPOSED' ? '기한 만료' : '-'}
          </span>
        )}
      </td>
    </tr>
  )
}

interface RejectProposalDialogProps {
  proposal: ForecastProposalRun
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

function RejectProposalDialog({ proposal, isSubmitting, onCancel, onConfirm }: RejectProposalDialogProps) {
  const [reason, setReason] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intraday-reject-title"
      data-testid="intraday-reject-dialog"
    >
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-neutral-200">
        <div className="p-5 border-b border-neutral-100">
          <h2 id="intraday-reject-title" className="text-lg font-semibold text-text-primary">제안 거부</h2>
          <p className="text-sm text-text-secondary mt-1">
            {proposal.productName ?? `상품 #${proposal.productId}`} ({String(proposal.runSlot).padStart(2, '0')}시 슬롯) 제안을 거부합니다.
          </p>
        </div>
        <div className="p-5">
          <label htmlFor="intraday-reject-reason" className="block text-xs font-medium text-text-secondary mb-1">
            거부 사유 (선택)
          </label>
          <textarea
            id="intraday-reject-reason"
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="예: 현재 재고로 충분합니다"
            data-testid="intraday-reject-reason"
          />
        </div>
        <div className="p-5 border-t border-neutral-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-70"
            data-testid="intraday-reject-cancel"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
            data-testid="intraday-reject-confirm"
          >
            <Ban className="w-3.5 h-3.5" />
            {isSubmitting ? '처리 중...' : '거부'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default IntradayProposalsPage
