import { getSupabaseServerClient } from "@/lib/supabase/server"
import { trackActivity } from "@/lib/gamification/track-activity"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const itemType = url.searchParams.get("type") || "hadith"
  const folderId = url.searchParams.get("folder_id")
  const limit = Number.parseInt(url.searchParams.get("limit") || "20")
  const offset = Number.parseInt(url.searchParams.get("offset") || "0")

  let query = supabase
    .from("user_bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .order("bookmarked_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (folderId) {
    query = query.eq("folder_id", folderId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bookmarks: data })
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { item_type, item_id, folder_id, tags } = body

  if (!item_type || !item_id) {
    return NextResponse.json({ error: "item_type and item_id required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("user_bookmarks")
    .upsert({
      user_id: user.id,
      item_type,
      item_id,
      folder_id: folder_id || null,
      tags: tags || [],
    }, { onConflict: "user_id,item_type,item_id" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Track bookmark activity for gamification
  await trackActivity(user.id, "bookmark", item_id).catch(() => {})

  return NextResponse.json({ bookmark: data })
}

export async function DELETE(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const itemType = url.searchParams.get("item_type")
  const itemId = url.searchParams.get("item_id")

  if (!itemType || !itemId) {
    return NextResponse.json({ error: "item_type and item_id required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("user_bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .eq("item_id", itemId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
