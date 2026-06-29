"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  Bookmark,
  FolderOpen,
  Plus,
  Trophy,
  Flame,
  BookOpen,
  Star,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/gamification/stat-card";
import { LevelProgressBar } from "@/components/gamification/level-progress-bar";
import { StreakCounter } from "@/components/gamification/streak-counter";
import { FolderCard } from "@/components/my-hadith/folder-card";
import { CreateFolderModal } from "@/components/my-hadith/create-folder-modal";
import { BookmarkedHadithCard } from "@/components/my-hadith/bookmarked-hadith-card";
import { getLevelInfo } from "@/lib/gamification/level-calculator";

interface UserStats {
  total_xp: number;
  current_streak_days: number;
  longest_streak_days: number;
  hadith_read_count: number;
  hadith_read_unique: number;
  notes_count: number;
  bookmarks_count: number;
  shares_count: number;
  level: number;
}

interface Folder {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  item_count: number;
}

interface BookmarkedHadith {
  id: string;
  item_id: string;
  item_type: string;
  created_at: string;
  hadiths?: {
    id: string;
    arabic_text: string;
    english_translation: string;
    collection: string;
    reference: string;
    grade: string;
    summary_line: string;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked_at: string;
}

export default function MyHadithPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkedHadith[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const [statsRes, foldersRes, bookmarksRes, achievementsRes] =
      await Promise.all([
        supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("user_folders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("user_bookmarks")
          .select("id, item_id, item_type, bookmarked_at")
          .eq("user_id", user.id)
          .eq("item_type", "hadith")
          .order("bookmarked_at", { ascending: false })
          .limit(6),
        supabase
          .from("user_achievements")
          .select(
            `
          unlocked_at,
          achievements (id, name_en, description_en, icon, category)
        `,
          )
          .eq("user_id", user.id)
          .order("unlocked_at", { ascending: false })
          .limit(3),
      ]);

    if (statsRes.data) {
      setStats(statsRes.data);
    } else {
      // Auto-initialize user stats row for new users
      await supabase
        .from("user_stats")
        .upsert({ user_id: user.id }, { onConflict: "user_id" });
    }
    if (foldersRes.data) setFolders(foldersRes.data as Folder[]);

    // Fetch hadith data for bookmarks separately (no FK join available)
    if (bookmarksRes.data && bookmarksRes.data.length > 0) {
      const hadithIds = bookmarksRes.data.map((b: { item_id: string }) => b.item_id);
      const { data: hadithsData } = await supabase
        .from("hadiths")
        .select("id, arabic_text, english_translation, collection, reference, grade")
        .in("id", hadithIds);

      const hadithMap = new Map(
        (hadithsData || []).map((h: { id: string }) => [h.id, h])
      );

      const enrichedBookmarks = bookmarksRes.data.map((b: { item_id: string; bookmarked_at: string }) => ({
        ...b,
        created_at: b.bookmarked_at,
        hadiths: hadithMap.get(b.item_id) || null,
      }));
      setBookmarks(enrichedBookmarks as unknown as BookmarkedHadith[]);
    }

    if (achievementsRes.data) {
      const mapped = achievementsRes.data
        .filter((a: Record<string, unknown>) => a.achievements)
        .map((a: Record<string, unknown>) => {
          const ach = a.achievements as Record<string, unknown>;
          return {
            id: ach.id,
            name: ach.name_en,
            description: ach.description_en,
            icon: ach.icon,
            category: ach.category,
            unlocked_at: a.unlocked_at as string,
          };
        });
      setRecentAchievements(mapped as unknown as Achievement[]);
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFolderCreated = () => {
    setShowCreateFolder(false);
    fetchData();
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    await supabase.from("user_bookmarks").delete().eq("id", bookmarkId);
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  };

  const levelInfo = stats ? getLevelInfo(stats.total_xp) : getLevelInfo(0);

  if (loading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen marble-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C5A059] to-[#E8C77D] flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">My Hadith</h1>
                <p className="text-xs text-muted-foreground">
                  Level {levelInfo.level} -- {levelInfo.title}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/achievements")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:border-[#C5A059] hover:text-[#C5A059] transition-colors"
            >
              <Trophy className="w-3.5 h-3.5" />
              Achievements
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Level Progress */}
        <LevelProgressBar
          level={levelInfo.level}
          title={levelInfo.title}
          currentXp={stats?.total_xp ?? 0}
          xpForCurrentLevel={levelInfo.xpForCurrentLevel}
          xpForNextLevel={levelInfo.xpForNextLevel}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Hadiths Read"
            value={stats?.hadith_read_count ?? 0}
          />
          <StreakCounter
            currentStreak={stats?.current_streak_days ?? 0}
            longestStreak={stats?.longest_streak_days ?? 0}
          />
          <StatCard
            icon={TrendingUp}
            label="Total XP"
            value={stats?.total_xp ?? 0}
          />
          <StatCard
            icon={Star}
            label="Notes"
            value={stats?.notes_count ?? 0}
          />
        </div>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Recent Achievements
              </h2>
              <button
                onClick={() => router.push("/achievements")}
                className="text-xs text-[#C5A059] font-medium flex items-center gap-0.5 hover:underline"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {recentAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className="flex-shrink-0 w-32 premium-card gold-border rounded-xl p-3 text-center"
                >
                  <div className="text-2xl mb-1">{ach.icon}</div>
                  <p className="text-xs font-semibold text-foreground truncate">
                    {ach.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(ach.unlocked_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Folders */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              My Folders
            </h2>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="flex items-center gap-1 text-xs text-[#C5A059] font-medium hover:underline"
            >
              <Plus className="w-3 h-3" /> New Folder
            </button>
          </div>
          {folders.length === 0 ? (
            <button
              onClick={() => setShowCreateFolder(true)}
              className="w-full premium-card rounded-xl p-6 text-center border-2 border-dashed border-border hover:border-[#C5A059] transition-colors group"
            >
              <FolderOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2 group-hover:text-[#C5A059] transition-colors" />
              <p className="text-sm font-medium text-muted-foreground group-hover:text-[#C5A059] transition-colors">
                Create your first folder
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Organize hadiths by theme, study plan, or topic
              </p>
            </button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onClick={() => router.push(`/my-hadith/folders/${folder.id}`)}
                />
              ))}
              <button
                onClick={() => setShowCreateFolder(true)}
                className="premium-card rounded-xl p-4 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border hover:border-[#C5A059] transition-colors min-h-[100px] group"
              >
                <Plus className="w-5 h-5 text-muted-foreground group-hover:text-[#C5A059] transition-colors" />
                <span className="text-xs text-muted-foreground group-hover:text-[#C5A059] transition-colors">
                  Add Folder
                </span>
              </button>
            </div>
          )}
        </section>

        {/* Recently Saved */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Recently Saved
            </h2>
            {bookmarks.length > 0 && (
              <button
                onClick={() => router.push("/saved")}
                className="text-xs text-[#C5A059] font-medium flex items-center gap-0.5 hover:underline"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          {bookmarks.length === 0 ? (
            <div className="premium-card rounded-xl p-8 text-center">
              <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">
                No saved hadiths yet
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Save hadiths while browsing to see them here
              </p>
              <button
                onClick={() => router.push("/collections")}
                className="gold-button px-4 py-2 rounded-lg text-sm"
              >
                Browse Collections
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark) => (
                <BookmarkedHadithCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onRemove={() => handleRemoveBookmark(bookmark.id)}
                  onClick={() =>
                    router.push(`/hadith/${bookmark.item_id}`)
                  }
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <CreateFolderModal
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onCreated={handleFolderCreated}
      />
    </div>
  );
}
