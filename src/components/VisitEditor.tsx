"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { setVisitImage, updateVisit } from "@/app/actions/visits";
import {
  AddressAutocomplete,
  type SelectedPlace,
} from "@/components/AddressAutocomplete";
import { useAppData } from "@/components/AppDataProvider";
import { DatePicker } from "@/components/DatePicker";
import { RestaurantAutocomplete } from "@/components/RestaurantAutocomplete";
import { StarRating } from "@/components/StarRating";
import { VisitImageLightbox } from "@/components/VisitImageLightbox";
import { formatVisitDate } from "@/lib/format";
import {
  validateVisitImage,
  visitImageStoragePath,
  VISIT_IMAGES_BUCKET,
} from "@/lib/storage";
import type { TimelineVisit } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

type VisitEditorProps = {
  visit: TimelineVisit;
};

function toDateInputValue(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function VisitEditor({ visit }: VisitEditorProps) {
  const { restaurants, refresh } = useAppData();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [restaurantName, setRestaurantName] = useState(visit.restaurantName);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(
    visit.restaurant_id,
  );
  const [visitedAt, setVisitedAt] = useState(() =>
    toDateInputValue(visit.visited_at),
  );
  const [notes, setNotes] = useState(visit.notes ?? "");
  const [address, setAddress] = useState(visit.address ?? "");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    null,
  );
  const [rating, setRating] = useState<number>(visit.rating);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  function resetDraftFromVisit() {
    setRestaurantName(visit.restaurantName);
    setSelectedRestaurantId(visit.restaurant_id);
    setVisitedAt(toDateInputValue(visit.visited_at));
    setNotes(visit.notes ?? "");
    setAddress(visit.address ?? "");
    setSelectedPlace(null);
    setRating(visit.rating);
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError(null);
  }

  function openEditor() {
    resetDraftFromVisit();
    setIsEditing(true);
  }

  function cancelEditor() {
    resetDraftFromVisit();
    setIsEditing(false);
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    if (!file) {
      setSelectedImage(null);
      setImagePreviewUrl(null);
      return;
    }

    const validationError = validateVisitImage(file);
    if (validationError) {
      setError(validationError);
      setSelectedImage(null);
      setImagePreviewUrl(null);
      event.target.value = "";
      return;
    }

    setError(null);
    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function handleSave() {
    if (!restaurantName.trim()) {
      setError("Please enter a restaurant name.");
      return;
    }

    if (!visitedAt) {
      setError("Please select a visit date.");
      return;
    }

    if (selectedImage) {
      const validationError = validateVisitImage(selectedImage);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const lat =
      selectedPlace?.lat ??
      (address.trim() === (visit.address ?? "").trim() ? visit.lat : null);
    const lng =
      selectedPlace?.lng ??
      (address.trim() === (visit.address ?? "").trim() ? visit.lng : null);

    startTransition(async () => {
      const result = await updateVisit(visit.id, {
        restaurantName,
        restaurantId: selectedRestaurantId,
        visitedAt,
        notes,
        address,
        lat,
        lng,
        rating,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (!selectedImage) {
        setError(null);
        setIsEditing(false);
        refresh();
        return;
      }

      setIsUploading(true);

      try {
        const supabase = createClient();
        const storagePath = visitImageStoragePath(visit.id, selectedImage);

        const { error: uploadError } = await supabase.storage
          .from(VISIT_IMAGES_BUCKET)
          .upload(storagePath, selectedImage, {
            contentType: selectedImage.type,
            upsert: false,
          });

        if (uploadError) {
          setError(
            "Visit updated, but photo failed to upload — try again later.",
          );
          setIsEditing(false);
          refresh();
          return;
        }

        const imageResult = await setVisitImage(visit.id, storagePath);

        if (imageResult.error) {
          setError(
            "Visit updated, but photo failed to save — try again later.",
          );
          setIsEditing(false);
          refresh();
          return;
        }

        setError(null);
        setIsEditing(false);
        refresh();
      } finally {
        setIsUploading(false);
      }
    });
  }

  const isBusy = isPending || isUploading;

  if (isEditing) {
    return (
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-rose-100/60">
        <div className="space-y-4">
          <RestaurantAutocomplete
            restaurants={restaurants}
            value={restaurantName}
            selectedId={selectedRestaurantId}
            onValueChange={setRestaurantName}
            onSelect={(restaurant) =>
              setSelectedRestaurantId(restaurant?.id ?? null)
            }
          />

          <div>
            <label
              htmlFor={`visited-at-${visit.id}`}
              className="mb-1.5 block text-sm font-medium text-stone-700"
            >
              Date visited
            </label>
            <DatePicker
              id={`visited-at-${visit.id}`}
              name={`visitedAt-${visit.id}`}
              required
              value={visitedAt}
              onChange={setVisitedAt}
            />
          </div>

          <AddressAutocomplete
            id={`address-${visit.id}`}
            name={`address-${visit.id}`}
            value={address}
            onValueChange={setAddress}
            onPlaceSelect={setSelectedPlace}
          />

          <StarRating
            value={rating}
            onChange={setRating}
            disabled={isBusy}
            required
            name={`rating-${visit.id}`}
            id={`rating-${visit.id}`}
          />

          <div>
            <label
              htmlFor={`notes-${visit.id}`}
              className="mb-1.5 block text-sm font-medium text-stone-700"
            >
              Notes / special event
              <span className="font-normal text-stone-400"> (optional)</span>
            </label>
            <textarea
              id={`notes-${visit.id}`}
              name={`notes-${visit.id}`}
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Our 3rd anniversary, tried the ribeye…"
              className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-base text-stone-800 shadow-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            />
          </div>

          <div>
            <label
              htmlFor={`visit-photo-${visit.id}`}
              className="mb-1.5 block cursor-pointer text-sm font-medium text-stone-700"
            >
              Photo
              <span className="font-normal text-stone-400">
                {visit.image_path ? " (optional — replace)" : " (optional)"}
              </span>
            </label>
            <input
              ref={fileInputRef}
              id={`visit-photo-${visit.id}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="w-full cursor-pointer rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-rose-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-rose-600 hover:file:bg-rose-100"
            />
            {imagePreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreviewUrl}
                alt="Selected visit photo preview"
                className="mt-3 max-h-48 w-full rounded-xl object-cover"
              />
            ) : visit.image_path ? (
              <VisitImageLightbox
                imagePath={visit.image_path}
                alt={`Current photo from visit to ${visit.restaurantName}`}
              />
            ) : null}
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="cursor-pointer rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading
                ? "Uploading photo…"
                : isPending
                  ? "Saving…"
                  : "Save"}
            </button>
            <button
              type="button"
              onClick={cancelEditor}
              disabled={isBusy}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-stone-500 transition hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-rose-100/60">
      <time
        dateTime={visit.visited_at}
        className="text-xs font-medium uppercase tracking-wide text-rose-400"
      >
        {formatVisitDate(visit.visited_at)}
      </time>
      <h3 className="mt-1 font-display text-lg font-semibold text-stone-800">
        {visit.restaurantName}
      </h3>
      <div className="mt-2">
        <StarRating mode="display" value={visit.rating} size="sm" />
      </div>
      {visit.address ? (
        <p className="mt-2 text-sm text-stone-600">{visit.address}</p>
      ) : null}
      {visit.image_path ? (
        <VisitImageLightbox
          imagePath={visit.image_path}
          alt={`Photo from visit to ${visit.restaurantName}`}
        />
      ) : null}
      {visit.notes ? (
        <p className="mt-2 text-sm italic text-stone-500">
          &ldquo;{visit.notes}&rdquo;
        </p>
      ) : null}
      <button
        type="button"
        onClick={openEditor}
        className="mt-3 cursor-pointer text-xs font-medium text-rose-500 transition hover:text-rose-600"
      >
        Edit visit
      </button>
    </article>
  );
}
