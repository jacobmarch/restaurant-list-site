"use client";

import { useState, useTransition } from "react";
import { updateVisitRating } from "@/app/actions/visits";
import { useAppData } from "@/components/AppDataProvider";
import { StarRating } from "@/components/StarRating";

type VisitRatingEditorProps = {
  visitId: string;
  rating: number;
};

export function VisitRatingEditor({ visitId, rating }: VisitRatingEditorProps) {
  const { refresh } = useAppData();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(rating);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openEditor() {
    setDraft(rating);
    setError(null);
    setIsEditing(true);
  }

  function cancelEditor() {
    setDraft(rating);
    setError(null);
    setIsEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateVisitRating(visitId, draft);

      if (result.error) {
        setError(result.error);
        return;
      }

      setError(null);
      setIsEditing(false);
      refresh();
    });
  }

  if (isEditing) {
    return (
      <div className="mt-2 space-y-2">
        <StarRating
          value={draft}
          onChange={setDraft}
          size="sm"
          label="Rating"
          name={`rating-${visitId}`}
          id={`rating-${visitId}`}
          disabled={isPending}
        />
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="cursor-pointer rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={cancelEditor}
            disabled={isPending}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-stone-500 transition hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <StarRating mode="display" value={rating} size="sm" />
      <button
        type="button"
        onClick={openEditor}
        className="cursor-pointer text-xs font-medium text-rose-500 transition hover:text-rose-600"
      >
        Edit rating
      </button>
    </div>
  );
}
