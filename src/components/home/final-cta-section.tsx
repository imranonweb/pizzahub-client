import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCtaSection() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-border bg-accent/65 p-8 sm:p-10 lg:flex-row lg:items-center">
        <div className="max-w-xl space-y-2">
          <h2
            id="final-cta-heading"
            className="font-heading text-2xl font-bold tracking-[-0.025em] text-foreground sm:text-3xl"
          >
            Ready for dinner from a real brick oven?
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Explore approved pizzas across local kitchens or open a free account
            as a customer or vendor in under a minute.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/menu"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-11 rounded-xl px-5 text-sm font-semibold shadow-sm",
            )}
          >
            <span>Explore Menu</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 rounded-xl bg-card px-5 text-sm font-semibold",
            )}
          >
            Create Account
          </Link>
        </div>
      </div>
    </section>
  );
}
