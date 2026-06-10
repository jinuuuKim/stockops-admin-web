/**
 * Environment alert handling page.
 * Lists active sensor warning/danger events and handled history, shows details,
 * and lets an administrator record a handling note when acknowledging an alert.
 *
 * @author StockOps Team
 * @since 2.2
 */

import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { useAcknowledgeEnvironmentAlert, useEnvironmentAlerts } from '@/hooks/useEnvironment'
import type { AlertSeverity, SensorAlert } from '@/types/environment'

type AlertStatus = 'ACTIVE' | 'AUTO_RESOLVED' | 'ACKNOWLEDGED'

function statusOf(alert: SensorAlert): AlertStatus {
  if (alert.acknowledged) return 'ACKNOWLEDGED'
  if (alert.resolvedAt) return 'AUTO_RESOLVED'
  return 'ACTIVE'
}

const STATUS_LABEL: Record<AlertStatus, string> = {
  ACTIVE: '처리 필요',
  AUTO_RESOLVED: '자동 해제 (정상화)',
  ACKNOWLEDGED: '처리 완료',
}

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  INFO: '정보',
  WARNING: '주의',
  CRITICAL: '위험',
}

function severityClass(severity: AlertSeverity): string {
  if (severity === 'CRITICAL') return 'bg-error/10 text-error'
  if (severity === 'WARNING') return 'bg-warning/10 text-warning'
  return 'bg-neutral-100 text-neutral-600'
}

function formatDateTime(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('ko-KR')
}

export function EnvironmentAlertsPage() {
  const alertsQuery = useEnvironmentAlerts(30)
  const acknowledgeMutation = useAcknowledgeEnvironmentAlert()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [note, setNote] = useState('')

  const alerts = useMemo(() => alertsQuery.data ?? [], [alertsQuery.data])

  const activeAlerts = useMemo(
    () =>
      alerts
        .filter((alert) => statusOf(alert) === 'ACTIVE')
        .sort((a, b) => {
          if (a.severity !== b.severity) return a.severity === 'CRITICAL' ? -1 : 1
          return b.createdAt.localeCompare(a.createdAt)
        }),
    [alerts],
  )

  const handledAlerts = useMemo(
    () =>
      alerts
        .filter((alert) => statusOf(alert) !== 'ACTIVE')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [alerts],
  )

  const selected = useMemo(
    () => alerts.find((alert) => alert.id === selectedId) ?? null,
    [alerts, selectedId],
  )

  function select(alert: SensorAlert): void {
    setSelectedId(alert.id)
    setNote(alert.acknowledgementNote ?? '')
  }

  function submit(): void {
    if (!selected) return
    acknowledgeMutation.mutate(
      { id: selected.id, note: note.trim() },
      { onSuccess: () => setNote('') },
    )
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-xl font-bold text-text-primary">환경 알림 처리</h1>
        <p className="mt-1 text-sm text-text-secondary">
          센서 주의·위험 이벤트를 확인하고 처리내용을 기록하세요. 알림은 센서가 정상화되거나 관리자가 처리할 때까지 유지됩니다.
        </p>
      </header>

      {alertsQuery.isLoading ? (
        <p className="text-sm text-text-secondary">알림을 불러오는 중입니다…</p>
      ) : alertsQuery.isError ? (
        <p className="text-sm text-error" role="alert">
          환경 알림을 불러오지 못했습니다. 잠시 후 다시 시도하세요.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <ShieldAlert className="h-5 w-5 text-error" />
                처리 필요 ({activeAlerts.length})
              </h2>
              {activeAlerts.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-secondary">처리할 활성 알림이 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {activeAlerts.map((alert) => (
                    <li key={alert.id}>
                      <button
                        type="button"
                        onClick={() => select(alert)}
                        aria-label={`알림 선택: ${alert.sensorName ?? alert.sensorId} ${SEVERITY_LABEL[alert.severity]}`}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                          selectedId === alert.id ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-text-primary">
                            {alert.sensorName ?? `센서 #${alert.sensorId ?? '-'}`}
                          </span>
                          <span className="block truncate text-xs text-text-secondary">{alert.message}</span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${severityClass(alert.severity)}`}>
                          {SEVERITY_LABEL[alert.severity]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <CheckCircle2 className="h-5 w-5 text-success" />
                처리 내역 ({handledAlerts.length})
              </h2>
              {handledAlerts.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-secondary">처리된 알림 내역이 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {handledAlerts.map((alert) => (
                    <li key={alert.id}>
                      <button
                        type="button"
                        onClick={() => select(alert)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                          selectedId === alert.id ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-text-primary">
                            {alert.sensorName ?? `센서 #${alert.sensorId ?? '-'}`}
                          </span>
                          <span className="block truncate text-xs text-text-secondary">{STATUS_LABEL[statusOf(alert)]} · {formatDateTime(alert.createdAt)}</span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${severityClass(alert.severity)}`}>
                          {SEVERITY_LABEL[alert.severity]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold">상세 및 처리</h2>
            {!selected ? (
              <p className="py-10 text-center text-sm text-text-secondary">왼쪽에서 알림을 선택하세요.</p>
            ) : (
              <div className="space-y-4">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">센서</dt>
                    <dd className="font-medium text-text-primary">{selected.sensorName ?? `센서 #${selected.sensorId ?? '-'}`}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">심각도</dt>
                    <dd><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${severityClass(selected.severity)}`}>{SEVERITY_LABEL[selected.severity]}</span></dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">상태</dt>
                    <dd className="font-medium text-text-primary">{STATUS_LABEL[statusOf(selected)]}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">발생 시각</dt>
                    <dd className="text-text-primary">{formatDateTime(selected.createdAt)}</dd>
                  </div>
                  {selected.resolvedAt && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-text-secondary">정상화 시각</dt>
                      <dd className="text-text-primary">{formatDateTime(selected.resolvedAt)}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-text-secondary">내용</dt>
                    <dd className="mt-1 rounded-lg bg-neutral-50 p-3 text-text-primary whitespace-pre-wrap">{selected.message}</dd>
                  </div>
                  {selected.acknowledged && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-text-secondary">처리자</dt>
                      <dd className="text-text-primary">{selected.acknowledgedBy ?? '-'} · {formatDateTime(selected.acknowledgedAt)}</dd>
                    </div>
                  )}
                </dl>

                <div>
                  <label htmlFor="ack-note" className="mb-1 block text-sm font-medium text-text-primary">처리내용</label>
                  <textarea
                    id="ack-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder="처리내용을 입력하세요 (예: 센서 교체, 환기 조치 등)"
                    className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {acknowledgeMutation.isError && (
                  <p className="text-sm text-error" role="alert">처리 저장에 실패했습니다. 잠시 후 다시 시도하세요.</p>
                )}

                <button
                  type="button"
                  onClick={submit}
                  disabled={acknowledgeMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {selected.acknowledged ? '처리내용 수정' : '처리 완료'}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
