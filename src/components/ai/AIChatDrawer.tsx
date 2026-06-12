import { useState } from 'react'
import { MessageCircle, Send, SquarePen, X } from 'lucide-react'
import { useAIChatSession } from '@/hooks/useAIChatSession'

/**
 * Floating admin AI chat drawer. Quick-access companion to the full AI chat page,
 * with session-only persistence (no DB, no cookie). Available from any admin screen.
 */
export function AIChatDrawer() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const { messages, send, clear, isSending, providerNotice } = useAIChatSession()

  function submit(): void {
    const next = draft.trim()
    if (!next) return
    send(next)
    setDraft('')
  }

  return (
    <>
      <button
        type="button"
        className="fixed bottom-20 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-colors hover:bg-primary-700 md:bottom-6"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'AI 챗봇 닫기' : 'AI 챗봇 열기'}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
      {open && (
        <section className="fixed bottom-36 right-5 z-40 flex h-[32rem] w-[min(24rem,calc(100vw-2.5rem))] flex-col rounded-lg border border-neutral-200 bg-white shadow-xl md:bottom-20">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <strong>AI 챗봇</strong>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded p-1 hover:bg-neutral-100 disabled:opacity-40"
                onClick={clear}
                disabled={messages.length === 0}
                aria-label="새 세션"
                title="새 세션"
              >
                <SquarePen className="h-4 w-4" />
              </button>
              <button type="button" className="rounded p-1 hover:bg-neutral-100" onClick={() => setOpen(false)} aria-label="AI 챗봇 닫기">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {providerNotice && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800" role="status">
              {providerNotice}
            </div>
          )}
          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {messages.map((message) => (
              <div key={message.id} className={message.role === 'user' ? 'ml-auto max-w-[85%] rounded-lg bg-primary-600 px-3 py-2 text-sm text-white' : 'mr-auto max-w-[85%] rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-900'}>
                {message.content}
              </div>
            ))}
            {messages.length === 0 && <p className="py-8 text-center text-sm text-neutral-500">운영 현황이나 재고 이슈를 질문해보세요.</p>}
          </div>
          <form
            className="flex items-center gap-2 border-t border-neutral-200 p-3"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <input
              className="min-w-0 flex-1 rounded border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="질문 입력"
            />
            <button type="submit" className="rounded bg-primary-600 p-2 text-white disabled:opacity-50" disabled={isSending} aria-label="메시지 보내기">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
    </>
  )
}
