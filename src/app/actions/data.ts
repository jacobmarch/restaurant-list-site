"use server";

import { getRestaurants, getTimelineVisits } from "@/lib/data";
import type { Restaurant, TimelineVisit } from "@/lib/types";

export async function loadAppData(): Promise<{
  restaurants: Restaurant[];
  visits: TimelineVisit[];
}> {
  const [restaurants, visits] = await Promise.all([
    getRestaurants(),
    getTimelineVisits(),
  ]);

  return { restaurants, visits };
}
