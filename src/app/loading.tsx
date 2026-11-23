import { Loader2 } from "lucide-react";
import { PizzaHubBrandMark } from "@/components/brand/pizzahub-logo";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
      <PizzaHubBrandMark />
      <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Loader2
          className="size-4 animate-spin text-primary"
          aria-hidden="true"
        />
        <span>Heating up the oven...</span>
      </div>
    </div>
  );
}
