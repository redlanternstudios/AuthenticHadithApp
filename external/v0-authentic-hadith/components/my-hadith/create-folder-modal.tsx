"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const FOLDER_COLORS = [
  "#1b5e43",
  "#c5a059",
  "#b91c1c",
  "#2563eb",
  "#7c3aed",
  "#ea580c",
  "#0891b2",
  "#6b7280",
];

const FOLDER_EMOJIS = [
  "📖", "⭐", "🤲", "📚", "💡", "🕌", "🌙", "💎",
];

interface CreateFolderModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateFolderModal({
  open,
  onClose,
  onCreated,
}: CreateFolderModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [emoji, setEmoji] = useState(FOLDER_EMOJIS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setColor(FOLDER_COLORS[0]);
      setEmoji(FOLDER_EMOJIS[0]);
    }
  }, [open]);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/my-hadith/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color, icon: emoji }),
      });
      if (res.ok) {
        onCreated();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={() => {}}
        role="presentation"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">
            Create Folder
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="folder-name"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Name
            </label>
            <input
              id="folder-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Favorites, Daily Reads"
              maxLength={50}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 outline-none transition-all text-sm"
              autoFocus
            />
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Icon
            </label>
            <div className="flex gap-2 flex-wrap">
              {FOLDER_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-lg border-2 text-lg flex items-center justify-center transition-all ${
                    emoji === e
                      ? "border-[#C5A059] bg-[#C5A059]/10"
                      : "border-border hover:border-[#C5A059]/50"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Color
            </label>
            <div className="flex gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor:
                      color === c ? "var(--foreground)" : "transparent",
                  }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/30">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
              style={{
                backgroundColor: `${color}20`,
                color: color,
              }}
            >
              {emoji}
            </div>
            <span className="text-sm font-medium text-foreground">
              {name || "Folder name"}
            </span>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="w-full gold-button py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Folder"}
          </button>
        </div>
      </div>
    </div>
  );
}
