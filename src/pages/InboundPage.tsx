/**
 * Inbound management page component.
 * Displays inbound list with filtering, creation, and confirmation capabilities.
 *
 * @author StockOps Team
 * @since 1.0
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Check, Package, ScanBarcode, Download, Upload } from 'lucide-react'
import { useInbounds, useInboundItems, useCreateInbound, useAddInboundItem, useConfirmInbound } from '@/hooks/useInbound'
import { useProducts } from '@/hooks/useProduct'
import { useLocations } from '@/hooks/useLocation'
import { ProductSelectDropdown } from '@/components/products/ProductSelectDropdown'
import { BarcodeScanner } from '@/components/common/BarcodeScanner'
import { ExcelUploadModal } from '@/components/common/ExcelUploadModal'
import { downloadExcelTemplate } from '@/api/excel'
import type { Inbound, InboundStatus } from '@/types/inbound'
import type { Location } from '@/types/location'
import { EmptyState } from '@/components/common/EmptyState'

/**
 * Inbound management page with table, filters, and modals.
 *
 * @returns Inbound page JSX element
 */
export function InboundPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<InboundStatus | ''>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInbound, setSelectedInbound] = useState<Inbound | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [showExcelModal, setShowExcelModal] = useState(false)

  const { data: inbounds, isLoading, error } = useInbounds(statusFilter || undefined)

  if (isLoading) {
    return <EmptyState title="Loading..." description="Fetching inbound data" variant="empty" />
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load data"
        description={error.message}
        variant="error"
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Inbound Management</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void downloadExcelTemplate('inbounds')}
            className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            템플릿 다운로드
          </button>
          <button
            onClick={() => setShowExcelModal(true)}
            className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-primary-700 hover:bg-primary-100 transition-colors"
          >
            <Upload className="w-4 h-4" />
            엑셀 업로드
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Inbound
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-1">Status Filter</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InboundStatus | '')}
          className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {inbounds && inbounds.length > 0 ? (
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Qty</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {inbounds.map((inbound) => (
                <tr key={inbound.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{inbound.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{inbound.inboundDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{inbound.supplier || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      inbound.status === 'CONFIRMED' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {inbound.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{inbound.totalQuantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedInbound(inbound)
                          setShowDetailModal(true)
                        }}
                        className="text-primary-600 hover:text-primary-700"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {inbound.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedInbound(inbound)
                              setShowAddItemModal(true)
                            }}
                            className="text-primary-600 hover:text-primary-700"
                            title="Add Item"
                          >
                            <Package className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInbound(inbound)
                              setShowDetailModal(true)
                            }}
                            className="text-success hover:text-green-700"
                            title="Confirm"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            title="No inbounds found"
            description="Create your first inbound to get started"
            actionLabel="New Inbound"
            onAction={() => setShowCreateModal(true)}
          />
        )}
      </div>

      {showCreateModal && (
        <CreateInboundModal onClose={() => setShowCreateModal(false)} />
      )}

      {showDetailModal && selectedInbound && (
        <InboundDetailModal
          inbound={selectedInbound}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedInbound(null)
          }}
        />
      )}

      {showAddItemModal && selectedInbound && (
        <AddItemModal
          inboundId={selectedInbound.id}
          onClose={() => {
            setShowAddItemModal(false)
            setSelectedInbound(null)
          }}
        />
      )}

      <ExcelUploadModal
        isOpen={showExcelModal}
        entityType="inbounds"
        entityLabel="입고"
        onClose={() => setShowExcelModal(false)}
        onImported={() => queryClient.invalidateQueries({ queryKey: ['inbounds'] })}
      />
    </div>
  )
}

/**
 * Create inbound modal component.
 *
 * @param onClose - Close callback
 * @returns Modal JSX element
 */
