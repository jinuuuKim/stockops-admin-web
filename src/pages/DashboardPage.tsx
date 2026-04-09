/**
 * Dashboard page component.
 * Main landing page after login showing system overview.
 * Redesigned to match web_proto with stats cards, alerts, and AI widget.
 *
 * @author StockOps Team
 * @since 1.0
 */

import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardSummary, useDashboardTransactions } from '@/hooks/useDashboard'
import { StatCard } from '@/components/ui/StatCard'
import { AlertItem } from '@/components/ui/AlertItem'
import { ActivityItem } from '@/components/ui/ActivityItem'
import { AIBanner } from '@/components/ui/AIBanner'
import { ArrowDownToLine, ArrowUpFromLine, Package, RefreshCw } from 'lucide-react'

/**
 * Dashboard page displaying welcome message and system overview.
 * Shows key metrics, recent transactions, and quick actions.
 *
 * @returns Dashboard page JSX element
 */
export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const { data: summary, isLoading, refetch } = useDashboardSummary()
  const { data: transactions } = useDashboardTransactions(5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">대시보드</h1>
          <p className="text-text-secondary mt-1">
            안녕하세요, <span className="font-medium">{user?.name || '관리자'}</span>님! 
            현재 시스템 현황을 확인하세요.
          </p>
        </div>
        <button 
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="📦"
          label="전체 품목"
          value={summary?.totalProducts ?? 0}
          variant="default"
        />
        <StatCard
          icon="⚠️"
          label="유통기한 임박"
          value={summary?.criticalExpiryCount ?? 0}
          change="3일 이내"
          variant="warning"
        />
        <StatCard
          icon="🌡️"
          label="환경 상태"
          value="정상"
          change="4.2°C / 65%"
          variant="success"
        />
        <StatCard
          icon="📊"
          label="오늘 입출고"
          value={`${summary?.todayInboundCount ?? 0} / ${summary?.todayOutboundCount ?? 0}`}
          change="입고 / 출고"
          variant="default"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
        <h2 className="text-lg font-semibold mb-4 text-text-primary">빠른 작업</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/inbound"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <ArrowDownToLine className="w-5 h-5" />
            입고 등록
          </Link>
          <Link
            to="/outbound"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <ArrowUpFromLine className="w-5 h-5" />
            출고 등록
          </Link>
          <Link
            to="/inventory"
            className="flex items-center gap-2 px-5 py-2.5 bg-neutral-100 text-text-primary border border-neutral-200 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
          >
            <Package className="w-5 h-5" />
            상품 등록
          </Link>
        </div>
      </div>

      {/* Alerts Section */}
      {(summary?.criticalExpiryCount ?? 0) > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <h2 className="text-lg font-semibold mb-4 text-text-primary">⚠️ 주요 알림</h2>
          <div className="space-y-3">
            <AlertItem
              type="danger"
              icon="🔥"
              title="유통기한 임박"
              message={`${summary?.criticalExpiryCount}개 품목이 3일 이내에 만료됩니다`}
              timestamp="5분 전"
              actionLabel="확인하기"
              onAction={() => {}}
            />
            {summary?.lowStockCount && summary.lowStockCount > 0 && (
              <AlertItem
                type="warning"
                icon="📉"
                title="재고 부족"
                message={`${summary.lowStockCount}개 품목의 재고가 안전재고 이하입니다`}
                timestamp="1시간 전"
                actionLabel="확인하기"
                onAction={() => {}}
              />
            )}
          </div>
        </div>
      )}

      {/* AI Banner */}
      <AIBanner
        title="AI 추천"
        description="다음 주 주말 매출 증가 예상 (15%). 생수, 과자류 안전재고를 늘리는 것을 추천합니다."
        actionLabel="자동 발주"
        onAction={() => {}}
      />

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
        <h2 className="text-lg font-semibold mb-4 text-text-primary">최근 활동</h2>
        {transactions && transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx) => (
              <ActivityItem
                key={tx.id}
                time={new Date(tx.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                type={tx.type === 'INBOUND' ? 'inbound' : tx.type === 'OUTBOUND' ? 'outbound' : 'adjust'}
                description={`${tx.productName} - ${tx.type === 'INBOUND' ? '+' : '-'}${tx.quantity}개`}
                user={tx.createdBy?.toString() || '시스템'}
              />
            ))}
          </div>
        ) : (
          <p className="text-text-secondary text-center py-8">최근 활동이 없습니다</p>
        )}
      </div>
    </div>
  )
}
