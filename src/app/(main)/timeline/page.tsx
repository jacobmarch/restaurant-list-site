import { Timeline } from "@/components/Timeline";
import type { TimelineVisit } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

export default async function TimelinePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, visits(id, visited_at, notes, image_path)");

  if (error) {
    throw new Error(error.message);
  }

  // Flatten every visit across all restaurants into one chronological list,
  // newest -> oldest, so the latest visit sits at the top of the timeline.
  const visits: TimelineVisit[] = (data ?? [])
    .flatMap((restaurant) =>
      (restaurant.visits ?? []).map((visit) => ({
        id: visit.id,
        restaurantName: restaurant.name,
        visited_at: visit.visited_at,
        notes: visit.notes,
        image_path: visit.image_path,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime(),
    );

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
      <Timeline visits={visits} />
    </main>
  );
}
