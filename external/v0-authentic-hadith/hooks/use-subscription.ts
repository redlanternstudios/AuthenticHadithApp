"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getNativeSubscriptionStatus, isNativeApp } from "@/lib/native-bridge"

export interface UserSubscription {
  isPremium: boolean
  plan: string | null
  status: string | null
  currentPeriodEnd: string | null
  loading: boolean
}

export function useSubscription(): UserSubscription {
  const [sub, setSub] = useState<UserSubscription>({
    isPremium: false,
    plan: null,
    status: null,
    currentPeriodEnd: null,
    loading: true,
  })

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    async function check() {
      // First check native bridge (instant, no network call)
      if (isNativeApp()) {
        const nativeStatus = getNativeSubscriptionStatus()
        if (nativeStatus?.isPro) {
          setSub({
            isPremium: true,
            plan: "native",
            status: "active",
            currentPeriodEnd: null,
            loading: false,
          })
          return
        }
      }

      // Fall back to Supabase check (covers Stripe + RevenueCat webhook syncs)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setSub((prev) => ({ ...prev, loading: false }))
        return
      }

      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing", "lifetime"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setSub({
          isPremium: true,
          plan: data.product_id,
          status: data.status,
          currentPeriodEnd: data.current_period_end,
          loading: false,
        })
        return
      }

      // Fall back to profiles table (covers manually granted lifetime accounts)
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_status, subscription_expires_at")
        .eq("user_id", user.id)
        .single()

      if (profile && (profile.subscription_tier === "premium" || profile.subscription_tier === "lifetime")) {
        setSub({
          isPremium: true,
          plan: profile.subscription_tier,
          status: profile.subscription_status,
          currentPeriodEnd: profile.subscription_expires_at,
          loading: false,
        })
      } else {
        setSub((prev) => ({ ...prev, loading: false }))
      }
    }

    check()

    // Listen for native subscription changes (e.g. user just purchased)
    if (isNativeApp()) {
      const handler = () => {
        const nativeStatus = getNativeSubscriptionStatus()
        if (nativeStatus?.isPro) {
          setSub({
            isPremium: true,
            plan: "native",
            status: "active",
            currentPeriodEnd: null,
            loading: false,
          })
        }
      }
      window.addEventListener("nativeSubscriptionUpdate", handler)
      return () => window.removeEventListener("nativeSubscriptionUpdate", handler)
    }
  }, [])

  return sub
}
