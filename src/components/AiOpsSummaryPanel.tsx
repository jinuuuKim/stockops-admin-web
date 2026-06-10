/**
 * AiOpsSummaryPanel — lazy-loaded AI operational summary card.
 *
 * Renders an "AI 운영 요약 보기" button. On first click it fetches the
 * operational summary from Bedrock (server-cached 24h), then displays
 * a card with: summary, urgent items, recommended actions, risk level,
 * source counts (§5.4), and confidence caveat (§5.4).
 *
 * @author StockOps Team
 * @since 2.0
 */

import { useState, type KeyboardEvent } from 'react'
import { fetchOpsSummary } from '@/api/aiOpsSummary'
import type { AiOpsSummaryResponse, RiskLevel } from '@/types/aiOpsSummary'
import {
  Bot,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Database,
} from 'lucide-react'

interface Props {
  /** ISO date string, e.g. "2026-06-10" */
  businessDate: string
  centerId?: number
  warehouseId?: number
}

const RISK_STYLES: Record<RiskLevel, { badge: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  LOW: { badge: 'bg-emerald-100 text-emerald-700', label: '낮음', icon: CheckCircle2 },
  MEDIUM: { badge: 'bg-amber-100 text-amber-700', label: '보통', icon: Info },
  HIGH: { badge: 'bg-red-100 text-red-700', label: '높음', icon: AlertTriangle },
}

const SOURCE_LABELS: Record<string, string> = {
  recommendations: '추천',
  sensorAlerts: '센서 알림',
  criticalExpiry: '만료(긴급)',
  warningExpiry: '만료(경고)',
  overdueShipments: '지연 PO',
}

/**
 * Card that fetches and displays the AI operational summary for a given date / location.
 */
export function AiOpsSummaryPanel({ businessDate, centerId, warehouseId }: Props) {
  const [summary, setSummary] = useState<AiOpsSummaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [caveatExpanded, setCaveatExpanded] = useState(false)

  async function handleOpen() {
    if (open) {
      setOpen(false)
      return
    }
    if (summary) {
      setOpen(true)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchOpsSummary(businessDate, centerId, warehouseId)
      setSummary(data)
      setOpen(true)
    } catch {
      setError('AI 운영 요약을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      void handleOpen()
    }
  }

  const riskConfig = summary ? RISK_STYLES[summary.riskLevel] : null

  // Build source chips from sourceCounts
  const sourceChips = summary
    ? Object.entries(summary.sourceCounts)
        .filter(([, count]) => count != null)
        .map(([key, count]) => ({ key, label: SOURCE_LABELS[key] ?? key, count }))
    : []

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => void handleOpen()}
        onKeyDown={handleKeyDown}
        disabled={loading}
        aria-label="AI 운영 요약 보기"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Bot className="w-4 h-4" />
        {loading ? '분석 중...' : open ? 'AI 운영 요약 닫기' : 'AI 운영 요약 보기'}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {open && summary && riskConfig && (
        <div
          role="region"
          aria-label="AI 운영 요약"
          className="mt-3 p-4 rounded-xl border border-indigo-100 bg-indigo-50 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-indigo-800 text-sm">AI 운영 요약</span>
              <span className="text-xs text-indigo-400">{summary.businessDate}</span>
              <span
                aria-label={`위험도: ${riskConfig.label}`}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${riskConfig.badge}`}
              >
                <riskConfig.icon className="w-3 h-3" />
                위험도: {riskConfig.label}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="text-indigo-400 hover:text-indigo-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Summary */}
          <p className="text-sm text-gray-700 leading-relaxed">{summary.summary}</p>

          {/* Urgent items */}
          {summary.urgentItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                긴급 항목
              </p>
              <ul aria-label="긴급 항목" className="space-y-1">
                {summary.urgentItems.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-red-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended actions */}
          {summary.recommendedActions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                권장 조치
              </p>
              <ul aria-label="권장 조치" className="space-y-1">
                {summary.recommendedActions.map((action, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Source counts (§5.4) */}
          {sourceChips.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Database className="w-3 h-3 text-indigo-400" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  분석 데이터 출처
                </p>
              </div>
              <div
                aria-label="데이터 출처"
                className="flex flex-wrap gap-1.5"
              >
                {sourceChips.map(({ key, label, count }) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-indigo-200 rounded-full text-xs text-indigo-700"
                  >
                    {label} <strong>{count}</strong>건
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Confidence caveat (§5.4, collapsible) */}
          {summary.confidenceCaveat && (
            <div className="border-t border-indigo-100 pt-3">
              <button
                type="button"
                onClick={() => setCaveatExpanded((v) => !v)}
                aria-expanded={caveatExpanded}
                aria-label="신뢰도 안내"
                className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                <Info className="w-3 h-3" />
                신뢰도 안내
                {caveatExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
              {caveatExpanded && (
                <p
                  aria-label="신뢰도 안내 내용"
                  className="mt-1.5 text-xs text-gray-500 leading-relaxed"
                >
                  {summary.confidenceCaveat}
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <p aria-label="생성 시각" className="text-xs text-gray-400">
            생성: {new Date(summary.generatedAt).toLocaleString('ko-KR')}
          </p>
        </div>
      )}
    </div>
  )
}
