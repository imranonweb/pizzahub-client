import { Check } from "lucide-react";
import {
  ORDER_LIFECYCLE_STEPS,
  type OrderStatus,
  type OrderTimelineEvent,
} from "@/lib/order-rules";
import { cn } from "@/lib/utils";
import { getOrderStatusMeta } from "./order-status-badge";

function formatEventTimestamp(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() === 0) {
    return null;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(parsed);
}

export function OrderTimeline({
  currentStatus,
  statusHistory,
}: {
  currentStatus: OrderStatus;
  statusHistory: readonly OrderTimelineEvent[];
}) {
  const historyByStatus = new Map<OrderStatus, OrderTimelineEvent>();
  for (const event of statusHistory) {
    historyByStatus.set(event.status, event);
  }

  const isTerminalInterruption =
    currentStatus === "rejected" || currentStatus === "cancelled";

  if (isTerminalInterruption) {
    const reachedSteps =
      statusHistory.length > 0
        ? statusHistory
        : [{ status: currentStatus, timestamp: null, note: null }];

    return (
      <ol className="space-y-4">
        {reachedSteps.map((entry, index) => {
          const meta = getOrderStatusMeta(entry.status);
          const Icon = meta.icon;
          const formattedTime = formatEventTimestamp(entry.timestamp);
          const isLast = index === reachedSteps.length - 1;
          const isRejectedOrCancelled =
            entry.status === "rejected" || entry.status === "cancelled";

          const entryKey = entry.timestamp
            ? `${entry.status}-${entry.timestamp}`
            : entry.status;

          return (
            <li key={entryKey} className="relative flex items-start gap-3.5">
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className="absolute top-8 left-4 h-[calc(100%-0.5rem)] w-px bg-border"
                />
              ) : null}

              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border",
                  isRejectedOrCancelled
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-primary/30 bg-primary/10 text-primary",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1 space-y-0.5 pb-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-heading text-sm font-semibold text-foreground">
                    {meta.label}
                  </p>
                  {formattedTime ? (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formattedTime}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {entry.note || meta.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  const currentStepIndex = ORDER_LIFECYCLE_STEPS.indexOf(currentStatus);

  return (
    <ol className="space-y-4">
      {ORDER_LIFECYCLE_STEPS.map((step, index) => {
        const meta = getOrderStatusMeta(step);
        const event = historyByStatus.get(step);
        const formattedTime = formatEventTimestamp(event?.timestamp);
        const isCurrent = step === currentStatus;
        const isCompleted =
          Boolean(event) ||
          (currentStepIndex !== -1 && index <= currentStepIndex);
        const isLast = index === ORDER_LIFECYCLE_STEPS.length - 1;

        return (
          <li key={step} className="relative flex items-start gap-3.5">
            {!isLast ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-8 left-4 h-[calc(100%-0.5rem)] w-px",
                  isCompleted && index < currentStepIndex
                    ? "bg-primary/50"
                    : "bg-border",
                )}
              />
            ) : null}

            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                isCurrent
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : isCompleted
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-muted text-muted-foreground",
              )}
            >
              {isCompleted && !isCurrent ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <meta.icon className="size-4" aria-hidden="true" />
              )}
            </span>

            <div className="min-w-0 flex-1 space-y-0.5 pb-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p
                  className={cn(
                    "font-heading text-sm font-semibold",
                    isCompleted ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {meta.label}
                </p>
                {formattedTime ? (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formattedTime}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {event?.note || meta.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
