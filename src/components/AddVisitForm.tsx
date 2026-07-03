"use client";

import { useState, useTransition } from "react";
import { addVisit } from "@/app/actions/visits";
import type { AddVisitState, Restaurant } from "@/lib/types";
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
  const [restaurantName, setRestaurantName] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(
    null,
  );
  const [visitedAt, setVisitedAt] = useState(todayIsoDate);
  const [notes, setNotes] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await addVisit(initialState, formData);
      setState(result);

      if (result.success) {
        setRestaurantName("");
        setSelectedRestaurantId(null);
        setVisitedAt(todayIsoDate());
        setNotes("");
      }
    });
  }

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
          disabled={isPending}
          className="w-full cursor-pointer rounded-xl bg-rose-500 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save visit"}
        </button>
      </form>
    </section>
  );
}
