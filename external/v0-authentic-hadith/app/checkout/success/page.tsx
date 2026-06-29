import Link from "next/link"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { getStripe } from "@/lib/stripe"

interface Props {
  searchParams: Promise<{ session_id?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams

  // No session_id — user navigated here directly
  if (!session_id) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <XCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 text-balance">
            Invalid Page
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            No checkout session was found. Please complete a purchase from the pricing page.
          </p>
          <Link
            href="/pricing"
            className="px-6 py-3 gold-button rounded-lg text-sm inline-block font-medium"
          >
            View Plans
          </Link>
        </div>
      </div>
    )
  }

  // Verify the session with Stripe server-side
  let paymentStatus: "paid" | "unpaid" | "no_payment_required" | "pending" = "pending"
  let sessionError = false

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(session_id)
    paymentStatus = (session.payment_status as typeof paymentStatus) ?? "pending"
  } catch (err) {
    console.error("[stripe] Failed to retrieve checkout session:", err)
    sessionError = true
  }

  const isSuccess = !sessionError && (paymentStatus === "paid" || paymentStatus === "no_payment_required")
  const isPending = !sessionError && paymentStatus === "unpaid"

  if (sessionError || (!isSuccess && !isPending)) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 text-balance">
            Payment Not Confirmed
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            We could not confirm your payment. If you believe this is an error, please contact support.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/pricing"
              className="px-6 py-3 gold-button rounded-lg text-sm inline-block font-medium"
            >
              Try Again
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 text-balance">
            Payment Processing
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Your payment is still being processed. Your premium access will be activated shortly — please check back in a few minutes.
          </p>
          <Link
            href="/home"
            className="px-6 py-3 gold-button rounded-lg text-sm inline-block font-medium"
          >
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1B5E43]/10 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-[#1B5E43]" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2 text-balance">
          Payment Successful
        </h1>
        <p className="text-muted-foreground mb-2 leading-relaxed">
          Thank you for supporting Authentic Hadith.
        </p>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          Your premium access is now active. It may take a moment for your account to update.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/home"
            className="px-6 py-3 gold-button rounded-lg text-sm inline-block font-medium"
          >
            Go to Home
          </Link>
          <Link
            href="/collections"
            className="px-6 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse Collections
          </Link>
        </div>
      </div>
    </div>
  )
}
