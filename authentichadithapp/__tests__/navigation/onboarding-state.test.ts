import { resolveOnboardingState } from '@/lib/onboarding/onboarding-state'

describe('resolveOnboardingState', () => {
  it('uses remote completion before stale local cache for signed in users', async () => {
    const fetchRemoteFlag = jest.fn()
    const setLocalFlag = jest.fn()

    await expect(resolveOnboardingState({
      userId: 'user-1',
      getLocalFlag: jest.fn().mockResolvedValue('true'),
      setLocalFlag,
      fetchRemoteFlag: fetchRemoteFlag.mockResolvedValue(false),
    })).resolves.toBe(false)

    expect(fetchRemoteFlag).toHaveBeenCalledWith('user-1')
    expect(setLocalFlag).not.toHaveBeenCalled()
  })

  it('uses local completion only when remote onboarding lookup is unavailable', async () => {
    const setLocalFlag = jest.fn()

    await expect(resolveOnboardingState({
      userId: 'user-1',
      getLocalFlag: jest.fn().mockResolvedValue('true'),
      setLocalFlag,
      fetchRemoteFlag: jest.fn().mockResolvedValue(null),
    })).resolves.toBe(true)

    expect(setLocalFlag).not.toHaveBeenCalled()
  })

  it('hydrates local completion from Supabase for returning users', async () => {
    const setLocalFlag = jest.fn().mockResolvedValue(undefined)

    await expect(resolveOnboardingState({
      userId: 'user-1',
      getLocalFlag: jest.fn().mockResolvedValue(null),
      setLocalFlag,
      fetchRemoteFlag: jest.fn().mockResolvedValue(true),
    })).resolves.toBe(true)

    expect(setLocalFlag).toHaveBeenCalledWith('true')
  })

  it('keeps new users in onboarding when no completion exists', async () => {
    const setLocalFlag = jest.fn()

    await expect(resolveOnboardingState({
      userId: 'user-1',
      getLocalFlag: jest.fn().mockResolvedValue(null),
      setLocalFlag,
      fetchRemoteFlag: jest.fn().mockResolvedValue(false),
    })).resolves.toBe(false)

    expect(setLocalFlag).not.toHaveBeenCalled()
  })

  it('does not mark logged out users onboarded without a local completion flag', async () => {
    await expect(resolveOnboardingState({
      userId: null,
      getLocalFlag: jest.fn().mockResolvedValue(null),
      setLocalFlag: jest.fn(),
    })).resolves.toBe(false)
  })
})
