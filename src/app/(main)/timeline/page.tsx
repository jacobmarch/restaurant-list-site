"use client";

import { useAppData } from "@/components/AppDataProvider";
import { Timeline } from "@/components/Timeline";

export default function TimelinePage() {
  const { visits } = useAppData();
  const uniqueChains = new Set(visits.map((visit) => visit.restaurant_id)).size;

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-800">
          Our timeline
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Every visit we&apos;ve logged, newest first.
        </p>
        <p className="mt-3 font-display text-sm text-stone-600">
          <span className="text-2xl font-semibold tabular-nums text-rose-500">
            {uniqueChains}
          </span>{" "}
          <span className="text-stone-500">chains visited</span>
        </p>
      </div>
      <Timeline visits={visits} />
    </main>
  );
}
