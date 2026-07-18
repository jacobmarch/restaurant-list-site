"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AddressAutocomplete,
  type SelectedPlace,
} from "@/components/AddressAutocomplete";
import { useAppData } from "@/components/AppDataProvider";
import {
  haversineMiles,
  type LatLng,
} from "@/lib/distance";
import { formatVisitDate } from "@/lib/format";
import type { Restaurant, TimelineVisit } from "@/lib/types";

type PickCount = 1 | 3 | 5;

type RestaurantCandidate = {
  restaurant: Restaurant;
  distanceMiles: number | null;
  address: string | null;
  lastVisitedAt: string | null;
};

type OriginSource = "gps" | "address" | null;

const PICK_COUNTS: PickCount[] = [1, 3, 5];
const DEFAULT_RADIUS_MILES = 15;

function pickRandomMany(
  pool: RestaurantCandidate[],
  count: number,
  previousIds?: Set<string>,
): RestaurantCandidate[] {
  if (pool.length === 0 || count <= 0) {
    return [];
  }

  const take = Math.min(count, pool.length);
  let working = [...pool];

  if (
    previousIds &&
    previousIds.size > 0 &&
    previousIds.size < pool.length &&
    take < pool.length
  ) {
    const withoutPrevious = working.filter(
      (candidate) => !previousIds.has(candidate.restaurant.id),
    );
    if (withoutPrevious.length >= take) {
      working = withoutPrevious;
    }
  }

  for (let i = working.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = working[i];
    working[i] = working[j];
    working[j] = temp;
  }

  return working.slice(0, take);
}

function buildCandidates(
  restaurants: Restaurant[],
  visits: TimelineVisit[],
  filterByDistance: boolean,
  origin: LatLng | null,
  radiusMiles: number,
): RestaurantCandidate[] {
  if (filterByDistance && (!origin || !Number.isFinite(radiusMiles) || radiusMiles <= 0)) {
    return [];
  }

  type VisitMeta = {
    lastVisitedAt: string;
    address: string | null;
    distanceMiles: number | null;
  };

  const metaByRestaurant = new Map<string, VisitMeta>();

  for (const visit of visits) {
    const hasCoords =
      visit.lat != null &&
      visit.lng != null &&
      Number.isFinite(visit.lat) &&
      Number.isFinite(visit.lng);

    let distanceMiles: number | null = null;

    if (filterByDistance) {
      if (!hasCoords || !origin) {
        continue;
      }

      distanceMiles = haversineMiles(origin, {
        lat: visit.lat as number,
        lng: visit.lng as number,
      });

      if (distanceMiles > radiusMiles) {
        continue;
      }
    }

    const existing = metaByRestaurant.get(visit.restaurant_id);

    if (!existing) {
      metaByRestaurant.set(visit.restaurant_id, {
        lastVisitedAt: visit.visited_at,
        address: visit.address,
        distanceMiles,
      });
      continue;
    }

    const isNewer = visit.visited_at > existing.lastVisitedAt;
    const isCloser =
      distanceMiles != null &&
      (existing.distanceMiles == null || distanceMiles < existing.distanceMiles);

    const next: VisitMeta = {
      lastVisitedAt: isNewer ? visit.visited_at : existing.lastVisitedAt,
      address: existing.address,
      distanceMiles:
        distanceMiles == null
          ? existing.distanceMiles
          : existing.distanceMiles == null
            ? distanceMiles
            : Math.min(existing.distanceMiles, distanceMiles),
    };

    if (filterByDistance) {
      if (isCloser && visit.address) {
        next.address = visit.address;
      } else if (!next.address && visit.address) {
        next.address = visit.address;
      }
    } else if (isNewer) {
      next.address = visit.address ?? existing.address;
    } else if (!next.address && visit.address) {
      next.address = visit.address;
    }

    metaByRestaurant.set(visit.restaurant_id, next);
  }

  return restaurants
    .filter((restaurant) => {
      if (!filterByDistance) {
        return true;
      }
      return metaByRestaurant.has(restaurant.id);
    })
    .map((restaurant) => {
      const meta = metaByRestaurant.get(restaurant.id);
      return {
        restaurant,
        distanceMiles: filterByDistance ? (meta?.distanceMiles ?? null) : null,
        address: meta?.address ?? null,
        lastVisitedAt: meta?.lastVisitedAt ?? null,
      };
    });
}

