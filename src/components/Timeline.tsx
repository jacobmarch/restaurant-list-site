import type { RestaurantWithVisits } from "@/lib/types";

function formatVisitDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

type TimelineProps = {
  restaurants: RestaurantWithVisits[];
};

export function Timeline({ restaurants }: TimelineProps) {
  if (restaurants.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-rose-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="font-display text-lg text-stone-700">No visits yet</p>
        <p className="mt-2 text-sm text-stone-500">
          Add your first restaurant above — the story starts here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {restaurants.map((restaurant) => (
        <article
          key={restaurant.id}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-rose-100/60"
        >
          <h2 className="font-display text-lg font-semibold text-stone-800">
            {restaurant.name}
          </h2>
          <ul className="mt-3 space-y-3 border-l-2 border-rose-100 pl-4">
            {restaurant.visits.map((visit) => (
              <li key={visit.id} className="text-sm text-stone-600">
                <span className="font-medium text-stone-700">
                  {formatVisitDate(visit.visited_at)}
                </span>
                {visit.notes ? (
                  <span className="mt-0.5 block italic text-stone-500">
                    &ldquo;{visit.notes}&rdquo;
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
