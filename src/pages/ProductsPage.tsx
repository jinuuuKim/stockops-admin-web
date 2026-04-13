/**
 * Products management page component.
 * Displays products list with search, filter, pagination, and CRUD operations.
 *
 * @author StockOps Team
 * @since 1.0
 */

import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react'
import { downloadExcelTemplate } from '@/api/excel'
import { ExcelUploadModal } from '@/components/common/ExcelUploadModal'
import { ProductModal } from '@/components/products/ProductModal'
import type { ProductDTO, CreateProductRequest, UpdateProductRequest } from '@/types/product'
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/api/products'

export function ProductsPage() {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showExcelModal, setShowExcelModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductDTO | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 10

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getProducts(0, 1000)
      setProducts(response.content)
    } catch (err) {
      setError('상품 목록을 불러오는데 실패했습니다.')
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>()
    products.forEach((p) => {
      if (p.category) categories.add(p.category)
    })
    return Array.from(categories).sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchTerm === '' ||
        product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, categoryFilter])

  const paginatedProducts = useMemo(() => {
    const start = currentPage * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, currentPage, pageSize])

  const totalPages = Math.ceil(filteredProducts.length / pageSize)

  const handleSubmit = async (data: CreateProductRequest | UpdateProductRequest) => {
    try {
      setSubmitting(true)
      if (editingProduct) {
        await updateProduct(editingProduct.id, data as UpdateProductRequest)
      } else {
        await createProduct(data as CreateProductRequest)
      }
      await fetchProducts()
      setShowModal(false)
      setEditingProduct(null)
    } catch (err) {
      console.error('Failed to save product:', err)
      setError('상품 저장에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (product: ProductDTO) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 상품을 삭제하시겠습니까?')) return

    try {
      await deleteProduct(id)
      await fetchProducts()
    } catch (err) {
      console.error('Failed to delete product:', err)
      setError('상품 삭제에 실패했습니다.')
    }
  }

  const handleOpenCreate = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProduct(null)
  }

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return '-'
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(price)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">상품 관리</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void downloadExcelTemplate('products')}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            템플릿 다운로드
          </button>
          <button
            onClick={() => setShowExcelModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-primary-200 text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <Upload className="w-4 h-4" />
            엑셀 업로드
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 상품
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="바코드 또는 상품명으로 검색..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(0)
                }}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(0)
              }}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">전체 카테고리</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="p-8 text-center text-neutral-500">로딩 중...</div>
        )}

        {error && (
          <div className="p-4 bg-error/10 text-error rounded m-4">{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      바코드
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      상품명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      카테고리
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      단위
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                      기본 가격
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                      안전 재고량
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">
                      유통기한 관리
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-neutral-500">
                        등록된 상품이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm">{product.barcode}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-neutral-900">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-neutral-500">{product.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">
                          {product.category || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">{product.unit}</td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          {formatPrice(product.defaultPrice)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm">
                          {product.safetyStockQuantity ?? '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              product.expiryManaged
                                ? 'bg-success/10 text-success'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {product.expiryManaged ? '관리' : '미관리'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors"
                            title="수정"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 hover:bg-error/10 rounded-lg text-error transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-200">
                <div className="text-sm text-neutral-500">
                  총 {filteredProducts.length}개 중{' '}
                  {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, filteredProducts.length)}
                  개 표시
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1 border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = currentPage < 3 ? i : currentPage - 2 + i
                      if (pageNum >= totalPages) return null
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded transition-colors ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'hover:bg-neutral-100'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-1 border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ProductModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        product={editingProduct}
        isLoading={submitting}
      />
      <ExcelUploadModal
        isOpen={showExcelModal}
        entityType="products"
        entityLabel="상품"
        onClose={() => setShowExcelModal(false)}
        onImported={fetchProducts}
      />
    </div>
  )
}
