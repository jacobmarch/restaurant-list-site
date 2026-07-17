import { Suspense } from "react";
import { TimelineContentSkeleton } from "@/components/MainPageSkeleton";
import { TimelineContent } from "@/components/TimelineContent";

export default function TimelinePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-800">
          Our timeline
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Every restaurant we&apos;ve visited, newest first.
        </p>
      </div>
      <Suspense
        fallback={
          <>
            <span className="sr-only">Loading timeline…</span>
            <TimelineContentSkeleton />
          </>
        }
      >
        <TimelineContent />
      </Suspense>
    </main>
  );
}