function CreateInboundModal({ onClose }: { onClose: () => void }) {
  const [supplier, setSupplier] = useState('')
  const [inboundDate, setInboundDate] = useState('')
  const createMutation = useCreateInbound()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(
      {
        supplier,
        inboundDate: inboundDate || undefined,
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Create New Inbound</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Supplier</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter supplier name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Inbound Date</label>
            <input
              type="date"
              value={inboundDate}
              onChange={(e) => setInboundDate(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Inbound detail modal component.
 *
 * @param inbound - Inbound data
 * @param onClose - Close callback
 * @returns Modal JSX element
 */
function InboundDetailModal({ inbound, onClose }: { inbound: Inbound; onClose: () => void }) {
  const { data: items, isLoading } = useInboundItems(inbound.id)
  const confirmMutation = useConfirmInbound()
  const queryClient = useQueryClient()

  const handleConfirm = () => {
    confirmMutation.mutate(inbound.id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['inbounds'] })
        onClose()
      },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-neutral-900">Inbound #{inbound.id}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            &times;
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-neutral-500">Date:</span>
            <span className="ml-2 text-neutral-900">{inbound.inboundDate}</span>
          </div>
          <div>
            <span className="text-sm text-neutral-500">Supplier:</span>
            <span className="ml-2 text-neutral-900">{inbound.supplier || '-'}</span>
          </div>
          <div>
            <span className="text-sm text-neutral-500">Status:</span>
            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
              inbound.status === 'CONFIRMED' 
                ? 'bg-success/10 text-success' 
                : 'bg-warning/10 text-warning'
            }`}>
              {inbound.status}
            </span>
          </div>
          <div>
            <span className="text-sm text-neutral-500">Total Quantity:</span>
            <span className="ml-2 text-neutral-900">{inbound.totalQuantity}</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Items</h3>
        {isLoading ? (
          <div className="text-neutral-600">Loading items...</div>
        ) : items && items.length > 0 ? (
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Product</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">LOT</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Expiry</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Qty</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 text-sm text-neutral-900">{item.productName}</td>
                  <td className="px-4 py-2 text-sm text-neutral-600">{item.lotNumber}</td>
                  <td className="px-4 py-2 text-sm text-neutral-600">{item.expiryDate || '-'}</td>
                  <td className="px-4 py-2 text-sm text-neutral-600">{item.quantity}</td>
                  <td className="px-4 py-2 text-sm text-neutral-600">{item.locationCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-neutral-500">No items added yet</div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 hover:text-neutral-700"
          >
            Close
          </button>
          {inbound.status === 'DRAFT' && items && items.length > 0 && (
            <button
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
              className="px-4 py-2 bg-success text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {confirmMutation.isPending ? 'Confirming...' : 'Confirm Inbound'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Add item modal component.
 *
 * @param inboundId - Inbound identifier
 * @param onClose - Close callback
 * @returns Modal JSX element
 */
function AddItemModal({ inboundId, onClose }: { inboundId: number; onClose: () => void }) {
  const { data: products, isLoading: productsLoading } = useProducts()
  const { data: locations } = useLocations()
  const addItemMutation = useAddInboundItem(inboundId)

  const [productId, setProductId] = useState<number | null>(null)
  const [lotNumber, setLotNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [locationId, setLocationId] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [scanError, setScanError] = useState('')

  const handleBarcodeScan = (barcode: string) => {
    const product = products?.find((p) => p.barcode === barcode)
    if (product) {
      setProductId(product.id)
      setScanError('')
      setShowScanner(false)
    } else {
      setScanError(`바코드 '${barcode}'에 해당하는 상품을 찾을 수 없습니다.`)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId) return
    addItemMutation.mutate(
      {
        productId,
        lotNumber,
        expiryDate: expiryDate || undefined,
        quantity: parseInt(quantity),
        locationId: parseInt(locationId),
      },
      {
        onSuccess: () => {
          setProductId(null)
          setLotNumber('')
          setExpiryDate('')
          setQuantity('')
          setLocationId('')
          onClose()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Add Item to Inbound</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Product</label>
            {!showScanner ? (
              <>
                <ProductSelectDropdown
                  value={productId}
                  onChange={setProductId}
                  products={products}
                  loading={productsLoading}
                  placeholder="상품명 또는 바코드로 검색"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="mt-2 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  <ScanBarcode className="w-4 h-4" />
                  바코드 스캔
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <BarcodeScanner
                  onScan={handleBarcodeScan}
                  placeholder="상품 바코드를 스캔하세요"
                  onSuccess={() => setScanError('')}
                  onError={(err) => setScanError(err)}
                />
                {scanError && (
                  <p className="text-sm text-error">{scanError}</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowScanner(false)
                    setScanError('')
                  }}
                  className="text-sm text-neutral-600 hover:text-neutral-700"
                >
                  수동 선택으로 돌아가기
                </button>
              </div>
            )}
            {productId && !showScanner && products && (
              <p className="mt-1 text-sm text-success">
                선택됨: {products.find((p) => p.id === productId)?.name}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">LOT Number</label>
            <input
              type="text"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter LOT number"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter quantity"
              min="1"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select Location</option>
              {locations?.map((location: Location) => (
                <option key={location.id} value={location.id}>
                  {location.code} - {location.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addItemMutation.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
