import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MotionReveal } from "@/components/home/motion-reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCtaSection() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="mx-auto w-full max-w-6xl px-4 py-18 sm:px-6 lg:px-8 lg:py-22"
    >
      <MotionReveal className="relative overflow-hidden rounded-3xl border border-[#3a2820] bg-[#1a110d] p-8 text-[#faf6f0] shadow-[0_24px_48px_-24px_rgba(22,15,12,0.6)] sm:p-11 lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_110%_at_100%_0%,rgba(220,76,42,0.22)_0%,transparent_65%)]"
        />
        <div className="relative flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
          <div className="max-w-xl space-y-2.5">
            <h2
              id="final-cta-heading"
              className="font-heading text-2xl font-bold tracking-[-0.03em] text-[#faf6f0] text-balance sm:text-[2rem]"
            >
              Ready for dinner from a real brick oven?
            </h2>
            <p className="text-sm leading-relaxed text-[#d7cbc0] sm:text-base">
              Explore approved pizzas across local kitchens or open a free
              account as a customer or vendor in under a minute.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/menu"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-12 w-full rounded-xl px-6 text-sm font-semibold sm:w-auto",
              )}
            >
              <span>Explore Pizza Menu</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/sign-up"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 w-full rounded-xl border-[#faf6f0]/25 bg-transparent px-6 text-sm font-semibold text-[#faf6f0] hover:border-[#faf6f0]/45 hover:bg-[#faf6f0]/10 hover:text-[#faf6f0] sm:w-auto",
              )}
            >
              Create Account
            </Link>
          </div>
        </div>
      </MotionReveal>
    </section>
  );
}
