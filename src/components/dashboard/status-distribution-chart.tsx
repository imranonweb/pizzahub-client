"use client";

import { cn } from "@/lib/utils";

export interface ChartSegment {
  label: string;
  value: number;
  colorClass: string;
}

export function StatusDistributionChart({
  title,
  description,
  segments,
  emptyMessage = "No data recorded yet.",
  className,
}: {
  title: string;
  description?: string;
  segments: readonly ChartSegment[];
  emptyMessage?: string;
  className?: string;
}) {
  const total = segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0);

  return (
    <section
      aria-label={title}
      className={cn(
        "surface-card rounded-2xl border border-border/90 bg-card p-5 sm:p-6",
        className,
      )}
    >
      <div className="mb-4 space-y-0.5">
        <h2 className="font-heading text-base font-semibold tracking-[-0.015em] text-foreground sm:text-lg">
          {title}
        </h2>
        {description ? (
          <p className="text-xs text-muted-foreground sm:text-sm">
            {description}
          </p>
        ) : null}
      </div>

      {total === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stacked proportion bar */}
          <div
            role="img"
            aria-label={`${title}: ${segments.map((s) => `${s.label} ${s.value}`).join(", ")}`}
            className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted p-0.5"
          >
            {segments.map((seg) => {
              const pct =
                total > 0 ? (Math.max(0, seg.value) / total) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={seg.label}
                  style={{ width: `${pct}%` }}
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    seg.colorClass,
                  )}
                />
              );
            })}
          </div>

          {/* Individual horizontal bars */}
          <div className="space-y-2.5">
            {segments.map((seg) => {
              const pct =
                total > 0
                  ? Math.round((Math.max(0, seg.value) / total) * 100)
                  : 0;
              return (
                <div key={seg.label} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-2 font-medium text-foreground">
                      <span
                        aria-hidden="true"
                        className={cn("size-2.5 rounded-full", seg.colorClass)}
                      />
                      {seg.label}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      <strong className="font-semibold text-foreground">
                        {seg.value}
                      </strong>{" "}
                      ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
                    <div
                      style={{ width: `${pct}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        seg.colorClass,
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
