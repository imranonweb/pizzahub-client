import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedRouteFallback() {
  return (
    <section
      className="mx-auto flex min-h-[60dvh] w-full max-w-4xl flex-col justify-center gap-4 px-6 py-12"
      aria-busy="true"
      aria-label="Verifying session"
    >
      <Skeleton className="h-7 w-52 rounded-lg" />
      <Skeleton className="h-4 w-80 max-w-full rounded-md" />
      <div className="grid gap-3 pt-2 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </section>
  );
}
