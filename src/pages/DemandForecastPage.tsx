import { useState } from 'react'
import { TrendingUp, Info } from 'lucide-react'
import api from '@/lib/api'

interface ForecastPoint {
  date: string
  predicted: number
  lower: number
  upper: number
}

export function DemandForecastPage() {
  const [productId, setProductId] = useState('')
  const [days, setDays] = useState('14')
  const [forecasts, setForecasts] = useState<ForecastPoint[]>([])
  const [loading, setLoading] = useState(false)

  const handleForecast = async () => {
    if (!productId) return
    setLoading(true)
    try {
      const res = await api.get(`/demand-forecast?productId=${productId}&days=${days}`)
      setForecasts(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">수요 예측</h1>

      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex gap-4 mb-6">
          <input
            type="number"
            placeholder="상품 ID"
            value={productId}
            onChange={e => setProductId(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg"
          />
          <select
            value={days}
            onChange={e => setDays(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg"
          >
            <option value="7">7일</option>
            <option value="14">14일</option>
            <option value="30">30일</option>
          </select>
          <button
            type="button"
            onClick={handleForecast}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? '예측 중...' : '예측 실행'}
          </button>
        </div>

        {forecasts.length > 0 && (
          <div className="space-y-3">
            {forecasts.map((f) => (
              <div key={`forecast-${f.date}`} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                <div className="w-24 text-sm font-medium text-neutral-900">{f.date}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-medium">예측: {f.predicted}</span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    신뢰구간: {f.lower} ~ {f.upper}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {forecasts.length === 0 && !loading && (
          <div className="text-center py-12 text-neutral-500">
            <Info className="w-8 h-8 mx-auto mb-2" />
            상품 ID를 입력하고 예측 실행을 클릭하세요.
          </div>
        )}
      </div>
    </div>
  )
}