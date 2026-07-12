"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeft, Check, X, Star, Crown, Infinity, RotateCcw,
  BookOpen, Search, Brain, FolderOpen, GraduationCap, HelpCircle, Sparkles,
} from "lucide-react"
import { PRODUCTS, TIER_FEATURES } from "@/lib/products"
import type { Product } from "@/lib/products"
import { isNativeApp, showNativePaywall, restoreNativePurchases } from "@/lib/native-bridge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const Checkout = dynamic(() => import("@/components/checkout"), { ssr: false })

/* ── Price display helpers ─────────────────────────────────── */

function PriceTag({ product }: { product: Product }) {
  if (product.interval === "year") {
    const monthly = (product.priceInCents / 100 / 12).toFixed(2)
    return (
      <div>
        <span className="text-3xl font-bold text-foreground">${(product.priceInCents / 100).toFixed(2)}</span>
        <span className="text-sm text-muted-foreground ml-1">/year</span>
        <div className="text-xs text-[#C5A059] font-medium mt-0.5">${monthly}/mo billed yearly</div>
      </div>
    )
  }
  if (product.interval === "month") {
    return (
      <div>
        <span className="text-3xl font-bold text-foreground">${(product.priceInCents / 100).toFixed(2)}</span>
        <span className="text-sm text-muted-foreground ml-1">/month</span>
      </div>
    )
  }
  return (
    <div>
      <span className="text-3xl font-bold text-foreground">${(product.priceInCents / 100).toFixed(2)}</span>
      <span className="text-sm text-muted-foreground ml-1">one-time</span>
    </div>
  )
}

/* ── Comparison table rows ─────────────────────────────────── */

type RowValue = boolean | string

interface ComparisonRow {
  feature: string
  explorer: RowValue
  pro: RowValue
  founding: RowValue
}

const COMPARISON: ComparisonRow[] = [
  { feature: "Browse all 8 collections", explorer: true, pro: true, founding: true },
  { feature: "Full hadith text (Arabic + English)", explorer: true, pro: true, founding: true },
  { feature: "Narrator chain & grading", explorer: true, pro: true, founding: true },
  { feature: "Topic browsing", explorer: true, pro: true, founding: true },
  { feature: "Basic search", explorer: true, pro: true, founding: true },
  { feature: "Advanced search + synonyms", explorer: false, pro: true, founding: true },
  { feature: "Tag filtering & semantic search", explorer: false, pro: true, founding: true },
  { feature: "Saved hadiths", explorer: "Up to 40", pro: "Unlimited", founding: "Unlimited" },
  { feature: "Folders & organization", explorer: false, pro: true, founding: true },
  { feature: "AI explanations", explorer: "3/day", pro: "Unlimited", founding: "Unlimited" },
  { feature: "AI mode", explorer: "Light", pro: "Deep (context + clarity)", founding: "Deep (context + clarity)" },
  { feature: "Learning paths", explorer: "Beginner", pro: "All (Advanced + Scholar)", founding: "All (Advanced + Scholar)" },
  { feature: "Quizzes", explorer: "1/day", pro: "Unlimited", founding: "Unlimited" },
  { feature: "Priority support", explorer: false, pro: true, founding: true },
  { feature: "Early access features", explorer: false, pro: true, founding: true },
  { feature: "Founding member badge", explorer: false, pro: false, founding: true },
  { feature: "All future features", explorer: false, pro: false, founding: true },
]

function CellValue({ value }: { value: RowValue }) {
  if (value === true) return <Check className="w-4 h-4 text-[#1B5E43] dark:text-[#6bb895] mx-auto" />
  if (value === false) return <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
  return <span className="text-xs font-medium text-foreground">{value}</span>
}

/* ── Plan card icons ───────────────────────────────────────── */

const planIcons: Record<string, React.ReactNode> = {
  "monthly-premium": <Star className="w-5 h-5 text-[#C5A059]" />,
  "annual-premium": <Crown className="w-5 h-5 text-[#C5A059]" />,
  "lifetime-access": <Infinity className="w-5 h-5 text-[#C5A059]" />,
}

