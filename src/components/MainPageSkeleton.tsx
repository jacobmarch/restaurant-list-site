function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-xl bg-stone-200/80 ${className ?? ""}`}
    />
  );
}

export function MainPageHeadingSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonBlock className="h-4 w-64 max-w-full" />
    </div>
  );
}

export function HomeContentSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-72 w-full rounded-2xl" />
      <SkeletonBlock className="h-12 w-full rounded-2xl" />
    </div>
  );
}

export function TimelineContentSkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonBlock className="ml-9 h-4 w-24" />
      <SkeletonBlock className="ml-9 h-36 w-full rounded-2xl" />
      <SkeletonBlock className="ml-9 h-28 w-full rounded-2xl" />
      <SkeletonBlock className="ml-9 h-32 w-full rounded-2xl" />
    </div>
  );
}

export function MainRouteLoadingSkeleton() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <MainPageHeadingSkeleton />
      <HomeContentSkeleton />
      <SkeletonBlock className="h-12 w-full rounded-2xl" />
    </main>
  );
}
