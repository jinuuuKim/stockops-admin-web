/**
 * Outbound management page component.
 * Displays outbound list with filtering, creation, and confirmation capabilities.
 *
 * @author StockOps Team
 * @since 1.0
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, CheckCircle, X, Package, ScanBarcode } from 'lucide-react'
import api from '@/lib/api'
import type { OutboundDTO, OutboundItemDTO, OutboundStatus, CreateOutboundRequest, AddOutboundItemRequest } from '@/types/outbound'
import type { ProductDTO } from '@/types/product'
import { EmptyState } from '@/components/common/EmptyState'
import { BarcodeScanner } from '@/components/common/BarcodeScanner'

/**
 * Outbound management page with table, filtering, and CRUD operations.
 *
 * @returns Outbound page JSX element
 */
export function OutboundPage() {
  const [statusFilter, setStatusFilter] = useState<OutboundStatus | ''>('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedOutbound, setSelectedOutbound] = useState<OutboundDTO | null>(null)
  const queryClient = useQueryClient()

  const { data: outbounds = [], isLoading } = useQuery({
    queryKey: ['outbounds', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const response = await api.get<OutboundDTO[]>(`/v1/outbounds${params}`)
      return response.data
    },
  })

  const confirmMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<OutboundDTO>(`/v1/outbounds/${id}/confirm`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbounds'] })
    },
  })

  const handleConfirm = (id: number) => {
    if (window.confirm('Are you sure you want to confirm this outbound? This will allocate lots using FEFO and decrease inventory.')) {
      confirmMutation.mutate(id)
    }
  }

  const handleViewDetails = (outbound: OutboundDTO) => {
    setSelectedOutbound(outbound)
    setIsDetailModalOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Outbound Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Outbound
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-neutral-700">Filter by Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OutboundStatus | '')}
          className="p-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
        </select>
      </div>

      {isLoading ? (
        <EmptyState
          title="Loading..."
          description="Fetching outbound data"
          variant="empty"
        />
      ) : outbounds.length === 0 ? (
        <EmptyState
          title="No outbounds found"
          description="Create your first outbound to get started"
          actionLabel="New Outbound"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {outbounds.map((outbound) => (
                <tr key={outbound.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{outbound.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{outbound.outboundDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{outbound.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      outbound.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {outbound.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{outbound.totalQuantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(outbound)}
                        className="text-primary-600 hover:text-primary-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {outbound.status === 'DRAFT' && (
                        <button
                          onClick={() => handleConfirm(outbound.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Confirm"
                          disabled={confirmMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {isCreateModalOpen && (
        <CreateOutboundModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            queryClient.invalidateQueries({ queryKey: ['outbounds'] })
          }}
        />
      )}

      {isDetailModalOpen && selectedOutbound && (
        <OutboundDetailModal
          outbound={selectedOutbound}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedOutbound(null)
          }}
        />
      )}
    </div>
  )
}

/**
 * Create outbound modal with form.
 *
 * @param onClose - Callback when modal is closed
 * @param onSuccess - Callback when outbound is created successfully
 */
function CreateOutboundModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [customer, setCustomer] = useState('')
  const [outboundDate, setOutboundDate] = useState(new Date().toISOString().split('T')[0])
  const [createdOutbound, setCreatedOutbound] = useState<OutboundDTO | null>(null)
  const [items, setItems] = useState<Array<{ productId: number; quantity: number; productName: string }>>([])
  const [error, setError] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [scanError, setScanError] = useState('')

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get<{ content: ProductDTO[] }>('/v1/products')
      return response.data.content || []
    },
  })

  const handleBarcodeScan = (barcode: string) => {
    const product = products.find((p) => p.barcode === barcode)
    if (product) {
      const select = document.getElementById('product-select') as HTMLSelectElement
      const quantityInput = document.getElementById('quantity-input') as HTMLInputElement
      if (select) {
        select.value = String(product.id)
      }
      setScanError('')
      setShowScanner(false)
      if (quantityInput) {
        quantityInput.focus()
      }
    } else {
      setScanError(`바코드 '${barcode}'에 해당하는 상품을 찾을 수 없습니다.`)
    }
  }

  const createMutation = useMutation({
    mutationFn: async (request: CreateOutboundRequest) => {
      const response = await api.post<OutboundDTO>('/v1/outbounds', request)
      return response.data
    },
    onSuccess: (data) => {
      setCreatedOutbound(data)
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to create outbound'
      setError(message)
    },
  })

  const addItemMutation = useMutation({
    mutationFn: async ({ outboundId, request }: { outboundId: number; request: AddOutboundItemRequest }) => {
      const response = await api.post<OutboundItemDTO>(`/v1/outbounds/${outboundId}/items`, request)
      return response.data
    },
  })

  const handleCreateOutbound = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!customer.trim()) {
      setError('Customer name is required')
      return
    }
    createMutation.mutate({ customer, outboundDate })
  }

  const handleAddItem = () => {
    const select = document.getElementById('product-select') as HTMLSelectElement
    const quantityInput = document.getElementById('quantity-input') as HTMLInputElement
    
    const productId = Number(select.value)
    const quantity = Number(quantityInput.value)
    const productName = select.options[select.selectedIndex].text

    if (!productId || quantity <= 0) {
      setError('Please select a product and enter a valid quantity')
      return
    }

    if (!createdOutbound) {
      setError('Please create outbound first')
      return
    }

    addItemMutation.mutate(
      { outboundId: createdOutbound.id, request: { productId, quantity } },
      {
        onSuccess: () => {
          setItems([...items, { productId, quantity, productName }])
          select.value = ''
          quantityInput.value = ''
          setError('')
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Failed to add item'
          setError(message)
        },
      }
    )
  }

  const handleFinish = () => {
    if (items.length === 0) {
      setError('Please add at least one item')
      return
    }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Create New Outbound</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="bg-error/10 text-error p-3 rounded mb-4">{error}</div>}

        {!createdOutbound ? (
          <form onSubmit={handleCreateOutbound}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-neutral-700">Customer *</label>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-neutral-700">Date</label>
              <input
                type="date"
                value={outboundDate}
                onChange={(e) => setOutboundDate(e.target.value)}
                className="w-full p-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-neutral-300 rounded hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="mb-4 p-3 bg-green-50 text-green-800 rounded">
              Outbound #{createdOutbound.id} created. Add items below.
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-neutral-700">Product</label>
              {!showScanner ? (
                <>
                  <select
                    id="product-select"
                    className="w-full p-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
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
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-neutral-700">Quantity</label>
              <input
                id="quantity-input"
                type="number"
                min="1"
                className="w-full p-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter quantity"
              />
            </div>

            <button
              onClick={handleAddItem}
              disabled={addItemMutation.isPending}
              className="w-full mb-4 px-4 py-2 bg-neutral-100 text-neutral-900 rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors"
            >
              {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
            </button>

            {items.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2 text-neutral-700">Items Added</h3>
                <ul className="border border-neutral-200 rounded divide-y divide-neutral-200">
                  {items.map((item, index) => (
                    <li key={index} className="p-2 text-sm text-neutral-900">
                      {item.productName} - Qty: {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-neutral-300 rounded hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFinish}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
              >
                Finish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Outbound detail modal showing items and lot allocations.
 *
 * @param outbound - Outbound data to display
 * @param onClose - Callback when modal is closed
 */
function OutboundDetailModal({ outbound, onClose }: { outbound: OutboundDTO; onClose: () => void }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['outbound-items', outbound.id],
    queryFn: async () => {
      const response = await api.get<OutboundItemDTO[]>(`/v1/outbounds/${outbound.id}/items`)
      return response.data
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Outbound #{outbound.id} Details</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-neutral-500">Date</span>
            <p className="text-neutral-900">{outbound.outboundDate}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-500">Customer</span>
            <p className="text-neutral-900">{outbound.customer}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-500">Status</span>
            <p>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                outbound.status === 'CONFIRMED' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {outbound.status}
              </span>
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-500">Total Quantity</span>
            <p className="text-neutral-900">{outbound.totalQuantity}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 text-neutral-700">Items</h3>
          {isLoading ? (
            <div className="text-neutral-600">Loading items...</div>
          ) : items.length === 0 ? (
            <div className="text-neutral-500 text-sm">No items found</div>
          ) : (
            <div className="border border-neutral-200 rounded overflow-hidden">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">Lot</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">Quantity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm text-neutral-900">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-neutral-400" />
                          {item.productName}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-neutral-900">
                        {item.lotNumber || <span className="text-neutral-400 italic">Pending allocation</span>}
                      </td>
                      <td className="px-4 py-2 text-sm text-neutral-900">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 rounded hover:bg-neutral-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}