function formatDistance(miles: number): string {
  if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  }
  return `${Math.round(miles)} mi`;
}

export function RandomizerButton() {
  const { restaurants, visits } = useAppData();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [picked, setPicked] = useState<RestaurantCandidate[]>([]);
  const [pickCount, setPickCount] = useState<PickCount>(1);
  const [filterByDistance, setFilterByDistance] = useState(false);
  const [radiusMiles, setRadiusMiles] = useState(DEFAULT_RADIUS_MILES);
  const [radiusInput, setRadiusInput] = useState(String(DEFAULT_RADIUS_MILES));
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [originSource, setOriginSource] = useState<OriginSource>(null);
  const [originLabel, setOriginLabel] = useState<string | null>(null);
  const [addressValue, setAddressValue] = useState("");
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [locationError, setLocationError] = useState<string | null>(null);

  const hasRestaurants = restaurants.length > 0;

  const candidates = useMemo(
    () =>
      buildCandidates(
        restaurants,
        visits,
        filterByDistance,
        origin,
        radiusMiles,
      ),
    [restaurants, visits, filterByDistance, origin, radiusMiles],
  );

  const canRoll =
    hasRestaurants &&
    (!filterByDistance || (origin != null && candidates.length > 0));

  const close = useCallback(() => {
    setIsOpen(false);
    setPicked([]);
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

  useEffect(() => {
    if (picked.length === 0) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [picked]);

  function handleRadiusChange(value: string) {
    setRadiusInput(value);
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      setRadiusMiles(parsed);
      setPicked([]);
    }
  }

  function handlePlaceSelect(place: SelectedPlace | null) {
    if (!place) {
      if (originSource === "address") {
        setOrigin(null);
        setOriginSource(null);
        setOriginLabel(null);
      }
      return;
    }

    setOrigin({ lat: place.lat, lng: place.lng });
    setOriginSource("address");
    setOriginLabel(place.address);
    setLocationStatus("idle");
    setLocationError(null);
    setPicked([]);
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError(
        "Location isn’t available in this browser. Enter an address instead.",
      );
      return;
    }

    setLocationStatus("loading");
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setOriginSource("gps");
        setOriginLabel("Current location");
        setAddressValue("");
        setLocationStatus("idle");
        setPicked([]);
      },
      (error) => {
        setLocationStatus("error");
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            "Location permission denied. Enter an address instead.",
          );
        } else {
          setLocationError(
            "Couldn’t get your location. Enter an address instead.",
          );
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  function handleRoll() {
    if (!canRoll) {
      return;
    }

    setPicked((current) =>
      pickRandomMany(
        candidates,
        pickCount,
        new Set(current.map((item) => item.restaurant.id)),
      ),
    );
  }

  const rollDisabledReason = !hasRestaurants
    ? null
    : filterByDistance && origin == null
      ? "Set your location or an address to filter by distance."
      : filterByDistance && candidates.length === 0
        ? `No visited places within ${radiusMiles} miles. Add locations to visits, or widen the radius.`
        : null;

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
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-stone-900/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="randomizer-title"
          onClick={close}
        >
          <div
            className="my-3 w-full max-w-md rounded-2xl bg-white p-4 shadow-xl ring-1 ring-rose-100/60 sm:my-0 sm:max-h-[min(90dvh,56rem)] sm:overflow-y-auto sm:p-5"
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
                  Pick random places we&apos;ve loved
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
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium text-stone-700">
                      How many?
                    </legend>
                    <div className="flex gap-2">
                      {PICK_COUNTS.map((count) => {
                        const selected = pickCount === count;
                        return (
                          <button
                            key={count}
                            type="button"
                            onClick={() => {
                              setPickCount(count);
                              setPicked([]);
                            }}
                            aria-pressed={selected}
                            className={`flex-1 cursor-pointer rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                              selected
                                ? "bg-rose-500 text-white shadow-sm"
                                : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                            }`}
                          >
                            {count}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="space-y-3 rounded-xl border border-stone-100 bg-stone-50/80 p-3">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={filterByDistance}
                        onChange={(event) => {
                          setFilterByDistance(event.target.checked);
                          setPicked([]);
                        }}
                        className="size-4 rounded border-stone-300 text-rose-500 focus:ring-rose-200"
                      />
                      <span className="text-sm font-medium text-stone-700">
                        Only within a certain distance
                      </span>
                    </label>

                    {filterByDistance ? (
                      <div className="space-y-3 pl-0.5">
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-stone-700">
                            Radius (miles)
                          </span>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            inputMode="decimal"
                            value={radiusInput}
                            onChange={(event) =>
                              handleRadiusChange(event.target.value)
                            }
                            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-base text-stone-800 shadow-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                          />
                        </label>

                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={handleUseMyLocation}
                            disabled={locationStatus === "loading"}
                            className="w-full cursor-pointer rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-70"
                          >
                            {locationStatus === "loading"
                              ? "Getting location…"
                              : "Use my current location"}
                          </button>

                          <AddressAutocomplete
                            id="randomizer-origin-address"
                            name="randomizerOriginAddress"
                            value={addressValue}
                            onValueChange={(value) => {
                              setAddressValue(value);
                              if (originSource === "address") {
                                setOrigin(null);
                                setOriginSource(null);
                                setOriginLabel(null);
                              }
                            }}
                            onPlaceSelect={handlePlaceSelect}
                            label="Or search near an address"
                            optional={false}
                            placeholder="City, neighborhood, or address…"
                          />
                        </div>

                        {origin && originLabel ? (
                          <p className="text-xs text-stone-500">
                            Searching near{" "}
                            <span className="font-medium text-stone-700">
                              {originLabel}
                            </span>
                            {originSource === "gps" ? " (GPS)" : ""}
                            {" · "}
                            {candidates.length}{" "}
                            {candidates.length === 1 ? "place" : "places"} in
                            range
                          </p>
                        ) : null}

                        {locationError ? (
                          <p className="text-sm text-rose-600" role="alert">
                            {locationError}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={handleRoll}
                    disabled={!canRoll}
                    className="w-full cursor-pointer rounded-xl bg-rose-500 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:hover:bg-stone-300"
                  >
                    Roll the dice
                  </button>

                  {rollDisabledReason ? (
                    <p className="text-sm text-stone-500">{rollDisabledReason}</p>
                  ) : null}

                  {picked.length > 0 ? (
                    <div
                      ref={resultsRef}
                      tabIndex={-1}
                      aria-live="polite"
                      className="scroll-mt-3 space-y-3 rounded-xl bg-rose-50 px-4 py-4 outline-none"
                    >
                      <p className="text-sm font-medium text-rose-600">
                        {picked.length === 1
                          ? "Tonight's pick!"
                          : `Here are ${picked.length} random choices`}
                      </p>

                      <ul className="space-y-4">
                        {picked.map((item) => (
                          <li key={item.restaurant.id}>
                            <p className="font-display text-2xl font-semibold text-stone-800">
                              {item.restaurant.name}
                            </p>
                            {item.address ? (
                              <p className="mt-1 text-sm text-stone-600">
                                {item.address}
                              </p>
                            ) : null}
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-stone-500">
                              {item.lastVisitedAt ? (
                                <span>
                                  Last visited{" "}
                                  {formatVisitDate(item.lastVisitedAt)}
                                </span>
                              ) : null}
                              {item.distanceMiles != null ? (
                                <>
                                  {item.lastVisitedAt ? (
                                    <span aria-hidden="true">·</span>
                                  ) : null}
                                  <span>
                                    ~{formatDistance(item.distanceMiles)} away
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>

                      {picked.length < pickCount &&
                      candidates.length < pickCount ? (
                        <p className="text-xs text-stone-500">
                          Only {candidates.length}{" "}
                          {candidates.length === 1 ? "place" : "places"}{" "}
                          available in the pool.
                        </p>
                      ) : null}
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
