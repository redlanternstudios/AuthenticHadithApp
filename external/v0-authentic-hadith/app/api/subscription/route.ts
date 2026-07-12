import { NextResponse } from "next/server"
import { getUserSubscription } from "@/lib/subscription"

export async function GET() {
  const subscription = await getUserSubscription()
  return NextResponse.json(subscription)
}
