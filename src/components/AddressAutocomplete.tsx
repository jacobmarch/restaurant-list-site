"use client";

import { useEffect, useId, useRef, useState } from "react";

export type SelectedPlace = {
  address: string;
  lat: number;
  lng: number;
};

type AddressSuggestion = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

type AddressAutocompleteProps = {
  id?: string;
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  onPlaceSelect: (place: SelectedPlace | null) => void;
  label?: string;
  optional?: boolean;
  placeholder?: string;
  inputClassName?: string;
  labelClassName?: string;
};

type GeoapifyResult = {
  place_id?: string | number;
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  lat: number;
  lon: number;
};

function formatSuggestionLabel(result: GeoapifyResult): string {
  if (result.formatted?.trim()) {
    return result.formatted.trim();
  }

  return [result.address_line1, result.address_line2]
    .filter(Boolean)
    .join(", ")
    .trim();
}

export function AddressAutocomplete({
  id = "address",
  name = "address",
  value,
  onValueChange,
  onPlaceSelect,
  label = "Address",
  optional = true,
  placeholder = "Start typing an address…",
  inputClassName = "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base text-stone-800 shadow-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100",
  labelClassName = "mb-1.5 block text-sm font-medium text-stone-700",
}: AddressAutocompleteProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);

  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY?.trim() ?? "";
  const query = value.trim();
  const canSearch = Boolean(apiKey) && query.length >= 3;

  useEffect(() => {
    if (!canSearch) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      const params = new URLSearchParams({
        text: query,
        format: "json",
        limit: "5",
        apiKey,
      });

      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?${params}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const data = (await response.json()) as {
          results?: GeoapifyResult[];
        };

        const nextSuggestions = (data.results ?? [])
          .map((result, index) => {
            const labelText = formatSuggestionLabel(result);
            if (
              !labelText ||
              !Number.isFinite(result.lat) ||
              !Number.isFinite(result.lon)
            ) {
              return null;
            }

            return {
              id: String(result.place_id ?? `${labelText}-${index}`),
              label: labelText,
              lat: result.lat,
              lng: result.lon,
            };
          })
          .filter((item): item is AddressSuggestion => item != null);

        setSuggestions(nextSuggestions);
        setHighlightedIndex(0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setSuggestions([]);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [apiKey, canSearch, query]);

  function handleSelect(suggestion: AddressSuggestion) {
    onValueChange(suggestion.label);
    onPlaceSelect({
      address: suggestion.label,
      lat: suggestion.lat,
      lng: suggestion.lng,
    });
    setSuggestions([]);
    setIsOpen(false);
  }

  function handleInputChange(nextValue: string) {
    onValueChange(nextValue);
    onPlaceSelect(null);
    setHighlightedIndex(0);
    setIsOpen(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const activeSuggestions = canSearch ? suggestions : [];

    if (!isOpen || activeSuggestions.length === 0) {
      if (event.key === "ArrowDown" && activeSuggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        index + 1 >= activeSuggestions.length ? 0 : index + 1,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        index - 1 < 0 ? activeSuggestions.length - 1 : index - 1,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = activeSuggestions[highlightedIndex];
      if (selected) handleSelect(selected);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  const visibleSuggestions = canSearch ? suggestions : [];
  const showSuggestions = isOpen && visibleSuggestions.length > 0;

  return (
    <div className="relative">
      <label htmlFor={id} className={labelClassName}>
        {label}
        {optional ? (
          <span className="font-normal text-stone-400"> (optional)</span>
        ) : null}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-expanded={showSuggestions}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        className={inputClassName}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 150);
        }}
        onKeyDown={handleKeyDown}
      />
      {showSuggestions ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          {visibleSuggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <button
                type="button"
                className={`flex min-h-11 w-full cursor-pointer items-center px-4 py-2.5 text-left text-sm transition ${
                  index === highlightedIndex
                    ? "bg-rose-50 text-rose-700"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(suggestion)}
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
