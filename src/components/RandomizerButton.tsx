"use client";

import { useState } from "react";
import type { Restaurant } from "@/lib/types";

type RandomizerButtonProps = {
  restaurants: Restaurant[];
};

function pickRandom(
  restaurants: Restaurant[],
  excludeId?: string,
): Restaurant {
  if (restaurants.length === 1) {
    return restaurants[0];
  }

  const pool = excludeId
    ? restaurants.filter((restaurant) => restaurant.id !== excludeId)
    : restaurants;

  return pool[Math.floor(Math.random() * pool.length)];
}

export function RandomizerButton({ restaurants }: RandomizerButtonProps) {
  const [picked, setPicked] = useState<Restaurant | null>(null);
  const hasRestaurants = restaurants.length > 0;

  function handleRoll() {
    setPicked((current) => pickRandom(restaurants, current?.id));
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-rose-100/60">
      <div className="space-y-3">
        <div>
          <p className="text-sm text-stone-500">
            Pick a random place we&apos;ve loved
          </p>
          <button
            type="button"
            onClick={handleRoll}
            disabled={!hasRestaurants}
            className="mt-3 w-full cursor-pointer rounded-xl bg-rose-500 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Roll the dice
          </button>
        </div>

        {!hasRestaurants ? (
          <p className="text-sm text-stone-500">
            Add your first visit to unlock the randomizer.
          </p>
        ) : null}

        {picked ? (
          <div aria-live="polite" className="space-y-2 border-t border-rose-100/80 pt-4">
            <p className="text-sm font-medium text-rose-600">Tonight&apos;s pick!</p>
            <p className="font-display text-2xl font-semibold text-stone-800">
              {picked.name}
            </p>
            <button
              type="button"
              onClick={handleRoll}
              className="cursor-pointer text-sm font-medium text-rose-600 transition hover:text-rose-700"
            >
              Roll again
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
