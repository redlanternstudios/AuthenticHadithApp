"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  className?: string;
}

export function StatCard({
  icon: IconComponent = Star,
  label,
  value,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-4 text-center",
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full gold-icon-bg">
        <IconComponent className="h-5 w-5 text-[#C5A059]" />
      </div>
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