/* ── Plan alias normalization ─────────────────────────────── */

// Maps common URL variations to canonical product IDs
const PLAN_ALIASES: Record<string, string> = {
  "monthly": "monthly-premium",
  "annual": "annual-premium",
  "lifetime": "lifetime-access",
  "monthly-premium": "monthly-premium",
  "annual-premium": "annual-premium",
  "lifetime-access": "lifetime-access",
  // Also handle potential typos/variations
  "pro": "monthly-premium",
  "pro-monthly": "monthly-premium",
  "pro-annual": "annual-premium",
  "founding": "lifetime-access",
}

function normalizeAndValidatePlan(planParam: string | null): Product | null {
  if (!planParam) return null
  const normalizedId = PLAN_ALIASES[planParam.toLowerCase()] || planParam
  return PRODUCTS.find((p) => p.id === normalizedId) || null
}

/* ── Main pricing content ──────────────────────────────────── */

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planFromUrl = searchParams.get("plan")
  const validPlan = normalizeAndValidatePlan(planFromUrl)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [isNative, setIsNative] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    setIsNative(isNativeApp())

    // If a plan is in the URL, verify the user is logged in before showing checkout
    if (validPlan) {
      const supabase = getSupabaseBrowserClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setSelectedProduct(validPlan.id)
        } else {
          // Not logged in -- redirect to login with return URL
          const returnUrl = encodeURIComponent(`/pricing?plan=${validPlan.id}`)
          router.push(`/login?redirect=${returnUrl}`)
        }
        setAuthChecked(true)
      })
    } else {
      setAuthChecked(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectPlan = async (planId: string) => {
    if (isNative) {
      handleNativeSubscribe()
      return
    }
    // Check if user is logged in before showing Stripe checkout
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const returnUrl = encodeURIComponent(`/pricing?plan=${planId}`)
      router.push(`/login?redirect=${returnUrl}`)
      return
    }
    setSelectedProduct(planId)
  }

  const handleNativeSubscribe = async () => {
    const success = await showNativePaywall()
    if (success) router.push("/home")
  }

  const handleNativeRestore = async () => {
    setIsRestoring(true)
    const restored = await restoreNativePurchases()
    setIsRestoring(false)
    if (restored) router.push("/home")
  }

  /* Stripe checkout view */
  if (selectedProduct) {
    return (
      <div className="min-h-screen marble-bg pb-20 md:pb-0">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => { setSelectedProduct(null); setCheckoutError(null) }}
              className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Complete Payment</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          {checkoutError ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{checkoutError}</p>
              <button
                onClick={() => { setCheckoutError(null); setSelectedProduct(null) }}
                className="px-6 py-2 gold-button rounded-lg text-sm"
              >
                Back to Plans
              </button>
            </div>
          ) : (
            <Checkout productId={selectedProduct} />
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Choose Your Plan</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-balance">
            Study deeper. Understand context. Grow consistently.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-pretty">
            Authentic Hadith is free to explore. Upgrade when you want deeper AI insights,
            advanced search, and unlimited learning tools.
          </p>
        </div>

        {/* ── Explorer (Free) card ──────────────────────────── */}
        <div className="mb-6 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1B5E43]/10 dark:bg-[#4a9973]/15 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-[#1B5E43] dark:text-[#6bb895]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Explorer</h3>
                <p className="text-sm text-muted-foreground">Your public library of authentic hadith</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-foreground">Free</div>
              <div className="text-xs text-[#1B5E43] dark:text-[#6bb895] font-medium">Forever</div>
            </div>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {TIER_FEATURES.explorer.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-foreground/80">
                <Check className="w-4 h-4 text-[#1B5E43] dark:text-[#6bb895] shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upgrade for depth</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ── Paid plan cards ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {PRODUCTS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-xl p-5 flex flex-col transition-all",
                plan.highlighted
                  ? "gold-border premium-card ring-2 ring-[#C5A059]/30"
                  : plan.id === "lifetime-access"
                    ? "border-2 border-[#1B5E43]/40 dark:border-[#4a9973]/40 bg-card"
                    : "border border-border bg-card"
              )}
            >
              {plan.badge && (
                <div
                  className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-xs font-bold whitespace-nowrap",
                    plan.highlighted
                      ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D]"
                      : "bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B]"
                  )}
                >
                  {plan.badge}
                </div>
              )}

              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                  {planIcons[plan.id]}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">{plan.tierLabel}</span>
              </div>

              <PriceTag product={plan} />

              <p className="text-sm text-muted-foreground mt-2 mb-4 flex-1">{plan.description}</p>

              {plan.features && (
                <ul className="space-y-2 mb-5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="w-4 h-4 text-[#1B5E43] dark:text-[#6bb895] shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={() => handleSelectPlan(plan.id)}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold text-sm transition-all mt-auto",
                  plan.highlighted
                    ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white hover:opacity-90 shadow-md"
                    : plan.id === "lifetime-access"
                      ? "bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B] text-white hover:opacity-90 shadow-md"
                      : "bg-background border border-border text-foreground hover:border-[#C5A059] hover:text-[#C5A059]"
                )}
              >
                {plan.trialDays ? `Start ${plan.trialDays}-Day Free Trial` : plan.mode === "payment" ? "Get Founding Access" : "Subscribe Now"}
              </button>
            </div>
          ))}
        </div>

        {/* ── Why upgrade? ──────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 mb-10">
          <h3 className="text-base font-semibold text-foreground mb-1">Why upgrade?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Study deeper, understand context, build consistent growth.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Brain, title: "Deep AI Mode", desc: "Context-aware explanations with scholarly depth -- not just translations." },
              { icon: Search, title: "Advanced Search", desc: "Synonym expansion, tag filtering, and semantic search across all collections." },
              { icon: GraduationCap, title: "Full Learning Paths", desc: "Advance from beginner to scholar-level modules with unlimited quizzes." },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#C5A059]/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-[#C5A059]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature comparison table ──────────────────────── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">Full Feature Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[40%]">Feature</th>
                  <th className="text-center py-3 px-3 font-medium text-muted-foreground">
                    <span className="block text-xs">Explorer</span>
                    <span className="text-[10px] text-[#1B5E43] dark:text-[#6bb895]">Free</span>
                  </th>
                  <th className="text-center py-3 px-3 font-medium text-[#C5A059]">
                    <span className="block text-xs">Pro</span>
                    <span className="text-[10px]">$9.99/mo</span>
                  </th>
                  <th className="text-center py-3 px-3 font-medium text-[#1B5E43] dark:text-[#6bb895]">
                    <span className="block text-xs">Founding</span>
                    <span className="text-[10px]">$99.99</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={cn("border-b border-border last:border-0", i % 2 === 0 && "bg-muted/10")}>
                    <td className="py-2.5 px-4 text-foreground/80">{row.feature}</td>
                    <td className="py-2.5 px-3 text-center"><CellValue value={row.explorer} /></td>
                    <td className="py-2.5 px-3 text-center"><CellValue value={row.pro} /></td>
                    <td className="py-2.5 px-3 text-center"><CellValue value={row.founding} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Restore Purchases */}
        {isNative && (
          <button
            onClick={handleNativeRestore}
            disabled={isRestoring}
            className="w-full py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 mb-4"
          >
            <RotateCcw className={cn("w-4 h-4", isRestoring && "animate-spin")} />
            {isRestoring ? "Restoring..." : "Restore Purchases"}
          </button>
        )}

        {/* Fine print */}
        <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
          You can cancel anytime from your profile settings or device subscription manager.
          No charge until your free trial ends. Prices shown in USD.
        </p>
      </main>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen marble-bg flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  )
}
