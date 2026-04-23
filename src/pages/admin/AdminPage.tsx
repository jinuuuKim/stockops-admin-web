import { useState, useEffect, useCallback } from 'react'
import { LayoutDashboard, Bell, FileText, Menu } from 'lucide-react'
import api from '@/lib/api'

interface NoticeDTO {
  id: number
  title: string
  content: string
  type: string
  active: boolean
  createdAt: string
}

export function AdminPage() {
  const [notices, setNotices] = useState<NoticeDTO[]>([])

  const fetchActiveNotices = useCallback(async () => {
    try {
      const res = await api.get<NoticeDTO[]>('/notices/active')
      setNotices(res.data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchActiveNotices()
  }, [fetchActiveNotices])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">관리자 대시보드</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">전체 공지</p>
              <p className="text-2xl font-bold text-neutral-900">{notices.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Bell className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">활성 공지</p>
              <p className="text-2xl font-bold text-neutral-900">{notices.filter(n => n.active).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">시스템 로그</p>
              <p className="text-2xl font-bold text-neutral-900">-</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
              <Menu className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">메뉴 수</p>
              <p className="text-2xl font-bold text-neutral-900">12</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">최근 공지</h2>
        {notices.length === 0 ? (
          <p className="text-neutral-500">활성화된 공지가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {notices.slice(0, 5).map(notice => (
              <div key={notice.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <Bell className="w-5 h-5 text-neutral-400" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 truncate">{notice.title}</p>
                  <p className="text-xs text-neutral-500">{notice.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}