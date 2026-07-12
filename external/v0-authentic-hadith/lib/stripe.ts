import "server-only"

import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured")
    }
    stripeInstance = new Stripe(secretKey)
  }
  return stripeInstance
}

// Backwards compatible export - lazy initialization
export const stripe = {
  get checkout() {
    return getStripe().checkout
  },
  get customers() {
    return getStripe().customers
  },
  get subscriptions() {
    return getStripe().subscriptions
  },
  get billingPortal() {
    return getStripe().billingPortal
  },
  get webhooks() {
    return getStripe().webhooks
  },
  get prices() {
    return getStripe().prices
  },
  get products() {
    return getStripe().products
  },
  get invoices() {
    return getStripe().invoices
  },
  get paymentIntents() {
    return getStripe().paymentIntents
  },
} as unknown as Stripe
