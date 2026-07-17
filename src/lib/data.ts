import { cacheLife, cacheTag } from "next/cache";
import {
  RESTAURANTS_CACHE_TAG,
  TIMELINE_CACHE_TAG,
} from "@/lib/cache-tags";
import type { Restaurant, TimelineVisit } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

export async function getRestaurants(): Promise<Restaurant[]> {
  "use cache: private";
  cacheTag(RESTAURANTS_CACHE_TAG);
  cacheLife("days");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, normalized_name")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    normalized_name: restaurant.normalized_name,
  }));
}

export async function getTimelineVisits(): Promise<TimelineVisit[]> {
  "use cache: private";
  cacheTag(TIMELINE_CACHE_TAG);
  cacheLife("days");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("visits")
    .select("id, visited_at, notes, image_path, restaurants(name)")
    .order("visited_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((visit) => {
    const restaurantRelation = visit.restaurants;
    const restaurant = Array.isArray(restaurantRelation)
      ? restaurantRelation[0]
      : restaurantRelation;

    return {
      id: visit.id,
      restaurantName: restaurant?.name ?? "Unknown restaurant",
      visited_at: visit.visited_at,
      notes: visit.notes,
      image_path: visit.image_path,
    };
  });
}
