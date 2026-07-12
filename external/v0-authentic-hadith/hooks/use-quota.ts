"use client"

import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export interface UserQuota {
  tier: "free" | "premium" | "lifetime"
  isPremium: boolean
  usage: {
    saves: number
    savesLimit: number
    savesRemaining: number
    aiToday: number
    aiDailyLimit: number
    aiRemaining: number
    quizzesToday: number
    quizDailyLimit: number
    quizzesRemaining: number
  }
}

export function useQuota() {
  const { data, error, isLoading, mutate } = useSWR<UserQuota>("/api/user/quota", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 30000,
  })

  return {
    quota: data ?? null,
    loading: isLoading,
    error,
    refresh: mutate,
  }
}
