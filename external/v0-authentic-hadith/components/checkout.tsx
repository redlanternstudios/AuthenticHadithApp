"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { startCheckoutSession } from "@/app/actions/stripe"
import { AlertCircle, LogIn, RotateCcw, ArrowLeft } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function Checkout({ productId }: { productId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const fetchClientSecret = useCallback(async () => {
    try {
      setError(null)
      const result = await startCheckoutSession(productId)
      if (result) {
        setSessionId(result.sessionId)
      }
      return result?.clientSecret ?? ""
    } catch (err) {
      // Extract a user-friendly error message
      let message = "Failed to start checkout. Please try again."
      if (err instanceof Error) {
        message = err.message
        // Clean up any server-side error prefixes
        if (message.includes("Error: ")) {
          message = message.replace(/^Error:\s*/i, "")
        }
      }
      // Check for common Stripe errors and provide helpful messages
      if (message.includes("No such price") || message.includes("Invalid price")) {
        message = "This plan is temporarily unavailable. Please try another plan or contact support."
      } else if (message.includes("logged in") || message.includes("must be logged")) {
        message = "Please sign in to continue with your purchase."
      } else if (message.includes("configuration") || message.includes("API Key")) {
        message = "Payment system is temporarily unavailable. Please try again later."
      }
      setError(message)
      throw err
    }
  }, [productId])

  const handleComplete = useCallback(() => {
    const query = sessionId ? `?session_id=${sessionId}` : ""
    router.push(`/checkout/success${query}`)
  }, [router, sessionId])

  const handleRetry = () => {
    setError(null)
    setKey((k) => k + 1)
  }

  const handleBackToPlans = () => {
    router.push("/pricing")
  }

  if (error) {
    const isAuthError = error.toLowerCase().includes("logged in")
    const isInvalidPlan = error.toLowerCase().includes("invalid plan") || error.toLowerCase().includes("unavailable")
    
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">
          {isAuthError ? "Sign in Required" : isInvalidPlan ? "Plan Unavailable" : "Checkout Error"}
        </p>
        <p className="text-xs text-muted-foreground mb-4">{error}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          {isAuthError ? (
            <button
              onClick={() => {
                const returnUrl = encodeURIComponent(`/pricing?plan=${productId}`)
                router.push(`/login?redirect=${returnUrl}`)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-4 h-4" />
              Sign In to Continue
            </button>
          ) : (
            <>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border text-sm font-medium hover:border-[#C5A059] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={handleBackToPlans}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border text-sm font-medium hover:border-[#C5A059] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Plans
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div id="checkout" key={key}>
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret, onComplete: handleComplete }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
