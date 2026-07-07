interface ResolveOnboardingStateArgs {
  userId?: string | null
  getLocalFlag: () => Promise<string | null>
  setLocalFlag: (value: string) => Promise<void>
  fetchRemoteFlag?: (userId: string) => Promise<boolean | null>
}

export async function resolveOnboardingState({
  userId,
  getLocalFlag,
  setLocalFlag,
  fetchRemoteFlag,
}: ResolveOnboardingStateArgs): Promise<boolean> {
  const localValue = await getLocalFlag()

  if (localValue === 'true') {
    return true
  }

  if (!userId || !fetchRemoteFlag) {
    return false
  }

  const remoteValue = await fetchRemoteFlag(userId)

  if (remoteValue === true) {
    await setLocalFlag('true')
    return true
  }

  return false
}
