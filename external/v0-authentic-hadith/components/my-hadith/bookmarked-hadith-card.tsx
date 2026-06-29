"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2, ExternalLink, Sparkles, Loader2, BookOpen, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkedHadithCardProps {
  bookmark: {
    id: string;
    item_id: string;
    item_type: string;
    created_at: string;
    hadiths: {
      id: string;
      arabic_text: string;
      english_translation: string;
      collection: string;
      reference: string;
      grade: string;
      summary_line: string;
    };
  };
  onRemove?: () => void;
  onClick?: () => void;
}

const gradeColors: Record<string, string> = {
  sahih: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  hasan: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  daif: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function BookmarkedHadithCard({
  bookmark,
  onRemove,
  onClick,
}: BookmarkedHadithCardProps) {
  const hadith = bookmark.hadiths;
  const [summarizing, setSummarizing] = useState(false);
  const [teaching, setTeaching] = useState<string | null>(null);
  const [teachingOpen, setTeachingOpen] = useState(false);
  const teachingRef = useRef<HTMLDivElement>(null);
  const [teachingHeight, setTeachingHeight] = useState(0);

  useEffect(() => {
    if (teachingRef.current) {
      setTeachingHeight(teachingRef.current.scrollHeight);
    }
  }, [teachingOpen, teaching]);

  const handleSummarize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSummarizing(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hadithId: hadith.id }),
      });
      const data = await res.json();
      if (res.ok && data.key_teaching_en) {
        setTeaching(data.key_teaching_en);
        setTeachingOpen(true);
      }
    } catch (err) {
      console.error("Summarize failed:", err);
    }
    setSummarizing(false);
  };

  if (!hadith) return null;

  return (
    <div className="group premium-card gold-border rounded-xl overflow-hidden transition-all hover:shadow-md">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left p-4"
      >
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            {hadith.collection}
          </span>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-xs text-muted-foreground">
            {hadith.reference}
          </span>
          {hadith.grade && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize",
                gradeColors[hadith.grade?.toLowerCase()] ||
                  "bg-muted text-muted-foreground",
              )}
            >
              {hadith.grade}
            </span>
          )}
        </div>

        {/* Summary or translation */}
        {hadith.summary_line ? (
          <p className="text-sm font-semibold text-foreground mb-1 line-clamp-1">
            {hadith.summary_line}
          </p>
        ) : null}
        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">
          {hadith.english_translation}
        </p>

        {/* Summarize / Key Teaching */}
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          {teaching ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTeachingOpen(!teachingOpen);
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium text-[#C5A059] bg-[#C5A059]/8 hover:bg-[#C5A059]/15 transition-colors"
              >
                <BookOpen className="w-3 h-3" />
                Key Teaching
                <ChevronDown
                  className={cn("w-3 h-3 transition-transform duration-200", teachingOpen && "rotate-180")}
                />
              </button>
              <div
                ref={teachingRef}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: teachingOpen ? `${teachingHeight}px` : "0px", opacity: teachingOpen ? 1 : 0 }}
              >
                <div className="mt-2 rounded-lg border border-[#C5A059]/15 bg-[#C5A059]/5 p-2.5">
                  <p className="text-[11px] leading-relaxed text-foreground/75">{teaching}</p>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-[#1B5E43] bg-[#1B5E43]/8 hover:bg-[#1B5E43]/15 transition-colors disabled:opacity-50"
            >
              {summarizing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {summarizing ? "Summarizing..." : "Summarize"}
            </button>
          )}
        </div>

        {/* Saved date */}
        <p className="text-[10px] text-muted-foreground mt-2">
          Saved {new Date(bookmark.created_at).toLocaleDateString()}
        </p>
      </button>

      {/* Action bar */}
      <div className="flex items-center justify-end gap-1 px-3 pb-3">
        <button
          type="button"
          onClick={onClick}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          aria-label="View hadith"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors"
            aria-label="Remove bookmark"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
