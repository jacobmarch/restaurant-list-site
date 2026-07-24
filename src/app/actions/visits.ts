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

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function resolveRestaurantId(
  supabase: SupabaseClient,
  rawName: string,
  restaurantId: string | null,
): Promise<{ restaurantId: string } | { error: string }> {
  if (restaurantId) {
    return { restaurantId };
  }

  const displayName = formatRestaurantName(rawName);
  const normalizedName = normalizeRestaurantName(rawName);

  const { data: existing } = await supabase
    .from("restaurants")
    .select("id")
    .eq("normalized_name", normalizedName)
    .maybeSingle();

  if (existing) {
    return { restaurantId: existing.id };
  }

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
      return { restaurantId: raced.id };
    }

    return { error: insertError.message };
  }

  return { restaurantId: created.id };
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

  const restaurant = await resolveRestaurantId(supabase, rawName, restaurantId);

  if ("error" in restaurant) {
    return { error: restaurant.error };
  }

  const visitedAtIso = new Date(`${visitedAt}T12:00:00`).toISOString();

  const { data: visit, error: visitError } = await supabase
    .from("visits")
    .insert({
      restaurant_id: restaurant.restaurantId,
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

export async function updateVisit(
  visitId: string,
  input: {
    restaurantName: string;
    restaurantId?: string | null;
    visitedAt: string;
    notes?: string | null;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
    rating: number;
  },
): Promise<{ error?: string }> {
  const trimmedVisitId = visitId.trim();
  const rawName = input.restaurantName.trim();
  const restaurantId = input.restaurantId?.trim() || null;
  const visitedAt = input.visitedAt.trim();
  const notesRaw = (input.notes ?? "").trim();
  const notes = notesRaw || null;
  const rawAddress = (input.address ?? "").trim();
  const rating = parseRating(String(input.rating));

  if (!trimmedVisitId) {
    return { error: "Missing visit." };
  }

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
  const location = await resolveVisitLocation(
    rawAddress,
    input.lat ?? null,
    input.lng ?? null,
  );

  if ("error" in location) {
    return { error: location.error };
  }

  const restaurant = await resolveRestaurantId(supabase, rawName, restaurantId);

  if ("error" in restaurant) {
    return { error: restaurant.error };
  }

  const visitedAtIso = new Date(`${visitedAt}T12:00:00`).toISOString();

  const { error } = await supabase
    .from("visits")
    .update({
      restaurant_id: restaurant.restaurantId,
      visited_at: visitedAtIso,
      notes,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      rating,
    })
    .eq("id", trimmedVisitId);

  if (error) {
    return { error: error.message };
  }

  updateTag(RESTAURANTS_CACHE_TAG);
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
