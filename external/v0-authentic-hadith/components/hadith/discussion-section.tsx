"use client"

import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  MessageCircle,
  Heart,
  Reply,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Discussion {
  id: string
  hadith_id: string
  user_id: string
  content: string
  parent_id: string | null
  likes_count: number
  created_at: string
  updated_at: string
  profile?: {
    name: string | null
    avatar_url: string | null
  }
  liked_by_user?: boolean
  replies?: Discussion[]
}

interface DiscussionSectionProps {
  hadithId: string
}

export function DiscussionSection({ hadithId }: DiscussionSectionProps) {
  const supabase = getSupabaseBrowserClient()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const fetchDiscussions = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    // Fetch all discussions for this hadith
    const { data: allDiscussions } = await supabase
      .from("discussions")
      .select("*")
      .eq("hadith_id", hadithId)
      .order("created_at", { ascending: true })

    if (!allDiscussions) {
      setLoading(false)
      return
    }

    // Fetch profiles for all unique user IDs
    const userIds = [...new Set(allDiscussions.map((d) => d.user_id))]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, avatar_url")
      .in("user_id", userIds)

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || [])

    // Fetch user's likes
    let likedIds = new Set<string>()
    if (user) {
      const { data: likes } = await supabase
        .from("discussion_likes")
        .select("discussion_id")
        .eq("user_id", user.id)
      if (likes) likedIds = new Set(likes.map((l) => l.discussion_id))
    }

    // Build tree structure
    const topLevel: Discussion[] = []
    const replyMap = new Map<string, Discussion[]>()

    for (const d of allDiscussions) {
      const enriched: Discussion = {
        ...d,
        profile: profileMap.get(d.user_id) || { name: null, avatar_url: null },
        liked_by_user: likedIds.has(d.id),
        replies: [],
      }

      if (d.parent_id) {
        if (!replyMap.has(d.parent_id)) replyMap.set(d.parent_id, [])
        replyMap.get(d.parent_id)!.push(enriched)
      } else {
        topLevel.push(enriched)
      }
    }

    // Attach replies
    for (const d of topLevel) {
      d.replies = replyMap.get(d.id) || []
    }

    setDiscussions(topLevel)
    setLoading(false)
  }, [supabase, hadithId])

  useEffect(() => {
    fetchDiscussions()
  }, [fetchDiscussions])

  const handleSubmit = async (parentId: string | null = null) => {
    const content = parentId ? replyText.trim() : newComment.trim()
    if (!content) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setSubmitting(true)
    await supabase.from("discussions").insert({
      hadith_id: hadithId,
      user_id: user.id,
      content,
      parent_id: parentId,
    })

    if (parentId) {
      setReplyText("")
      setReplyingTo(null)
    } else {
      setNewComment("")
    }
    setSubmitting(false)
    fetchDiscussions()
  }

  const handleLike = async (discussionId: string, currentlyLiked: boolean) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    if (currentlyLiked) {
      await supabase
        .from("discussion_likes")
        .delete()
        .eq("discussion_id", discussionId)
        .eq("user_id", user.id)

      // Decrement count
      const found = [...discussions, ...discussions.flatMap((d) => d.replies || [])].find(
        (d) => d.id === discussionId,
      )
      if (found) {
        await supabase
          .from("discussions")
          .update({ likes_count: Math.max(0, (found.likes_count || 0) - 1) })
          .eq("id", discussionId)
      }
    } else {
      await supabase.from("discussion_likes").insert({
        discussion_id: discussionId,
        user_id: user.id,
      })

      const found = [...discussions, ...discussions.flatMap((d) => d.replies || [])].find(
        (d) => d.id === discussionId,
      )
      if (found) {
        await supabase
          .from("discussions")
          .update({ likes_count: (found.likes_count || 0) + 1 })
          .eq("id", discussionId)
      }
    }

    fetchDiscussions()
  }

  const handleDelete = async (discussionId: string) => {
    await supabase.from("discussions").delete().eq("id", discussionId)
    fetchDiscussions()
  }

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const totalComments = discussions.length + discussions.reduce((sum, d) => sum + (d.replies?.length || 0), 0)

  const renderComment = (comment: Discussion, isReply = false) => (
    <div key={comment.id} className={cn("group", isReply && "ml-8 border-l-2 border-border pl-4")}>
      <div className="flex items-start gap-3 py-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {comment.profile?.avatar_url ? (
            <img
              src={comment.profile.avatar_url || "/placeholder.svg"}
              alt=""
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <User className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">
              {comment.profile?.name || "Anonymous"}
            </span>
            <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</span>
          </div>

          <p className="text-sm text-foreground/80 leading-relaxed">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => handleLike(comment.id, !!comment.liked_by_user)}
              className={cn(
                "flex items-center gap-1 text-xs transition-colors",
                comment.liked_by_user
                  ? "text-[#C5A059] font-medium"
                  : "text-muted-foreground hover:text-[#C5A059]",
              )}
            >
              <Heart className={cn("w-3.5 h-3.5", comment.liked_by_user && "fill-current")} />
              {comment.likes_count > 0 && comment.likes_count}
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>
            )}

            {comment.user_id === currentUserId && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Reply Input */}
          {replyingTo === comment.id && (
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-2 rounded-lg premium-input text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(comment.id)}
                autoFocus
              />
              <button
                onClick={() => handleSubmit(comment.id)}
                disabled={!replyText.trim() || submitting}
                className="p-2 rounded-lg bg-[#1B5E43] text-white hover:bg-[#2D7A5B] transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Render Replies */}
      {comment.replies?.map((reply) => renderComment(reply, true))}
    </div>
  )

  return (
    <section className="mt-6">
      {/* Section Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 rounded-xl premium-card hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#C5A059]" />
          <h3 className="font-semibold text-foreground">Discussion</h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {totalComments}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 premium-card rounded-xl p-4">
          {/* New Comment Input */}
          <div className="flex items-start gap-3 mb-4 pb-4 border-b border-border">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts or insights on this hadith..."
                className="w-full px-3 py-2 rounded-lg premium-input text-sm resize-none"
                rows={2}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleSubmit(null)}
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium emerald-button text-white disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post
                </button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : discussions.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your insight!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {discussions.map((d) => renderComment(d))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
