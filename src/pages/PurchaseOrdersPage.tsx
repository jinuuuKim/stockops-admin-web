/**
 * Purchase Orders management page.
 * Provides PO request, acceptance, shipment, and inbound workflow.
 *
 * @author StockOps Team
 * @since 2.0
 */

import { useEffect, useMemo, useState } from 'react'
import type { ComponentType, FormEvent } from 'react'
import axios from 'axios'
import api from '@/lib/api'
import { CheckCircle2, Clock3, Download, Eye, PackageCheck, Plus, Send, Truck, Upload, X, XCircle } from 'lucide-react'
import { downloadExcelTemplate } from '@/api/excel'
import { ExcelUploadModal } from '@/components/common/ExcelUploadModal'
import { EmptyState } from '@/components/common/EmptyState'
import { getErrorMessage, showErrorToast } from '@/lib/httpError'

interface Center {
  id: number
  code: string
  name: string
}

interface Warehouse {
  id: number
  code: string
  name: string
}

interface PurchaseOrderShipment {
  id: number
  shipmentNumber?: string
  carrier?: string
  trackingNumber?: string
  createdAt?: string
  shippedAt?: string
}

interface PurchaseOrder {
  id: number
  poNumber: string
  status: PurchaseOrderStatus | string
  supplierName?: string
  requestedAt?: string
  erpRespondedAt?: string
  createdAt?: string
  updatedAt?: string
  cancelReason?: string
  erpReference?: string
  totalRequestedAmount?: number
  requestingCenter?: Center
  targetWarehouse?: Warehouse
  items?: PurchaseOrderItem[]
  shipments?: PurchaseOrderShipment[]
}

interface PurchaseOrderItem {
  id: number
  productId: number
  requestedQuantity: number
  acceptedQuantity?: number
  cancelledQuantity?: number
}

interface ActionDefinition {
  id: PurchaseOrderAction
  label: string
  icon: ComponentType<{ className?: string }>
  activeClassName: string
  successMessage: string
}

interface StatusHistoryEvent {
  key: string
  status: string
  label: string
  timestamp?: string
  description: string
}

type PurchaseOrderStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'PARTIALLY_ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'SHIPMENT_CREATED'
  | 'INBOUND_PENDING'
  | 'COMPLETED'

type PurchaseOrderAction = 'submit' | 'accept' | 'reject' | 'createShipment' | 'complete'
type DetailTab = 'details' | 'history'

const SUCCESS_TOAST_ID = 'stockops-purchase-order-success-toast'
const SUCCESS_TOAST_DURATION_MS = 4000
const TRANSITION_DISABLED_TOOLTIP = '현재 상태에서 사용할 수 없습니다'

let activeSuccessToastTimeout: number | undefined

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'border-neutral-200 bg-neutral-50 text-neutral-700',
  REQUESTED: 'border-blue-200 bg-blue-50 text-blue-700',
  ACCEPTED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PARTIALLY_ACCEPTED: 'border-amber-200 bg-amber-50 text-amber-700',
  REJECTED: 'border-red-200 bg-red-50 text-red-700',
  CANCELLED: 'border-slate-200 bg-slate-100 text-slate-600',
  SHIPMENT_CREATED: 'border-violet-200 bg-violet-50 text-violet-700',
  INBOUND_PENDING: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  COMPLETED: 'border-emerald-200 bg-emerald-100 text-emerald-800',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '초안',
  REQUESTED: '요청됨',
  ACCEPTED: '수락됨',
  PARTIALLY_ACCEPTED: '부분수락',
  REJECTED: '거절됨',
  CANCELLED: '취소됨',
  SHIPMENT_CREATED: '발송등록',
  INBOUND_PENDING: '입고대기',
  COMPLETED: '완료',
}

const VALID_TRANSITIONS: Record<string, PurchaseOrderAction[]> = {
  DRAFT: ['submit'],
  REQUESTED: ['accept', 'reject'],
  ACCEPTED: ['createShipment'],
  PARTIALLY_ACCEPTED: ['createShipment'],
  SHIPMENT_CREATED: ['complete'],
}

