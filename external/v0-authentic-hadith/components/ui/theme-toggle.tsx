"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "default" | "compact" | "settings";
  className?: string;
}

export function ThemeToggle({
  variant = "default",
  className,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn("h-10 w-10 rounded-lg bg-muted animate-pulse", className)}
      />
    );
  }

  if (variant === "compact") {
    return (
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-lg",
          "border border-border bg-card hover:border-secondary",
          "transition-colors duration-200",
          className,
        )}
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-secondary" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-secondary" />
      </button>
    );
  }

  if (variant === "settings") {
    const themes = [
      { value: "light", icon: Sun, label: "Light" },
      { value: "dark", icon: Moon, label: "Dark" },
      { value: "system", icon: Monitor, label: "System" },
    ];

    return (
      <div className={cn("space-y-3", className)}>
        {themes.map((item) => (
          <button
            key={item.value}
            onClick={() => setTheme(item.value)}
            className={cn(
              "w-full rounded-xl p-4 flex items-center gap-4 text-left transition-all",
              "border",
              theme === item.value
                ? "border-secondary bg-secondary/10"
                : "border-border bg-card hover:border-secondary/50",
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                theme === item.value
                  ? "bg-secondary text-white"
                  : "bg-secondary/10 text-secondary",
              )}
            >
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3
                className={cn(
                  "font-medium",
                  theme === item.value
                    ? "text-secondary"
                    : "text-foreground",
                )}
              >
                {item.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {item.value === "light" && "Always use light mode"}
                {item.value === "dark" && "Always use dark mode"}
                {item.value === "system" && "Match your device settings"}
              </p>
            </div>
            {theme === item.value && (
              <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default variant - segmented control
  return (
    <div
      className={cn(
        "relative inline-flex gap-1 p-1 rounded-lg border border-border bg-card",
        className,
      )}
    >
      {[
        { value: "light", icon: Sun },
        { value: "system", icon: Monitor },
        { value: "dark", icon: Moon },
      ].map((item) => (
        <button
          key={item.value}
          onClick={() => setTheme(item.value)}
          className={cn(
            "relative inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
            theme === item.value
              ? "bg-muted shadow-sm text-secondary"
              : "text-muted-foreground hover:text-secondary",
          )}
          aria-label={`${item.value} theme`}
        >
          <item.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

export function useIsDarkMode() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? resolvedTheme === "dark" : false;
}
