"use client";

import { useState, useTransition } from "react";
import { updateVisitAddress } from "@/app/actions/visits";
import {
  AddressAutocomplete,
  type SelectedPlace,
} from "@/components/AddressAutocomplete";
import { useAppData } from "@/components/AppDataProvider";

type VisitAddressEditorProps = {
  visitId: string;
  address: string | null;
};

export function VisitAddressEditor({
  visitId,
  address,
}: VisitAddressEditorProps) {
  const { refresh } = useAppData();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(address ?? "");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openEditor() {
    setDraft(address ?? "");
    setSelectedPlace(null);
    setError(null);
    setIsEditing(true);
  }

  function cancelEditor() {
    setDraft(address ?? "");
    setSelectedPlace(null);
    setError(null);
    setIsEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateVisitAddress(
        visitId,
        draft,
        selectedPlace?.lat ?? null,
        selectedPlace?.lng ?? null,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      setError(null);
      setSelectedPlace(null);
      setIsEditing(false);
      refresh();
    });
  }

  if (isEditing) {
    return (
      <div className="mt-2 space-y-2">
        <AddressAutocomplete
          id={`address-${visitId}`}
          name={`address-${visitId}`}
          value={draft}
          onValueChange={setDraft}
          onPlaceSelect={setSelectedPlace}
          optional={false}
          labelClassName="block text-xs font-medium text-stone-600"
          inputClassName="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
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
    <div className="mt-2">
      {address ? (
        <p className="text-sm text-stone-600">{address}</p>
      ) : null}
      <button
        type="button"
        onClick={openEditor}
        className="mt-1 cursor-pointer text-xs font-medium text-rose-500 transition hover:text-rose-600"
      >
        {address ? "Edit address" : "Add address"}
      </button>
    </div>
  );
}
