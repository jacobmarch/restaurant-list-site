"use server";

import { updateTag } from "next/cache";
import {
  formatRestaurantName,
  normalizeRestaurantName,
} from "@/lib/restaurant-name";
import {
  RESTAURANTS_CACHE_TAG,
  TIMELINE_CACHE_TAG,
} from "@/lib/cache-tags";
import type { AddVisitState } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

export async function addVisit(
  _prevState: AddVisitState,
  formData: FormData,
): Promise<AddVisitState> {
  const rawName = String(formData.get("restaurantName") ?? "").trim();
  const restaurantId = String(formData.get("restaurantId") ?? "").trim() || null;
  const visitedAt = String(formData.get("visitedAt") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw || null;

  if (!rawName) {
    return { error: "Please enter a restaurant name." };
  }

  if (!visitedAt) {
    return { error: "Please select a visit date." };
  }

  const displayName = formatRestaurantName(rawName);
  const supabase = await createClient();

  let targetRestaurantId = restaurantId;

  if (!targetRestaurantId) {
    const normalizedName = normalizeRestaurantName(rawName);

    const { data: existing } = await supabase
      .from("restaurants")
      .select("id")
      .eq("normalized_name", normalizedName)
      .maybeSingle();

    if (existing) {
      targetRestaurantId = existing.id;
    } else {
      const { data: created, error: insertError } = await supabase
        .from("restaurants")
        .insert({ name: displayName, normalized_name: normalizedName })
        .select("id")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          const { data: raced } = await supabase
            .from("restaurants")
            .select("id")
            .eq("normalized_name", normalizedName)
            .single();

          if (!raced) {
            return { error: "Could not save restaurant. Please try again." };
          }
          targetRestaurantId = raced.id;
        } else {
          return { error: insertError.message };
        }
      } else {
        targetRestaurantId = created.id;
      }
    }
  }

  const visitedAtIso = new Date(`${visitedAt}T12:00:00`).toISOString();

  const { data: visit, error: visitError } = await supabase
    .from("visits")
    .insert({
      restaurant_id: targetRestaurantId,
      visited_at: visitedAtIso,
      notes,
    })
    .select("id")
    .single();

  if (visitError) {
    return { error: visitError.message };
  }

  updateTag(RESTAURANTS_CACHE_TAG);
  updateTag(TIMELINE_CACHE_TAG);
  return { success: true, visitId: visit.id };
}

export async function setVisitImage(
  visitId: string,
  imagePath: string,
): Promise<{ error?: string }> {
  const trimmedVisitId = visitId.trim();
  const trimmedImagePath = imagePath.trim();

  if (!trimmedVisitId || !trimmedImagePath) {
    return { error: "Missing visit or image path." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("visits")
    .update({ image_path: trimmedImagePath })
    .eq("id", trimmedVisitId);

  if (error) {
    return { error: error.message };
  }

  updateTag(TIMELINE_CACHE_TAG);
  return {};
}
