import { renderHook, act } from '@testing-library/react'
import { useAdminActions } from './useAdminActions'

describe('useAdminActions', () => {
  it('toggles user banned status', () => {
    const { result } = renderHook(() => useAdminActions())
    const users = [
      {
        id: 'U-1',
        username: 'alpha',
        email: 'a@test.com',
        status: 'Active',
        plan: 'Basic',
        registerDate: '2025-01-01',
        expiryDate: '2026-01-01',
      },
    ] as const

    const next = result.current.toggleUserBan(users as any, 'U-1')
    expect(next[0].status).toBe('Banned')
  })

  it('appends support message for admin sender', () => {
    const { result } = renderHook(() => useAdminActions())
    const messages = [{ id: 'm1', sender: 'user', text: 'hi', at: '10:00' }] as const
    const next = result.current.appendSupportMessage(messages as any, 'reply')
    expect(next).toHaveLength(2)
    expect(next[1].sender).toBe('admin')
    expect(next[1].text).toBe('reply')
  })

  it('exposes toast on showToast', () => {
    const { result } = renderHook(() => useAdminActions())
    act(() => {
      result.current.showToast('done', 'success')
    })
    expect(result.current.toast?.message).toBe('done')
  })
})

