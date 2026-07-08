"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [picked, setPicked] = useState<Restaurant | null>(null);
  const hasRestaurants = restaurants.length > 0;

  const close = useCallback(() => {
    setIsOpen(false);
    setPicked(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  function handleRoll() {
    setPicked((current) => pickRandom(restaurants, current?.id));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full cursor-pointer items-center justify-center rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm font-medium text-rose-600 shadow-sm transition-colors hover:bg-rose-50"
      >
        Pick a place to eat
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="randomizer-title"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-rose-100/60"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="randomizer-title"
                  className="font-display text-xl font-semibold text-stone-800"
                >
                  Where should we eat?
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Pick a random place we&apos;ve loved
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="cursor-pointer rounded-full px-2 py-1 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
                aria-label="Close randomizer"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {!hasRestaurants ? (
                <p className="text-sm text-stone-500">
                  Add your first visit to unlock the randomizer.
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRoll}
                    className="w-full cursor-pointer rounded-xl bg-rose-500 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-rose-600"
                  >
                    Roll the dice
                  </button>

                  {picked ? (
                    <div
                      aria-live="polite"
                      className="space-y-2 rounded-xl bg-rose-50 px-4 py-4"
                    >
                      <p className="text-sm font-medium text-rose-600">
                        Tonight&apos;s pick!
                      </p>
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
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
