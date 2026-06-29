import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config"
import { createClient } from "@supabase/supabase-js"

// POST: Review an enrichment (approve, reject, edit, publish)
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = getSupabaseAdmin()

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()
    if (!profile || !["admin", "reviewer"].includes(profile.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { enrichment_id, action, changes, notes } = body

    if (!enrichment_id || !action) {
      return Response.json({ error: "enrichment_id and action required" }, { status: 400 })
    }

    // Get current enrichment
    const { data: current, error: fetchError } = await supabase
      .from("hadith_enrichment")
      .select("*")
      .eq("id", enrichment_id)
      .single()

    if (fetchError || !current) {
      return Response.json({ error: "Enrichment not found" }, { status: 404 })
    }

    const oldStatus = current.status
    let newStatus: string

    switch (action) {
      case "approve":
        newStatus = "approved"
        break
      case "reject":
        newStatus = "rejected"
        break
      case "publish":
        newStatus = "published"
        break
      case "edit":
        newStatus = current.status // Keep current status on edits
        break
      default:
        return Response.json({ error: "Invalid action. Use: approve, reject, publish, edit" }, { status: 400 })
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: notes || null,
    }

    if (action === "publish") {
      updatePayload.published_at = new Date().toISOString()
    }

    // Apply inline edits if provided
    if (changes) {
      if (changes.summary_line) updatePayload.summary_line = changes.summary_line
      if (changes.category_id) updatePayload.category_id = changes.category_id
    }

    // Update enrichment
    const { error: updateError } = await supabase
      .from("hadith_enrichment")
      .update(updatePayload)
      .eq("id", enrichment_id)

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 })
    }

    // Also update hadith_tags status to match enrichment status
    if (action === "publish" || action === "approve" || action === "reject") {
      await supabase
        .from("hadith_tags")
        .update({ status: newStatus })
        .eq("enrichment_id", enrichment_id)
    }

    // Update tag assignments if changed
    if (changes?.tag_ids && Array.isArray(changes.tag_ids)) {
      // Remove old tags for this enrichment
      await supabase.from("hadith_tags").delete().eq("enrichment_id", enrichment_id)

      // Insert new tags
      if (changes.tag_ids.length > 0) {
        const tagRows = changes.tag_ids.map((tagId: string) => ({
          hadith_id: current.hadith_id,
          tag_id: tagId,
          enrichment_id,
          status: newStatus,
        }))
        await supabase.from("hadith_tags").insert(tagRows)
      }
    }

    // Log review action
    await supabase.from("enrichment_reviews").insert({
      enrichment_id,
      reviewer_id: user.id,
      action,
      old_status: oldStatus,
      new_status: newStatus,
      changes: changes || null,
      notes: notes || null,
    })

    return Response.json({ success: true, new_status: newStatus })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// Batch actions (approve-all, publish-all for a filter)
export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = getSupabaseAdmin()

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()
    if (!profile || profile.role !== "admin") {
      return Response.json({ error: "Forbidden: admin only for batch actions" }, { status: 403 })
    }

    const body = await req.json()
    const { action, filter_status, enrichment_ids } = body

    if (!action || (!filter_status && !enrichment_ids)) {
      return Response.json({ error: "action and (filter_status or enrichment_ids) required" }, { status: 400 })
    }

    let newStatus: string
    switch (action) {
      case "approve_all":
        newStatus = "approved"
        break
      case "publish_all":
        newStatus = "published"
        break
      default:
        return Response.json({ error: "Invalid batch action" }, { status: 400 })
    }

    // Build update query
    let query = supabase
      .from("hadith_enrichment")
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        ...(newStatus === "published" ? { published_at: new Date().toISOString() } : {}),
      })

    if (enrichment_ids) {
      query = query.in("id", enrichment_ids)
    } else if (filter_status) {
      query = query.eq("status", filter_status)
    }

    const { error, count } = await query.select("id")

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Batch update hadith_tags too
    if (enrichment_ids) {
      await supabase
        .from("hadith_tags")
        .update({ status: newStatus })
        .in("enrichment_id", enrichment_ids)
    }

    return Response.json({ success: true, updated: count || 0, new_status: newStatus })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
