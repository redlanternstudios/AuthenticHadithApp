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

  if (!userId || !fetchRemoteFlag) {
    return localValue === 'true'
  }

  const remoteValue = await fetchRemoteFlag(userId)

  if (remoteValue === true) {
    await setLocalFlag('true')
    return true
  }

  if (remoteValue === false) {
    return false
  }

  if (localValue === 'true') {
    return true
  }

  return false
}
