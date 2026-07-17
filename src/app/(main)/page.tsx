import Link from "next/link";
import { Suspense } from "react";
import { HomeContent } from "@/components/HomeContent";
import { HomeContentSkeleton } from "@/components/MainPageSkeleton";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-800">
          Add a visit
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Log a new restaurant memory while it&apos;s fresh.
        </p>
      </div>
      <Suspense fallback={<HomeContentSkeleton />}>
        <HomeContent />
      </Suspense>
      <Link
        href="/timeline"
        className="flex items-center justify-center gap-1 rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm font-medium text-rose-600 shadow-sm transition-colors hover:bg-rose-50"
      >
        View our timeline
        <span aria-hidden>→</span>
      </Link>
    </main>
  );
}
