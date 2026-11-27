"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSwitcher({
  className,
  compact = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  return (
    <fieldset
      aria-label="Select interface language"
      className={cn(
        "m-0 inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border/85 bg-card/90 p-0.5 shadow-2xs",
        className,
      )}
    >
      {!compact ? (
        <span
          aria-hidden="true"
          className="hidden items-center pl-2 pr-1 text-muted-foreground xl:inline-flex"
        >
          <Languages className="size-3.5 text-primary" />
        </span>
      ) : null}
      <button
        type="button"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          locale === "en"
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={locale === "bn"}
        onClick={() => setLocale("bn")}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          locale === "bn"
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        বাংলা
      </button>
    </fieldset>
  );
}
