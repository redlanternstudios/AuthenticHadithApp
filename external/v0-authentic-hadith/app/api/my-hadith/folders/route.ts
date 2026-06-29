import { getSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("user_folders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ folders: data })
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { name, description, icon, color, is_public } = body

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("user_folders")
    .insert({
      user_id: user.id,
      name: name.trim(),
      description: description || null,
      icon: icon || null,
      color: color || "#6b7280",
      is_public: is_public || false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ folder: data })
}

export async function PATCH(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: "Folder id required" }, { status: 400 })

  const { data, error } = await supabase
    .from("user_folders")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ folder: data })
}

export async function DELETE(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Folder id required" }, { status: 400 })

  const { error } = await supabase
    .from("user_folders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
