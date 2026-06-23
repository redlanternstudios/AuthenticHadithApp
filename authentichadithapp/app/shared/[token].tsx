import React from 'react'
import { Redirect, useLocalSearchParams } from 'expo-router'

// Deep-link alias for shared folders.
// The app's share action emits links of the form .../shared/<token>
// (see app/my-hadith/folder/[id].tsx), but the viewer lives at
// /my-hadith/shared/[token]. This thin route forwards /shared/<token> to the
// real viewer so BOTH path shapes resolve, and no viewer logic is duplicated.
//
// Works today via the registered custom scheme:
//   authentichadithapp://shared/<token>   ->   /my-hadith/shared/<token>
// Works for universal https links once ios.associatedDomains + the website
// apple-app-site-association are live (those need a new native build).
export default function SharedFolderRedirect() {
  const { token } = useLocalSearchParams<{ token: string }>()

  if (!token) {
    return <Redirect href="/my-hadith" />
  }

  return <Redirect href={`/my-hadith/shared/${token}`} />
}
