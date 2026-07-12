import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { SUPABASE_URL } from "@/lib/supabase/config"

/**
 * RevenueCat Server Notifications Webhook
 *
 * Configure this URL in RevenueCat Dashboard > Project > Integrations > Webhooks:
 * https://your-domain.vercel.app/api/webhooks/revenuecat
 *
 * Set REVENUECAT_WEBHOOK_SECRET env var and configure it in RevenueCat
 * as the "Authorization header" value for signature verification.
 */

const supabaseAdmin = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// RevenueCat event types we care about
type RCEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "CANCELLATION"
  | "UNCANCELLATION"
  | "BILLING_ISSUE"
  | "SUBSCRIBER_ALIAS"
  | "PRODUCT_CHANGE"
  | "EXPIRATION"
  | "TRANSFER"
  | "NON_RENEWING_PURCHASE"

interface RCWebhookEvent {
  api_version: string
  event: {
    type: RCEventType
    app_user_id: string
    original_app_user_id: string
    product_id: string
    entitlement_ids: string[]
    store: string // APP_STORE, PLAY_STORE, STRIPE, etc.
    environment: string // PRODUCTION, SANDBOX
    purchased_at_ms: number
    expiration_at_ms: number | null
    event_timestamp_ms: number
    is_trial_conversion?: boolean
    period_type?: string // TRIAL, INTRO, NORMAL
    price_in_purchased_currency?: number
    currency?: string
    transaction_id?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET
    if (webhookSecret) {
      const authHeader = request.headers.get("authorization")
      if (authHeader !== `Bearer ${webhookSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const body: RCWebhookEvent = await request.json()
    const event = body.event

    // The app_user_id should be the Supabase user ID
    // (set via Purchases.logIn(userId) on the native side after auth)
    const userId = event.app_user_id

    if (!userId || userId.startsWith("$RCAnonymousID:")) {
      // Anonymous user -- can't link to Supabase account
      return NextResponse.json({ received: true, skipped: "anonymous_user" })
    }

    // Map RevenueCat event to subscription status
    let status: string
    let tier: "free" | "premium" | "lifetime" = "free"

    switch (event.type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "UNCANCELLATION":
        status = event.period_type === "TRIAL" ? "trialing" : "active"
        // Check if it's a non-renewing (lifetime) purchase
        if (event.expiration_at_ms === null) {
          status = "lifetime"
          tier = "lifetime"
        } else {
          tier = "premium"
        }
        break

      case "NON_RENEWING_PURCHASE":
        status = "lifetime"
        tier = "lifetime"
        break

      case "CANCELLATION":
        // Still active until expiration
        status = "canceled"
        tier = "premium"
        break

      case "EXPIRATION":
        status = "expired"
        tier = "free"
        break

      case "BILLING_ISSUE":
        status = "past_due"
        tier = "premium"
        break

      default:
        // Other events like TRANSFER, PRODUCT_CHANGE, etc.
        return NextResponse.json({ received: true, skipped: event.type })
    }

    const expiresAt = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null

    // Check if this user already has a RevenueCat subscription row
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", "revenuecat")
      .limit(1)
      .single()

    const subscriptionData = {
      user_id: userId,
      product_id: event.product_id,
      status,
      provider: "revenuecat",
      store: event.store.toLowerCase(),
      current_period_end: expiresAt,
      environment: event.environment.toLowerCase(),
      transaction_id: event.transaction_id || null,
      updated_at: new Date().toISOString(),
    }

    let subError
    if (existingSub) {
      // Update existing RevenueCat subscription
      const result = await supabaseAdmin
        .from("subscriptions")
        .update(subscriptionData)
        .eq("id", existingSub.id)
      subError = result.error
    } else {
      // Insert new RevenueCat subscription
      const result = await supabaseAdmin
        .from("subscriptions")
        .insert({ ...subscriptionData, created_at: new Date().toISOString() })
      subError = result.error
    }

    if (subError) {
      console.error("[RevenueCat Webhook] Subscription write error:", subError)
    }

    // Also update the profile tier for fast lookups
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_tier: tier,
        subscription_status: status,
        subscription_expires_at: expiresAt,
      })
      .eq("user_id", userId)

    if (profileError) {
      console.error("[RevenueCat Webhook] Profile update error:", profileError)
    }

    return NextResponse.json({ received: true, status, tier })
  } catch (error) {
    console.error("[RevenueCat Webhook] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