const ACTION_DEFINITIONS: ActionDefinition[] = [
  {
    id: 'submit',
    label: '요청',
    icon: Send,
    activeClassName: 'bg-blue-600 text-white hover:bg-blue-700',
    successMessage: '발주 요청이 전송되었습니다.',
  },
  {
    id: 'accept',
    label: '수락',
    icon: CheckCircle2,
    activeClassName: 'bg-emerald-600 text-white hover:bg-emerald-700',
    successMessage: '발주가 수락되었습니다.',
  },
  {
    id: 'reject',
    label: '거절',
    icon: XCircle,
    activeClassName: 'bg-red-600 text-white hover:bg-red-700',
    successMessage: '발주가 거절되었습니다.',
  },
  {
    id: 'createShipment',
    label: '발송등록',
    icon: Truck,
    activeClassName: 'bg-violet-600 text-white hover:bg-violet-700',
    successMessage: '발송 정보가 등록되었습니다.',
  },
  {
    id: 'complete',
    label: '완료',
    icon: PackageCheck,
    activeClassName: 'bg-emerald-700 text-white hover:bg-emerald-800',
    successMessage: '발주가 완료 처리되었습니다.',
  },
]

function showSuccessToast(message: string): void {
  if (typeof document === 'undefined' || !document.body) {
    return
  }

  document.getElementById(SUCCESS_TOAST_ID)?.remove()

  const toast = document.createElement('div')
  toast.id = SUCCESS_TOAST_ID
  toast.setAttribute('role', 'status')
  toast.textContent = message

  Object.assign(toast.style, {
    position: 'fixed',
    left: '50%',
    bottom: '24px',
    transform: 'translateX(-50%)',
    zIndex: '9999',
    maxWidth: 'calc(100vw - 32px)',
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '500',
  } satisfies Partial<CSSStyleDeclaration>)

  document.body.appendChild(toast)

  if (activeSuccessToastTimeout !== undefined) {
    window.clearTimeout(activeSuccessToastTimeout)
  }

  activeSuccessToastTimeout = window.setTimeout(() => {
    document.getElementById(SUCCESS_TOAST_ID)?.remove()
    activeSuccessToastTimeout = undefined
  }, SUCCESS_TOAST_DURATION_MS)
}

function formatDateTime(value?: string): string {
  if (!value) {
    return '-'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleString('ko-KR')
}

function getStatusBadgeClassName(status: string): string {
  return STATUS_STYLES[status] ?? 'border-neutral-200 bg-neutral-50 text-neutral-700'
}

function getValidActions(status: string): PurchaseOrderAction[] {
  return VALID_TRANSITIONS[status] ?? []
}

function getTransitionErrorMessage(actionLabel: string, error: unknown): string {
  const networkMessage = getErrorMessage(error)
  if (networkMessage) {
    return networkMessage
  }

  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data && typeof error.response.data === 'object'
      ? Reflect.get(error.response.data, 'message')
      : null

    if (typeof responseMessage === 'string' && responseMessage.trim().length > 0) {
      return responseMessage
    }
  }

  return `${actionLabel} 처리에 실패했습니다. 다시 시도해주세요.`
}

function buildShipmentPayload(po: PurchaseOrder): Record<string, string> {
  const normalizedPoNumber = po.poNumber.replace(/[^A-Z0-9]/gi, '') || `PO${po.id}`

  return {
    shipmentNumber: `SHIP-${normalizedPoNumber}`,
    carrier: po.supplierName || 'ERP',
    trackingNumber: `TRK-${normalizedPoNumber}`,
  }
}

function getHistoryResponseLabel(status: string): string {
  if (status === 'REJECTED') {
    return '거절됨'
  }

  if (status === 'PARTIALLY_ACCEPTED') {
    return '부분수락'
  }

  return '수락됨'
}

