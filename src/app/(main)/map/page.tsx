"use client";

import dynamic from "next/dynamic";
import { useAppData } from "@/components/AppDataProvider";

const VisitMap = dynamic(
  () => import("@/components/VisitMap").then((mod) => mod.VisitMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(70vh,520px)] items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-rose-100/60">
        <p className="text-sm text-stone-500">Loading map…</p>
      </div>
    ),
  },
);

export default function MapPage() {
  const { visits } = useAppData();

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-800">
          Visit map
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Every visit with an address, pinned on the map.
        </p>
      </div>
      <VisitMap visits={visits} />
    </main>
  );
}
