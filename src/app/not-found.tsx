import { ArrowLeft, Search, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UtensilsCrossed className="size-8" aria-hidden="true" />
        </div>

        <p className="font-mono text-sm font-semibold tracking-wider text-primary uppercase">
          Error 404
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl">
          This slice isn&apos;t on the menu
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          The page you&apos;re looking for may have moved, expired, or never
          existed. Head back to our storefront to explore fresh local pizzas.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 rounded-xl bg-card px-5 font-medium",
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Home
          </Link>
          <Link
            href="/menu"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-10 rounded-xl px-5 font-semibold",
            )}
          >
            <Search className="size-4" aria-hidden="true" />
            Browse Menu
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
