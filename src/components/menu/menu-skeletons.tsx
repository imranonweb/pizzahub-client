import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ITEMS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

export function MenuGridSkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading menu items">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SKELETON_ITEMS.map((key) => (
          <div
            key={key}
            className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-md" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MenuDetailSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading pizza details"
      className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <Skeleton className="mb-8 h-5 w-64 rounded-md" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
        <div className="space-y-5">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-9 w-4/5 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </section>
  );
}
