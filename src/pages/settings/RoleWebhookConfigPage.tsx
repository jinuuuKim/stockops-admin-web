/**
 * Role → Teams channel mapping page. Admins map an application role to a Teams webhook
 * so notices/announcements targeting that role are delivered to its channel.
 *
 * @author StockOps Team
 * @since 2.3
 */

import { useState } from 'react'
import { X, Plus, Trash2, Power } from 'lucide-react'
import {
  useRoleWebhookConfigs,
  useCreateRoleWebhookConfig,
  useDeleteRoleWebhookConfig,
} from '@/hooks/useRoleWebhookConfigs'
import { useAdminRoles } from '@/hooks/useAdmin'
import type { RoleWebhookConfig } from '@/types/roleWebhook'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { showToast } from '@/lib/toast'

function isValidTeamsWebhookUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false
    return url.hostname.endsWith('webhook.office.com') || url.hostname.endsWith('logic.azure.com')
  } catch {
    return false
  }
}

interface FormState {
  role: string
  webhookUrl: string
  enabled: boolean
}

const INITIAL_FORM: FormState = { role: '', webhookUrl: '', enabled: true }

export function RoleWebhookConfigPage() {
  const { data: configs = [], isLoading } = useRoleWebhookConfigs()
  const { data: roles = [] } = useAdminRoles()
  const createMutation = useCreateRoleWebhookConfig()
  const deleteMutation = useDeleteRoleWebhookConfig()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RoleWebhookConfig | null>(null)

  function openModal() {
    setForm(INITIAL_FORM)
    setFormError(null)
    setIsModalOpen(true)
  }

  async function handleSubmit() {
    if (!form.role) {
      setFormError('역할을 선택하세요.')
      return
    }
    if (!isValidTeamsWebhookUrl(form.webhookUrl)) {
      setFormError('유효한 Microsoft Teams webhook URL을 입력하세요 (webhook.office.com 또는 logic.azure.com).')
      return
    }
    try {
      await createMutation.mutateAsync({
        role: form.role,
        providerType: 'TEAMS',
        webhookUrl: form.webhookUrl.trim(),
        enabled: form.enabled,
      })
      showToast({ message: '역할 채널이 추가되었습니다.', variant: 'success' })
      setIsModalOpen(false)
    } catch {
      showToast({ message: '역할 채널 추가에 실패했습니다.', variant: 'error' })
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      showToast({ message: '역할 채널이 삭제되었습니다.', variant: 'success' })
    } catch {
      showToast({ message: '역할 채널 삭제에 실패했습니다.', variant: 'error' })
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">역할 채널</h1>
          <p className="text-sm text-text-secondary mt-1">
            역할을 Microsoft Teams 채널에 매핑합니다. 공지/전체알림이 대상 역할의 채널로 발송됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" /> 역할 채널 추가
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-text-secondary">
            <tr>
              <th className="px-4 py-2">역할</th>
              <th className="px-4 py-2">Provider</th>
              <th className="px-4 py-2">상태</th>
              <th className="px-4 py-2 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-text-secondary">불러오는 중…</td>
              </tr>
            ) : configs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-text-secondary">등록된 역할 채널이 없습니다.</td>
              </tr>
            ) : (
              configs.map((config) => (
                <tr key={config.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium text-text-primary">{config.role}</td>
                  <td className="px-4 py-3 text-text-secondary">{config.providerType}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                        config.enabled ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      <Power className="h-3 w-3" /> {config.enabled ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(config)}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-text-secondary hover:bg-neutral-50"
                    >
                      <Trash2 className="h-4 w-4" /> 삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">역할 채널 추가</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm text-text-secondary">
                <span>역할</span>
                <select
                  value={form.role}
                  onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">역할 선택</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-text-secondary">
                <span>Microsoft Teams webhook URL</span>
                <input
                  type="url"
                  value={form.webhookUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, webhookUrl: event.target.value }))}
                  placeholder="https://...webhook.office.com/..."
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                활성화
              </label>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-text-secondary hover:bg-neutral-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="역할 채널 삭제"
        description="이 역할 채널 매핑을 삭제하시겠습니까?"
        variant="destructive"
        confirmLabel="삭제"
      />
    </div>
  )
}
