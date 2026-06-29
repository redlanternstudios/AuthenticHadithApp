"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ChevronLeft, Trophy, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { AchievementCard } from "@/components/gamification/achievement-card";
import { LevelProgressBar } from "@/components/gamification/level-progress-bar";
import { getLevelInfo } from "@/lib/gamification/level-calculator";

interface AchievementRow {
  id: string;
  name_en: string;
  description_en: string;
  icon: string;
  category: string;
  tier: number;
  xp_reward: number;
  criteria: Record<string, unknown>;
}

interface UserAchievementRow {
  achievement_id: string;
  unlocked_at: string;
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "learning", label: "Learning" },
  { id: "consistency", label: "Streaks" },
  { id: "social", label: "Social" },
  { id: "mastery", label: "Mastery" },
  { id: "milestone", label: "Milestones" },
];

export default function AchievementsPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [unlocked, setUnlocked] = useState<Map<string, string>>(new Map());
  const [totalXp, setTotalXp] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const [achRes, userAchRes, statsRes] = await Promise.all([
      supabase
        .from("achievements")
        .select("*")
        .order("tier", { ascending: true })
        .order("threshold", { ascending: true }),
      supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user.id),
      supabase
        .from("user_stats")
        .select("total_xp")
        .eq("user_id", user.id)
        .single(),
    ]);

    if (achRes.data) setAchievements(achRes.data);
    if (userAchRes.data) {
      const map = new Map<string, string>();
      for (const ua of userAchRes.data as UserAchievementRow[]) {
        map.set(ua.achievement_id, ua.unlocked_at);
      }
      setUnlocked(map);
    }
    if (statsRes.data) {
      setTotalXp(statsRes.data.total_xp);
    } else {
      // Auto-initialize user stats for new users
      await supabase
        .from("user_stats")
        .upsert({ user_id: user.id }, { onConflict: "user_id" });
    }
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered =
    activeCategory === "all"
      ? achievements
      : achievements.filter((a) => a.category === activeCategory);

  const unlockedCount = achievements.filter((a) => unlocked.has(a.id)).length;
  const levelInfo = getLevelInfo(totalXp);

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
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center hover:border-[#C5A059] transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">Achievements</h1>
              <p className="text-xs text-muted-foreground">
                {unlockedCount} of {achievements.length} unlocked
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#C5A059]/10 to-[#E8C77D]/10 border border-[#C5A059]/20">
              <Trophy className="w-4 h-4 text-[#C5A059]" />
              <span className="text-sm font-semibold text-[#C5A059]">
                {totalXp} XP
              </span>
            </div>
          </div>

          {/* Level Progress */}
          <LevelProgressBar
            level={levelInfo.level}
            title={levelInfo.title}
            currentXp={totalXp}
            xpForCurrentLevel={levelInfo.xpForCurrentLevel}
            xpForNextLevel={levelInfo.xpForNextLevel}
          />

          {/* Category filters */}
          <div
            className="flex gap-2 overflow-x-auto mt-4 pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {CATEGORIES.map((cat) => {
              const count =
                cat.id === "all"
                  ? achievements.length
                  : achievements.filter((a) => a.category === cat.id).length;
              if (count === 0 && cat.id !== "all") return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                    activeCategory === cat.id
                      ? "bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-[#2c2416]"
                      : "border border-border text-muted-foreground hover:border-[#C5A059]",
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Unlocked section */}
        {filtered.some((a) => unlocked.has(a.id)) && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
              Unlocked
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered
                .filter((a) => unlocked.has(a.id))
                .map((a) => (
                  <AchievementCard
                    key={a.id}
                    achievement={{
                      ...a,
                      isUnlocked: true,
                      unlockedAt: unlocked.get(a.id) || null,
                    }}
                  />
                ))}
            </div>
          </section>
        )}

        {/* Locked section */}
        <section>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
            {filtered.some((a) => unlocked.has(a.id))
              ? "Locked"
              : "All Achievements"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered
              .filter((a) => !unlocked.has(a.id))
              .map((a) => (
                <AchievementCard
                  key={a.id}
                  achievement={{
                    ...a,
                    isUnlocked: false,
                    unlockedAt: null,
                  }}
                />
              ))}
          </div>
          {filtered.filter((a) => !unlocked.has(a.id)).length === 0 &&
            filtered.length > 0 && (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-[#C5A059] mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">
                  All unlocked in this category!
                </p>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}
