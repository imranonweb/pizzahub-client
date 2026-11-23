import { type ReactNode, Suspense } from "react";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button";
import { Footer } from "./footer";
import { Navbar } from "./navbar";

function NavbarFallback() {
  return (
    <div
      className="sticky top-0 z-40 h-16 border-b border-border/80 bg-background/92 backdrop-blur-md"
      aria-hidden="true"
    />
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Suspense fallback={<NavbarFallback />}>
        <Navbar />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}
