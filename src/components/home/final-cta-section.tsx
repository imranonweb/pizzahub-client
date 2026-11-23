import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MotionReveal } from "@/components/home/motion-reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCtaSection() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <MotionReveal className="surface-card flex flex-col items-start justify-between gap-6 rounded-3xl border border-primary/18 bg-accent/70 p-8 sm:p-10 lg:flex-row lg:items-center">
        <div className="max-w-xl space-y-2">
          <h2
            id="final-cta-heading"
            className="font-heading text-2xl font-bold tracking-[-0.025em] text-foreground text-balance sm:text-3xl"
          >
            Ready for dinner from a real brick oven?
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Explore approved pizzas across local kitchens or open a free account
            as a customer or vendor in under a minute.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/menu"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-11 w-full rounded-xl px-6 text-sm font-semibold sm:w-auto",
            )}
          >
            <span>Explore Pizza Menu</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 w-full rounded-xl bg-card px-6 text-sm font-semibold sm:w-auto",
            )}
          >
            Create Account
          </Link>
        </div>
      </MotionReveal>
    </section>
  );
}