function buildHistoryEvents(po: PurchaseOrder | null): StatusHistoryEvent[] {
  if (!po) {
    return []
  }

  const events: StatusHistoryEvent[] = []

  if (po.createdAt) {
    events.push({
      key: 'draft',
      status: 'DRAFT',
      label: STATUS_LABELS.DRAFT,
      timestamp: po.createdAt,
      description: '발주가 생성되어 초안 상태로 시작되었습니다.',
    })
  }

  if (po.requestedAt) {
    events.push({
      key: 'requested',
      status: 'REQUESTED',
      label: STATUS_LABELS.REQUESTED,
      timestamp: po.requestedAt,
      description: 'ERP 요청이 전송되었습니다.',
    })
  }

  if (po.erpRespondedAt) {
    const responseStatus = po.status === 'REJECTED' ? 'REJECTED' : po.status === 'PARTIALLY_ACCEPTED' ? 'PARTIALLY_ACCEPTED' : 'ACCEPTED'
    events.push({
      key: 'erp-response',
      status: responseStatus,
      label: getHistoryResponseLabel(responseStatus),
      timestamp: po.erpRespondedAt,
      description: po.erpReference
        ? `ERP 응답이 등록되었습니다. 참조번호: ${po.erpReference}`
        : 'ERP 응답이 등록되었습니다.',
    })
  }

  const sortedShipments = [...(po.shipments ?? [])].sort((left, right) => {
    const leftTimestamp = left.createdAt ?? left.shippedAt ?? ''
    const rightTimestamp = right.createdAt ?? right.shippedAt ?? ''
    return new Date(leftTimestamp).getTime() - new Date(rightTimestamp).getTime()
  })

  sortedShipments.forEach((shipment, index) => {
    const shipmentDetails = [shipment.shipmentNumber, shipment.carrier, shipment.trackingNumber]
      .filter((value): value is string => Boolean(value && value.trim()))
      .join(' · ')

    events.push({
      key: `shipment-${shipment.id ?? index}`,
      status: 'SHIPMENT_CREATED',
      label: STATUS_LABELS.SHIPMENT_CREATED,
      timestamp: shipment.createdAt ?? shipment.shippedAt,
      description: shipmentDetails || '발송 정보가 등록되었습니다.',
    })
  })

  if (po.status === 'COMPLETED') {
    events.push({
      key: 'completed',
      status: 'COMPLETED',
      label: STATUS_LABELS.COMPLETED,
      timestamp: po.updatedAt,
      description: '입고 연결이 완료되어 발주가 종료되었습니다.',
    })
  }

  if (po.status === 'CANCELLED') {
    events.push({
      key: 'cancelled',
      status: 'CANCELLED',
      label: STATUS_LABELS.CANCELLED,
      timestamp: po.updatedAt,
      description: po.cancelReason ? `취소 사유: ${po.cancelReason}` : '발주가 취소되었습니다.',
    })
  }

  return events
}

