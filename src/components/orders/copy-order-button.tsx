"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function CopyOrderButton({
  orderId,
  className,
}: {
  orderId: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      toast.add({
        title: "Order ID copied",
        description: `#${orderId} copied to clipboard.`,
        type: "success",
      });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.add({
        title: "Copy failed",
        description: "Unable to copy order reference.",
        type: "error",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={`Copy order ID ${orderId}`}
      title="Copy order reference"
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="size-3 text-emerald-600" aria-hidden="true" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="size-3" aria-hidden="true" />
          <span>Copy ID</span>
        </>
      )}
    </button>
  );
}
