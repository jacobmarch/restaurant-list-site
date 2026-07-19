"use server";

import { updateTag } from "next/cache";
import { geocodeAddress } from "@/lib/geocode";
import {
  formatRestaurantName,
  normalizeRestaurantName,
} from "@/lib/restaurant-name";
import {
  RESTAURANTS_CACHE_TAG,
  TIMELINE_CACHE_TAG,
} from "@/lib/cache-tags";
import { parseRating } from "@/lib/rating";
import type { AddVisitState } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

type VisitLocation = {
  address: string | null;
  lat: number | null;
  lng: number | null;
};

async function requireAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "Your session expired. Please sign in again." } as const;
  }

  return { supabase } as const;
}

function parseOptionalCoord(raw: FormDataEntryValue | string | null): number | null {
  if (raw == null) {
    return null;
  }

  const value = String(raw).trim();
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function resolveVisitLocation(
  rawAddress: string,
  clientLat: number | null = null,
  clientLng: number | null = null,
): Promise<VisitLocation | { error: string }> {
  const trimmed = rawAddress.trim();

  if (!trimmed) {
    return { address: null, lat: null, lng: null };
  }

  if (clientLat != null && clientLng != null) {
    return {
      address: trimmed,
      lat: clientLat,
      lng: clientLng,
    };
  }

  const result = await geocodeAddress(trimmed);

  if ("error" in result) {
    return { error: result.error };
  }

  return {
    address: trimmed,
    lat: result.lat,
    lng: result.lng,
  };
}

export async function addVisit(
  _prevState: AddVisitState,
  formData: FormData,
): Promise<AddVisitState> {
  const rawName = String(formData.get("restaurantName") ?? "").trim();
  const restaurantId = String(formData.get("restaurantId") ?? "").trim() || null;
  const visitedAt = String(formData.get("visitedAt") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw || null;
  const rawAddress = String(formData.get("address") ?? "").trim();
  const clientLat = parseOptionalCoord(formData.get("lat"));
  const clientLng = parseOptionalCoord(formData.get("lng"));
  const rating = parseRating(formData.get("rating"));

  if (!rawName) {
    return { error: "Please enter a restaurant name." };
  }

  if (!visitedAt) {
    return { error: "Please select a visit date." };
  }

  if (rating == null) {
    return { error: "Please select a rating from 1 to 5 stars." };
  }

  const auth = await requireAuthenticatedClient();

  if ("error" in auth) {
    return { error: auth.error };
  }

  const { supabase } = auth;
  const location = await resolveVisitLocation(rawAddress, clientLat, clientLng);

  if ("error" in location) {
    return { error: location.error };
  }

  const displayName = formatRestaurantName(rawName);

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
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      rating,
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

export async function updateVisitAddress(
  visitId: string,
  address: string,
  lat?: number | null,
  lng?: number | null,
): Promise<{ error?: string }> {
  const trimmedVisitId = visitId.trim();

  if (!trimmedVisitId) {
    return { error: "Missing visit." };
  }

  const auth = await requireAuthenticatedClient();

  if ("error" in auth) {
    return { error: auth.error };
  }

  const location = await resolveVisitLocation(
    address,
    lat ?? null,
    lng ?? null,
  );

  if ("error" in location) {
    return { error: location.error };
  }

  const { supabase } = auth;

  const { error } = await supabase
    .from("visits")
    .update({
      address: location.address,
      lat: location.lat,
      lng: location.lng,
    })
    .eq("id", trimmedVisitId);

  if (error) {
    return { error: error.message };
  }

  updateTag(TIMELINE_CACHE_TAG);
  return {};
}

export async function updateVisitRating(
  visitId: string,
  rating: number,
): Promise<{ error?: string }> {
  const trimmedVisitId = visitId.trim();
  const parsed = parseRating(String(rating));

  if (!trimmedVisitId) {
    return { error: "Missing visit." };
  }

  if (parsed == null) {
    return { error: "Please select a rating from 1 to 5 stars." };
  }

  const auth = await requireAuthenticatedClient();

  if ("error" in auth) {
    return { error: auth.error };
  }

  const { supabase } = auth;

  const { error } = await supabase
    .from("visits")
    .update({ rating: parsed })
    .eq("id", trimmedVisitId);

  if (error) {
    return { error: error.message };
  }

  updateTag(TIMELINE_CACHE_TAG);
  return {};
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

  const auth = await requireAuthenticatedClient();

  if ("error" in auth) {
    return { error: auth.error };
  }

  const { supabase } = auth;

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
