/**
 * Inbound management page component.
 * Displays inbound list with filtering, creation, and confirmation capabilities.
 *
 * @author StockOps Team
 * @since 1.0
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Check, Package } from 'lucide-react'
import { useInbounds, useInboundItems, useCreateInbound, useAddInboundItem, useConfirmInbound } from '@/hooks/useInbound'
import { useProducts } from '@/hooks/useProduct'
import { useLocations } from '@/hooks/useLocation'
import { ProductSelectDropdown } from '@/components/products/ProductSelectDropdown'
import type { Inbound, InboundStatus } from '@/types/inbound'
import type { Location } from '@/types/location'

/**
 * Inbound management page with table, filters, and modals.
 *
 * @returns Inbound page JSX element
 */
export function InboundPage() {
  const [statusFilter, setStatusFilter] = useState<InboundStatus | ''>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInbound, setSelectedInbound] = useState<Inbound | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAddItemModal, setShowAddItemModal] = useState(false)

  const { data: inbounds, isLoading, error } = useInbounds(statusFilter || undefined)

  if (isLoading) {
    return <div className="text-neutral-600">Loading...</div>
  }

  if (error) {
    return <div className="text-error">Error loading inbounds: {error.message}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Inbound Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Inbound
        </button>
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
            {inbounds && inbounds.length > 0 ? (
              inbounds.map((inbound) => (
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
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-neutral-500">
                  No inbounds found
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Add Item to Inbound</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Product</label>
            <ProductSelectDropdown
              value={productId}
              onChange={setProductId}
              products={products}
              loading={productsLoading}
              placeholder="상품명 또는 바코드로 검색"
            />
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