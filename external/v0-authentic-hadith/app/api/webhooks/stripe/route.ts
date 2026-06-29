import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getTierFromProductId } from "@/lib/products"
import type Stripe from "stripe"

export async function POST(request: Request) {
  const stripe = getStripe()
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[v0] Webhook signature verification failed:", message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Idempotency: check if we already processed this event
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .single()

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Record event (id is the text PK -- use the Stripe event id)
  await supabase.from("stripe_events").insert({
    id: event.id,
    stripe_event_id: event.id,
    event_type: event.type,
    type: event.type,
    payload: event.data.object,
    processed_at: new Date().toISOString(),
  })

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, supabase)
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(sub, supabase)
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(sub, supabase)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice, supabase)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice, supabase)
        break
      }
    }
  } catch (err) {
    console.error("[v0] Webhook handler error:", err)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof getSupabaseAdmin>,
) {
  const userId = session.metadata?.supabase_user_id
  const productId = session.metadata?.product_id

  if (!userId) {
    console.error("[v0] No supabase_user_id in session metadata")
    return
  }

  const customerId = session.customer as string

  if (session.mode === "subscription") {
    const subscriptionId = session.subscription as string
    const sub = await getStripe().subscriptions.retrieve(subscriptionId)

    const tier = getTierFromProductId(productId || "")
    const status = sub.status === "trialing" ? "trialing" : "active"

    // Update subscriptions table
    await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        product_id: productId,
        provider: "stripe",
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      },
      { onConflict: "user_id" },
    )

    // Update profile with tier info
    await supabase
      .from("profiles")
      .update({
        subscription_tier: tier,
        subscription_status: status,
        subscription_started_at: new Date().toISOString(),
        subscription_expires_at: new Date(sub.current_period_end * 1000).toISOString(),
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      })
      .eq("user_id", userId)
  } else if (session.mode === "payment") {
    // One-time payment (lifetime access)
    await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: null,
        product_id: productId,
        provider: "stripe",
        status: "lifetime",
        current_period_start: new Date().toISOString(),
        current_period_end: null,
      },
      { onConflict: "user_id" },
    )

    // Update profile with lifetime tier
    await supabase
      .from("profiles")
      .update({
        subscription_tier: "lifetime",
        subscription_status: "active",
        subscription_started_at: new Date().toISOString(),
        subscription_expires_at: null,
        stripe_customer_id: customerId,
      })
      .eq("user_id", userId)
  }
}

async function handleSubscriptionUpdated(
  sub: Stripe.Subscription,
  supabase: ReturnType<typeof getSupabaseAdmin>,
) {
  const customerId = sub.customer as string

  // Update subscriptions table
  await supabase
    .from("subscriptions")
    .update({
      status: sub.status,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    })
    .eq("stripe_subscription_id", sub.id)

  // Update profile tier/status
  const status = mapStripeStatus(sub.status)
  const tier = sub.status === "canceled" ? "free" : undefined

  const updateData: Record<string, unknown> = {
    subscription_status: status,
    subscription_expires_at: new Date(sub.current_period_end * 1000).toISOString(),
    subscription_cancel_at_period_end: sub.cancel_at_period_end,
  }
  if (tier) {
    updateData.subscription_tier = tier
  }

  await supabase
    .from("profiles")
    .update(updateData)
    .eq("stripe_customer_id", customerId)
}

async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
  supabase: ReturnType<typeof getSupabaseAdmin>,
) {
  const customerId = sub.customer as string

  await supabase
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", sub.id)

  await supabase
    .from("profiles")
    .update({
      subscription_tier: "free",
      subscription_status: "expired",
      subscription_expires_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId)
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof getSupabaseAdmin>,
) {
  const customerId = invoice.customer as string
  const subscriptionId = invoice.subscription as string | null

  if (!subscriptionId) return

  const sub = await getStripe().subscriptions.retrieve(subscriptionId)

  await supabase
    .from("subscriptions")
    .update({
      status: "active",
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId)

  await supabase
    .from("profiles")
    .update({
      subscription_status: "active",
      subscription_expires_at: new Date(sub.current_period_end * 1000).toISOString(),
    })
    .eq("stripe_customer_id", customerId)
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof getSupabaseAdmin>,
) {
  const customerId = invoice.customer as string

  if (invoice.subscription) {
    await supabase
      .from("subscriptions")
      .update({ status: "past_due" })
      .eq("stripe_subscription_id", invoice.subscription as string)
  }

  await supabase
    .from("profiles")
    .update({ subscription_status: "past_due" })
    .eq("stripe_customer_id", customerId)
}

function mapStripeStatus(
  status: Stripe.Subscription.Status,
): "active" | "trialing" | "cancelled" | "expired" | "past_due" {
  switch (status) {
    case "active":
      return "active"
    case "trialing":
      return "trialing"
    case "canceled":
      return "cancelled"
    case "unpaid":
    case "past_due":
      return "past_due"
    case "incomplete":
    case "incomplete_expired":
    case "paused":
    default:
      return "expired"
  }
}
