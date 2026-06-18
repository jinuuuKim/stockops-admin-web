import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import type { AxiosResponse } from 'axios'
import { useAIChatSession } from './useAIChatSession'

const sendChatMessage = vi.fn()

vi.mock('@/api/aiChat', () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
}))

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('useAIChatSession error handling', () => {
  it('surfaces a timeout-specific message when the request times out', async () => {
    sendChatMessage.mockRejectedValueOnce(new AxiosError('timeout of 120000ms exceeded', 'ECONNABORTED'))

    const { result } = renderHook(() => useAIChatSession())
    await act(async () => {
      await result.current.send('prophet 모델로 진행해줘')
    })

    const last = result.current.messages.at(-1)
    expect(last?.role).toBe('assistant')
    expect(last?.content).toContain('시간이 초과')
  })

  it('surfaces a permission message on 403', async () => {
    sendChatMessage.mockRejectedValueOnce(
      new AxiosError('Forbidden', 'ERR_BAD_REQUEST', undefined, undefined, { status: 403 } as AxiosResponse),
    )

    const { result } = renderHook(() => useAIChatSession())
    await act(async () => {
      await result.current.send('재고 알려줘')
    })

    expect(result.current.messages.at(-1)?.content).toContain('권한')
  })

  it('surfaces a server-error message on 5xx', async () => {
    sendChatMessage.mockRejectedValueOnce(
      new AxiosError('Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, { status: 503 } as AxiosResponse),
    )

    const { result } = renderHook(() => useAIChatSession())
    await act(async () => {
      await result.current.send('재고 알려줘')
    })

    expect(result.current.messages.at(-1)?.content).toContain('AI 서버')
  })
})
