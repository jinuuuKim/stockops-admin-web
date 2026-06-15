import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AIChatDrawer } from './AIChatDrawer'

const send = vi.fn()
const clear = vi.fn()

vi.mock('@/hooks/useAIChatSession', () => ({
  useAIChatSession: () => ({
    messages: [
      { id: 'm1', role: 'assistant', content: '관리자 AI 응답', createdAt: '2026-06-10T00:00:00.000Z' },
    ],
    send,
    clear,
    isSending: false,
    providerNotice: '',
  }),
}))

describe('AIChatDrawer', () => {
  it('opens, sends, and clears admin AI chat messages', () => {
    render(<AIChatDrawer />)

    fireEvent.click(screen.getByRole('button', { name: 'AI 챗봇 열기' }))
    expect(screen.getByText('관리자 AI 응답')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('질문 입력'), { target: { value: '재고 위험 알려줘' } })
    fireEvent.click(screen.getByRole('button', { name: '메시지 보내기' }))
    expect(send).toHaveBeenCalledWith('재고 위험 알려줘')

    fireEvent.click(screen.getByRole('button', { name: '새 세션' }))
    expect(clear).toHaveBeenCalled()
  })
})
