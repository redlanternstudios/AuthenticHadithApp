import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const stripe = getStripe()
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get customer ID from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe first." },
        { status: 400 }
      )
    }

    // Get return URL from request body or use default
    const body = await request.json().catch(() => ({}))
    const returnUrl = body.returnUrl || `${request.headers.get("origin")}/settings`

    // Create Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("[v0] Error creating portal session:", error)
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    )
  }
}