export function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showExcelModal, setShowExcelModal] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('details')
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [transitioningPoId, setTransitioningPoId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    centerId: '',
    warehouseId: '',
  })

  const historyEvents = useMemo(() => buildHistoryEvents(selectedPO), [selectedPO])

  useEffect(() => {
    void fetchCenters()
    void fetchPurchaseOrders()
  }, [])

  useEffect(() => {
    if (!formData.centerId) {
      setWarehouses([])
      return
    }

    void fetchWarehousesByCenter(formData.centerId)
  }, [formData.centerId])

  const fetchCenters = async () => {
    try {
      const response = await api.get('/v1/centers')
      setCenters(response.data)
    } catch (error) {
      console.error('Failed to fetch centers:', error)
    }
  }

  const fetchWarehousesByCenter = async (centerId: string) => {
    try {
      const response = await api.get(`/v1/warehouses/center/${centerId}`)
      setWarehouses(response.data)
    } catch (error) {
      console.error('Failed to fetch warehouses:', error)
    }
  }

  const fetchPurchaseOrders = async () => {
    try {
      const response = await api.get('/v1/purchase-orders')
      setPurchaseOrders(response.data)
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchaseOrderDetail = async (poId: number) => {
    const response = await api.get(`/v1/purchase-orders/${poId}`)
    setSelectedPO(response.data)
  }

  const handleOpenDetail = async (po: PurchaseOrder) => {
    setDetailTab('details')
    setSelectedPO(po)
    setIsDetailLoading(true)

    try {
      await fetchPurchaseOrderDetail(po.id)
    } catch (error) {
      console.error('Failed to fetch purchase order detail:', error)
      showErrorToast(getTransitionErrorMessage('발주 상세 조회', error))
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()

    try {
      await api.post('/v1/purchase-orders', null, {
        params: {
          centerId: formData.centerId,
          warehouseId: formData.warehouseId || null,
        },
      })

      await fetchPurchaseOrders()
      setShowModal(false)
      setFormData({ centerId: '', warehouseId: '' })
    } catch (error) {
      console.error('Failed to create purchase order:', error)
      showErrorToast(getTransitionErrorMessage('발주 생성', error))
    }
  }

  const handleStatusAction = async (po: PurchaseOrder, action: PurchaseOrderAction) => {
    const validActions = getValidActions(po.status)
    const actionDefinition = ACTION_DEFINITIONS.find((item) => item.id === action)

    if (!validActions.includes(action) || !actionDefinition) {
      showErrorToast(TRANSITION_DISABLED_TOOLTIP)
      return
    }

    setTransitioningPoId(po.id)

    try {
      switch (action) {
        case 'submit':
          await api.post(`/v1/purchase-orders/${po.id}/submit`)
          break
        case 'accept':
          await api.post(`/v1/purchase-orders/${po.id}/accept`, null, {
            params: { erpReference: po.erpReference || `ERP-${po.poNumber}` },
          })
          break
        case 'reject':
          await api.post(`/v1/purchase-orders/${po.id}/reject`, null, {
            params: { reason: '재고 부족' },
          })
          break
        case 'createShipment':
          await api.post(`/v1/purchase-orders/${po.id}/shipments`, buildShipmentPayload(po))
          break
        case 'complete':
          await api.post(`/v1/purchase-orders/${po.id}/complete`)
          break
      }

      await fetchPurchaseOrders()

      if (selectedPO?.id === po.id) {
        await fetchPurchaseOrderDetail(po.id)
      }

      showSuccessToast(actionDefinition.successMessage)
    } catch (error) {
      console.error(`Failed to ${action} purchase order:`, error)
      showErrorToast(getTransitionErrorMessage(actionDefinition.label, error))
    } finally {
      setTransitioningPoId(null)
    }
  }

  const renderActionButtons = (po: PurchaseOrder) => {
    const validActions = getValidActions(po.status)
    const isBusy = transitioningPoId === po.id

    return ACTION_DEFINITIONS.map((action) => {
      const isAllowed = validActions.includes(action.id)
      const isDisabled = isBusy || !isAllowed
      const Icon = action.icon
      const button = (
        <button
          key={action.id}
          type="button"
          disabled={isDisabled}
          onClick={() => void handleStatusAction(po, action.id)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            isAllowed && !isBusy
              ? action.activeClassName
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          }`}
        >
          <Icon className="w-4 h-4" />
          {isBusy && isAllowed ? '처리 중...' : action.label}
        </button>
      )

      if (isBusy) {
        return (
          <span key={action.id} title="상태 변경을 처리하고 있습니다." className="inline-flex">
            {button}
          </span>
        )
      }

      if (!isAllowed) {
        return (
          <span key={action.id} title={TRANSITION_DISABLED_TOOLTIP} className="inline-flex">
            {button}
          </span>
        )
      }

      return button
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">발주 관리</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void downloadExcelTemplate('purchase-orders')}
            className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
          >
            <Download className="w-4 h-4" />
            템플릿 다운로드
          </button>
          <button
            onClick={() => setShowExcelModal(true)}
            className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-primary-700 hover:bg-primary-100"
          >
            <Upload className="w-4 h-4" />
            엑셀 업로드
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            새 발주
          </button>
        </div>
      </div>

      {loading ? (
        <EmptyState
          title="Loading..."
          description="Fetching purchase orders"
          variant="empty"
        />
      ) : purchaseOrders.length === 0 ? (
        <EmptyState
          title="No purchase orders found"
          description="Create your first purchase order to get started"
          actionLabel="New Purchase Order"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-text-secondary">발주번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-text-secondary">센터</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-text-secondary">창고</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-text-secondary">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-text-secondary">요청일</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-text-secondary">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-mono text-sm">{po.poNumber}</td>
                  <td className="px-6 py-4 text-sm">{po.requestingCenter?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm">{po.targetWarehouse?.name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${getStatusBadgeClassName(po.status)}`}>
                      {STATUS_LABELS[po.status] || po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{po.requestedAt ? formatDateTime(po.requestedAt) : '-'}</td>
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex items-start justify-end gap-2">
                      <button
                        onClick={() => void handleOpenDetail(po)}
                        className="rounded-lg p-2 text-text-secondary hover:bg-neutral-100"
                        title="상세 보기"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <div className="flex flex-wrap justify-end gap-2">
                        {renderActionButtons(po)}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">새 발주</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">요청 센터 *</label>
                <select
                  value={formData.centerId}
                  onChange={(event) => setFormData({ ...formData, centerId: event.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  required
                >
                  <option value="">센터 선택</option>
                  {centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name} ({center.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">입고 창고</label>
                <select
                  value={formData.warehouseId}
                  onChange={(event) => setFormData({ ...formData, warehouseId: event.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                >
                  <option value="">창고 선택</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 hover:bg-neutral-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
                >
                  생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">발주 상세</h2>
                <p className="mt-1 text-sm text-text-secondary">상태 전환과 이력을 함께 확인할 수 있습니다.</p>
              </div>
              <button onClick={() => setSelectedPO(null)} className="rounded-lg p-2 hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 flex gap-2 border-b border-neutral-200">
              <button
                type="button"
                onClick={() => setDetailTab('details')}
                className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  detailTab === 'details'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                상세
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('history')}
                className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  detailTab === 'history'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                History
              </button>
            </div>

            {isDetailLoading && (
              <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                최신 발주 정보를 불러오는 중입니다.
              </div>
            )}

            {detailTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">발주번호</p>
                    <p className="font-mono font-medium">{selectedPO.poNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">상태</p>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${getStatusBadgeClassName(selectedPO.status)}`}>
                      {STATUS_LABELS[selectedPO.status] || selectedPO.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">센터</p>
                    <p className="font-medium">{selectedPO.requestingCenter?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">창고</p>
                    <p className="font-medium">{selectedPO.targetWarehouse?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">요청일</p>
                    <p className="font-medium">{formatDateTime(selectedPO.requestedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">ERP 응답</p>
                    <p className="font-medium">{formatDateTime(selectedPO.erpRespondedAt)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">상태 전환</h3>
                      <p className="text-sm text-text-secondary">허용된 전환만 실행 가능하며, 나머지는 비활성화됩니다.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {renderActionButtons(selectedPO)}
                    </div>
                  </div>
                </div>

                {selectedPO.items && selectedPO.items.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-medium">품목</h3>
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-3 py-2 text-left">품목ID</th>
                          <th className="px-3 py-2 text-right">요청수량</th>
                          <th className="px-3 py-2 text-right">수락수량</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedPO.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">{item.productId}</td>
                            <td className="px-3 py-2 text-right">{item.requestedQuantity}</td>
                            <td className="px-3 py-2 text-right">{item.acceptedQuantity || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {detailTab === 'history' && (
              <div className="space-y-4">
                {historyEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center text-sm text-text-secondary">
                    아직 표시할 상태 이력이 없습니다.
                  </div>
                ) : (
                  historyEvents.map((event) => (
                    <div key={event.key} className="flex gap-4 rounded-xl border border-neutral-200 p-4">
                      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${getStatusBadgeClassName(event.status)}`}>
                        <Clock3 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-text-primary">{event.label}</p>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusBadgeClassName(event.status)}`}>
                              {STATUS_LABELS[event.status] || event.status}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary">{formatDateTime(event.timestamp)}</p>
                        </div>
                        <p className="mt-1 text-sm text-text-secondary">{event.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ExcelUploadModal
        isOpen={showExcelModal}
        entityType="purchase-orders"
        entityLabel="발주"
        onClose={() => setShowExcelModal(false)}
        onImported={fetchPurchaseOrders}
      />
    </div>
  )
}
