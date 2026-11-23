"use client";

import { AlertTriangle, Home, RotateCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("PizzaHub dashboard error:", error);
  }, [error]);

  const handleRetry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center bg-background px-4 py-16 text-center text-foreground">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" aria-hidden="true" />
        </div>

        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Dashboard temporarily unavailable
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          Something interrupted loading this workspace view. Try reloading the
          dashboard or return to the storefront.
        </p>

        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            onClick={handleRetry}
            className="h-10 rounded-xl px-5 font-semibold"
          >
            <RotateCw className="size-4" aria-hidden="true" />
            Retry Dashboard
          </Button>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 rounded-xl bg-background px-5 font-medium",
            )}
          >
            <Home className="size-4" aria-hidden="true" />
            Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
