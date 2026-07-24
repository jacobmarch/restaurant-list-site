import { Fragment } from "react";
import { VisitEditor } from "@/components/VisitEditor";
import { formatMonthLabel } from "@/lib/format";
import type { TimelineVisit } from "@/lib/types";

type TimelineProps = {
  visits: TimelineVisit[];
};

export function Timeline({ visits }: TimelineProps) {
  if (visits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-rose-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="font-display text-lg text-stone-700">No visits yet</p>
        <p className="mt-2 text-sm text-stone-500">
          Add your first restaurant — the story starts here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Continuous vertical rail behind the dots. */}
      <span
        aria-hidden
        className="absolute bottom-2 left-2 top-2 w-px bg-rose-200"
      />
      <ol className="space-y-5">
        {visits.map((visit, index) => {
          const month = formatMonthLabel(visit.visited_at);
          const startsNewMonth =
            index === 0 ||
            formatMonthLabel(visits[index - 1].visited_at) !== month;

          return (
            <Fragment key={visit.id}>
              {startsNewMonth ? (
                <li className="relative pl-9 pt-3 first:pt-0">
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-rose-400">
                    {month}
                  </h2>
                </li>
              ) : null}

              <li className="relative pl-9">
                <span
                  aria-hidden
                  className="absolute left-2 top-4 h-3 w-3 -translate-x-1/2 rounded-full bg-rose-400 ring-4 ring-stone-50"
                />
                <VisitEditor visit={visit} />
              </li>
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
