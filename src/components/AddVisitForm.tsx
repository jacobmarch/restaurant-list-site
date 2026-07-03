"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { addVisit, setVisitImage } from "@/app/actions/visits";
import {
  validateVisitImage,
  visitImageStoragePath,
  VISIT_IMAGES_BUCKET,
} from "@/lib/storage";
import type { AddVisitState, Restaurant } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";
import { RestaurantAutocomplete } from "./RestaurantAutocomplete";

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type AddVisitFormProps = {
  restaurants: Restaurant[];
};

const initialState: AddVisitState = {};

export function AddVisitForm({ restaurants }: AddVisitFormProps) {
  const [state, setState] = useState<AddVisitState>(initialState);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(
    null,
  );
  const [visitedAt, setVisitedAt] = useState(todayIsoDate);
  const [notes, setNotes] = useState("");
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

  function resetForm() {
    setRestaurantName("");
    setSelectedRestaurantId(null);
    setVisitedAt(todayIsoDate());
    setNotes("");
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      setState({ error: validationError });
      setSelectedImage(null);
      setImagePreviewUrl(null);
      event.target.value = "";
      return;
    }

    setState(initialState);
    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedImage) {
      const validationError = validateVisitImage(selectedImage);
      if (validationError) {
        setState({ error: validationError });
        return;
      }
    }

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await addVisit(initialState, formData);

      if (!result.success || !result.visitId) {
        setState(result);
        return;
      }

      if (!selectedImage) {
        setState(result);
        resetForm();
        return;
      }

      setIsUploading(true);

      try {
        const supabase = createClient();
        const storagePath = visitImageStoragePath(result.visitId, selectedImage);

        const { error: uploadError } = await supabase.storage
          .from(VISIT_IMAGES_BUCKET)
          .upload(storagePath, selectedImage, {
            contentType: selectedImage.type,
            upsert: false,
          });

        if (uploadError) {
          setState({
            error: "Visit saved, but photo failed to upload — try again later.",
          });
          resetForm();
          return;
        }

        const imageResult = await setVisitImage(result.visitId, storagePath);

        if (imageResult.error) {
          setState({
            error: "Visit saved, but photo failed to save — try again later.",
          });
          resetForm();
          return;
        }

        setState({ success: true });
        resetForm();
      } finally {
        setIsUploading(false);
      }
    });
  }

  const isBusy = isPending || isUploading;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-rose-100/60">
      <h2 className="font-display text-lg font-semibold text-stone-800">
        Add a visit
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <input
          type="hidden"
          name="restaurantId"
          value={selectedRestaurantId ?? ""}
        />

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
            htmlFor="visited-at"
            className="mb-1.5 block text-sm font-medium text-stone-700"
          >
            Date visited
          </label>
          <input
            id="visited-at"
            name="visitedAt"
            type="date"
            required
            value={visitedAt}
            onChange={(event) => setVisitedAt(event.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base text-stone-800 shadow-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="mb-1.5 block text-sm font-medium text-stone-700"
          >
            Notes / special event
            <span className="font-normal text-stone-400"> (optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Our 3rd anniversary, tried the ribeye…"
            className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-base text-stone-800 shadow-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        <div>
          <label
            htmlFor="visit-photo"
            className="mb-1.5 block cursor-pointer text-sm font-medium text-stone-700"
          >
            Photo
            <span className="font-normal text-stone-400"> (optional)</span>
          </label>
          <input
            ref={fileInputRef}
            id="visit-photo"
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
          ) : null}
        </div>

        {state.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Visit saved!
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isBusy}
          className="w-full cursor-pointer rounded-xl bg-rose-500 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading
            ? "Uploading photo…"
            : isPending
              ? "Saving…"
              : "Save visit"}
        </button>
      </form>
    </section>
  );
}
