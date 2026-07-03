"use client";

import { useId, useRef, useState } from "react";
import { matchesSearch } from "@/lib/restaurant-name";
import type { Restaurant } from "@/lib/types";

type RestaurantAutocompleteProps = {
  restaurants: Restaurant[];
  value: string;
  selectedId: string | null;
  onValueChange: (value: string) => void;
  onSelect: (restaurant: Restaurant | null) => void;
};

export function RestaurantAutocomplete({
  restaurants,
  value,
  selectedId,
  onValueChange,
  onSelect,
}: RestaurantAutocompleteProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const suggestions = restaurants.filter((restaurant) =>
    matchesSearch(value, restaurant),
  );

  function handleSelect(restaurant: Restaurant) {
    onValueChange(restaurant.name);
    onSelect(restaurant);
    setIsOpen(false);
  }

  function handleInputChange(nextValue: string) {
    onValueChange(nextValue);
    onSelect(null);
    setHighlightedIndex(0);
    setIsOpen(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) {
      if (event.key === "ArrowDown" && suggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        index + 1 >= suggestions.length ? 0 : index + 1,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        index - 1 < 0 ? suggestions.length - 1 : index - 1,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = suggestions[highlightedIndex];
      if (selected) handleSelect(selected);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative">
      <label
        htmlFor="restaurant-name"
        className="mb-1.5 block text-sm font-medium text-stone-700"
      >
        Restaurant
      </label>
      <input
        ref={inputRef}
        id="restaurant-name"
        name="restaurantName"
        type="text"
        role="combobox"
        aria-expanded={isOpen && suggestions.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        required
        value={value}
        placeholder="Start typing a restaurant…"
        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base text-stone-800 shadow-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 150);
        }}
        onKeyDown={handleKeyDown}
      />
      {selectedId ? (
        <p className="mt-1.5 text-xs text-rose-600">
          Adding a new visit to an existing restaurant
        </p>
      ) : null}
      {isOpen && value && suggestions.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((restaurant, index) => (
            <li key={restaurant.id} role="option" aria-selected={index === highlightedIndex}>
              <button
                type="button"
                className={`flex min-h-11 w-full cursor-pointer items-center px-4 py-2.5 text-left text-sm transition ${
                  index === highlightedIndex
                    ? "bg-rose-50 text-rose-700"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(restaurant)}
              >
                {restaurant.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
