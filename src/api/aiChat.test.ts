import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendChatMessage } from './aiChat'
import api from '@/lib/api'

vi.mock('@/lib/api', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}))

const mockedApi = api as unknown as { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> }

afterEach(() => {
  vi.clearAllMocks()
})

describe('sendChatMessage (async job + polling)', () => {
  it('creates a job, polls until DONE, and adapts the result', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { jobId: 'job-1' } })
    mockedApi.get
      .mockResolvedValueOnce({ data: { jobId: 'job-1', status: 'PENDING' } })
      .mockResolvedValueOnce({
        data: {
          jobId: 'job-1',
          status: 'DONE',
          result: { answer: '안녕하세요', sessionId: 's1', actionSuggested: false, notice: null, sessionReset: false },
        },
      })

    const res = await sendChatMessage({ message: '안녕하세요' })

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/v1/ai/bedrock/assistant/jobs',
      expect.objectContaining({ message: '안녕하세요' }),
    )
    expect(res.message).toBe('안녕하세요')
    expect(res.sessionId).toBe('s1')
    expect(res.provider).toBe('bedrock')
  })

  it('throws when the job ends in ERROR (so the hook surfaces the failure)', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { jobId: 'job-2' } })
    mockedApi.get.mockResolvedValueOnce({ data: { jobId: 'job-2', status: 'ERROR', error: 'boom' } })

    await expect(sendChatMessage({ message: 'hi' })).rejects.toThrow('boom')
  })
})
