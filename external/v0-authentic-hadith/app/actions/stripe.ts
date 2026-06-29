"use server"

import { getStripe } from "@/lib/stripe"
import { getProductById, PRODUCTS } from "@/lib/products"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getStripePriceId, BILLING_CONFIG } from "@/lib/billing/config"

// Plan alias normalization - maps common variations to canonical product IDs
const PLAN_ALIASES: Record<string, string> = {
  "monthly": "monthly-premium",
  "annual": "annual-premium",
  "lifetime": "lifetime-access",
  "monthly-premium": "monthly-premium",
  "annual-premium": "annual-premium",
  "lifetime-access": "lifetime-access",
}

function normalizeProductId(productId: string): string {
  return PLAN_ALIASES[productId] || productId
}

export async function startCheckoutSession(productId: string) {
  // Get the Stripe instance early to fail fast if not configured
  let stripe: ReturnType<typeof getStripe>
  try {
    stripe = getStripe()
  } catch (err) {
    console.error("Stripe initialization error:", err)
    throw new Error("Payment system is not configured. Please contact support.")
  }

  try {
    // Normalize the product ID in case an alias was passed
    const normalizedId = normalizeProductId(productId)
    const product = getProductById(normalizedId)
    
    if (!product) {
      const validIds = PRODUCTS.map(p => p.id).join(", ")
      throw new Error(`Invalid plan "${productId}". Valid plans: ${validIds}`)
    }

    // Get the authenticated user
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("You must be logged in to subscribe")
    }

    // Get or create Stripe customer
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, name")
      .eq("user_id", user.id)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      throw new Error(`Failed to fetch profile: ${profileError.message}`)
    }

    let customerId = profile?.stripe_customer_id
    let needsCustomerUpdate = false

    // Validate existing customer ID if present
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId)
      } catch (err: unknown) {
        // Customer doesn't exist in Stripe - clear it so we create a new one
        console.warn(`Stored Stripe customer ${customerId} not found, creating new one`)
        customerId = null
        needsCustomerUpdate = true
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: profile?.name || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      })

      customerId = customer.id
      needsCustomerUpdate = true
    }

    // Update profile with new stripe_customer_id if needed
    if (needsCustomerUpdate) {
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({ 
          user_id: user.id, 
          stripe_customer_id: customerId,
          email: user.email,
        }, { 
          onConflict: "user_id" 
        })
      
      if (updateError) {
        console.error("Failed to save Stripe customer ID:", updateError)
      }
    }

    const isSubscription = product.mode === "subscription"

    // Determine which plan this is (monthly, annual, or lifetime)
    const planType = product.id === "monthly-premium" ? "monthly" 
      : product.id === "annual-premium" ? "annual" 
      : "lifetime"

    // Get Stripe Price ID from environment variables
    const envPriceIds: Record<string, string | undefined> = {
      monthly: process.env.STRIPE_PRICE_MONTHLY,
      annual: process.env.STRIPE_PRICE_ANNUAL,
      lifetime: process.env.STRIPE_PRICE_LIFETIME,
    }
    const stripePriceId = envPriceIds[planType] || getStripePriceId(planType)

    // Build line_items - prefer Price ID, fallback to price_data
    let lineItems: Record<string, unknown>[]

    if (stripePriceId) {
      // Use pre-created Stripe Price (recommended for trials)
      lineItems = [{ price: stripePriceId, quantity: 1 }]
    } else {
      // Fallback: Build price_data inline
      const fallback = BILLING_CONFIG.fallbackPricing[planType]
      const priceData: Record<string, unknown> = {
        currency: fallback.currency,
        product_data: {
          name: product.name,
          description: product.description,
        },
        unit_amount: fallback.amount,
      }

      if (isSubscription && "interval" in fallback) {
        priceData.recurring = { interval: fallback.interval }
      }

      lineItems = [{ price_data: priceData, quantity: 1 }]
    }

    const sessionParams: Record<string, unknown> = {
      customer: customerId,
      ui_mode: "embedded",
      redirect_on_completion: "never",
      line_items: lineItems,
      mode: product.mode,
      metadata: {
        supabase_user_id: user.id,
        product_id: product.id,
      },
    }

    if (isSubscription) {
      const subscriptionData: Record<string, unknown> = {
        metadata: { supabase_user_id: user.id },
      }

      // Only add trial if using inline price_data (Price IDs have trials configured in Stripe)
      if (!stripePriceId && product.trialDays) {
        subscriptionData.trial_period_days = product.trialDays
      }

      sessionParams.subscription_data = subscriptionData
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0],
    )

    if (!session.client_secret) {
      throw new Error("Failed to create checkout session -- no client secret returned")
    }

    return { clientSecret: session.client_secret, sessionId: session.id }
  } catch (error) {
    console.error("Checkout error:", error)
    
    if (error instanceof Error) {
      if (error.message.includes("No such price")) {
        throw new Error("This subscription plan is not configured correctly. Please contact support.")
      }
      if (error.message.includes("No such customer")) {
        throw new Error("Customer validation failed. Please try again.")
      }
      if (error.message.includes("Invalid API Key")) {
        throw new Error("Payment system configuration error. Please contact support.")
      }
      throw error
    }
    throw new Error("An unexpected error occurred during checkout. Please try again.")
  }
}
