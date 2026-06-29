import { getSupabaseServerClient } from "@/lib/supabase/server"
import { trackActivity } from "@/lib/gamification/track-activity"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { activity_type, item_id } = body

  if (!activity_type) {
    return NextResponse.json({ error: "activity_type required" }, { status: 400 })
  }

  const validTypes = ["read_hadith", "complete_story", "share", "bookmark", "note"]
  if (!validTypes.includes(activity_type)) {
    return NextResponse.json({ error: "Invalid activity_type" }, { status: 400 })
  }

  const result = await trackActivity(user.id, activity_type, item_id)

  return NextResponse.json(result)
}
